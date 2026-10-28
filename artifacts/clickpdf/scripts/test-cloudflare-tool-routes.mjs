import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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
      let decodedPath;
      try {
        decodedPath = decodeURIComponent(url.pathname);
      } catch {
        return new Response('Not Found', { status: 404 });
      }
      const relativePath = decodedPath.replace(/^\/+/, '');
      const assetPath = relativePath === 'ad-160x300'
        ? path.join(publicDir, 'ad-160x300.html')
        : /\.(?:json|html)$/i.test(relativePath)
        ? path.join(publicDir, relativePath)
        : path.join(publicDir, relativePath, 'index.html');
      try {
        const html = await readFile(assetPath, 'utf8');
        const contentType = relativePath.endsWith('.json')
          ? 'application/json; charset=utf-8'
          : 'text/html; charset=utf-8';
        return new Response(html, {
          status: 200,
          headers: { 'content-type': contentType },
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

test('the 160x300 ad URL returns the static advertisement document directly', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const response = await worker.fetch(
    new Request('https://www.clickpdf.net/ad-160x300.html'),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null, 'the public .html URL should not redirect');
  const html = await response.text();
  assert.match(html, /<title>Advertisement<\/title>/);
  assert.match(html, /atOptions/);
  assert.match(html, /https:\/\/bauval\.org\/22\/e39a0a66fdd541a9ce157b436297163d/);
  assert.match(html, /height:\s*300/);
  assert.match(html, /width:\s*160/);
  assert.doesNotMatch(html, /404 Page not found|Free PDF tools that work in your browser/);
});

test('all published blog article aliases permanently redirect to their canonical trailing-slash routes', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const blogRouteMap = JSON.parse(await readFile(path.join(publicDir, '__blog_routes.json'), 'utf8'));
  const articleRoutes = Object.entries(blogRouteMap).filter(([key]) => key !== '/blog');
  const markdownArticles = (await readdir(path.join(appDir, 'src', 'blogs')))
    .filter((name) => name.endsWith('.md'));

  assert.equal(articleRoutes.length, markdownArticles.length, 'each Markdown article has one generated no-slash route alias');
  assert.equal(blogRouteMap['/blog'], '/blog/', 'the blog index also has its canonical slash route');

  for (const [aliasPath, canonicalPath] of Object.entries(blogRouteMap)) {
    const response = await worker.fetch(
      new Request(`https://www.clickpdf.net${aliasPath}?source=redirect-test`),
      env,
    );
    assert.equal(response.status, 301, `${aliasPath} uses a permanent redirect`);
    assert.equal(
      response.headers.get('location'),
      `https://www.clickpdf.net${canonicalPath}?source=redirect-test`,
      `${aliasPath} redirects to its generated canonical route and preserves query parameters`,
    );

    const canonicalResponse = await worker.fetch(
      new Request(response.headers.get('location')),
      env,
    );
    assert.equal(canonicalResponse.status, 200, `${canonicalPath} resolves to its static article page`);
    const html = await canonicalResponse.text();
    assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']https:\\/\\/www\\.clickpdf\\.net${canonicalPath.replaceAll('/', '\\/')}["']`));
  }
});
