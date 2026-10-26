import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import worker, { TOOL_ROUTE_REDIRECTS } from '../cloudflare-worker.mjs';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const publicDir = path.join(appDir, 'dist', 'public');
const tools = await readActiveToolRegistry(appDir);

function createAssetsBinding() {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const assetPath = path.join(publicDir, url.pathname, 'index.html');
      try {
        const html = await readFile(assetPath, 'utf8');
        return new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    },
  };
}

test('every public tool has an alias redirect and a valid canonical static route', async (t) => {
  const env = { ASSETS: createAssetsBinding() };

  assert.equal(tools.length, 21, 'The public tool registry should contain all 21 tools.');

  for (const tool of tools) {
    await t.test(tool.slug, async () => {
      const aliasPath = `/${tool.slug}/`;
      const canonicalPath = `/tools/${tool.slug}/`;
      assert.equal(TOOL_ROUTE_REDIRECTS.get(`/${tool.slug}`), canonicalPath);

      for (const variant of [aliasPath, aliasPath.slice(0, -1)]) {
        const aliasResponse = await worker.fetch(
          new Request(`https://www.clickpdf.net${variant}?source=alias-test`),
          env,
        );
        assert.equal(aliasResponse.status, 301);
        assert.equal(
          aliasResponse.headers.get('location'),
          `https://www.clickpdf.net${canonicalPath}?source=alias-test`,
        );
      }

      const canonicalResponse = await worker.fetch(
        new Request(`https://www.clickpdf.net${canonicalPath}`),
        env,
      );
      assert.equal(canonicalResponse.status, 200);
      assert.match(await canonicalResponse.text(), new RegExp(
        `<link rel=["']canonical["'] href=["']https://www\\.clickpdf\\.net${canonicalPath.replaceAll('/', '\\/')}["']`,
      ));
    });
  }
});

test('legacy tool aliases redirect to their current canonical tool routes', async () => {
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/protect-pdf'), '/tools/protect-pdf-password/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/pdf-metadata'), '/tools/edit-pdf-metadata/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/protect-pdf'), '/tools/protect-pdf-password/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/pdf-metadata'), '/tools/edit-pdf-metadata/');
});
