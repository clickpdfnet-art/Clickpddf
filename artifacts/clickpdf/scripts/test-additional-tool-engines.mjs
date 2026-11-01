import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { buildPdfTextComparisonReport } from '../src/utils/pdfTextComparison.mjs';
import { cropPdfMargins, repairPdfBytes } from '../src/utils/pdfToolOperations.mjs';
import {
  convertPptxTextToPdf,
  extractPowerPointSlideLines,
  isSupportedPowerPointFile,
} from '../src/utils/powerpointTextPdf.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function makePdf(pageCount = 1) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index++) pdf.addPage([200, 100]);
  return new Uint8Array(await pdf.save());
}

async function readPdfText(bytes) {
  const document = await getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    const text = await page.getTextContent();
    pages.push(text.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages;
}

function slideXml(paragraphs) {
  return `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody>${paragraphs.map((text, index) => `<a:p><a:r><a:rPr b="${index === 0 ? 1 : 0}"/><a:t>${text}</a:t></a:r></a:p>`).join('')}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
}

async function makePptx(slides) {
  const zip = new JSZip();
  for (const [index, paragraphs] of slides.entries()) {
    zip.file(`ppt/slides/slide${index + 1}.xml`, slideXml(paragraphs));
  }
  return new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));
}

const sourcePdf = await makePdf(2);

{
  const croppedBytes = await cropPdfMargins(sourcePdf, 5);
  const cropped = await PDFDocument.load(croppedBytes);
  const croppedPage = cropped.getPage(0);
  assert.deepEqual(croppedPage.getMediaBox(), { x: 0, y: 0, width: 200, height: 100 });
  assert.deepEqual(croppedPage.getCropBox(), { x: 5, y: 5, width: 190, height: 90 });
  await assert.rejects(() => cropPdfMargins(sourcePdf, 26), /between 0 and 25 percent/);
  await assert.rejects(() => cropPdfMargins(sourcePdf, Number.NaN), /between 0 and 25 percent/);
}

{
  const repairedBytes = await repairPdfBytes(sourcePdf);
  const repaired = await PDFDocument.load(repairedBytes);
  assert.equal(repaired.getPageCount(), 2, 'best-effort rebuild retains the readable page count');
  await assert.rejects(() => repairPdfBytes(new TextEncoder().encode('not a PDF')));
}

{
  const report = buildPdfTextComparisonReport(
    { fileName: 'original.pdf', pages: 2, text: 'Same text\fOriginal wording', emptyPages: [] },
    { fileName: 'revised.pdf', pages: 3, text: 'Same text\fRevised wording\fNew page', emptyPages: [3] },
  );
  assert.match(report, /PAGE 1: TEXT MATCH/);
  assert.match(report, /PAGE 2: TEXT DIFFERS/);
  assert.match(report, /PAGE 3: PAGE ADDED/);
  assert.match(report, /does not compare images, visual layout/);
  assert.match(report, /OCR NOTE/);
}

{
  const xml = slideXml(['Slide title', 'Selectable text &amp; entities']);
  assert.deepEqual(extractPowerPointSlideLines(xml).map((line) => line.text), [
    'Slide title',
    'Selectable text & entities',
  ]);
  assert.equal(isSupportedPowerPointFile('deck.PPTX'), true);
  assert.equal(isSupportedPowerPointFile('legacy.ppt'), false);

  const manyParagraphs = Array.from({ length: 45 }, (_, index) => `Paragraph ${index + 1} stays in the output.`);
  const pptxBytes = await makePptx([['Slide title', ...manyParagraphs], ['Second slide', 'Second-slide text']]);
  const result = await convertPptxTextToPdf(pptxBytes, 'fixture.pptx');
  assert.equal(result.fileName, 'fixture.pdf');
  assert.ok(result.pageCount > 2, 'overflow is continued onto additional PDF pages');
  assert.match(result.details, /Selectable text is retained/);
  assert.match(result.details, /original slide images, layout, charts, speaker notes, and animations are not preserved/i);
  const pages = await readPdfText(result.data);
  const outputText = pages.join('\n');
  for (const paragraph of manyParagraphs) assert.ok(outputText.includes(paragraph), `output preserves "${paragraph}"`);
  assert.ok(outputText.includes('Second-slide text'));
  await assert.rejects(() => convertPptxTextToPdf(pptxBytes, 'legacy.ppt'), /Only \.pptx files/);

  const unicodePptx = await makePptx([['Unicode slide', '東京']]);
  await assert.rejects(
    () => convertPptxTextToPdf(unicodePptx, 'unicode.pptx'),
    /characters not supported by the built-in PDF font/,
  );
}

{
  const workspace = await readFile(path.join(appDir, 'src/components/ToolWorkspace.tsx'), 'utf8');
  assert.match(workspace, /tool\.id === 'compare' && files\.length !== 2/, 'text comparison requires exactly two files');
  assert.match(workspace, /cropMarginPercent/, 'crop margin control is wired into tool execution');
  assert.match(workspace, /CropBox/, 'crop UI explains that content outside the visible box remains in the file');
}

console.log('Additional tool engine checks passed: crop, best-effort repair, text comparison, PPTX text conversion, and workspace constraints.');
