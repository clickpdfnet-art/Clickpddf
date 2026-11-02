import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRestoredToolPages } from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const candidateRoot = path.resolve(appDir, '../..');
const config = await readFile(path.join(candidateRoot, 'wrangler.toml'), 'utf8');
const assetsSection = config.match(/\[assets\]([\s\S]*?)(?:\n\[|$)/)?.[1] ?? '';
const directory = assetsSection.match(/^\s*directory\s*=\s*["']([^"']+)["']/m)?.[1];
const notFoundHandling = assetsSection.match(/^\s*not_found_handling\s*=\s*["']([^"']+)["']/m)?.[1];
assert.equal(directory, './artifacts/clickpdf/dist/public', 'candidate preserves the origin assets directory');
assert.equal(notFoundHandling, 'single-page-application', 'candidate preserves the origin SPA fallback');
assert.doesNotMatch(config, /^\s*main\s*=/m, 'candidate does not add a Worker entrypoint');

const assetRoot = path.resolve(candidateRoot, directory);
const { pages, englishPages } = await readRestoredToolPages(appDir);
const staticPages = [...pages, ...englishPages];
const rootIndex = await readFile(path.join(assetRoot, 'index.html'), 'utf8');
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://asset.test').pathname);
    const candidatePath = path.resolve(assetRoot, `.${pathname}`);
    if (candidatePath !== assetRoot && !candidatePath.startsWith(`${assetRoot}${path.sep}`)) {
      response.writeHead(400).end('Bad path');
      return;
    }

    let filePath = candidatePath;
    try {
      if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, 'index.html');
      await stat(filePath);
    } catch {
      filePath = path.join(assetRoot, 'index.html');
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(500).end('Asset test server error');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  for (const page of staticPages) {
    const response = await fetch(`${base}${new URL(page.canonical).pathname}`);
    assert.equal(response.status, 200, `${page.locale}:${page.toolId} static asset route returns 200`);
    const html = await response.text();
    assert.ok(html.includes(`<title>${escapeHtml(page.seoTitle)} | ClickPDF</title>`), `${page.locale}:${page.toolId} serves its route-specific static file rather than the SPA shell`);
    assert.ok(html.includes('id="seo-static-content"'));
    assert.ok(html.includes(`<link rel="canonical" href="${page.canonical}" />`));
  }

  const missing = await fetch(`${base}/__task194_missing_route__`);
  assert.equal(missing.status, 200, 'the original SPA fallback remains available for unknown client routes');
  assert.equal(await missing.text(), rootIndex);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

console.log(`PASS: ${staticPages.length} routes resolve to their static HTML under the origin assets directory; SPA fallback remains intact.`);
