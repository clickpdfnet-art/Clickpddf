import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readActiveToolRegistry, readTypeScriptExport } from './static-tool-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const distDir = path.join(appDir, 'dist', 'public');
const siteOrigin = 'https://www.clickpdf.net';

function textContent(value = '') {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

test('all public tool pages retain SEO metadata and canonical links', async () => {
  const tools = await readActiveToolRegistry(appDir);
  assert.equal(tools.length, 23, 'PDF/A, PDF Repair, and PowerPoint to PDF remain hidden');
  const seoSource = await readTypeScriptExport(
    path.join(appDir, 'src', 'data', 'toolSeoData.ts'),
    'TOOL_SEO_REGISTRY',
  );
  const seoById = new Map(Object.values(seoSource).map((entry) => [entry.toolId, entry]));

  const activeById = new Map(tools.map((tool) => [tool.id, tool]));
  const titleValues = new Set();
  const descriptionValues = new Set();
  const h1Values = new Set();
  const primaryKeywords = new Set();

  for (const tool of tools) {
    const source = seoById.get(tool.id);
    assert.ok(source, `${tool.slug} has SEO source metadata`);
    assert.ok(tool.slug, `tool ${tool.id} has a public slug`);
    assert.ok(tool.title, `${tool.slug} has a title`);
    assert.ok(tool.description, `${tool.slug} has a meta description`);
    assert.ok(tool.name, `${tool.slug} has an H1`);
    assert.ok(Array.isArray(source.targetKeywords) && source.targetKeywords.length > 0, `${tool.slug} has a keyword map`);

    assert.ok(tool.title.length >= 35 && tool.title.length <= 65, `${tool.slug} title length is ${tool.title.length}`);
    assert.ok(tool.description.length >= 120 && tool.description.length <= 158, `${tool.slug} description length is ${tool.description.length}`);
    assert.ok(!titleValues.has(tool.title), `${tool.slug} title is unique`);
    assert.ok(!descriptionValues.has(tool.description), `${tool.slug} description is unique`);
    assert.ok(!h1Values.has(tool.name), `${tool.slug} H1 is unique`);

    const primaryKeyword = source.targetKeywords[0].toLowerCase().replace(/\s+/g, ' ').trim();
    assert.ok(!primaryKeywords.has(primaryKeyword), `${tool.slug} primary keyword is distinct`);
    primaryKeywords.add(primaryKeyword);
    const titleLead = primaryKeyword.split(' ').slice(0, 2).join(' ');
    assert.ok(
      tool.title.toLowerCase().includes(titleLead) || tool.name.toLowerCase().includes(titleLead),
      `${tool.slug} title or H1 aligns with its primary keyword`,
    );

    titleValues.add(tool.title);
    descriptionValues.add(tool.description);
    h1Values.add(tool.name);

    for (const relatedId of tool.relatedToolIds || []) {
      assert.ok(activeById.has(relatedId), `${tool.slug} only links to active public tool ${relatedId}`);
    }

    const htmlPath = path.join(distDir, 'tools', tool.slug, 'index.html');
    const html = await readFile(htmlPath, 'utf8');
    const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    assert.ok(main, `${tool.slug} has generated static fallback content`);
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    assert.equal(canonical, `${siteOrigin}/tools/${tool.slug}/`, `${tool.slug} retains its canonical route`);
    assert.equal(
      textContent(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
      tool.title,
      `${tool.slug} generated title matches the registry`,
    );
    assert.equal(
      html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1],
      tool.description,
      `${tool.slug} generated description matches the registry`,
    );

    const h1s = [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.equal(h1s.length, 1, `${tool.slug} has exactly one static H1`);
    assert.equal(textContent(h1s[0][1]), tool.name, `${tool.slug} H1 matches the registry`);
    assert.match(main, /id=["']seo-tool-overview["']/, `${tool.slug} includes its page-specific overview`);
    assert.ok((main.match(/<details>/g) || []).length > 0, `${tool.slug} keeps visible FAQ content`);

    const expectedRelatedHrefs = (tool.relatedToolIds || []).map((relatedId) => {
      const related = activeById.get(relatedId);
      return `/tools/${related.slug}/`;
    });
    for (const href of expectedRelatedHrefs) {
      assert.ok(main.includes(`href="${href}"`), `${tool.slug} contains its canonical related link ${href}`);
    }
  }

  const sectionSource = await readFile(
    path.join(appDir, 'src', 'components', 'ToolSeoContentSection.tsx'),
    'utf8',
  );
  assert.match(sectionSource, /href=\{relatedToolHref\(relTool\.id\)\}/, 'hydrated related-tool cards use crawlable anchors');
});
