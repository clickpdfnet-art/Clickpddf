import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const asModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;

const toolSource = (await readFile(new URL('../src/data/toolsData.ts', import.meta.url), 'utf8'))
  .replace(
    "import { getPluginToolsAsPdfTools } from '../tools/plugins/pluginLoader';",
    'const getPluginToolsAsPdfTools = () => [];'
  );
const tools = await import(asModule(compile(toolSource)));
const expectedHiddenIds = [
  'compare',
  'crop',
  'pdf-to-pdfa',
  'powerpoint-to-pdf',
  'repair'
];

test('hidden tools remain backed up but are excluded from public cards, searches, and categories', () => {
  assert.deepEqual([...tools.HIDDEN_TOOL_IDS].sort(), expectedHiddenIds);
  const allIds = tools.PDF_TOOLS.map(tool => tool.id);
  const publicIds = tools.PUBLIC_PDF_TOOLS.map(tool => tool.id);

  for (const id of expectedHiddenIds) {
    assert.ok(allIds.includes(id), `${id} remains in the full backup registry`);
    assert.ok(!publicIds.includes(id), `${id} is excluded from public lists`);
    assert.ok(!tools.getAllTools().some(tool => tool.id === id));
  }

  assert.equal(allIds.length - publicIds.length, expectedHiddenIds.length);
  assert.equal(tools.CATEGORIES.find(category => category.id === 'all')?.count, publicIds.length);
  for (const category of tools.CATEGORIES.filter(item => item.id !== 'all')) {
    assert.equal(
      category.count,
      publicIds.filter(toolId => tools.PUBLIC_PDF_TOOLS.find(tool => tool.id === toolId)?.category === category.id).length
    );
  }
});

test('default sitemap only contains public tools', async () => {
  const sitemapSource = (await readFile(new URL('../src/utils/sitemapGenerator.ts', import.meta.url), 'utf8'))
    .replace(
      "import { PUBLIC_PDF_TOOLS } from '../data/toolsData';",
      'const PUBLIC_PDF_TOOLS = globalThis.__PUBLIC_PDF_TOOLS__;'
    )
    .replace(
      "import { INITIAL_ARTICLES, getStoredArticles } from '../data/initialArticles';",
      'const INITIAL_ARTICLES = []; const getStoredArticles = () => [];'
    )
    .replace(
      "import { getToolSeoInfo } from '../data/toolSeoData';",
      'const getToolSeoInfo = () => undefined;'
    );
  globalThis.__PUBLIC_PDF_TOOLS__ = tools.PUBLIC_PDF_TOOLS;
  const sitemap = await import(asModule(compile(sitemapSource)));
  const entries = sitemap.getSitemapEntries({ articles: [] });
  const index = entries.map(entry => `${entry.path} ${entry.title} ${entry.description || ''}`).join('\n').toLowerCase();

  assert.equal(sitemap.normalizeBaseUrl(), 'https://clickpdf.net');
  assert.equal(sitemap.normalizeBaseUrl('https://m.sisko.replit.dev'), 'https://clickpdf.net');
  assert.equal(sitemap.normalizeBaseUrl('https://www.clickpdf.net/'), 'https://clickpdf.net');
  assert.ok(entries.every(entry => entry.loc.startsWith('https://clickpdf.net/')));
  assert.ok(entries.every(entry =>
    entry.path === '/' ||
    entry.path.startsWith('/tools/') ||
    entry.path.startsWith('/blog') ||
    entry.path.startsWith('/?tool=')
  ));

  for (const label of ['compare pdf', 'crop & trim margins', 'pdf to pdf/a', 'powerpoint to pdf', 'repair pdf']) {
    assert.ok(!index.includes(label), `${label} is absent from the generated sitemap`);
  }
  delete globalThis.__PUBLIC_PDF_TOOLS__;
});
