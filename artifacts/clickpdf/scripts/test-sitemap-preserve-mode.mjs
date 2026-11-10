import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const publicDir = path.join(appDir, 'public');
const distPublicDir = path.join(appDir, 'dist', 'public');
const preservedSitemapSha256 = '5c67e14e85437cc63381ff138d344211fe0ef4260be7f0db4fb5e5708d233047';
const expectedUrlSequenceSha256 = '91a150fbe7ede037a4b71ad31d16d009a3f2f7223a1c612e83c10be828923992';
const expectedHreflangSha256 = '060b1ae94b74554d0f76b32638972b070fc181417ad8b23860f3d2044b500053';

const protectedFiles = [
  { name: 'sitemap.xml', expectedSha256: preservedSitemapSha256 },
  {
    name: 'llms.txt',
    envName: 'CLICKPDF_PRESERVE_LLMS_SHA256',
  },
  {
    name: 'llms-full.txt',
    envName: 'CLICKPDF_PRESERVE_LLMS_FULL_SHA256',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function approvedHash(file) {
  const value = file.expectedSha256 || process.env[file.envName]?.trim().toLowerCase();
  assert.match(
    value || '',
    /^[a-f0-9]{64}$/,
    `${file.name} needs an owner-approved SHA-256 in ${file.envName || 'the source'}`,
  );
  return value;
}

function sitemapBlocks(xml) {
  return xml.match(/  <url>[\s\S]*?<\/url>/g) || [];
}

function urlLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
}

function hreflangPairs(xml) {
  return sitemapBlocks(xml).flatMap((block) => {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    return [...block.matchAll(
      /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/>/g,
    )].map((match) => `${loc}\t${match[1]}\t${match[2]}`);
  }).sort();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal) => String.fromCodePoint(Number(decimal)));
}

function textContent(html) {
  return decodeHtml(html.replace(/<[^>]*>/g, '').trim());
}

function schemasFromHtml(html) {
  const scripts = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].map((match) => JSON.parse(match[1]));
  return scripts.flatMap((schema) =>
    Array.isArray(schema['@graph']) ? schema['@graph'] : [schema],
  );
}

function visibleFaqFromHtml(html) {
  const section = html.match(
    /<section[^>]*aria-labelledby=["']seo-tool-faq["'][^>]*>([\s\S]*?)<\/section>/i,
  )?.[1] || '';
  return [...section.matchAll(
    /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/gi,
  )].map((match) => ({
    question: textContent(match[1]),
    answer: textContent(match[2]),
  }));
}

function visibleStepsFromHtml(html) {
  const section = html.match(
    /<section[^>]*aria-labelledby=["']seo-tool-steps["'][^>]*>([\s\S]*?)<\/section>/i,
  )?.[1] || '';
  return [...section.matchAll(
    /<li[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/gi,
  )].map((match) => ({
    name: textContent(match[1]),
    text: textContent(match[2]),
  }));
}

test('approved protected source files are byte-identical in dist/public', async () => {
  for (const file of protectedFiles) {
    const expected = approvedHash(file);
    const source = await readFile(path.join(publicDir, file.name));
    const output = await readFile(path.join(distPublicDir, file.name));
    assert.equal(sha256(source), expected, `public/${file.name} must match its approved hash`);
    assert.equal(sha256(output), expected, `dist/public/${file.name} must match its approved hash`);
  }
});

test('sitemap URL, hreflang, route, and lastmod surfaces remain unchanged', async () => {
  const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
  assert.equal(sha256(sitemap), preservedSitemapSha256, 'all sitemap bytes and lastmod values are preserved');

  const locations = urlLocations(sitemap);
  const alternates = hreflangPairs(sitemap);
  assert.equal(locations.length, 767);
  assert.equal(new Set(locations).size, 767);
  assert.equal(sha256(locations.join('\n')), expectedUrlSequenceSha256);
  assert.equal(alternates.length, 16_632);
  assert.equal(sha256(alternates.join('\n')), expectedHreflangSha256);
  assert.ok(locations.every((location) => new URL(location).origin === 'https://www.clickpdf.net'));

  const mergeRoutes = locations.filter((location) =>
    /\/(?:[a-z]{2}\/)?tools\/merge-pdf\/$/.test(new URL(location).pathname),
  );
  assert.equal(mergeRoutes.length, 21);
  assert.ok(mergeRoutes.includes('https://www.clickpdf.net/tools/merge-pdf/'));

  const locationSet = new Set(locations);
  for (const pair of alternates) {
    const target = pair.split('\t')[2];
    assert.ok(locationSet.has(target), `hreflang target exists in the preserved sitemap: ${target}`);
  }

  for (const block of sitemapBlocks(sitemap)) {
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim();
    assert.ok(lastmod && /^\d{4}-\d{2}-\d{2}$/.test(lastmod), 'each URL keeps a valid lastmod value');
  }
});

test('generated Merge PDF FAQPage and HowTo match visible page content', async () => {
  const html = await readFile(
    path.join(distPublicDir, 'tools', 'merge-pdf', 'index.html'),
    'utf8',
  );
  const schemas = schemasFromHtml(html);
  const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
  const howToSchema = schemas.find((schema) => schema['@type'] === 'HowTo');

  assert.ok(faqSchema, 'Merge PDF page includes FAQPage JSON-LD');
  assert.ok(howToSchema, 'Merge PDF page includes HowTo JSON-LD');

  const schemaFaq = faqSchema.mainEntity.map((item) => ({
    question: item.name,
    answer: item.acceptedAnswer?.text,
  }));
  const visibleFaq = visibleFaqFromHtml(html);
  assert.equal(schemaFaq.length, 6);
  assert.deepEqual(schemaFaq, visibleFaq, 'visible FAQ and FAQPage JSON-LD must match exactly');
  assert.match(schemaFaq[0].question, /just one file/i);
  assert.match(schemaFaq[0].answer, /one or more PDF files/i);
  assert.match(schemaFaq[0].answer, /separate (?:PDF )?copy/i);
  assert.ok(!schemaFaq.some((item) => /need more than one file/i.test(item.question)));

  const schemaSteps = howToSchema.step.map((step) => ({
    name: step.name,
    text: step.text,
  }));
  assert.equal(schemaSteps.length, 3);
  assert.deepEqual(
    schemaSteps,
    visibleStepsFromHtml(html),
    'visible HowTo instructions and HowTo JSON-LD must match exactly',
  );
  assert.match(schemaSteps[0].text, /one or more PDF documents/i);
});
