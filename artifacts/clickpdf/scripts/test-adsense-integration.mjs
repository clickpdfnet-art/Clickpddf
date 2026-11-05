import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import worker from '../cloudflare-worker.mjs';
import { readActiveToolRegistry } from './static-tool-registry.mjs';
import {
  ADVERTISING_CONSENT_CHANGED_EVENT,
  ADVERTISING_CONSENT_STORAGE_KEY,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOT_ID,
  isValidAdSenseSlotId,
  shouldRequestAdUnit,
} from '../src/ads/adsenseRuntime.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(projectRoot, 'public');
const builtPublicDir = path.join(projectRoot, 'dist', 'public');
const expectedAdsTxt = 'google.com, pub-6250344265022238, DIRECT, f08c47fec0942fa0\n';
const expectedGaId = 'G-RYEME5P62V';
const expectedAdSenseScript =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6250344265022238';
const expectedGaScript = `https://www.googletagmanager.com/gtag/js?id=${expectedGaId}`;

function createAssetsBinding() {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname !== '/ads.txt') return new Response('Not Found', { status: 404 });
      return new Response(await readFile(path.join(builtPublicDir, 'ads.txt'), 'utf8'), {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    },
  };
}

async function readTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readTextFiles(entryPath);
    if (!/\.(?:ts|tsx|js|mjs|html|json|txt)$/i.test(entry.name)) return [];
    return [{ path: entryPath, content: await readFile(entryPath, 'utf8') }];
  }));
  return files.flat();
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function assertPublicHeadHasOneGoogleTagSet(html, sourcePath) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `${sourcePath} has a document head`);
  assert.equal(countMatches(head, /<script\b[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-RYEME5P62V["'][^>]*><\/script>/gi), 1, `${sourcePath} has one GA loader`);
  assert.equal(countMatches(head, /gtag\(['"]config['"],\s*['"]G-RYEME5P62V['"]\)/g), 1, `${sourcePath} configures the confirmed GA ID once`);
  assert.equal(countMatches(head, /<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6250344265022238["'][^>]*><\/script>/gi), 1, `${sourcePath} has one AdSense loader`);
  const adScript = head.match(/<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6250344265022238["'][^>]*><\/script>/i)?.[0] || '';
  assert.match(adScript, /\basync\b/i, `${sourcePath} AdSense loader is async`);
  assert.match(adScript, /\bcrossorigin=["']anonymous["']/i, `${sourcePath} AdSense loader uses anonymous CORS`);
}

async function assertAdsTxtResponse(response) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^text\/plain(?:;|$)/i);
  assert.equal(await response.text(), expectedAdsTxt);
}

test('ads.txt is one exact standard record and is served as plain text through local Worker routing', async () => {
  assert.equal(await readFile(path.join(publicDir, 'ads.txt'), 'utf8'), expectedAdsTxt);
  assert.equal(await readFile(path.join(builtPublicDir, 'ads.txt'), 'utf8'), expectedAdsTxt);
  await assert.rejects(access(path.join(projectRoot, 'ads.txt')));

  const env = { ASSETS: createAssetsBinding() };
  await assertAdsTxtResponse(await worker.fetch(new Request('https://www.clickpdf.net/ads.txt'), env));

  const secureApexResponse = await worker.fetch(
    new Request('https://clickpdf.net/ads.txt?source=ads-check'),
    env,
  );
  await assertAdsTxtResponse(secureApexResponse);
  assert.equal(secureApexResponse.headers.get('location'), null);

  for (const apexUrl of ['http://clickpdf.net/ads.txt', 'http://www.clickpdf.net/ads.txt']) {
    const redirect = await worker.fetch(new Request(apexUrl), env);
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), 'https://www.clickpdf.net/ads.txt');
    await assertAdsTxtResponse(await worker.fetch(new Request(redirect.headers.get('location')), env));
  }
});

test('confirmed AdSense publisher, single slot, and consent policy are configured', () => {
  assert.equal(ADSENSE_PUBLISHER_ID, 'ca-pub-6250344265022238');
  assert.equal(ADSENSE_SLOT_ID, '7770736190');
  assert.equal(isValidAdSenseSlotId(ADSENSE_SLOT_ID), true);
  assert.equal(shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID, null), true);
  assert.equal(shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID, 'accepted'), true);
  assert.equal(shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID, 'dismissed'), true);
  assert.equal(shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID, 'rejected'), false);
  assert.equal(shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, 'REPLACE_WITH_AD_SLOT_ID', null), false);
  assert.equal(shouldRequestAdUnit('invalid-publisher', ADSENSE_SLOT_ID, null), false);
  assert.equal(ADVERTISING_CONSENT_STORAGE_KEY, 'clickpdf_cookie_consent_v1');
  assert.equal(ADVERTISING_CONSENT_CHANGED_EVENT, 'clickpdf-cookie-consent-change');
});

test('every generated sitemap page and SPA shell has one GA tag and one AdSense loader in its head', async () => {
  const template = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
  assertPublicHeadHasOneGoogleTagSet(template, 'index.html');

  const sitemap = await readFile(path.join(builtPublicDir, 'sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map((match) => new URL(match[1].trim().replaceAll('&amp;', '&')));
  assert.ok(sitemapUrls.length > 0, 'the generated public sitemap contains routes');
  const unicodeRoutes = JSON.parse(
    await readFile(path.join(builtPublicDir, '__unicode_routes.json'), 'utf8'),
  );

  const htmlFiles = (await readTextFiles(builtPublicDir))
    .filter((file) => file.path.endsWith('.html'));
  assert.ok(htmlFiles.length >= sitemapUrls.length, 'generated HTML includes every sitemap route');
  for (const file of htmlFiles) {
    assertPublicHeadHasOneGoogleTagSet(file.content, path.relative(builtPublicDir, file.path));
    assert.doesNotMatch(file.content, /<ins\b[^>]*class=["'][^"']*\badsbygoogle\b/i, `${file.path} has no static ad unit`);
  }

  for (const url of sitemapUrls) {
    const decodedRoute = decodeURIComponent(url.pathname);
    const mappedPath = unicodeRoutes[decodedRoute];
    const encodedPath = url.pathname.replace(/^\/+|\/+$/g, '');
    const htmlPath = mappedPath
      ? path.join(builtPublicDir, mappedPath.replace(/^\/+/, ''))
      : encodedPath
        ? path.join(builtPublicDir, encodedPath, 'index.html')
        : path.join(builtPublicDir, 'index.html');
    await access(htmlPath);
    const html = await readFile(htmlPath, 'utf8');
    assertPublicHeadHasOneGoogleTagSet(html, url.pathname);
  }

  const toolRoutes = sitemapUrls
    .map((url) => url.pathname)
    .map((pathname) => pathname.match(/^\/(?:(?<locale>[a-z]{2})\/)?tools\/(?<slug>[^/]+)\/?$/))
    .filter(Boolean);
  const englishSlugs = new Set(
    toolRoutes.filter((route) => !route.groups.locale).map((route) => route.groups.slug),
  );
  const localizedRoutes = toolRoutes.filter((route) => route.groups.locale);
  const locales = new Set(localizedRoutes.map((route) => route.groups.locale));
  assert.ok(englishSlugs.size > 0, 'the sitemap has public PDF tools in English');
  assert.equal(locales.size + 1, 21, 'the sitemap covers all 21 supported languages including English');
  assert.equal(localizedRoutes.length, englishSlugs.size * locales.size, 'every public tool has a route in every localized language');
  for (const locale of locales) {
    const localizedSlugs = new Set(
      localizedRoutes.filter((route) => route.groups.locale === locale).map((route) => route.groups.slug),
    );
    assert.deepEqual(localizedSlugs, englishSlugs, `${locale} contains the complete public tool set`);
  }
});

test('public PDF tools use one top banner and collapse unavailable ads', async () => {
  const source = async (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
  const app = await source('src/App.tsx');
  const component = await source('src/components/AdSenseDisplayAd.tsx');
  const headerIndex = app.indexOf('<Header');
  const headerEndIndex = app.indexOf('/>', headerIndex);
  const adIndex = app.indexOf('<AdSenseDisplayAd />');
  const mainIndex = app.indexOf('<main className="flex-1">');
  assert.ok(headerIndex >= 0 && headerEndIndex > headerIndex, 'the global navigation renders');
  assert.ok(adIndex > headerEndIndex, 'the ad follows the global navigation');
  assert.ok(adIndex < mainIndex, 'the ad precedes the tool workspace and Back link');
  assert.match(
    app,
    /const showToolHeaderAd =\s*activeView === 'tool' &&\s*selectedTool !== null &&\s*PUBLIC_PDF_TOOLS\.some\(\(tool\) => tool\.id === selectedTool\.id\)/,
    'the placement is limited to selected public PDF tools',
  );
  assert.equal((app.match(/<AdSenseDisplayAd\b/g) || []).length, 1, 'App mounts one shared ad placement');
  const sourceFiles = await readTextFiles(path.join(projectRoot, 'src'));
  const adUses = sourceFiles.flatMap((file) =>
    [...file.content.matchAll(/<AdSenseDisplayAd\b[^>]*\/>/g)].map(() => path.relative(projectRoot, file.path)),
  );
  assert.deepEqual(adUses, ['src/App.tsx'], 'no tool workspace or non-tool view duplicates the ad');

  const publicTools = await readActiveToolRegistry(projectRoot);
  assert.equal(publicTools.length, 25, 'all 25 public PDF tools use the shared conditional placement');
  const publicToolIds = new Set(publicTools.map((tool) => tool.id));
  for (const toolId of ['jpg-to-pdf', 'watermark', 'merge', 'split', 'compress']) {
    assert.ok(publicToolIds.has(toolId), `${toolId} is a public tool using the shared header placement`);
  }

  const workspaceChecks = [
    ['src/components/ToolWorkspace.tsx', await source('src/components/ToolWorkspace.tsx'), 't.backToTools', '{/* Tool header card */}'],
    ['src/components/SignPdfWorkspace.tsx', await source('src/components/SignPdfWorkspace.tsx'), 't.backToTools', '<h1'],
    ['src/components/PdfTextWorkspace.tsx', await source('src/components/PdfTextWorkspace.tsx'), 't.backToTools', '<h1'],
    ['src/components/PdfExcelWorkspace.tsx', await source('src/components/PdfExcelWorkspace.tsx'), 't.backToTools', '<h1'],
  ];
  for (const [file, content, backMarker, titleMarker] of workspaceChecks) {
    assert.doesNotMatch(content, /AdSenseDisplayAd/, `${file} has no misplaced or duplicate ad`);
    const backIndex = content.indexOf(backMarker);
    const titleIndex = content.indexOf(titleMarker, backIndex);
    assert.ok(backIndex >= 0 && titleIndex > backIndex, `${file} renders Back before tool title`);
  }

  assert.match(component, /if \(!canRequestAd\) return null;/);
  assert.match(component, /if \(!canRequestAd\) return;/);
  assert.match(component, /adsWindow\.adsbygoogle\.push\(\{\}\)/);
  assert.match(component, /ADVERTISING_CONSENT_CHANGED_EVENT/);
  assert.match(component, /ADVERTISING_CONSENT_STORAGE_KEY/);
  assert.match(component, /aria-label="Advertisement"/);
  assert.match(component, /aria-hidden=\{isUnfilled\}/);
  assert.match(component, /new MutationObserver\(readProviderStatus\)/);
  assert.match(component, /NO_FILL_COLLAPSE_MS = 12_000/);
  assert.match(component, /height: isUnfilled \? 0 : 50/);
  assert.match(component, /flex: isUnfilled \? '0 0 0px' : '0 0 50px'/);
  assert.match(component, /data-ad-placement="toolHeader"/);
  assert.match(component, /data-ad-slot=\{ADSENSE_SLOT_ID\}/);
  assert.match(component, /width: 'min\(320px, calc\(100vw - 24px\)\)'/);
  assert.match(component, /maxWidth: 320,[\s\S]*height: isUnfilled \? 0 : 50,[\s\S]*minHeight: isUnfilled \? 0 : 50,[\s\S]*maxHeight: 50/);
  assert.doesNotMatch(component, /loadAdSenseScriptOnce/);
});

test('active ClickPDF runtime contains no Adsterra provider, route, or banner asset', async () => {
  const sourceFiles = [
    ...(await readTextFiles(path.join(projectRoot, 'src'))),
    ...(await readTextFiles(path.join(projectRoot, 'public'))),
    { path: path.join(projectRoot, 'cloudflare-worker.mjs'), content: await readFile(path.join(projectRoot, 'cloudflare-worker.mjs'), 'utf8') },
  ];
  for (const file of sourceFiles) {
    assert.doesNotMatch(file.content, /adsterra|bauval\.org|ad-320x50/i, file.path);
  }

  for (const removedFile of [
    'src/components/AdsterraBanner.tsx',
    'public/ad-320x50.html',
    'scripts/test-tool-page-banner-ad.mjs',
    'dist/public/ad-320x50.html',
  ]) {
    await assert.rejects(access(path.join(projectRoot, removedFile)), `${removedFile} must be removed`);
  }
});
