import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

// Load only the pure text-tool formatter; no browser shims or app dependencies.
const source = await readFile(new URL('../src/utils/pdfTextFormatting.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText;
const { textItemsToLines, linesToTextAndMarkdown, uniqueTextOutputNames } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const item = (str, x, y, size = 12, dir = 'ltr') =>
  ({ str, transform: [size, 0, 0, size, x, y], width: str.length * size / 2, height: size, dir });

test('reconstructs page lines by coordinates and joins contiguous glyph runs', () => {
  const lines = textItemsToLines([
    item('Body text', 20, 680), item('lo', 38, 720), item('Hel', 20, 720), item('world', 65, 720)
  ]);
  assert.deepEqual(lines.map(line => line.text), ['Hello world', 'Body text']);
});

test('keeps UTF-8 text and right-to-left reading direction', () => {
  const lines = textItemsToLines([item('دنیا', 20, 700, 12, 'rtl'), item('سلام', 100, 700, 12, 'rtl')]);
  assert.equal(lines[0].text, 'سلام دنیا');
});

test('converts actual large-font headings and bullet lists to Markdown', () => {
  const result = linesToTextAndMarkdown([
    { text: 'Report Title', size: 24, y: 740 },
    { text: 'This body paragraph has sufficient content to establish the normal text size.', size: 12, y: 700 },
    { text: '• First item', size: 12, y: 680 },
    { text: 'Literal *asterisks* and <tags>', size: 12, y: 660 }
  ]);
  assert.match(result.markdown, /^# Report Title/);
  assert.match(result.markdown, /- First item/);
  assert.match(result.markdown, /Literal \\\*asterisks\\\* and \\<tags\\>/);
  assert.match(result.text, /• First item/);
  assert.match(result.text, /Literal \*asterisks\* and <tags>/);
});

test('blank pages do not fabricate text', () => {
  assert.deepEqual(textItemsToLines([item('  ', 0, 0)]), []);
  assert.deepEqual(linesToTextAndMarkdown([]), { text: '', markdown: '' });
});

test('archive output stems are safe and collision-free, including case-only duplicates', () => {
  assert.deepEqual(uniqueTextOutputNames(['same.pdf', 'same.pdf', 'SAME.pdf', '../bad.pdf', 'same_2.pdf']), [
    'same', 'same_2', 'SAME_3', '.._bad', 'same_2_2'
  ]);
});
