import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await mkdtemp(join(tmpdir(), 'clickpdf-ad-browser-'));
let browser;
let socket;
let commandId = 0;
const pending = new Map();

async function getJson(url, options) {
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
    pending.set(id, { resolve, reject, timer, method });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser evaluation failed');
  return response.result?.value;
}

async function goTo(path) {
  await evaluate(`(() => {
    history.pushState({}, '', ${JSON.stringify(path)});
    window.dispatchEvent(new PopStateEvent('popstate'));
  })()`);
}

try {
  browser = spawn(process.env.CHROME_BIN || '/repl/tools/bin/chromium', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore', detached: true });
  const portFile = join(profile, 'DevToolsActivePort');
  await waitFor(async () => {
    try { return (await readFile(portFile, 'utf8')).trim().length > 0; } catch { return false; }
  }, 'Chromium DevTools port', 20000);
  const port = Number((await readFile(portFile, 'utf8')).split('\n')[0]);
  const target = await getJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(`${entry.method}: ${message.error.message}`));
      else entry.resolve(message.result || {});
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:21606/' });
  await waitFor(() => evaluate(`!!document.body?.innerText.includes('Stay Secure, Stay Smart')`), 'home page');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 0, 'home page must not mount the ad');

  await goTo('/tools/merge');
  await waitFor(() => evaluate(`document.body?.innerText.includes('Merge PDF') && document.body?.innerText.includes('Back to Tools Catalog')`), 'Merge PDF page');
  const initialState = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    return {
      state: ad?.dataset.adState,
      display: ad && getComputedStyle(ad).display,
      height: ad?.getBoundingClientRect().height,
      iframes: ad?.querySelectorAll('iframe').length,
      hasBackButton: Boolean([...document.querySelectorAll('button')].find(button => button.innerText.includes('Back to Tools Catalog'))),
      hasHeader: Boolean(document.querySelector('header'))
    };
  })()`);
  assert.equal(initialState.state, 'consent-required');
  assert.equal(initialState.display, 'none');
  assert.equal(initialState.height, 0);
  assert.equal(initialState.iframes, 0, 'no provider request should be made before cookie consent');
  assert.equal(initialState.hasHeader, true, 'global header should be present');
  assert.equal(await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    const back = [...document.querySelectorAll('button')].find(button => button.innerText.includes('Back to Tools Catalog'));
    return Boolean(ad && back && (ad.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING));
  })()`), true, 'shared ad slot should sit before the existing Back button');

  await waitFor(() => evaluate(`!![...document.querySelectorAll('button')].find(button => button.innerText.includes('Accept Cookies'))`), 'cookie consent prompt');
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.innerText.includes('Accept Cookies')).click()`);
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'loading'`), 'consented ad frame load');
  const frameState = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    const frame = ad?.querySelector('iframe');
    return {
      frameCount: ad?.querySelectorAll('iframe').length,
      sandbox: frame?.getAttribute('sandbox'),
      referrerPolicy: frame?.getAttribute('referrerpolicy'),
      exactProviderTag: frame?.getAttribute('srcdoc')?.includes('<script src="https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc"></script>'),
      isIsolated: frame?.hasAttribute('sandbox') && !frame.getAttribute('sandbox').includes('allow-same-origin')
    };
  })()`);
  assert.equal(frameState.frameCount, 1);
  assert.equal(frameState.referrerPolicy, 'no-referrer');
  assert.equal(frameState.exactProviderTag, true, 'the supplied provider script URL should be present exactly');
  assert.equal(frameState.isIsolated, true, 'provider code must not share the application origin');

  const frameTree = await send('Page.getFrameTree');
  const findAdFrame = node => {
    if (node.frame?.url === 'about:srcdoc' || node.frame?.url === 'about:blank') return node.frame;
    for (const child of node.childFrames || []) {
      const found = findAdFrame(child);
      if (found) return found;
    }
    return null;
  };
  const adFrame = findAdFrame(frameTree.frameTree);
  if (!adFrame) console.log('Frame tree during ad test:', JSON.stringify(frameTree.frameTree));
  assert.ok(adFrame, 'isolated provider document should be a child frame');
  const isolatedWorld = await send('Page.createIsolatedWorld', { frameId: adFrame.id, worldName: 'ad-fill-test' });
  await send('Runtime.evaluate', {
    contextId: isolatedWorld.executionContextId,
    returnByValue: true,
    expression: `(() => {
      const creative = document.createElement('iframe');
      creative.width = '320';
      creative.height = '50';
      creative.srcdoc = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="50"><rect width="320" height="50" fill="#fff"/></svg>';
      document.body.appendChild(creative);
      return true;
    })()`,
  });
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'rendered'`), 'compatible visible-creative signal');
  const desktopBanner = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    const frame = ad.querySelector('iframe');
    const adRect = ad.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const back = [...document.querySelectorAll('button')].find(button => button.innerText.includes('Back to Tools Catalog')).getBoundingClientRect();
    return { display: getComputedStyle(ad).display, height: adRect.height, width: frameRect.width, frameHeight: frameRect.height, belowHeader: adRect.top >= document.querySelector('header').getBoundingClientRect().bottom, aboveBack: adRect.bottom <= back.top };
  })()`);
  assert.equal(desktopBanner.display, 'flex');
  assert.equal(desktopBanner.height, 50);
  assert.equal(desktopBanner.width, 320);
  assert.equal(desktopBanner.frameHeight, 50);
  assert.equal(desktopBanner.belowHeader, true);
  assert.equal(desktopBanner.aboveBack, true);

  await send('Emulation.setDeviceMetricsOverride', { width: 280, height: 800, deviceScaleFactor: 2, mobile: true, screenWidth: 280, screenHeight: 800 });
  await waitFor(() => evaluate(`window.innerWidth === 280`), 'narrow mobile viewport');
  await delay(250);
  const mobileLayout = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    return { viewport: innerWidth, pageWidth: document.documentElement.scrollWidth, adWidth: ad.getBoundingClientRect().width, adHeight: ad.getBoundingClientRect().height };
  })()`);
  assert.equal(mobileLayout.pageWidth, mobileLayout.viewport, `mobile page must not scroll horizontally: ${JSON.stringify(mobileLayout)}`);
  assert.ok(mobileLayout.adWidth <= 280 && mobileLayout.adWidth > 0);
  assert.ok(Math.abs(mobileLayout.adWidth / mobileLayout.adHeight - 320 / 50) < 0.05, 'small-screen scaling should preserve banner aspect ratio');

  await goTo('/tools/sign');
  await waitFor(() => evaluate(`document.body?.innerText.includes('Sign PDF')`), 'Sign PDF navigation');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 1, 'tool-to-tool navigation should not duplicate the shared ad slot');
  assert.equal(await evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState`), 'rendered', 'same mounted slot should remain stable across tool navigation');

  await goTo('/');
  await waitFor(() => evaluate(`document.body?.innerText.includes('Stay Secure, Stay Smart')`), 'return to home');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 0, 'returning to the homepage must unmount the ad');

  await goTo('/tools/merge');
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'loading'`), 'real provider no-fill test');
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'empty'`), 'provider no-fill timeout', 15000);
  const noFill = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    return { display: getComputedStyle(ad).display, width: ad.getBoundingClientRect().width, height: ad.getBoundingClientRect().height, iframes: ad.querySelectorAll('iframe').length };
  })()`);
  assert.deepEqual(noFill, { display: 'none', width: 0, height: 0, iframes: 0 }, 'no-fill must remove the full wrapper and its reserved space');
  console.log('PASS: home has no ad; Merge and Sign share one isolated, consent-gated slot; simulated same-origin creative shows at 320×50 and scales on 280px mobile; empty provider response returns to display:none with zero height. Real provider fill was not available to verify.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (browser) {
    try { process.kill(-browser.pid, 'SIGTERM'); } catch { browser.kill('SIGTERM'); }
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(1500)]);
    try { process.kill(-browser.pid, 'SIGKILL'); } catch { /* already stopped */ }
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
