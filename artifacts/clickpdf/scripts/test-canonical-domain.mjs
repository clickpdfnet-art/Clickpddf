import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import worker from '../cloudflare-worker.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const publicDir = path.join(appDir, 'dist', 'public');

test('tool URL variants reach the canonical host and trailing-slash form in at most one redirect', async () => {
  const variants = [
    ['https://clickpdf.net/tools/image-to-pdf?source=test', 301, 'https://www.clickpdf.net/tools/image-to-pdf/?source=test'],
    ['https://clickpdf.net/tools/image-to-pdf/?source=test', 301, 'https://www.clickpdf.net/tools/image-to-pdf/?source=test'],
    ['https://www.clickpdf.net/tools/image-to-pdf?source=test', 301, 'https://www.clickpdf.net/tools/image-to-pdf/?source=test'],
  ];
  const env = {
    ASSETS: {
      fetch: async (request) => {
        assert.equal(new URL(request.url).pathname, '/tools/image-to-pdf/');
        return new Response('canonical tool', { status: 200 });
      },
    },
  };

  for (const [requestUrl, status, location] of variants) {
    const response = await worker.fetch(new Request(requestUrl), env);
    assert.equal(response.status, status, requestUrl);
    assert.equal(response.headers.get('location'), location, requestUrl);
  }

  const canonicalResponse = await worker.fetch(
    new Request('https://www.clickpdf.net/tools/image-to-pdf/'),
    env,
  );
  assert.equal(canonicalResponse.status, 200);
  assert.equal(canonicalResponse.headers.get('location'), null);
});

test('apex blog aliases, including localized URLs, redirect directly to their final canonical URL', async () => {
  const blogRoutes = JSON.parse(
    await readFile(path.join(publicDir, '__blog_routes.json'), 'utf8'),
  );
  const localizedRoute = Object.entries(blogRoutes).find(
    ([alias]) => alias !== '/blog' && /[^\u0000-\u007f]/.test(alias),
  );
  assert.ok(localizedRoute, 'generated route map contains a Unicode blog route');

  const [localizedAlias, localizedCanonical] = localizedRoute;
  const assets = {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === '/__blog_routes.json') {
        return new Response(JSON.stringify(blogRoutes), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('canonical article', { status: 200 });
    },
  };

  const requestUrl = new URL(`${localizedAlias}?source=test`, 'https://clickpdf.net');
  const response = await worker.fetch(new Request(requestUrl), { ASSETS: assets });
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    `https://www.clickpdf.net${localizedCanonical}?source=test`,
  );
});

test('apex homepage and canonical slash routes require only the host redirect', async () => {
  const assets = { fetch: async () => new Response('canonical page', { status: 200 }) };
  for (const pathname of ['/', '/blog/', '/faq/', '/privacy-policy/']) {
    const response = await worker.fetch(
      new Request(`https://clickpdf.net${pathname}`),
      { ASSETS: assets },
    );
    assert.equal(response.status, 301, pathname);
    assert.equal(response.headers.get('location'), `https://www.clickpdf.net${pathname}`);
  }
});

test('www requests are served from the static asset binding without redirect', async () => {
  let passedRequest;
  const expectedResponse = new Response('static page', { status: 200 });
  const response = await worker.fetch(
    new Request('https://www.clickpdf.net/tools/compress-pdf/'),
    { ASSETS: { fetch: async (request) => { passedRequest = request; return expectedResponse; } } },
  );

  assert.equal(response, expectedResponse);
  assert.equal(passedRequest.url, 'https://www.clickpdf.net/tools/compress-pdf/');
});

test('workers.dev and other hosts continue to serve the static app', async () => {
  const expectedResponse = new Response('static app');
  const response = await worker.fetch(
    new Request('https://clickpddf.clickpdfnet.workers.dev/'),
    { ASSETS: { fetch: async () => expectedResponse } },
  );

  assert.equal(response, expectedResponse);
});
