import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../cloudflare-worker.mjs';

test('apex host permanently redirects to the matching www URL', async () => {
  const request = new Request('http://clickpdf.net/tools/merge-pdf?source=test');
  const response = await worker.fetch(request, { ASSETS: { fetch: async () => assert.fail('Assets should not receive apex requests') } });

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.clickpdf.net/tools/merge-pdf?source=test');
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
