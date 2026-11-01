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
const intentionalLegacy404s = [
  {
    path: '/tools/extract-images-from-pdf/',
    reason: 'PDF to Image renders whole pages as PNG; it does not extract embedded image objects.',
  },
  {
    path: '/tools/flatten-pdf/',
    reason: 'No public PDF flattening tool exists; merging documents is not equivalent.',
  },
  {
    path: '/tools/pdf-to-pdfa/',
    reason: 'The PDF/A route remains hidden because no PDF/A conversion or conformance validation engine exists.',
  },
  {
    path: '/tools/repair-pdf/',
    reason: 'The canonical repair slug is repair-corrupted-pdf; this non-registered variant is not a public route.',
  },
  {
    path: '/tools/repair-corrupted-pdf/',
    reason: 'PDF Repair remains hidden until real-file recovery behavior meets the release bar.',
  },
  {
    path: '/tools/powerpoint-to-pdf/',
    reason: 'PowerPoint to PDF remains hidden until its real-file behavior meets the release bar.',
  },
  {
    path: '/ur/tools/repair-corrupted-pdf/',
    reason: 'Localized PDF Repair drafts remain hidden along with the English public route.',
  },
  {
    path: '/ja/tools/powerpoint-to-pdf/',
    reason: 'Localized PowerPoint to PDF drafts remain hidden along with the English public route.',
  },
];

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(entryPath);
    return entry.isFile() && /\.html?$/i.test(entry.name) ? [entryPath] : [];
  }));
  return nestedFiles.flat();
}

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
      const assetPath = relativePath === 'ad-320x50'
        ? path.join(publicDir, 'ad-320x50.html')
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

  assert.equal(tools.length, 23, 'PDF/A, PDF Repair, and PowerPoint to PDF remain hidden.');

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

test('the tools index is served as a canonical static page for GET and HEAD', async () => {
  const env = { ASSETS: createAssetsBinding() };

  for (const method of ['GET', 'HEAD']) {
    const response = await worker.fetch(
      new Request('https://www.clickpdf.net/tools/', { method }),
      env,
    );
    assert.equal(response.status, 200, `${method} /tools/ is available`);
    assert.equal(response.headers.get('location'), null, `${method} /tools/ does not redirect`);
    assert.match(
      response.headers.get('content-type') || '',
      /text\/html/i,
      `${method} /tools/ serves HTML`,
    );
    if (method === 'GET') {
      const html = await response.text();
      assert.match(html, /<link rel="canonical" href="https:\/\/www\.clickpdf\.net\/tools\/"/);
      assert.match(html, /<h1>All PDF Tools<\/h1>/);
      assert.match(html, /name="robots" content="index,follow"/);
    }
  }
});

test('bare /tools permanently redirects to the canonical URL in one step for GET and HEAD', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const origins = [
    'http://www.clickpdf.net',
    'https://www.clickpdf.net',
    'http://clickpdf.net',
    'https://clickpdf.net',
  ];
  const canonicalUrl = 'https://www.clickpdf.net/tools/?audit=utility';

  for (const method of ['GET', 'HEAD']) {
    for (const origin of origins) {
      const response = await worker.fetch(
        new Request(`${origin}/tools?audit=utility`, { method }),
        env,
      );

      assert.equal(response.status, 301, `${method} ${origin}/tools redirects permanently`);
      assert.equal(
        response.headers.get('location'),
        canonicalUrl,
        `${method} ${origin}/tools redirects directly and preserves its query`,
      );
    }
  }
});

test('complete localized tool routes serve matching canonical static pages', async (t) => {
  const env = { ASSETS: createAssetsBinding() };
  const localizedRoutes = tools.flatMap((tool) =>
    Object.keys(tool.localizedSeoContent || {}).map((locale) => ({
      tool,
      locale,
      path: `/${locale}/tools/${tool.slug}/`,
    })),
  );

  assert.equal(localizedRoutes.length, 460, 'only localized routes for public tools are exposed');

  for (const { locale, path: routePath } of localizedRoutes) {
    await t.test(routePath, async () => {
      const noSlash = await worker.fetch(
        new Request(`https://www.clickpdf.net${routePath.slice(0, -1)}`),
        env,
      );
      assert.equal(noSlash.status, 301, 'the no-slash localized path redirects permanently');
      assert.equal(noSlash.headers.get('location'), `https://www.clickpdf.net${routePath}`);

      const response = await worker.fetch(
        new Request(`https://www.clickpdf.net${routePath}`),
        env,
      );
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, new RegExp(`<html[^>]*lang=["']${locale}["']`, 'i'));
      assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']https:\\/\\/www\\.clickpdf\\.net${routePath.replaceAll('/', '\\/')}["']`));
    });
  }
});

test('every public tool has localized SEO content in all 20 non-English locales', () => {
  for (const tool of tools) {
    assert.equal(
      Object.keys(tool.localizedSeoContent || {}).length,
      20,
      `${tool.id} has localized content for every non-English language`,
    );
  }
});

test('legacy tool aliases redirect to their current canonical tool routes', async () => {
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/protect-pdf'), '/tools/protect-pdf-password/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/pdf-metadata'), '/tools/edit-pdf-metadata/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/protect-pdf'), '/tools/protect-pdf-password/');
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/pdf-metadata'), '/tools/edit-pdf-metadata/');
});

test('Unlock PDF legacy URLs redirect directly to the canonical page for host and slash variants', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const origins = [
    'http://www.clickpdf.net',
    'https://www.clickpdf.net',
    'http://clickpdf.net',
    'https://clickpdf.net',
  ];
  const canonicalUrl = 'https://www.clickpdf.net/tools/unlock-pdf-password/?source=legacy-url-test';
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/unlock-pdf'), '/tools/unlock-pdf-password/');

  for (const origin of origins) {
    for (const pathVariant of ['/tools/unlock-pdf', '/tools/unlock-pdf/']) {
      const response = await worker.fetch(
        new Request(`${origin}${pathVariant}?source=legacy-url-test`),
        env,
      );
      assert.equal(response.status, 301, `${origin}${pathVariant} redirects permanently`);
      assert.equal(
        response.headers.get('location'),
        canonicalUrl,
        `${origin}${pathVariant} reaches the final canonical URL in one hop`,
      );

      const target = await worker.fetch(new Request(canonicalUrl), env);
      assert.equal(target.status, 200, 'the canonical Unlock PDF page is available');
      assert.equal(target.headers.get('location'), null, 'the canonical target does not redirect again');
      assert.match(
        await target.text(),
        /<link rel=["']canonical["'] href=["']https:\/\/www\.clickpdf\.net\/tools\/unlock-pdf-password\/["']/,
      );
    }
  }
});

test('the grayscale legacy URL redirects to the working Compress PDF grayscale option', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const canonicalUrl = 'https://www.clickpdf.net/tools/compress-pdf/?source=legacy-url-test';
  assert.equal(TOOL_ROUTE_REDIRECTS.get('/tools/grayscale-pdf'), '/tools/compress-pdf/');

  for (const pathVariant of ['/tools/grayscale-pdf', '/tools/grayscale-pdf/']) {
    const response = await worker.fetch(
      new Request(`https://www.clickpdf.net${pathVariant}?source=legacy-url-test`),
      env,
    );
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), canonicalUrl);

    const target = await worker.fetch(new Request(canonicalUrl), env);
    assert.equal(target.status, 200);
    assert.equal(target.headers.get('location'), null);
    assert.match(
      await target.text(),
      /<link rel=["']canonical["'] href=["']https:\/\/www\.clickpdf\.net\/tools\/compress-pdf\/["']/,
    );
  }
});

test('unsupported legacy and hidden tool URLs remain 404 and absent from sitemap and rendered internal links', async (t) => {
  const env = { ASSETS: createAssetsBinding() };
  const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
  const sitemapPaths = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname),
  );
  const renderedLinks = new Set();

  for (const htmlPath of await listHtmlFiles(publicDir)) {
    const html = await readFile(htmlPath, 'utf8');
    for (const [, href] of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      try {
        const link = new URL(href, 'https://www.clickpdf.net');
        if (link.origin === 'https://www.clickpdf.net') renderedLinks.add(link.pathname);
      } catch {
        // Ignore non-URL attribute values; they are not navigable links.
      }
    }
  }

  for (const { path: legacyPath, reason } of intentionalLegacy404s) {
    await t.test(legacyPath, async () => {
      const slug = legacyPath.split('/').filter(Boolean).at(-1);
      assert.ok(reason.length > 0, 'the intentional 404 decision has a documented rationale');
      assert.ok(!tools.some((tool) => tool.slug === slug), `${legacyPath} is not in the active public registry`);
      assert.ok(!sitemapPaths.has(legacyPath), `${legacyPath} is absent from the sitemap`);
      assert.ok(!sitemapPaths.has(legacyPath.slice(0, -1)), `${legacyPath} without a slash is absent from the sitemap`);
      assert.ok(!renderedLinks.has(legacyPath), `${legacyPath} is absent from rendered internal links`);
      assert.ok(!renderedLinks.has(legacyPath.slice(0, -1)), `${legacyPath} without a slash is absent from rendered internal links`);

      const noSlash = await worker.fetch(
        new Request(`https://www.clickpdf.net${legacyPath.slice(0, -1)}?source=legacy-404-test`),
        env,
      );
      assert.equal(noSlash.status, 301, 'slashless tool paths normalize to the trailing-slash URL');
      assert.equal(
        noSlash.headers.get('location'),
        `https://www.clickpdf.net${legacyPath}?source=legacy-404-test`,
      );
      const normalized = await worker.fetch(new Request(noSlash.headers.get('location')), env);
      assert.equal(normalized.status, 404, reason);
      assert.equal(normalized.headers.get('location'), null, 'the intentional 404 does not redirect elsewhere');

      const withSlash = await worker.fetch(
        new Request(`https://www.clickpdf.net${legacyPath}`),
        env,
      );
      assert.equal(withSlash.status, 404, reason);
      assert.equal(withSlash.headers.get('location'), null);
    });
  }
});

test('the 320x50 ad URL returns the static advertisement document directly', async () => {
  const env = { ASSETS: createAssetsBinding() };
  const response = await worker.fetch(
    new Request('https://www.clickpdf.net/ad-320x50.html'),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null, 'the public .html URL should not redirect');
  const html = await response.text();
  assert.match(html, /<title>Advertisement<\/title>/);
  assert.match(html, /atOptions/);
  assert.match(html, /https:\/\/bauval\.org\/22\/3221c27a7eae6feed96313cf6813cfcc/);
  assert.match(html, /height:\s*50/);
  assert.match(html, /width:\s*320/);
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
