import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import JSZip from 'jszip';

const root = await mkdtemp(join(tmpdir(), 'clickpdf-sign-browser-'));
const profile = join(root, 'chrome-profile');
const pdfPath = join(root, 'three-page-fixture.pdf');
const secondPdfPath = join(root, 'separate-document.pdf');
const pngPath = join(root, 'signature.png');
const downloadPath = join(root, 'downloads');
await (await import('node:fs/promises')).mkdir(downloadPath, { recursive: true });
const browserErrors = [];
let browser;
let socket;
let commandId = 0;
const pending = new Map();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function makePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * (width * 4 + 1);
    scanlines[start] = 0;
    for (let x = 0; x < width; x += 1) {
      rgba.forEach((value, channel) => { scanlines[start + 1 + x * 4 + channel] = value; });
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', (awaitlessDeflate)(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Kept synchronous so the fixture is deterministic and needs no image package.
import { deflateSync as awaitlessDeflate } from 'node:zlib';

async function makePdfFixture() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const first = pdf.addPage([612, 792]);
  first.drawText('Fixture page 1', { x: 42, y: 742, size: 18, font });
  const rotated = pdf.addPage([842, 595]);
  rotated.drawText('Rotated fixture page 2', { x: 42, y: 540, size: 18, font });
  rotated.setRotation(degrees(90));
  const cropped = pdf.addPage([612, 792]);
  cropped.drawText('Cropped fixture page 3', { x: 42, y: 742, size: 18, font });
  cropped.setCropBox(24, 32, 540, 710);
  await writeFile(pdfPath, await pdf.save());
}

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return response.json();
}

async function waitFor(predicate, description, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await predicate()) return;
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

function send(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP command timed out: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser script failed');
  return response.result?.value;
}

async function clickButton(partialText) {
  return evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find(node => node.innerText.trim().includes(${JSON.stringify(partialText)}));
    if (!button) throw new Error('Could not find button: ' + ${JSON.stringify(partialText)});
    if (button.disabled) throw new Error('Button is disabled: ' + ${JSON.stringify(partialText)});
    button.click();
    return true;
  })()`);
}

async function setInput(selector, value) {
  return evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Missing input: ' + ${JSON.stringify(selector)});
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
    setter.call(input, ${JSON.stringify(String(value))});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return input.value;
  })()`);
}

async function uploadFiles(inputIndex, paths) {
  const { root: documentRoot } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', {
    nodeId: documentRoot.nodeId,
    selector: 'input[type="file"]',
  });
  const { nodeId: targetNode } = await send('DOM.querySelector', {
    nodeId: documentRoot.nodeId,
    selector: `input[type="file"]:nth-of-type(${inputIndex + 1})`,
  });
  const node = targetNode ? { nodeId: targetNode } : { nodeId };
  await send('DOM.setFileInputFiles', { files: paths, ...node });
}

async function uploadFile(inputIndex, path) {
  await uploadFiles(inputIndex, [path]);
}

async function waitForPage(pageNumber) {
  await waitFor(() => evaluate(`document.querySelector('input[aria-label="Current page"]')?.value === "${pageNumber}"`), `page ${pageNumber}`);
  await waitFor(() => evaluate(`document.querySelector('#sign-pdf-preview-canvas')?.width > 0`), `page ${pageNumber} canvas`);
  await delay(250);
}

async function drawSignature() {
  await waitFor(() => evaluate(`!!document.querySelector('canvas[aria-label*="Draw your signature"]')`), 'signature canvas');
  await evaluate(`document.querySelector('canvas[aria-label*="Draw your signature"]').scrollIntoView({ block: 'center', inline: 'center' })`);
  await delay(250);
  const rect = await evaluate(`(() => {
    const r = document.querySelector('canvas[aria-label*="Draw your signature"]').getBoundingClientRect();
    return { left:r.left, top:r.top, width:r.width, height:r.height };
  })()`);
  const points = [
    [0.18, 0.65], [0.27, 0.44], [0.34, 0.58], [0.42, 0.35],
    [0.52, 0.63], [0.64, 0.40], [0.76, 0.55], [0.84, 0.44],
  ];
  for (let index = 0; index < points.length; index += 1) {
    const [px, py] = points[index];
    await send('Input.dispatchMouseEvent', {
      type: index === 0 ? 'mousePressed' : 'mouseMoved',
      x: rect.left + rect.width * px,
      y: rect.top + rect.height * py,
      button: index === 0 ? 'left' : 'none',
      buttons: index === 0 ? 1 : 1,
    });
  }
  const [px, py] = points.at(-1);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: rect.left + rect.width * px,
    y: rect.top + rect.height * py,
    button: 'left',
    buttons: 0,
  });
}

async function addSignatureToPage(pageNumber) {
  await setInput('input[aria-label="Current page"]', pageNumber);
  await waitForPage(pageNumber);
  await clickButton(`Add to page ${pageNumber}`);
  await waitFor(() => evaluate(`document.body.innerText.includes('${pageNumber} signature') || document.body.innerText.includes('signatures placed')`), `signature added on page ${pageNumber}`);
}

async function createTypedSignature() {
  await clickButton('Type');
  await evaluate(`(() => {
    const input = document.querySelector('input[placeholder="Type your name"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Browser Test Signature');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await clickButton('Create typed signature');
  await waitFor(() => evaluate(`document.querySelectorAll('#sign-signature-library option').length >= 2`), 'typed signature creation');
}

async function createUploadedSignature() {
  await clickButton('Upload PNG');
  await uploadFile(1, pngPath);
  await waitFor(() => evaluate(`document.querySelectorAll('#sign-signature-library option').length >= 3`), 'PNG signature upload');
}

async function pageHasInk(pageNumber) {
  await setInput('input[aria-label="Current page"]', pageNumber);
  await waitForPage(pageNumber);
  return evaluate(`(() => {
    const canvas = document.querySelector('#sign-pdf-preview-canvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return 0;
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    let ink = 0;
    for (let y = Math.floor(height * 0.58); y < Math.floor(height * 0.88); y += 2) {
      for (let x = Math.floor(width * 0.25); x < Math.floor(width * 0.8); x += 2) {
        const index = (y * width + x) * 4;
        if (data[index] < 100 && data[index + 1] < 130 && data[index + 2] < 170 && data[index + 3] > 200) ink += 1;
      }
    }
    return ink;
  })()`);
}

try {
  await makePdfFixture();
  await writeFile(secondPdfPath, await readFile(pdfPath));
  await writeFile(pngPath, makePng(64, 32, [35, 70, 160, 255]));
  browser = spawn(process.env.CHROME_BIN || '/repl/tools/bin/chromium', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore', detached: true });
  const activePortPath = join(profile, 'DevToolsActivePort');
  await waitFor(async () => {
    try { return (await readFile(activePortPath, 'utf8')).trim().length > 0; } catch { return false; }
  }, 'Chromium DevTools port', 20000);
  const debugPort = Number((await readFile(activePortPath, 'utf8')).split('\n')[0]);
  const targets = await json(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  socket = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result || {});
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
  await send('Page.navigate', { url: 'http://127.0.0.1:21606/sign-pdf-online' });
  await waitFor(() => evaluate(`!!document.body?.innerText.includes('PDF files') && !!document.body?.innerText.includes('Draw')`), 'Sign PDF page load');

  await uploadFiles(0, [pdfPath, secondPdfPath]);
  await waitFor(() => evaluate(`document.body.innerText.includes('three-page-fixture.pdf') && document.body.innerText.includes('separate-document.pdf') && document.body.innerText.includes('3 pages')`), 'multiple PDF inspection');
  await waitFor(() => evaluate(`document.querySelector('#sign-pdf-preview-canvas')?.width > 0`), 'original PDF render');

  await drawSignature();
  const drawnState = await evaluate(`(() => {
    const canvas = document.querySelector('canvas[aria-label*="Draw your signature"]');
    const pixels = canvas?.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    if (pixels) for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 8) ink += 1;
    const button = [...document.querySelectorAll('button')].find(node => node.innerText.includes('Use this signature'));
    return { ink, buttonDisabled: button?.disabled, text: button?.innerText, body: document.body.innerText.slice(-500) };
  })()`);
  console.log('Draw-pad check:', JSON.stringify(drawnState));
  assert.ok(drawnState.ink > 0, 'mouse drawing should paint nontransparent pixels on the signature canvas');
  assert.equal(drawnState.buttonDisabled, false, 'signature creation button should enable after drawing');
  await clickButton('Use this signature');
  await waitFor(() => evaluate(`document.querySelectorAll('#sign-signature-library option').length === 1`), 'drawn signature creation');
  await addSignatureToPage(1);
  await addSignatureToPage(2);
  await addSignatureToPage(3);

  await createTypedSignature();
  await addSignatureToPage(1);
  await createUploadedSignature();
  await addSignatureToPage(3);
  await evaluate(`(() => {
    const select = document.querySelector('#sign-signature-library');
    const option = [...select.options].find(item => item.textContent.includes('Browser Test Signature'));
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await clickButton('Replace selected');
  await evaluate(`(() => {
    const select = document.querySelector('#sign-signature-library');
    const option = [...select.options].find(item => item.textContent.includes('signature.png'));
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  const replace = await evaluate(`!![...document.querySelectorAll('button')].find(button => button.innerText.includes('Replace selected'))`);
  assert.equal(replace, true, 'replace control should be available with a selected placement');
  await clickButton('Replace selected');

  await clickButton('Rotate +15°');
  await waitFor(() => evaluate(`document.body.innerText.includes('Rotation: 15°')`), 'signature rotation');
  await clickButton('Undo');
  await waitFor(() => evaluate(`document.body.innerText.includes('Rotation: 0°')`), 'signature undo');
  await clickButton('Redo');
  await waitFor(() => evaluate(`document.body.innerText.includes('Rotation: 15°')`), 'signature redo');
  await clickButton('Undo');

  await setInput('#sign-page-target', 'placed');
  await waitFor(() => evaluate(`document.querySelector('#sign-page-target')?.value === 'placed'`), 'per-page placement mode');
  await clickButton('Apply signature and preview');
  try {
    await waitFor(() => evaluate(`document.body?.innerText.includes('Signed PDF ready')`), 'signed PDF generation', 30000);
  } catch (error) {
    const status = await evaluate(`(() => ({
      notice: document.querySelector('[role="alert"]')?.innerText || document.querySelector('[role="status"]')?.innerText,
      files: [...document.querySelectorAll('button')].map(button => button.innerText).filter(text => text.includes('three-page-fixture')),
      body: document.querySelector('main')?.innerText?.slice(0, 4000)
    }))()`);
    console.error('Signing result diagnostics:', JSON.stringify(status));
    throw error;
  }
  await waitFor(() => evaluate(`document.body.innerText.includes('signed result preview') && document.querySelector('#sign-pdf-preview-canvas')?.width > 0`), 'signed-result preview', 30000);

  for (const pageNumber of [1, 2, 3]) {
    const ink = await pageHasInk(pageNumber);
    assert.ok(ink > 4, `signed preview should show signature ink on page ${pageNumber}; found ${ink} dark pixels in the placement region`);
  }

  await clickButton('Download three-page-fixture-signed.pdf');
  await waitFor(async () => (await readdir(downloadPath)).some(name => name === 'three-page-fixture-signed.pdf'), 'first signed PDF download', 15000);
  const downloadedBytes = await readFile(join(downloadPath, 'three-page-fixture-signed.pdf'));
  const outputPdf = await PDFDocument.load(downloadedBytes);
  assert.equal(outputPdf.getPageCount(), 3, 'download should retain all source pages');
  assert.ok(downloadedBytes.length > (await readFile(pdfPath)).length, 'signed PDF should contain embedded signature images');

  await clickButton('separate-document.pdf');
  await waitFor(() => evaluate(`document.querySelector('main')?.innerText.includes('separate-document.pdf · original preview')`), 'second PDF selection');
  await waitFor(() => evaluate(`document.querySelector('#sign-pdf-preview-canvas')?.width > 0`), 'second PDF preview');
  const secondPlacementCount = await evaluate(`document.querySelector('main')?.innerText.match(/\\d+ signatures? placed in this document/)?.[0]`);
  assert.equal(secondPlacementCount, '0 signatures placed in this document', 'the second PDF must not inherit the first PDF placements');
  await clickButton('Add to page 1');
  await waitFor(() => evaluate(`document.querySelector('main')?.innerText.includes('1 signature placed in this document')`), 'second PDF placement');
  await clickButton('Apply signature and preview');
  await waitFor(() => evaluate(`document.querySelector('main')?.innerText.includes('separate-document-signed.pdf') && document.querySelector('main')?.innerText.includes('Signed PDF ready')`), 'second independent signed output', 30000);
  await clickButton('Download 2 as ZIP');
  await waitFor(async () => (await readdir(downloadPath)).some(name => name === 'signed-pdfs.zip'), 'multiple signed PDF ZIP download', 15000);
  const zipBytes = await readFile(join(downloadPath, 'signed-pdfs.zip'));
  const archive = await JSZip.loadAsync(zipBytes);
  assert.deepEqual(Object.keys(archive.files).filter(name => !archive.files[name].dir).sort(), [
    'separate-document-signed.pdf',
    'three-page-fixture-signed.pdf',
  ]);
  const secondOutput = await PDFDocument.load(await archive.file('separate-document-signed.pdf').async('uint8array'));
  assert.equal(secondOutput.getPageCount(), 3, 'the second output should remain an independent, complete PDF');
  assert.equal(browserErrors.length, 0, `browser should not report runtime exceptions: ${browserErrors.join('; ')}`);
  console.log('PASS: multiple PDFs stayed independent; drawn, typed and PNG signatures were placed and embedded; rotations, crop boxes, undo/redo, final previews, individual downloads and ZIP download were verified.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (browser) {
    try { process.kill(-browser.pid, 'SIGTERM'); } catch { browser.kill('SIGTERM'); }
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(1500)]);
    try { process.kill(-browser.pid, 'SIGKILL'); } catch { /* already stopped */ }
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      break;
    } catch {
      if (attempt === 4) throw new Error(`Could not clean test browser profile ${root}`);
      await delay(250);
    }
  }
}
