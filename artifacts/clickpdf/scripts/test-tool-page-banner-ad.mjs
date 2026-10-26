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
  await waitFor(() => evaluate(`!!document.body?.innerText.includes('Free PDF tools that work in your browser')`), 'home page');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 0, 'home page must not mount the ad');

  await goTo('/tools/merge');
  await waitFor(() => evaluate(`document.body?.innerText.includes('Merge PDF') && document.body?.innerText.includes('Back to Tools Catalog')`), 'Merge PDF page');
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'loading'`), 'loading ad slot');
  const initialState = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    const frame = ad?.querySelector('iframe');
    const slotRect = ad?.getBoundingClientRect();
    const frameRect = frame?.getBoundingClientRect();
    const header = document.querySelector('header');
    const back = [...document.querySelectorAll('button')].find(button => button.innerText.includes('Back to Tools Catalog'));
    return {
      state: ad?.dataset.adState,
      display: ad && getComputedStyle(ad).display,
      width: slotRect?.width,
      height: slotRect?.height,
      frameWidth: frameRect?.width,
      frameHeight: frameRect?.height,
      belowHeader: Boolean(header && slotRect && slotRect.top >= header.getBoundingClientRect().bottom),
      aboveBack: Boolean(back && slotRect && slotRect.bottom <= back.getBoundingClientRect().top),
      iframes: ad?.querySelectorAll('iframe').length,
      hasBackButton: Boolean([...document.querySelectorAll('button')].find(button => button.innerText.includes('Back to Tools Catalog'))),
      hasHeader: Boolean(document.querySelector('header'))
    };
  })()`);
  assert.equal(initialState.state, 'loading');
  assert.equal(initialState.display, 'flex', 'the banner slot should remain visible while the provider loads');
  assert.equal(initialState.width, 320);
  assert.equal(initialState.height, 50);
  assert.equal(initialState.frameWidth, 320);
  assert.equal(initialState.frameHeight, 50);
  assert.equal(initialState.belowHeader, true);
  assert.equal(initialState.aboveBack, true);
  assert.equal(initialState.iframes, 1, 'the banner loads by default while the cookie notice remains available');
  assert.equal(initialState.hasHeader, true, 'global header should be present');

  await waitFor(() => evaluate(`!![...document.querySelectorAll('button')].find(button => button.innerText.includes('Accept Cookies'))`), 'cookie consent prompt');
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.innerText.includes('Accept Cookies')).click()`);
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'loading'`), 'consented ad frame load');
  const frameState = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    const frame = ad?.querySelector('iframe');
    return {
      frameCount: ad?.querySelectorAll('iframe').length,
      framePath: frame ? new URL(frame.src).pathname : null,
      hasSrcDoc: Boolean(frame?.hasAttribute('srcdoc')),
      sandbox: frame?.getAttribute('sandbox'),
      referrerPolicy: frame?.referrerPolicy,
      isIsolated: frame?.hasAttribute('sandbox') && !frame.getAttribute('sandbox').includes('allow-same-origin')
    };
  })()`);
  assert.equal(frameState.frameCount, 1);
  assert.equal(frameState.framePath, '/ad-320x50.html', 'the banner must load from its standalone static document');
  assert.equal(frameState.hasSrcDoc, false, 'the provider document must not use srcDoc');
  assert.equal(frameState.referrerPolicy, 'strict-origin');
  assert.equal(frameState.isIsolated, true, 'provider code must not share the application origin');
  const staticAdPage = await evaluate(`(async () => {
    const response = await fetch('/ad-320x50.html');
    const html = await response.text();
    return {
      status: response.status,
      providerUrl: html.includes('https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc'),
      publisherKey: html.includes('3221c27a7eae6feed96313cf6813cfcc'),
      parserInsertedScript: /<script[^>]+src="https:\\/\\/bauval\\.org\\/22\\/3221c27a7eae6feed96313cf6813cfcc"/.test(html),
      referrerPolicy: html.includes('<meta name="referrer" content="strict-origin"')
    };
  })()`);
  assert.equal(staticAdPage.status, 200, 'the standalone banner document should be served directly');
  assert.equal(staticAdPage.providerUrl, true, 'the existing Adsterra URL must remain unchanged');
  assert.equal(staticAdPage.publisherKey, true, 'the existing publisher key must remain unchanged');
  assert.equal(staticAdPage.parserInsertedScript, true, 'the provider script must remain parser-inserted for document.write compatibility');
  assert.equal(staticAdPage.referrerPolicy, true, 'the standalone ad document must send only the site origin as referrer');

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
  assert.notEqual(await evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState`), 'empty', 'the same loading slot should remain mounted during tool navigation');

  await goTo('/tools/pdf-to-text');
  await waitFor(() => evaluate(`document.body?.innerText.includes('PDF to Text')`), 'isolated text tool navigation');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 1, 'specialized tool components must inherit the same single shared ad slot');
  assert.notEqual(await evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState`), 'empty', 'specialized tool navigation should preserve the shared loading slot');

  await goTo('/');
  await waitFor(() => evaluate(`document.body?.innerText.includes('Free PDF tools that work in your browser')`), 'return to home');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="tool-page-banner-ad"]').length`), 0, 'returning to the homepage must unmount the ad');

  await goTo('/tools/merge');
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState === 'loading'`), 'real provider no-fill test');
  const noFillStartedAt = Date.now();
  await waitFor(() => evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState !== 'loading'`), 'provider response or no-fill timeout', 15000);
  const noFillElapsedMs = Date.now() - noFillStartedAt;
  const finalAdState = await evaluate(`document.querySelector('[data-testid="tool-page-banner-ad"]')?.dataset.adState`);
  assert.ok(['empty', 'rendered'].includes(finalAdState), `unexpected provider state: ${finalAdState}`);
  const noFill = await evaluate(`(() => {
    const ad = document.querySelector('[data-testid="tool-page-banner-ad"]');
    return { display: getComputedStyle(ad).display, width: ad.getBoundingClientRect().width, height: ad.getBoundingClientRect().height, iframes: ad.querySelectorAll('iframe').length };
  })()`);
  if (finalAdState === 'empty') {
    assert.ok(noFillElapsedMs >= 10_000, `empty response should collapse after the configured 12-second timeout; elapsed ${noFillElapsedMs}ms`);
    assert.deepEqual(noFill, { display: 'none', width: 0, height: 0, iframes: 0 }, 'no-fill must remove the full wrapper and its reserved space');
  } else {
    assert.equal(noFill.display, 'flex', 'a provider iframe load should preserve the banner slot');
    assert.equal(noFill.height, 50);
  }
  console.log(`PASS: the real provider request kept the loading slot visible at 320×50; mobile scaled without horizontal overflow; final state was ${finalAdState} after ${noFillElapsedMs}ms. No synthetic render signal was used; a loaded iframe is not proof that an ad creative visibly filled.`);
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (browser) {
    try { process.kill(-browser.pid, 'SIGTERM'); } catch { browser.kill('SIGTERM'); }
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(1500)]);
    try { process.kill(-browser.pid, 'SIGKILL'); } catch { /* already stopped */ }
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
