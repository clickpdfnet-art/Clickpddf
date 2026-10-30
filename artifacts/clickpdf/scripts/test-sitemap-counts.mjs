import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { readActiveToolRegistry } from './static-tool-registry.mjs';
import { setGeneratedSitemapComment } from './sitemap-summary.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(appDir, 'public');
const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
const activeTools = await readActiveToolRegistry(appDir);

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
}

test('sitemap summary distinguishes public tool IDs from generated route URLs', async () => {
  const locations = sitemapLocations(sitemap);
  const toolRoutes = locations.filter((location) =>
    /^https:\/\/www\.clickpdf\.net\/(?:[a-z]{2}\/)?tools\/[^/]+\/$/.test(location),
  );
  const localizedToolRoutes = toolRoutes.filter((location) =>
    /^https:\/\/www\.clickpdf\.net\/[a-z]{2}\/tools\//.test(location),
  );
  const expectedLocalizedRouteCount = activeTools.reduce(
    (count, tool) => count + Object.keys(tool.localizedSeoContent || {}).length,
    0,
  );
  const comment = sitemap.match(/<!--\s*Generated sitemap:[\s\S]*?-->/)?.[0] || '';

  assert.equal(new Set(locations).size, locations.length, 'sitemap URL locations remain unique');
  assert.equal(toolRoutes.length, activeTools.length + expectedLocalizedRouteCount);
  assert.equal(localizedToolRoutes.length, expectedLocalizedRouteCount);
  assert.match(
    comment,
    new RegExp(
      `including ${activeTools.length} public tools and ${toolRoutes.length} tool route URLs \\(${localizedToolRoutes.length} localized routes\\)`,
    ),
  );
});

test('changing the generated summary comment leaves all sitemap locations and uniqueness unchanged', () => {
  const before = sitemapLocations(sitemap);
  const changedSummary = setGeneratedSitemapComment(
    sitemap,
    '<!-- Generated sitemap: regression sentinel. -->',
  );
  const after = sitemapLocations(changedSummary);

  assert.deepEqual(after, before, 'the <loc> URL sequence is unchanged by summary replacement');
  assert.equal(new Set(after).size, after.length, 'the sitemap remains unique after summary replacement');
});
