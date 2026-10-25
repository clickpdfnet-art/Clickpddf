import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(appDir, 'dist', 'public');
const siteOrigin = 'https://www.clickpdf.net';

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function schemaNodes(schema) {
  if (!schema || typeof schema !== 'object') return [];
  return Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];
}

function schemaTypes(nodes) {
  return new Set(nodes.flatMap((node) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return types.filter((type) => typeof type === 'string');
  }));
}

function pageFileForUrl(value) {
  const pathname = new URL(value).pathname;
  const relative = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(publicDir, relative, 'index.html');
}

async function readHeadSchemas(value) {
  const html = await readFile(pageFileForUrl(value), 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `Rendered static page has a head element: ${value}`);
  const scripts = [...head.matchAll(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length, `JSON-LD is in the raw HTML head: ${value}`);
  const schemas = scripts.map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      assert.fail(`Invalid JSON-LD on ${value}: ${error.message}`);
    }
  });
  return { html, schemas, nodes: schemas.flatMap(schemaNodes) };
}

const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
  .map((match) => decodeXml(match[1].trim()));
const activeTools = await readActiveToolRegistry(appDir);
const toolUrls = urls.filter((value) => new URL(value).pathname.startsWith('/tools/'));
const blogFiles = (await readdir(path.join(appDir, 'src', 'blogs'))).filter((name) => name.endsWith('.md'));

test('sitemap routes have static metadata and parseable head JSON-LD', async () => {
  assert.equal(new Set(urls).size, urls.length, 'sitemap URLs are unique');
  assert.equal(toolUrls.length, activeTools.length, 'sitemap lists exactly the active public tools');
  for (const tool of activeTools) {
    assert.ok(
      toolUrls.includes(`${siteOrigin}/tools/${tool.slug}/`),
      `public tool route is present in sitemap: ${tool.slug}`,
    );
  }

  for (const url of urls) {
    assert.ok(url.startsWith(`${siteOrigin}/`), `production canonical host is used: ${url}`);
    const { html } = await readHeadSchemas(url);
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    assert.equal(canonical, url, `canonical matches its static route: ${url}`);
  }
});

test('homepage contains brand, WebSite, WebApplication, navigation, and the full tool list', async () => {
  const { nodes } = await readHeadSchemas(`${siteOrigin}/`);
  const types = schemaTypes(nodes);
  for (const required of ['Organization', 'WebSite', 'WebPage', 'WebApplication', 'ItemList', 'SiteNavigationElement']) {
    assert.ok(types.has(required), `homepage schema includes ${required}`);
  }
  assert.ok(!types.has('FAQPage'), 'homepage does not claim FAQ content that is not shown there');
  const toolsList = nodes.find((node) => node['@type'] === 'ItemList' && node['@id'] === `${siteOrigin}/#tools`);
  assert.equal(toolsList?.numberOfItems, activeTools.length);
  assert.equal(toolsList?.itemListElement?.length, activeTools.length);
});

test('each active PDF tool has SoftwareApplication, HowTo, FAQPage, and BreadcrumbList schemas', async () => {
  for (const url of toolUrls) {
    const { nodes } = await readHeadSchemas(url);
    const types = schemaTypes(nodes);
    for (const required of ['SoftwareApplication', 'WebApplication', 'HowTo', 'FAQPage', 'BreadcrumbList']) {
      assert.ok(types.has(required), `${url} schema includes ${required}`);
    }
  }
});

test('blog posts, blog index, FAQ, and batch routes have page-specific static schemas', async () => {
  let blogPostPages = 0;
  for (const url of urls) {
    const { nodes } = await readHeadSchemas(url);
    const types = schemaTypes(nodes);
    if (types.has('BlogPosting')) {
      blogPostPages += 1;
      assert.ok(types.has('Article'), `${url} includes Article`);
      assert.ok(types.has('BreadcrumbList'), `${url} includes BreadcrumbList`);
    }
    if (new URL(url).pathname === '/blog/') {
      assert.ok(types.has('CollectionPage'));
      assert.ok(types.has('ItemList'));
      assert.ok(types.has('BreadcrumbList'));
    }
    if (new URL(url).pathname === '/faq/') {
      assert.ok(types.has('FAQPage'));
      assert.ok(types.has('BreadcrumbList'));
    }
    if (new URL(url).pathname === '/batch/') {
      assert.ok(types.has('WebApplication'));
      assert.ok(types.has('BreadcrumbList'));
    }
  }
  assert.equal(blogPostPages, blogFiles.length, 'every Markdown blog post has static BlogPosting data');
});

test('all sitemap URLs resolve to generated static HTML files', async () => {
  for (const url of urls) {
    await access(pageFileForUrl(url));
  }
});
