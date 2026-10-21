import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const asModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;

const languageSource = compile(await readFile(new URL('../src/utils/pdfWordLanguages.ts', import.meta.url), 'utf8'));
const languages = await import(asModule(languageSource));
const runtimeSource = compile(await readFile(new URL('../src/utils/pdfWordRuntimeChecks.ts', import.meta.url), 'utf8'));
const runtime = await import(asModule(runtimeSource));

test('OCR registry is unique, explicit about external models, and never marks untested accuracy as verified', () => {
  const { WORD_LANGUAGES, wordModelUrl, wordLanguageSupportText } = languages;
  assert.equal(WORD_LANGUAGES.length, 17);
  assert.equal(new Set(WORD_LANGUAGES.map(entry => entry.id)).size, 17);
  for (const entry of WORD_LANGUAGES) {
    assert.equal(entry.ocrTest, 'not-verified');
    assert.equal(entry.textTest, 'not-verified');
    assert.equal(entry.availability, 'downloadable-not-bundled');
    assert.equal(new URL(wordModelUrl(entry.id)).protocol, 'https:');
  }
  assert.throws(() => wordModelUrl('eng+missing'), /not configured/);
  assert.match(wordLanguageSupportText(), /Firefox \/ Safari: feature-detected but not verified/);
  assert.match(wordLanguageSupportText(), /never an automatic model switch/);
  assert.match(wordLanguageSupportText(), /never PDF content/);
});

test('bounded script suggestions never silently select or change OCR models', () => {
  const urdu = languages.suggestWordLanguage('یہ اردو متن کا واضح نمونہ ہے');
  const japanese = languages.suggestWordLanguage('日本語の文章を認識します');
  const mixed = languages.suggestWordLanguage('日本語の文章を認識します MIXED English');
  assert.equal(urdu.script, 'Arabic family');
  assert.equal(urdu.languageConfidence, 0, 'Arabic-script language identification must stay ambiguous');
  assert.equal(japanese.candidates[0], 'jpn');
  assert.ok(japanese.languageConfidence > 0);
  assert.match(japanese.note, /never|unchanged|remain/i);
  assert.match(mixed.script, / \+ /);
  assert.equal(languages.suggestWordLanguage('1234').candidates.length, 0);
});

test('page-range and page-language parsers bound and deduplicate the selection', () => {
  assert.deepEqual(languages.parseWordPageRange('1-3, 3, 5', 6), [1, 2, 3, 5]);
  assert.deepEqual([...languages.parseWordPageModels('2:urd+eng; 5:jpn', 6)],
    [[2, ['urd', 'eng']], [5, ['jpn']]]);
  assert.throws(() => languages.parseWordPageRange('1-9', 6), /outside/);
  assert.throws(() => languages.parseWordPageRange('1,all', 6), /Page range/);
  assert.throws(() => languages.parseWordPageModels('2:eng+missing', 6), error => /unavailable/.test(error.message));
});

test('OCR model selection rejects empty, unknown and duplicate models without substitution', () => {
  assert.throws(() => languages.validateWordLanguages([]), /at least one/);
  assert.throws(() => languages.validateWordLanguages(['not-supported']), error => /not configured/.test(error.message));
  assert.deepEqual(languages.validateWordLanguages(['urd', 'eng', 'urd']), ['urd', 'eng']);
});

test('browser capability gates allow text-only conversion when OCR WebAssembly is unavailable', () => {
  const supported = { worker: true, wasm: true, blob: true, objectUrl: true, arrayBuffer: true, canvas: true, cache: false };
  assert.doesNotThrow(() => runtime.validateWordBrowser(supported, true));
  assert.doesNotThrow(() => runtime.validateWordBrowser({ ...supported, wasm: false }, false));
  assert.throws(() => runtime.validateWordBrowser({ ...supported, wasm: false }, true), /WebAssembly/);
  assert.throws(() => runtime.validateWordBrowser({ ...supported, canvas: false }, false), /Canvas 2D/);
});

test('render scale stays within pixel and dimension budgets', () => {
  const scale = runtime.wordRenderScale(6000, 4000, 2, 6_000_000, 4096);
  assert.ok(scale <= 0.5);
  assert.ok(6000 * scale <= 4096);
  assert.ok(6000 * 4000 * scale * scale <= 6_000_000);
  assert.ok(runtime.wordRenderScale(612, 792, 2, 9_000_000) <= 2);
});

test('cancellation promptly rejects conversion work and reports AbortError', async () => {
  const controller = new AbortController();
  let rejectJob;
  const pending = new Promise((_, reject) => { rejectJob = reject; });
  const cancelled = runtime.wordAbortable(pending, controller.signal);
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  assert.throws(() => runtime.wordAbort(controller.signal), { name: 'AbortError' });
  rejectJob(new Error('cleanup'));
});
