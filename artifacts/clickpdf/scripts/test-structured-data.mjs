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

function staticMain(html, url) {
  const match = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(match, `route-specific semantic static content is in the HTML response: ${url}`);
  const headings = match[1].match(/<h1\b/gi) || [];
  assert.equal(headings.length, 1, `static fallback has exactly one H1: ${url}`);
  return match[1];
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
    const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const twitterImage = html.match(/<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    assert.equal(ogImage, `${siteOrigin}/social/clickpdf-social-1200x630.png`);
    assert.equal(twitterImage, ogImage);
    assert.match(html, /property=["']og:image:width["']\s+content=["']1200["']/i);
    assert.match(html, /property=["']og:image:height["']\s+content=["']630["']/i);
    assert.match(html, /rel=["']icon["'][^>]*href=["']\/favicon\.ico["']/i);
    assert.match(html, /rel=["']apple-touch-icon["'][^>]*href=["']\/apple-touch-icon\.png["']/i);
    assert.match(html, /sizes=["']192x192["'][^>]*href=["']\/icon-192\.png["']/i);
    assert.match(html, /sizes=["']512x512["'][^>]*href=["']\/icon-512\.png["']/i);
    staticMain(html, url);
    assert.match(html, /<div id=["']root["']><\/div>/i, 'React createRoot mount remains empty and unchanged');
  }
});

test('homepage contains brand, WebSite, WebApplication, navigation, and the full tool list', async () => {
  const { html, nodes } = await readHeadSchemas(`${siteOrigin}/`);
  const content = staticMain(html, `${siteOrigin}/`);
  const types = schemaTypes(nodes);
  for (const required of ['Organization', 'WebSite', 'WebPage', 'WebApplication', 'ItemList', 'SiteNavigationElement']) {
    assert.ok(types.has(required), `homepage schema includes ${required}`);
  }
  assert.ok(!types.has('FAQPage'), 'homepage does not claim FAQ content that is not shown there');
  const organization = nodes.find((node) => node['@type'] === 'Organization' && node.name === 'Click Digital Services');
  const website = nodes.find((node) => node['@type'] === 'WebSite');
  assert.equal(organization?.logo?.url, `${siteOrigin}/icon-512.png`);
  assert.equal(organization?.logo?.width, 512);
  assert.equal(website?.image?.url, `${siteOrigin}/icon-512.png`);
  const toolsList = nodes.find((node) => node['@type'] === 'ItemList' && node['@id'] === `${siteOrigin}/#tools`);
  assert.equal(toolsList?.numberOfItems, activeTools.length);
  assert.equal(toolsList?.itemListElement?.length, activeTools.length);
  assert.equal((content.match(/<a href="\/tools\//g) || []).length, activeTools.length);
});

test('each active PDF tool has SoftwareApplication, HowTo, FAQPage, and BreadcrumbList schemas', async () => {
  for (const url of toolUrls) {
    const { html, nodes } = await readHeadSchemas(url);
    const content = staticMain(html, url);
    const types = schemaTypes(nodes);
    for (const required of ['SoftwareApplication', 'WebApplication', 'HowTo', 'FAQPage', 'BreadcrumbList']) {
      assert.ok(types.has(required), `${url} schema includes ${required}`);
    }
    assert.match(content, /<section[\s\S]*?<ol>/i, `${url} includes semantic how-to steps`);
    assert.match(content, /Frequently asked questions/i, `${url} includes visible FAQ text`);
    const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1);
    const tool = activeTools.find((item) => item.slug === slug);
    assert.ok(tool, `active tool registry includes ${url}`);
    assert.equal((content.match(/<details>/g) || []).length, tool.faqs.length, `${url} renders every current FAQ`);
  }
});

test('blog posts, blog index, FAQ, and batch routes have page-specific static schemas', async () => {
  let blogPostPages = 0;
  for (const url of urls) {
    const { html, nodes } = await readHeadSchemas(url);
    const content = staticMain(html, url);
    const types = schemaTypes(nodes);
    if (types.has('BlogPosting')) {
      blogPostPages += 1;
      assert.ok(types.has('Article'), `${url} includes Article`);
      assert.ok(types.has('BreadcrumbList'), `${url} includes BreadcrumbList`);
      assert.match(content, /<article>/i, `${url} contains semantic article body`);
      assert.match(content, /<h2\b/i, `${url} contains semantic section headings`);
      assert.match(content, /<a href=/i, `${url} contains crawlable article links`);
      if (content.includes('<figure>')) {
        assert.match(content, /<img src="\/icon\.svg" alt="" aria-hidden="true"/i, `${url} displays the official logo watermark`);
      }
      const posting = nodes.find((node) => Array.isArray(node['@type']) && node['@type'].includes('BlogPosting'));
      assert.equal(posting?.publisher?.logo?.url, `${siteOrigin}/icon-512.png`, `${url} publisher uses the official logo`);
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

test('robots, llms.txt, and the social image are generated for production', async () => {
  const robots = await readFile(path.join(publicDir, 'robots.txt'), 'utf8');
  const llms = await readFile(path.join(publicDir, 'llms.txt'), 'utf8');
  const toolsSection = llms.split('## PDF tools\n')[1]?.split('\n## ')[0] || '';
  const guidesSection = llms.split('## Guides and articles\n')[1]?.split('\n## ')[0] || '';
  assert.match(robots, /Sitemap:\s*https:\/\/www\.clickpdf\.net\/sitemap\.xml/i);
  assert.match(robots, /https:\/\/www\.clickpdf\.net\/llms\.txt/i);
  assert.equal(
    (toolsSection.match(/^- \[/gm) || []).length,
    activeTools.length,
    'llms.txt contains every active public tool',
  );
  assert.equal(
    (guidesSection.match(/^- \[/gm) || []).length,
    blogFiles.length,
    'llms.txt contains every Markdown article',
  );
  await access(path.join(publicDir, 'social', 'clickpdf-social-1200x630.png'));
  const manifest = JSON.parse(await readFile(path.join(publicDir, 'manifest.json'), 'utf8'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/icon-192.png'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/icon-512.png'));
  const serviceWorker = await readFile(path.join(publicDir, 'sw.js'), 'utf8');
  assert.match(serviceWorker, /clickpdf-v3/);
  assert.match(serviceWorker, /icon-192\.png/);
  assert.match(serviceWorker, /icon-512\.png/);
  for (const [fileName, width, height] of [
    ['icon-192.png', 192, 192],
    ['icon-512.png', 512, 512],
    ['apple-touch-icon.png', 180, 180],
    ['social/clickpdf-social-1200x630.png', 1200, 630],
  ]) {
    const image = await readFile(path.join(publicDir, fileName));
    assert.equal(image.readUInt32BE(16), width, `${fileName} width`);
    assert.equal(image.readUInt32BE(20), height, `${fileName} height`);
  }
  const favicon = await readFile(path.join(publicDir, 'favicon.ico'));
  assert.equal(favicon.readUInt16LE(0), 0);
  assert.equal(favicon.readUInt16LE(2), 1);
});
