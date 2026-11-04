import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import worker from '../cloudflare-worker.mjs';
import {
  ADVERTISING_CONSENT_CHANGED_EVENT,
  ADVERTISING_CONSENT_STORAGE_KEY,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SCRIPT_URL,
  ADSENSE_SLOT_IDS,
  hasConfiguredAdSenseSlots,
  isValidAdSenseSlotId,
  loadAdSenseScriptOnce,
  shouldLoadAdSense,
} from '../src/ads/adsenseRuntime.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(projectRoot, 'public');
const builtPublicDir = path.join(projectRoot, 'dist', 'public');
const expectedAdsTxt = 'google.com, pub-6250344265022238, DIRECT, f08c47fec0942fa0\n';

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

  for (const apexUrl of ['http://clickpdf.net/ads.txt', 'https://clickpdf.net/ads.txt']) {
    const redirect = await worker.fetch(new Request(apexUrl), env);
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), 'https://www.clickpdf.net/ads.txt');
    await assertAdsTxtResponse(await worker.fetch(new Request(redirect.headers.get('location')), env));
  }
});

test('confirmed AdSense publisher and slot are configured for both tool placements', () => {
  assert.equal(ADSENSE_PUBLISHER_ID, 'ca-pub-6250344265022238');
  assert.deepEqual(Object.keys(ADSENSE_SLOT_IDS), ['toolHeader', 'beforeBack']);
  assert.deepEqual(ADSENSE_SLOT_IDS, { toolHeader: '7770736190', beforeBack: '7770736190' });
  assert.equal(hasConfiguredAdSenseSlots(ADSENSE_SLOT_IDS), true);
  assert.equal(isValidAdSenseSlotId(ADSENSE_SLOT_IDS.toolHeader), true);
  assert.equal(isValidAdSenseSlotId(ADSENSE_SLOT_IDS.beforeBack), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_IDS, null), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_IDS, 'accepted'), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_IDS, 'dismissed'), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_IDS, 'rejected'), false);
  const missingSlotIds = { toolHeader: 'REPLACE_WITH_TOOL_HEADER_AD_SLOT_ID', beforeBack: '' };
  assert.equal(hasConfiguredAdSenseSlots(missingSlotIds), false);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, missingSlotIds, null), false);

  const realSlotIds = { toolHeader: '1234567890', beforeBack: '9876543210' };
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, realSlotIds, null), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, realSlotIds, 'accepted'), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, realSlotIds, 'dismissed'), true);
  assert.equal(shouldLoadAdSense(ADSENSE_PUBLISHER_ID, realSlotIds, 'rejected'), false);

  let scriptInsertions = 0;
  if (shouldLoadAdSense(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_IDS, null)) scriptInsertions += 1;
  assert.equal(scriptInsertions, 1, 'configured slot IDs allow the AdSense script request');
});

test('the official AdSense loader appends one script when invoked repeatedly', async () => {
  const addedScripts = [];
  const scriptAttributes = new Map();
  const eventHandlers = new Map();
  const fakeDocument = {
    querySelector: () => null,
    createElement: (tagName) => {
      assert.equal(tagName, 'script');
      return {
        async: false,
        crossOrigin: '',
        src: '',
        setAttribute: (name, value) => scriptAttributes.set(name, value),
        addEventListener: (eventName, handler) => eventHandlers.set(eventName, handler),
      };
    },
    head: {
      appendChild: (script) => {
        addedScripts.push(script);
        queueMicrotask(() => eventHandlers.get('load')?.());
      },
    },
  };

  const first = loadAdSenseScriptOnce(fakeDocument, ADSENSE_PUBLISHER_ID);
  const second = loadAdSenseScriptOnce(fakeDocument, ADSENSE_PUBLISHER_ID);
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(addedScripts.length, 1);
  assert.equal(addedScripts[0].src, `${ADSENSE_SCRIPT_URL}?client=${ADSENSE_PUBLISHER_ID}`);
  assert.equal(addedScripts[0].async, true);
  assert.equal(addedScripts[0].crossOrigin, 'anonymous');
  assert.equal(scriptAttributes.get('data-clickpdf-adsense'), 'true');
});

test('tool-only placements are after each tool heading and before the navigation bar', async () => {
  const source = async (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
  const app = await source('src/App.tsx');
  const workspace = await source('src/components/ToolWorkspace.tsx');
  const signWorkspace = await source('src/components/SignPdfWorkspace.tsx');
  const textWorkspace = await source('src/components/PdfTextWorkspace.tsx');
  const excelWorkspace = await source('src/components/PdfExcelWorkspace.tsx');
  const component = await source('src/components/AdSenseDisplayAd.tsx');

  assert.match(app, /activeView === 'tool' && selectedTool && \(\s*<AdSenseDisplayAd placement="beforeBack" \/>/);
  assert.equal((app.match(/<AdSenseDisplayAd\b/g) || []).length, 1);
  assert.match(component, /width: 'min\(320px, calc\(100vw - 24px\)\)'/);
  assert.match(component, /maxWidth: 320, height: 50/);

  const headerPlacements = [
    ['src/components/ToolWorkspace.tsx', workspace, '{/* Tool header card */}', '{/* Keep the picker mounted'],
    ['src/components/SignPdfWorkspace.tsx', signWorkspace, '<h1', '<input ref={pageFileInputRef}'],
    ['src/components/PdfTextWorkspace.tsx', textWorkspace, '<h1', '<input ref={input}'],
    ['src/components/PdfExcelWorkspace.tsx', excelWorkspace, '<h1', '<input ref={input}'],
  ];
  for (const [file, content, headerMarker, nextMarker] of headerPlacements) {
    const placementIndex = content.indexOf('<AdSenseDisplayAd placement="toolHeader" />');
    assert.notEqual(placementIndex, -1, `${file} has its tool-header placement`);
    assert.ok(placementIndex > content.indexOf(headerMarker), `${file} places it after the tool heading`);
    assert.ok(placementIndex < content.indexOf(nextMarker), `${file} places it before tool controls`);
    assert.equal((content.match(/<AdSenseDisplayAd placement="toolHeader" \/>/g) || []).length, 1);
  }

  assert.match(component, /if \(!canLoad\) return null;/);
  assert.match(component, /if \(!canLoad\) return;/);
  assert.match(component, /loadAdSenseScriptOnce\(document, ADSENSE_PUBLISHER_ID\)/);
  assert.match(component, /addEventListener\(ADVERTISING_CONSENT_CHANGED_EVENT/);
  assert.match(component, /ADVERTISING_CONSENT_STORAGE_KEY/);
  assert.equal(ADVERTISING_CONSENT_STORAGE_KEY, 'clickpdf_cookie_consent_v1');
  assert.equal(ADVERTISING_CONSENT_CHANGED_EVENT, 'clickpdf-cookie-consent-change');
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
