// Functional engine check, not a browser capacity guarantee.
// Run after building: node artifacts/clickpdf/scripts/verify-pdf-background.mjs
import { PDFDocument, PDFName } from 'pdf-lib';
import { Worker } from 'node:worker_threads';
import { readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const assets = new URL('../dist/public/assets/', import.meta.url);
const name = (await readdir(assets)).find((entry) => /^pdfOperations\.worker-.*\.js$/.test(entry));
if (!name) throw new Error('Build the ClickPDF app before running the worker check.');
const workerUrl = new URL(name, assets).href;
const directory = await mkdtemp(join(tmpdir(), 'clickpdf-worker-check-'));

async function processFiles(operation, files) {
  const shim = `
    const { parentPort, workerData } = require('node:worker_threads');
    globalThis.self = { postMessage(message, options) {
      parentPort.postMessage(message, options?.transfer || []);
    }};
    parentPort.on('message', (data) => self.onmessage({ data }));
    import(workerData).then(() => parentPort.postMessage({ type: 'ready' }));
  `;
  const worker = new Worker(shim, { eval: true, workerData: workerUrl });
  try {
    return await new Promise((resolve, reject) => {
      worker.on('error', reject);
      worker.on('exit', (code) => { if (code !== 0) reject(new Error(`Worker exited: ${code}`)); });
      worker.on('message', (message) => {
        if (message.type === 'ready') worker.postMessage({ operation, files });
        if (message.type === 'result') resolve(message.data);
        if (message.type === 'error') reject(new Error(message.message));
      });
    });
  } finally { await worker.terminate(); }
}

try {
  const smallPdf = await PDFDocument.create();
  smallPdf.addPage([300, 400]).drawText('ClickPDF batch fixture');
  const smallBytes = await smallPdf.save();
  const small = new File([smallBytes], 'small.pdf', { type: 'application/pdf' });
  const twenty = await processFiles('merge', Array.from({ length: 20 }, () => small));
  assert.equal((await PDFDocument.load(twenty)).getPageCount(), 20);
  console.log('PASS: built Merge worker combined 20 source PDFs into 20 pages.');

  const largePdf = await PDFDocument.create();
  const page = largePdf.addPage([400, 400]);
  // A valid referenced, uncompressed RGB image, not padding after %%EOF.
  const image = largePdf.context.register(largePdf.context.stream(new Uint8Array(4096 * 4096 * 3), {
    Type: 'XObject', Subtype: 'Image', Width: 4096, Height: 4096,
    ColorSpace: 'DeviceRGB', BitsPerComponent: 8,
  }));
  page.node.set(PDFName.of('Resources'), largePdf.context.obj({ XObject: { TestImage: image } }));
  page.node.addContentStream(largePdf.context.register(
    largePdf.context.stream('q 350 0 0 350 25 25 cm /TestImage Do Q')));
  const largeBytes = await largePdf.save({ useObjectStreams: false });
  const path = join(directory, 'large.pdf');
  await writeFile(path, largeBytes);
  const large = new File([largeBytes], 'large.pdf', { type: 'application/pdf' });
  console.log(`Real referenced-image fixture: ${large.size} bytes (${(large.size / 1_000_000).toFixed(2)} MB), stored temporarily at ${fileURLToPath(new URL(`file://${path}`))}`);

  const merged = await processFiles('merge', [large, small]);
  assert.equal((await PDFDocument.load(merged)).getPageCount(), 2);
  console.log(`PASS: built Merge worker processed real ${(large.size / 1_000_000).toFixed(2)} MB PDF plus a second document; output has 2 pages.`);
  const optimized = await processFiles('optimize', [large]);
  assert.equal((await PDFDocument.load(optimized)).getPageCount(), 1);
  console.log(`PASS: built optimization worker processed the real large PDF (${optimized.byteLength} output bytes).`);
  const repaired = await processFiles('repair', [small]);
  assert.equal((await PDFDocument.load(repaired)).getPageCount(), 1);
  console.log('PASS: built Repair worker returned a readable one-page PDF.');
  console.log('NOTE: This test runs the actual built worker in Node, not a browser. It does not establish browser support for 50–1000 MB files.');
} finally { await rm(directory, { recursive: true, force: true }); }
