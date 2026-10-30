import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const source = await readFile(path.join(appDir, 'src/utils/routeParser.ts'), 'utf8');
const appSource = await readFile(path.join(appDir, 'src/App.tsx'), 'utf8');
const headerSource = await readFile(path.join(appDir, 'src/components/Header.tsx'), 'utf8');
const publicToolsSource = (await readFile(path.join(appDir, 'src/data/toolsData.ts'), 'utf8'))
  .replace(
    "import { getPluginToolsAsPdfTools } from '../tools/plugins/pluginLoader';",
    'const getPluginToolsAsPdfTools = () => [];',
  );
const routeParserSource = source
  .replace("import { PDF_TOOLS } from '../data/toolsData';", 'const PDF_TOOLS = [];')
  .replace(
    "import { getToolSeoInfo } from '../data/toolSeoData';",
    "const getToolSeoInfo = (slug) => slug === 'merge-pdf' ? { toolId: 'merge' } : undefined;",
  )
  .replace("import { hasLocalizedToolPageSeoContent } from '../data/toolPageSeoContent';", 'const hasLocalizedToolPageSeoContent = () => false;')
  .replace("import { getActiveBlogArticles } from './blogLoader';", 'const getActiveBlogArticles = () => [];')
  .replace("import { getLegalPageByPath, LegalPageId } from '../data/legalPages';", 'const getLegalPageByPath = () => undefined;')
  .replace("import { Language, SUPPORTED_LANGUAGES } from '../i18n/translations';", 'const SUPPORTED_LANGUAGES = [];')
  .replace('const BASE_PATH = import.meta.env.BASE_URL;', "const BASE_PATH = '/';");
const compiled = ts.transpileModule(routeParserSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const parserUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
const { navigateToToolsUrl, parseCurrentRoute } = await import(parserUrl);
const toolsModule = await import(`data:text/javascript;base64,${Buffer.from(
  ts.transpileModule(publicToolsSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
).toString('base64')}`);

function installWindow(pathname, search = '', hash = '') {
  const previous = globalThis.window;
  const calls = [];
  globalThis.window = {
    location: { pathname, search, hash },
    history: {
      pushState: (...args) => calls.push({ method: 'pushState', args }),
      replaceState: (...args) => calls.push({ method: 'replaceState', args }),
    },
  };
  return {
    calls,
    restore() {
      if (previous === undefined) delete globalThis.window;
      else globalThis.window = previous;
    },
  };
}

test('direct /tools/ loads and refreshes as the tools index route', () => {
  for (const pathname of ['/tools', '/tools/']) {
    const browser = installWindow(pathname);
    try {
      assert.deepEqual(parseCurrentRoute(), { view: 'tools' }, pathname);
    } finally {
      browser.restore();
    }
  }
});

test('individual /tools/:slug routes remain tool pages', () => {
  const browser = installWindow('/tools/merge-pdf/');
  try {
    assert.deepEqual(parseCurrentRoute(), { view: 'tool', toolId: 'merge' });
  } finally {
    browser.restore();
  }
});

test('client navigation pushes the canonical /tools/ URL and resolves to the listing route', () => {
  const browser = installWindow('/');
  try {
    navigateToToolsUrl();
    assert.equal(browser.calls.length, 1);
    assert.deepEqual(browser.calls[0], {
      method: 'pushState',
      args: [{ view: 'tools' }, '', '/tools/'],
    });

    globalThis.window.location.pathname = browser.calls[0].args[2];
    assert.deepEqual(parseCurrentRoute(), { view: 'tools' });
  } finally {
    browser.restore();
  }
});

test('unsupported localized tools index URLs are not introduced', () => {
  const browser = installWindow('/ja/tools/');
  try {
    assert.notEqual(parseCurrentRoute().view, 'tools');
  } finally {
    browser.restore();
  }
});

test('the header control and app route both render the existing public tools grid', () => {
  assert.match(headerSource, /onClick=\{onOpenTools\}/);
  assert.match(appSource, /onOpenTools=\{handleGoToTools\}/);
  assert.match(appSource, /route\.view === 'tools'/);
  assert.match(appSource, /activeView === 'tools' \? \(\s*toolGrid\s*\)/);
  assert.match(appSource, /tools=\{filteredTools\}/);
  assert.match(appSource, /const filteredTools = PUBLIC_PDF_TOOLS\.filter/);
});

test('the generated listing IDs exactly match PUBLIC_PDF_TOOLS and exclude hidden tools', async () => {
  const html = await readFile(path.join(appDir, 'dist/public/tools/index.html'), 'utf8');
  const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  assert.ok(main, 'the generated tools index contains semantic static content');
  const renderedIds = [...main.matchAll(/<li data-tool-id=["']([^"']+)["']/g)].map((match) => match[1]);
  const publicIds = toolsModule.PUBLIC_PDF_TOOLS.map((tool) => tool.id);
  assert.deepEqual(renderedIds, publicIds);
  for (const hiddenId of toolsModule.HIDDEN_TOOL_IDS) {
    assert.ok(!renderedIds.includes(hiddenId), `${hiddenId} is excluded from the generated listing`);
  }
});
