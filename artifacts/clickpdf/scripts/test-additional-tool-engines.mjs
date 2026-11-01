import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
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
  for (let index = 0; index < pageCount; index++) {
    pdf.addPage([200, 100]).drawText(`Repair ${index + 1}`, { x: 20, y: 60, size: 12 });
  }
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

function readRawPageContent(document, pageIndex) {
  const contents = document.getPage(pageIndex).node.Contents();
  const streams = contents?.asArray?.() ?? [contents];
  return streams.map((reference) => {
    const stream = document.context.lookup(reference);
    const raw = stream.getContents();
    try {
      return inflateSync(raw).toString('latin1');
    } catch {
      return Buffer.from(raw).toString('latin1');
    }
  }).join('\n');
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

async function makeRealPptxFixture() {
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';

  const first = presentation.addSlide();
  first.addText('Fixture title', { x: 0.5, y: 0.4, w: 5, h: 0.5, fontSize: 24, bold: true });
  first.addText('Body fixture text', { x: 1, y: 2, w: 5, h: 1, fontSize: 16 });
  first.addImage({
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/vVQAAAAASUVORK5CYII=',
    x: 7,
    y: 1,
    w: 1,
    h: 1,
  });

  const second = presentation.addSlide();
  second.addText('Second layout title', { x: 1, y: 0.5, w: 4, h: 0.4, fontSize: 20 });
  second.addText('Second slide content', { x: 4, y: 3, w: 3, h: 1, fontSize: 14 });

  return new Uint8Array(await presentation.write({ outputType: 'uint8array' }));
}

function replaceStartXrefOffset(pdfBytes, replacement) {
  const bytes = Buffer.from(pdfBytes);
  const marker = Buffer.from('startxref', 'ascii');
  const markerIndex = bytes.lastIndexOf(marker);
  assert.ok(markerIndex >= 0, 'the fixture has a startxref marker');

  let numberStart = markerIndex + marker.length;
  while ([0x09, 0x0a, 0x0d, 0x20].includes(bytes[numberStart])) numberStart++;
  let numberEnd = numberStart;
  while (bytes[numberEnd] >= 0x30 && bytes[numberEnd] <= 0x39) numberEnd++;
  assert.ok(numberEnd > numberStart, 'the fixture has a numeric startxref offset');

  return new Uint8Array(Buffer.concat([
    bytes.subarray(0, numberStart),
    Buffer.from(String(replacement), 'ascii'),
    bytes.subarray(numberEnd),
  ]));
}

function removeStartXrefTrailer(pdfBytes) {
  const bytes = Buffer.from(pdfBytes);
  const markerIndex = bytes.lastIndexOf(Buffer.from('startxref', 'ascii'));
  assert.ok(markerIndex >= 0, 'the fixture has a startxref marker');
  return new Uint8Array(bytes.subarray(0, markerIndex));
}

const sourcePdf = await makePdf(2);

{
  const cropFixtureDocument = await PDFDocument.create();
  const firstCropPage = cropFixtureDocument.addPage([200, 100]);
  firstCropPage.drawText('Crop page one', { x: 20, y: 60, size: 12 });
  firstCropPage.drawText('Outside CropBox remains', { x: 1, y: 1, size: 6 });
  const secondCropPage = cropFixtureDocument.addPage([600, 400]);
  secondCropPage.drawText('Crop page two', { x: 40, y: 350, size: 12 });
  const cropFixture = new Uint8Array(await cropFixtureDocument.save());

  const croppedBytes = await cropPdfMargins(cropFixture, 5);
  const cropped = await PDFDocument.load(croppedBytes);
  assert.equal(cropped.getPageCount(), 2, 'all source pages are retained');
  assert.deepEqual(cropped.getPage(0).getMediaBox(), { x: 0, y: 0, width: 200, height: 100 });
  assert.deepEqual(cropped.getPage(0).getCropBox(), { x: 5, y: 5, width: 190, height: 90 });
  assert.deepEqual(cropped.getPage(1).getMediaBox(), { x: 0, y: 0, width: 600, height: 400 });
  assert.deepEqual(cropped.getPage(1).getCropBox(), { x: 20, y: 20, width: 560, height: 360 });
  const croppedText = (await readPdfText(croppedBytes)).join('\n');
  assert.match(croppedText, /Crop page one/);
  assert.match(croppedText, /Crop page two/);
  const firstPageContent = readRawPageContent(cropped, 0);
  assert.ok(
    firstPageContent.toUpperCase().includes(Buffer.from('Outside CropBox remains').toString('hex').toUpperCase()),
    'the off-box text remains in the saved page content stream; CropBox changes are not redaction',
  );

  const maximumCrop = await PDFDocument.load(await cropPdfMargins(cropFixture, 25));
  assert.deepEqual(maximumCrop.getPage(0).getCropBox(), { x: 25, y: 25, width: 150, height: 50 });
  const zeroCrop = await PDFDocument.load(await cropPdfMargins(cropFixture, 0));
  assert.deepEqual(zeroCrop.getPage(0).getCropBox(), { x: 0, y: 0, width: 200, height: 100 });

  await assert.rejects(() => cropPdfMargins(sourcePdf, 26), /between 0 and 25 percent/);
  await assert.rejects(() => cropPdfMargins(sourcePdf, -1), /between 0 and 25 percent/);
  await assert.rejects(() => cropPdfMargins(sourcePdf, Number.NaN), /between 0 and 25 percent/);

  const tinyPdf = await PDFDocument.create();
  tinyPdf.addPage([50, 50]);
  const tinyPdfBytes = new Uint8Array(await tinyPdf.save());
  await assert.rejects(
    () => cropPdfMargins(tinyPdfBytes, 25),
    /page too small/,
    'crop settings that leave a page below the minimum size are rejected',
  );
}

{
  const repairedBytes = await repairPdfBytes(sourcePdf);
  const repaired = await PDFDocument.load(repairedBytes);
  assert.equal(repaired.getPageCount(), 2, 'best-effort rebuild retains the readable page count');
  assert.match((await readPdfText(repairedBytes)).join('\n'), /Repair 1/);
  await assert.rejects(() => repairPdfBytes(new TextEncoder().encode('not a PDF')));
}

{
  const classicPdf = await PDFDocument.create();
  for (let index = 0; index < 2; index++) {
    classicPdf.addPage([300, 400]).drawText(`Recovery ${index + 1}`, { x: 40, y: 350, fontSize: 12 });
  }
  const validBytes = new Uint8Array(await classicPdf.save({ useObjectStreams: false }));

  for (const [label, damagedBytes] of [
    ['incorrect startxref offset', replaceStartXrefOffset(validBytes, 999999)],
    ['missing startxref trailer', removeStartXrefTrailer(validBytes)],
  ]) {
    const repairedBytes = await repairPdfBytes(damagedBytes);
    const reopened = await PDFDocument.load(repairedBytes);
    assert.equal(reopened.getPageCount(), 2, `${label}: recovered output opens with both pages`);
    const extracted = (await readPdfText(repairedBytes)).join('\n');
    assert.match(extracted, /Recovery 1/);
    assert.match(extracted, /Recovery 2/);
  }

  let truncatedRejected = false;
  try {
    await repairPdfBytes(validBytes.slice(0, -10));
  } catch {
    truncatedRejected = true;
  }
  assert.equal(truncatedRejected, true, 'truncated content that prevents parsing must be reported as unrecoverable');
}

{
  const originalDocument = await PDFDocument.create();
  originalDocument.addPage([300, 400]).drawText('Shared clause', { x: 40, y: 350, fontSize: 12 });
  originalDocument.addPage([300, 400]).drawText('Total 100', { x: 40, y: 350, fontSize: 12 });
  const originalBytes = new Uint8Array(await originalDocument.save());

  const revisedDocument = await PDFDocument.create();
  revisedDocument.addPage([300, 400]).drawText('Shared clause', { x: 40, y: 350, fontSize: 12 });
  revisedDocument.addPage([300, 400]).drawText('Total 125', { x: 40, y: 350, fontSize: 12 });
  revisedDocument.addPage([300, 400]).drawText('Added appendix', { x: 40, y: 350, fontSize: 12 });
  revisedDocument.addPage([300, 400]);
  const revisedBytes = new Uint8Array(await revisedDocument.save());

  const originalPages = await readPdfText(originalBytes);
  const revisedPages = await readPdfText(revisedBytes);
  const originalEmptyPages = originalPages.flatMap((text, index) => text.trim() ? [] : [index + 1]);
  const revisedEmptyPages = revisedPages.flatMap((text, index) => text.trim() ? [] : [index + 1]);
  assert.match(originalPages[0], /Shared clause/);
  assert.match(originalPages[1], /Total 100/);
  assert.equal(revisedPages.length, 4);

  const realReport = buildPdfTextComparisonReport(
    {
      fileName: 'original.pdf',
      pages: originalPages.length,
      text: originalPages.join('\f'),
      emptyPages: originalEmptyPages,
    },
    {
      fileName: 'revised.pdf',
      pages: revisedPages.length,
      text: revisedPages.join('\f'),
      emptyPages: revisedEmptyPages,
    },
  );
  assert.match(realReport, /PAGE 1: TEXT MATCH/);
  assert.match(realReport, /PAGE 2: TEXT DIFFERS/);
  assert.match(realReport, /PAGE 3: PAGE ADDED/);
  assert.match(realReport, /PAGE 4: PAGE ADDED/);
  assert.match(realReport, /Total 100/);
  assert.match(realReport, /Total 125/);
  assert.match(realReport, /OCR NOTE/);
  assert.match(realReport, /Revised file has no selectable text on page\(s\): 4/);

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

  const realPptxBytes = await makeRealPptxFixture();
  const realPptx = await JSZip.loadAsync(realPptxBytes);
  const mediaFiles = Object.keys(realPptx.files).filter((name) => /^ppt\/media\/.+\.png$/i.test(name));
  assert.ok(mediaFiles.length > 0, 'the real PPTX fixture contains an embedded image');
  const sourceSlide1 = await realPptx.file('ppt/slides/slide1.xml').async('text');
  const sourceSlide2 = await realPptx.file('ppt/slides/slide2.xml').async('text');
  assert.match(sourceSlide1, /<p:pic\b/, 'the real PPTX fixture includes a picture shape');
  assert.match(sourceSlide1, /Fixture title/);
  assert.match(sourceSlide2, /Second layout title/);
  const presentationXml = await realPptx.file('ppt/presentation.xml').async('text');
  const slideSize = presentationXml.match(/<p:sldSz\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
  assert.ok(slideSize, 'the real PPTX fixture declares a slide layout');
  assert.ok(
    Math.abs(Number(slideSize[1]) / Number(slideSize[2]) - 16 / 9) < 0.01,
    'the source presentation uses a 16:9 layout',
  );

  const realResult = await convertPptxTextToPdf(realPptxBytes, 'real-layout-image-fixture.pptx');
  assert.equal(realResult.fileName, 'real-layout-image-fixture.pdf');
  assert.equal(realResult.pageCount, 2, 'one basic PDF page is created for each source slide');
  assert.match(realResult.details, /original slide images, layout, charts, speaker notes, and animations are not preserved/i);
  const realOutput = await PDFDocument.load(realResult.data);
  assert.deepEqual(realOutput.getPages().map((page) => page.getSize()), [
    { width: 960, height: 540 },
    { width: 960, height: 540 },
  ], 'source slide placement is rebuilt onto uniform 16:9 PDF pages');
  const realText = (await readPdfText(realResult.data)).join('\n');
  assert.match(realText, /Fixture title/);
  assert.match(realText, /Body fixture text/);
  assert.match(realText, /Second layout title/);
  assert.match(realText, /Second slide content/);
  assert.doesNotMatch(
    new TextDecoder().decode(realResult.data),
    /\/Subtype\s*\/Image\b/,
    'embedded PPTX pictures are intentionally not copied into the basic PDF output',
  );
  assert.equal(isSupportedPowerPointFile('legacy.ppt'), false);
  await assert.rejects(
    () => convertPptxTextToPdf(realPptxBytes, 'legacy.ppt'),
    /Only \.pptx files are supported/,
    'legacy .ppt input is rejected with the supported format stated',
  );
}

{
  const workspace = await readFile(path.join(appDir, 'src/components/ToolWorkspace.tsx'), 'utf8');
  const officeConverters = await readFile(path.join(appDir, 'src/utils/officeConverters.ts'), 'utf8');
  const textExtraction = await readFile(path.join(appDir, 'src/utils/pdfTextExtraction.ts'), 'utf8');
  assert.match(workspace, /tool\.id === 'compare' && files\.length !== 2/, 'text comparison requires exactly two files');
  assert.match(workspace, /const \[original,\s*revised\] = files/);
  assert.match(workspace, /extractPdfText\(original/);
  assert.match(workspace, /extractPdfText\(revised/);
  assert.match(textExtraction, /URL\.createObjectURL\(file\)/, 'PDF text extraction reads the selected local file');
  assert.match(textExtraction, /pdfjs\.getDocument\(\{ url, stopAtErrors: true \}\)/);
  assert.match(textExtraction, /URL\.revokeObjectURL\(url\)/);
  assert.match(workspace, /cropMarginPercent/, 'crop margin control is wired into tool execution');
  assert.match(workspace, /CropBox/, 'crop UI explains that content outside the visible box remains in the file');
  assert.match(workspace, /pptxOnly\s*=\s*tool\.id === 'powerpoint-to-pdf'/, 'the workspace accepts only PPTX files for this converter');
  assert.match(officeConverters, /if \(!isSupportedPowerPointFile\(file\.name\)\)/, 'the conversion entry point uses the shared legacy format guard');
}

console.log('Additional tool engine checks passed: crop, valid/damaged/unrecoverable PDF repair, text comparison, real PPTX text/image/layout behavior, legacy .ppt rejection, and workspace constraints.');
