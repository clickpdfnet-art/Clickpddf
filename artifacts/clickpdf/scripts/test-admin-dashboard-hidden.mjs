import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await mkdtemp(join(tmpdir(), 'clickpdf-admin-hidden-'));
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

async function navigate(path) {
  await send('Page.navigate', { url: `http://127.0.0.1:21606${path}` });
  await waitFor(() => evaluate(`document.readyState === 'complete' && Boolean(document.body?.innerText)`), `route ${path}`);
  const expectedText = path === '/blog' ? 'Back to PDF Tools' : 'Stay Secure, Stay Smart';
  await waitFor(() => evaluate(`document.body?.innerText.includes(${JSON.stringify(expectedText)})`), `app content on ${path}`);
}

async function assertNoAdminEntry(path) {
  await navigate(path);
  const visibleAdminAccess = await evaluate(`(() => {
    const text = /admin dashboard|publish article|open admin dashboard/i;
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    return [...document.querySelectorAll('a, button')].some(element =>
      visible(element) && text.test([element.innerText, element.getAttribute('title'), element.getAttribute('aria-label')].join(' '))
    );
  })()`);
  assert.equal(visibleAdminAccess, false, `${path} should not expose an Admin Dashboard button or link`);

  const adminLinks = await evaluate(`[...document.querySelectorAll('a[href]')].some(link => /admin/i.test(link.getAttribute('href') || ''))`);
  assert.equal(adminLinks, false, `${path} should not expose an Admin URL`);
  const modalVisible = await evaluate(`document.body?.innerText.includes('ClickPDF Admin Dashboard')`);
  assert.equal(modalVisible, false, `${path} should not open the Admin Dashboard modal`);
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
  for (const path of ['/', '/admin', '/?admin=true', '/?view=admin', '/#admin', '/blog']) {
    await assertNoAdminEntry(path);
  }

  await navigate('/');
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 2 | 8,
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 0,
  });
  const dashboardOpenedByShortcut = await evaluate(`document.body?.innerText.includes('ClickPDF Admin Dashboard')`);
  assert.equal(dashboardOpenedByShortcut, false, 'Ctrl+Shift+A must not reopen the Admin Dashboard');

  const adminModalSource = await readFile(new URL('../src/components/AdminModal.tsx', import.meta.url), 'utf8');
  assert.match(adminModalSource, /export const AdminModal/, 'Admin Dashboard component code should remain backed up');
  console.log('PASS: footer/blog admin entries are absent; /admin and admin query/hash routes do not open it; shortcut is disabled; AdminModal source remains intact.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (browser) {
    try { process.kill(-browser.pid, 'SIGTERM'); } catch { browser.kill('SIGTERM'); }
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(1500)]);
    try { process.kill(-browser.pid, 'SIGKILL'); } catch { /* already stopped */ }
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
