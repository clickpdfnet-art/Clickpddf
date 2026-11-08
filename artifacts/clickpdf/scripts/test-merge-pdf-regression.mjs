import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import ts from 'typescript';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  degrees,
  rgb,
} from 'pdf-lib';

const tempRoot = await mkdtemp(join(tmpdir(), 'clickpdf-merge-regression-'));
const toModuleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

const helperText = await readFile(new URL('../src/utils/mergePdfDocument.ts', import.meta.url), 'utf8');
const helperModuleText = transpile(helperText)
  .replaceAll('"pdf-lib"', JSON.stringify(import.meta.resolve('pdf-lib')))
  .replaceAll("'pdf-lib'", JSON.stringify(import.meta.resolve('pdf-lib')));
const {
  formatMergePdfErrorMessage,
  MergePdfUserError,
  mergePdfDocuments,
} = await import(toModuleUrl(helperModuleText));
const toolContentText = await readFile(new URL('../src/data/toolPageContent.ts', import.meta.url), 'utf8');
const { TOOL_PAGE_CONTENT } = await import(toModuleUrl(transpile(toolContentText)));
const localizedToolContent = JSON.parse(await readFile(
  new URL('../src/i18n/toolSeoContentTranslations.json', import.meta.url),
  'utf8',
));
const uiTranslationsText = await readFile(new URL('../src/i18n/uiTranslations.ts', import.meta.url), 'utf8');
const uiTranslationsModuleUrl = toModuleUrl(transpile(uiTranslationsText));
const translationsText = await readFile(new URL('../src/i18n/translations.ts', import.meta.url), 'utf8');
const translationsModuleText = transpile(translationsText)
  .replaceAll('"./uiTranslations"', JSON.stringify(uiTranslationsModuleUrl))
  .replaceAll("'./uiTranslations'", JSON.stringify(uiTranslationsModuleUrl));
const { translations } = await import(toModuleUrl(translationsModuleText));

after(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function makePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * (width * 4 + 1);
    scanlines[start] = 0;
    for (let x = 0; x < width; x += 1) {
      rgba.forEach((value, channel) => { scanlines[start + 1 + x * 4 + channel] = value; });
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function addLinkAnnotation(pdf, page, uri) {
  const action = PDFDict.withContext(pdf.context);
  action.set(PDFName.of('Type'), PDFName.of('Action'));
  action.set(PDFName.of('S'), PDFName.of('URI'));
  action.set(PDFName.of('URI'), PDFString.of(uri));

  const annotation = PDFDict.withContext(pdf.context);
  annotation.set(PDFName.of('Type'), PDFName.of('Annot'));
  annotation.set(PDFName.of('Subtype'), PDFName.of('Link'));
  annotation.set(PDFName.of('Rect'), pdf.context.obj([20, 20, 180, 42]));
  annotation.set(PDFName.of('Border'), pdf.context.obj([0, 0, 0]));
  annotation.set(PDFName.of('A'), action);
  page.node.addAnnot(pdf.context.register(annotation));
}

function makeRawPdfWithFormEntry(acroFormEntries, extraObjects = '') {
  const fieldsEntry = acroFormEntries.includes('/Fields') ? '' : '/Fields []';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R /AcroForm 5 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
    `<< ${fieldsEntry} ${acroFormEntries} >>`,
  ];
  if (extraObjects) objects.push(...extraObjects.trim().split('\n\n'));

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    const objectNumber = index + 1;
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${objectNumber} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

async function makeFormPdf({ marker, title, author, subject, keyword, checked, selection }) {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const page = pdf.addPage([612, 792]);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const image = await pdf.embedPng(makePng(4, 4, [28, 120, 210, 255]));

  page.drawText(marker, { x: 42, y: 744, size: 18, font: bodyFont, color: rgb(0.1, 0.2, 0.4) });
  page.drawRectangle({ x: 36, y: 680, width: 145, height: 34, borderColor: rgb(0, 0.6, 0.2), borderWidth: 2 });
  page.drawImage(image, { x: 210, y: 680, width: 28, height: 28 });
  page.setRotation(degrees(90));
  page.setCropBox(18, 25, 560, 730);

  const form = pdf.getForm();
  const text = form.createTextField('Applicant.Name');
  text.setText(`${marker}-TEXT`);
  text.setMaxLength(80);
  text.enableRequired();
  text.addToPage(page, {
    x: 42,
    y: 620,
    width: 220,
    height: 28,
    textColor: rgb(0.12, 0.18, 0.3),
    backgroundColor: rgb(0.92, 0.95, 1),
    borderColor: rgb(0.2, 0.3, 0.6),
    borderWidth: 1,
  });

  const checkbox = form.createCheckBox('Applicant.Confirmed');
  checkbox.addToPage(page, { x: 42, y: 575, width: 18, height: 18 });
  if (checked) checkbox.check();

  const radio = form.createRadioGroup('Applicant.Route');
  radio.addOptionToPage('Keep', page, { x: 42, y: 535, width: 18, height: 18 });
  radio.addOptionToPage('Replace', page, { x: 72, y: 535, width: 18, height: 18 });
  if (selection) radio.select(selection);

  const dropdown = form.createDropdown('Applicant.Department');
  dropdown.addOptions(['Design', 'Finance', 'Research']);
  dropdown.select(marker === 'ALPHA' ? 'Design' : 'Finance');
  dropdown.addToPage(page, { x: 42, y: 490, width: 180, height: 24 });

  const optionList = form.createOptionList('Applicant.Tags');
  optionList.addOptions(['alpha', 'beta', 'gamma']);
  optionList.select(marker === 'ALPHA' ? 'alpha' : 'beta');
  optionList.addToPage(page, { x: 42, y: 410, width: 180, height: 60 });

  addLinkAnnotation(pdf, page, `https://example.test/${marker.toLowerCase()}`);
  if (title) pdf.setTitle(title);
  if (author) pdf.setAuthor(author);
  if (subject) pdf.setSubject(subject);
  if (keyword) pdf.setKeywords([keyword]);
  pdf.setCreator(`Fixture creator ${marker}`);
  pdf.setProducer(`Fixture producer ${marker}`);
  pdf.setCreationDate(new Date('2025-01-02T03:04:05.000Z'));
  pdf.setModificationDate(new Date('2025-02-03T04:05:06.000Z'));
  return pdf.save();
}

async function setFormFontResource(pdfBytes, resourceName, baseFontName) {
  const pdf = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const form = pdf.catalog.AcroForm();
  assert.ok(form, 'fixture contains an AcroForm');
  const font = PDFDict.withContext(pdf.context);
  font.set(PDFName.of('Type'), PDFName.of('Font'));
  font.set(PDFName.of('Subtype'), PDFName.of('Type1'));
  font.set(PDFName.of('BaseFont'), PDFName.of(baseFontName));
  const fonts = PDFDict.withContext(pdf.context);
  fonts.set(PDFName.of(resourceName), pdf.context.register(font));
  const resources = PDFDict.withContext(pdf.context);
  resources.set(PDFName.of('Font'), fonts);
  form.set(PDFName.of('DR'), resources);
  form.set(PDFName.of('DA'), PDFString.of(`/${resourceName} 11 Tf 0 g`));
  const fields = form.lookupMaybe(PDFName.of('Fields'), PDFArray);
  assert.ok(fields?.size(), 'fixture has an AcroForm field');
  const setFieldAppearance = (value) => {
    const field = value instanceof PDFDict ? value : pdf.context.lookupMaybe(value, PDFDict);
    if (!field) return;
    if (field.has(PDFName.of('FT'))) {
      field.set(PDFName.of('DA'), PDFString.of(`/${resourceName} 11 Tf 0 g`));
    }
    const kids = field.lookupMaybe(PDFName.of('Kids'), PDFArray);
    for (let index = 0; index < (kids?.size() || 0); index += 1) {
      setFieldAppearance(kids.get(index));
    }
  };
  setFieldAppearance(fields.get(0));
  return pdf.save({ updateFieldAppearances: false });
}

async function makeSimplePdf(marker, width = 612, height = 792) {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const page = pdf.addPage([width, height]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(marker, { x: 40, y: height - 48, size: 18, font });
  return pdf.save();
}

function asPdfFile(bytes, name) {
  return new File([bytes], name, { type: 'application/pdf' });
}

function linkTargets(pdf, page) {
  const annotations = page.node.Annots();
  if (!annotations) return [];
  const targets = [];
  for (let index = 0; index < annotations.size(); index += 1) {
    const annotation = pdf.context.lookupMaybe(annotations.get(index), PDFDict);
    const action = annotation?.lookupMaybe(PDFName.of('A'), PDFDict);
    const uri = action?.lookupMaybe(PDFName.of('URI'), PDFString);
    if (uri) targets.push(uri.decodeText());
  }
  return targets;
}

function assertCheckboxAppearance(pdf, fieldName, expectedChecked, label) {
  const checkbox = pdf.getForm().getCheckBox(fieldName);
  const onValue = checkbox.acroField.getOnValue();
  assert.ok(onValue, `${label}: checkbox has an on-state value`);

  const expectedState = expectedChecked ? onValue : PDFName.of('Off');
  const widgets = checkbox.acroField.getWidgets();
  assert.equal(widgets.length, 1, `${label}: checkbox has one widget`);
  const widget = widgets[0];
  const appearances = widget.getAppearances()?.normal;

  assert.equal(
    checkbox.acroField.getValue().toString(),
    expectedState.toString(),
    `${label}: stored field /V matches the checked state`,
  );
  assert.equal(
    widget.getAppearanceState()?.toString(),
    expectedState.toString(),
    `${label}: widget /AS selects the matching appearance`,
  );
  assert.ok(appearances instanceof PDFDict, `${label}: widget has a normal appearance dictionary`);
  assert.ok(appearances.has(PDFName.of('Off')), `${label}: normal appearances include /Off`);
  assert.ok(appearances.has(onValue), `${label}: normal appearances include its on-state`);
  assert.equal(checkbox.isChecked(), expectedChecked, `${label}: checkbox value is distinguishable`);
}

function hasCommand(command) {
  return spawnSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' }).status === 0;
}

test('one PDF keeps AcroForm values, field properties, appearance, page geometry, links, and source metadata', async () => {
  const sourceBytes = await makeFormPdf({
    marker: 'ALPHA',
    title: 'First source title',
    author: 'First source author',
    subject: undefined,
    keyword: 'first-source-keyword',
    checked: true,
    selection: 'Keep',
  });
  const source = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  assertCheckboxAppearance(source, 'Applicant.Confirmed', true, 'checked source fixture');
  const sourceText = source.getForm().getTextField('Applicant.Name');
  const sourceWidget = sourceText.acroField.getWidgets()[0];

  let readCount = 0;
  let yieldCount = 0;
  const mergedBytes = await mergePdfDocuments(
    [asPdfFile(sourceBytes, 'alpha.pdf')],
    undefined,
    {
      readFile: async (file) => {
        readCount += 1;
        return file.arrayBuffer();
      },
      yieldToMainThread: async () => { yieldCount += 1; },
    },
  );
  assert.equal(readCount, 1, 'the no-worker file reader is used');
  assert.equal(yieldCount, 1, 'the fallback gives the browser a chance to render');

  const merged = await PDFDocument.load(mergedBytes, { updateMetadata: false });
  assert.equal(merged.getPageCount(), 1);
  assert.deepEqual(merged.getPages()[0].getSize(), source.getPages()[0].getSize());
  assert.equal(merged.getPages()[0].getRotation().angle, 90);
  assert.deepEqual(merged.getPages()[0].getCropBox(), source.getPages()[0].getCropBox());
  assert.deepEqual(linkTargets(merged, merged.getPages()[0]), ['https://example.test/alpha']);

  const form = merged.getForm();
  assert.deepEqual(
    form.getFields().map((field) => field.constructor.name),
    ['PDFTextField', 'PDFCheckBox', 'PDFRadioGroup', 'PDFDropdown', 'PDFOptionList'],
  );
  assert.equal(form.getTextField('Applicant.Name').getText(), 'ALPHA-TEXT');
  assert.equal(form.getTextField('Applicant.Name').isRequired(), true);
  assert.equal(form.getTextField('Applicant.Name').getMaxLength(), 80);
  assert.equal(form.getCheckBox('Applicant.Confirmed').isChecked(), true);
  assertCheckboxAppearance(merged, 'Applicant.Confirmed', true, 'checked merged output');
  assert.equal(form.getRadioGroup('Applicant.Route').getSelected(), 'Keep');
  assert.deepEqual(form.getDropdown('Applicant.Department').getSelected(), ['Design']);
  assert.deepEqual(form.getOptionList('Applicant.Tags').getSelected(), ['alpha']);
  const mergedWidget = form.getTextField('Applicant.Name').acroField.getWidgets()[0];
  assert.deepEqual(mergedWidget.getRectangle(), sourceWidget.getRectangle());
  assert.ok(mergedWidget.dict.has(PDFName.of('AP')), 'the copied widget keeps its appearance stream');

  assert.equal(merged.getTitle(), 'First source title');
  assert.equal(merged.getAuthor(), 'First source author');
  assert.equal(merged.getKeywords(), 'first-source-keyword');
  assert.equal(merged.getCreator(), 'Fixture creator ALPHA');
  assert.equal(merged.getProducer(), 'Fixture producer ALPHA');
  assert.equal(merged.getCreationDate()?.toISOString(), '2025-01-02T03:04:05.000Z');
  assert.equal(merged.getModificationDate()?.toISOString(), '2025-02-03T04:05:06.000Z');

  form.getTextField('Applicant.Name').setText('ALPHA-EDITED');
  form.getCheckBox('Applicant.Confirmed').uncheck();
  form.getRadioGroup('Applicant.Route').select('Replace');
  form.getDropdown('Applicant.Department').select('Research');
  form.getOptionList('Applicant.Tags').select(['beta', 'gamma']);
  const edited = await PDFDocument.load(await merged.save(), { updateMetadata: false });
  assert.equal(edited.getForm().getTextField('Applicant.Name').getText(), 'ALPHA-EDITED');
  assert.equal(edited.getForm().getCheckBox('Applicant.Confirmed').isChecked(), false);
  assertCheckboxAppearance(edited, 'Applicant.Confirmed', false, 'unchecked saved output');
  assert.equal(edited.getForm().getRadioGroup('Applicant.Route').getSelected(), 'Replace');
  assert.deepEqual(edited.getForm().getDropdown('Applicant.Department').getSelected(), ['Research']);
  assert.deepEqual(edited.getForm().getOptionList('Applicant.Tags').getSelected(), ['beta', 'gamma']);
});

test('multiple PDFs retain separate interactive fields with safe names and first-meaningful metadata precedence', async () => {
  const firstBytes = await makeFormPdf({
    marker: 'ALPHA',
    title: 'Preferred title',
    author: 'Preferred author',
    subject: undefined,
    keyword: 'preferred-keyword',
    checked: true,
    selection: 'Keep',
  });
  const secondBytes = await makeFormPdf({
    marker: 'BETA',
    title: 'Conflicting title',
    author: 'Conflicting author',
    subject: 'First available subject',
    keyword: 'conflicting-keyword',
    checked: false,
    selection: 'Replace',
  });
  const firstSource = await PDFDocument.load(firstBytes, { updateMetadata: false });
  const secondSource = await PDFDocument.load(secondBytes, { updateMetadata: false });
  assertCheckboxAppearance(firstSource, 'Applicant.Confirmed', true, 'first checked source fixture');
  assertCheckboxAppearance(secondSource, 'Applicant.Confirmed', false, 'second unchecked source fixture');

  const mergedBytes = await mergePdfDocuments([
    asPdfFile(firstBytes, 'alpha.pdf'),
    asPdfFile(secondBytes, 'beta.pdf'),
  ]);
  const merged = await PDFDocument.load(mergedBytes, { updateMetadata: false });
  assert.equal(merged.getPageCount(), 2);
  assert.deepEqual(merged.getPages().map((page) => page.getWidth()), [612, 612]);
  assert.deepEqual(linkTargets(merged, merged.getPages()[0]), ['https://example.test/alpha']);
  assert.deepEqual(linkTargets(merged, merged.getPages()[1]), ['https://example.test/beta']);

  const form = merged.getForm();
  const fields = form.getFields();
  assert.equal(fields.length, 10);
  assert.equal(new Set(fields.map((field) => field.getName())).size, 10);
  assert.equal(form.getTextField('Applicant.Name').getText(), 'ALPHA-TEXT');
  assert.equal(form.getCheckBox('Applicant.Confirmed').isChecked(), true);
  assertCheckboxAppearance(merged, 'Applicant.Confirmed', true, 'first checked merged field');
  const duplicateCheckbox = fields.find(
    (field) => field.constructor.name === 'PDFCheckBox' && field.getName() !== 'Applicant.Confirmed',
  );
  assert.ok(duplicateCheckbox, 'the second checkbox has a distinct field name');
  assertCheckboxAppearance(merged, duplicateCheckbox.getName(), false, 'second unchecked merged field');
  assert.equal(form.getRadioGroup('Applicant.Route').getSelected(), 'Keep');
  const duplicateText = fields.find((field) => field.getName().startsWith('Applicant.Name__merged2_'));
  assert.ok(duplicateText, 'a duplicate field receives a deterministic suffix');
  assert.equal(form.getTextField(duplicateText.getName()).getText(), 'BETA-TEXT');
  assert.equal(merged.getTitle(), 'Preferred title');
  assert.equal(merged.getAuthor(), 'Preferred author');
  assert.equal(merged.getSubject(), 'First available subject', 'the first non-empty subject is retained');
  assert.equal(merged.getKeywords(), 'preferred-keyword');

  const path = join(tempRoot, 'two-sources.pdf');
  await writeFile(path, mergedBytes);
  if (hasCommand('pdftotext')) {
    const extractedText = execFileSync('pdftotext', [path, '-'], { encoding: 'utf8' });
    assert.match(extractedText, /ALPHA/);
    assert.match(extractedText, /BETA/);
  }
});

test('colliding AcroForm font resources are renamed and each field keeps its source font reference', async () => {
  const firstSource = await setFormFontResource(
    await makeFormPdf({
      marker: 'ALPHA',
      title: 'First source title',
      author: undefined,
      subject: undefined,
      keyword: undefined,
      checked: false,
      selection: undefined,
    }),
    'SharedFont',
    'Helvetica',
  );
  const secondSource = await setFormFontResource(
    await makeFormPdf({
      marker: 'BETA',
      title: undefined,
      author: undefined,
      subject: undefined,
      keyword: undefined,
      checked: false,
      selection: undefined,
    }),
    'SharedFont',
    'Courier',
  );
  const mergedBytes = await mergePdfDocuments([
    asPdfFile(firstSource, 'font-one.pdf'),
    asPdfFile(secondSource, 'font-two.pdf'),
  ]);
  const merged = await PDFDocument.load(mergedBytes, { updateMetadata: false });
  const form = merged.catalog.AcroForm();
  const resources = form?.lookupMaybe(PDFName.of('DR'), PDFDict);
  const fonts = resources?.lookupMaybe(PDFName.of('Font'), PDFDict);
  const secondFontKey = PDFName.of('Merge2Font0');
  assert.ok(fonts?.has(PDFName.of('SharedFont')));
  assert.ok(fonts?.has(secondFontKey));
  assert.equal(
    fonts?.lookup(secondFontKey, PDFDict).lookup(PDFName.of('BaseFont'), PDFName).decodeText(),
    'Courier',
  );
  assert.match(
    merged.getForm().getTextField('Applicant.Name__merged2_1').acroField.dict
      .lookup(PDFName.of('DA'), PDFString).decodeText(),
    /\/Merge2Font0\s+11\s+Tf/,
  );
});
test('two, three, twenty, and duplicate inputs keep page count and selected order', async () => {
  const twenty = [];
  for (let index = 1; index <= 20; index += 1) {
    twenty.push(asPdfFile(await makeSimplePdf(`PAGE-MARKER-${String(index).padStart(2, '0')}`, 500 + index, 700 + index), `page-${index}.pdf`));
  }
  for (const count of [2, 3, 20]) {
    const outputBytes = await mergePdfDocuments(twenty.slice(0, count));
    const output = await PDFDocument.load(outputBytes, { updateMetadata: false });
    assert.equal(output.getPageCount(), count);
    assert.deepEqual(output.getPages().map((page) => Math.round(page.getWidth())), Array.from({ length: count }, (_, index) => 501 + index));
    const path = join(tempRoot, `count-${count}.pdf`);
    await writeFile(path, outputBytes);
    if (hasCommand('pdftotext')) {
      const text = execFileSync('pdftotext', [path, '-'], { encoding: 'utf8' });
      for (let index = 1; index <= count; index += 1) {
        assert.ok(text.indexOf(`PAGE-MARKER-${String(index).padStart(2, '0')}`) >= 0, `page ${index} marker remains searchable`);
        if (index < count) {
          assert.ok(
            text.indexOf(`PAGE-MARKER-${String(index).padStart(2, '0')}`) < text.indexOf(`PAGE-MARKER-${String(index + 1).padStart(2, '0')}`),
            `page ${index} stays before page ${index + 1}`,
          );
        }
      }
    }
  }

  const duplicateBytes = await makeSimplePdf('DUPLICATE-INPUT');
  const duplicateOutput = await PDFDocument.load(await mergePdfDocuments([
    asPdfFile(duplicateBytes, 'same.pdf'),
    asPdfFile(duplicateBytes, 'same-again.pdf'),
  ]), { updateMetadata: false });
  assert.equal(duplicateOutput.getPageCount(), 2);
});

test('empty, malformed, corrupt, XFA, and digital-signature inputs fail safely with the source filename', async () => {
  await assert.rejects(
    mergePdfDocuments([new File([], 'empty.pdf')]),
    /File "empty\.pdf": could not be read as a usable PDF/,
  );
  await assert.rejects(
    mergePdfDocuments([asPdfFile(Buffer.from('not a PDF'), 'malformed.pdf')]),
    /File "malformed\.pdf": could not be read as a usable PDF/,
  );
  await assert.rejects(
    mergePdfDocuments([asPdfFile(Buffer.from('%PDF-1.7\ntruncated'), 'corrupt.pdf')]),
    /File "corrupt\.pdf": could not be read as a usable PDF/,
  );

  await assert.rejects(
    mergePdfDocuments([asPdfFile(makeRawPdfWithFormEntry('/XFA (dynamic XFA fixture)'), 'dynamic-form.pdf')]),
    /File "dynamic-form\.pdf": contains a dynamic XFA form/,
  );

  await assert.rejects(
    mergePdfDocuments([asPdfFile(makeRawPdfWithFormEntry('/Fields [6 0 R]', '<< /FT /Sig /T (Signature) >>'), 'signed.pdf')]),
    /File "signed\.pdf": contains a digital signature/,
  );
});

test('English Merge PDF FAQ accurately describes single-file processing', () => {
  assert.match(TOOL_PAGE_CONTENT.merge.steps[0].description, /one or more PDF documents/i);
  const faq = TOOL_PAGE_CONTENT.merge.faqs[0];
  assert.match(faq.question, /one file/i);
  assert.match(faq.answer, /accepts one or more PDF files/i);
  assert.match(faq.answer, /processing a single file creates a separate PDF copy/i);
  assert.match(faq.answer, /two or more PDFs/i);
});

test('Merge PDF single-file wording matches runtime in English and all corrected locales', () => {
  const expected = {
    ja: {
      intro: 'PDFを1つ以上追加し、複数の文書をまとめる場合は順序を整えてから出力を作成します。1つだけ処理すると別のコピーが作成され、元のPDFは変更されません。リンク、フォーム、注釈の動作は文書によって異なる場合があるため、保存後に結果を確認してください。',
      question: 'Merge PDFは1つのファイルだけでも使えますか？',
      answer: 'はい。Merge PDFは1つ以上のPDFファイルに対応しています。1つのファイルを処理すると、別のPDFコピーが作成されます。複数の文書をまとめる場合のみ、2つ以上のPDFを選択してください。元のファイルは変更されません。',
      step: 'デバイスから1つ以上のPDF文書を選ぶか、結合ワークスペースにドラッグします。',
    },
    ur: {
      intro: 'ایک یا زیادہ PDFs شامل کریں؛ متعدد دستاویزات کو جوڑنے کی صورت میں ان کی ترتیب بنائیں، پھر آؤٹ پٹ تیار کریں۔ ایک فائل پر کارروائی سے اس کی الگ نقل بنتی ہے اور اصل PDF میں تبدیلی نہیں ہوتی۔ لنکس، فارمز اور annotations کا رویہ دستاویز کے لحاظ سے بدل سکتا ہے، اس لیے محفوظ کرنے کے بعد نتیجہ چیک کریں۔',
      question: 'کیا Merge PDF ایک فائل کے ساتھ بھی استعمال ہو سکتا ہے؟',
      answer: 'جی ہاں۔ Merge PDF ایک یا زیادہ PDF فائلیں قبول کرتا ہے۔ ایک فائل پر کارروائی سے اس کی الگ PDF نقل بنتی ہے۔ دو یا زیادہ فائلیں صرف تب منتخب کریں جب دستاویزات کو جوڑنا ہو۔ اصل فائلیں تبدیل نہیں ہوتیں۔',
      step: 'اپنے ڈیوائس سے ایک یا زیادہ PDF دستاویزات منتخب کریں یا انہیں مرج ورک اسپیس میں کھینچ کر ڈالیں۔',
    },
    de: {
      intro: 'Fügen Sie eine oder mehrere PDFs hinzu und ordnen Sie sie, wenn Sie mehrere Dokumente zusammenführen möchten. Bei einer einzelnen PDF wird eine separate Kopie erstellt; die Originaldatei bleibt unverändert. Links, Formulare und Anmerkungen können sich je nach Dokument anders verhalten; prüfen Sie daher das Ergebnis nach dem Speichern.',
      question: 'Kann ich Merge PDF auch mit nur einer Datei verwenden?',
      answer: 'Ja. Merge PDF akzeptiert eine oder mehrere PDF-Dateien. Bei einer einzelnen Datei wird eine separate PDF-Kopie erstellt. Wählen Sie nur dann mindestens zwei PDFs aus, wenn Sie mehrere Dokumente zusammenfügen möchten. Die Originaldateien bleiben unverändert.',
      step: 'Wählen Sie ein oder mehrere PDF-Dokumente auf Ihrem Gerät aus oder ziehen Sie sie in den Arbeitsbereich zum Zusammenfügen.',
    },
    hi: {
      question: 'क्या Merge PDF में केवल एक फ़ाइल भी इस्तेमाल की जा सकती है?',
      answer: 'हाँ। Merge PDF एक या अधिक PDF फ़ाइलें स्वीकार करता है। एक फ़ाइल प्रोसेस करने पर उसकी अलग PDF कॉपी बनती है। दो या अधिक PDF केवल दस्तावेज़ जोड़ने के लिए चुनें। मूल फ़ाइलें नहीं बदलतीं।',
      step: 'Merge workspace में अपने device से एक या अधिक PDFs चुनें या उन्हें वहाँ छोड़ें।',
    },
    ar: {
      question: 'هل يمكن استخدام Merge PDF مع ملف PDF واحد فقط؟',
      answer: 'نعم. يقبل Merge PDF ملف PDF واحدًا أو أكثر. تؤدي معالجة ملف واحد إلى إنشاء نسخة PDF منفصلة. اختر ملفي PDF أو أكثر فقط عند دمج مستندات متعددة. لا تتغير الملفات الأصلية.',
      step: 'حدد ملف PDF واحدًا أو أكثر من جهازك، أو اسحب الملفات إلى مساحة الدمج.',
    },
    fr: {
      question: 'Puis-je utiliser Merge PDF avec un seul fichier ?',
      answer: 'Oui. Merge PDF accepte un ou plusieurs fichiers PDF. Le traitement d’un seul fichier crée une copie PDF distincte. Sélectionnez au moins deux PDF uniquement pour réunir plusieurs documents. Les fichiers d’origine restent inchangés.',
      step: 'Sélectionnez un ou plusieurs documents PDF sur votre appareil ou déposez-les dans l’espace de fusion.',
    },
    it: {
      intro: 'Aggiungi uno o più PDF e disponili nell’ordine desiderato se vuoi unire più documenti. Con un solo PDF viene creata una copia separata; il file originale resta invariato. Controlla link, moduli, segnalibri e annotazioni nel risultato: le funzioni interattive possono variare tra i documenti.',
      step: 'Seleziona uno o più documenti PDF dal dispositivo o trascinali nell’area di lavoro.',
    },
    no: {
      intro: 'Legg til én eller flere PDF-filer, og ordne dem hvis du skal slå sammen flere dokumenter. Behandling av én fil lager en separat kopi; originalfilen endres ikke. Kontroller lenker, skjemaer, bokmerker og merknader i resultatet; interaktive funksjoner kan variere mellom dokumenter.',
      step: 'Velg ett eller flere PDF-dokumenter fra enheten, eller dra dem inn i arbeidsområdet.',
    },
    pt: {
      intro: 'Adicione um ou mais PDFs e organize-os se quiser reunir vários documentos. Ao processar um único PDF, é criada uma cópia separada; o original permanece inalterado. Confira links, formulários, favoritos e anotações no resultado, pois os recursos interativos podem variar entre os documentos.',
      step: 'Selecione um ou mais documentos PDF no dispositivo ou arraste-os para a área de trabalho.',
    },
    ru: {
      intro: 'Добавьте один или несколько PDF-файлов и расположите их по порядку, если объединяете несколько документов. При обработке одного файла создаётся отдельная копия; исходный файл не изменяется. После объединения проверьте ссылки, формы, закладки и аннотации: интерактивные элементы могут различаться.',
      step: 'Выберите один или несколько документов PDF на устройстве или перетащите их в рабочую область.',
    },
    ko: {
      intro: 'PDF 파일을 하나 이상 추가하고 여러 문서를 합칠 경우 원하는 순서로 정렬하세요. PDF 한 개만 처리하면 별도의 사본이 만들어지며 원본은 변경되지 않습니다. 병합 후 링크, 양식, 책갈피와 주석을 확인하세요. 문서마다 상호작용 요소가 다를 수 있습니다.',
      step: '기기에서 PDF 문서를 하나 이상 선택하거나 작업 영역으로 끌어오세요.',
    },
    tr: {
      intro: 'Bir veya daha fazla PDF ekleyin; birden çok belgeyi birleştirecekseniz istediğiniz sıraya koyun. Tek bir PDF işlendiğinde ayrı bir kopya oluşturulur ve kaynak dosya değişmez. Birleştirmeden sonra bağlantıları, formları, yer imlerini ve açıklamaları kontrol edin; etkileşimli öğeler belgelere göre farklılık gösterebilir.',
      step: 'Cihazınızdan bir veya daha fazla PDF belgesi seçin veya çalışma alanına sürükleyin.',
    },
    id: {
      intro: 'Tambahkan satu atau lebih PDF dan atur urutannya jika ingin menggabungkan beberapa dokumen. Memproses satu file akan membuat salinan terpisah; file asli tidak berubah. Periksa tautan, formulir, bookmark, dan anotasi pada hasil karena fitur interaktif dapat berbeda di setiap dokumen.',
      step: 'Pilih satu atau beberapa dokumen PDF dari perangkat atau seret ke ruang kerja.',
    },
    vi: {
      intro: 'Thêm một hoặc nhiều PDF; nếu gộp nhiều tài liệu, hãy sắp xếp theo thứ tự mong muốn. Xử lý một tệp sẽ tạo bản sao riêng; tệp gốc không bị thay đổi. Hãy kiểm tra liên kết, biểu mẫu, dấu trang và chú thích trong kết quả vì các tính năng tương tác có thể khác nhau giữa các tài liệu.',
      step: 'Chọn một hoặc nhiều tài liệu PDF trên thiết bị hoặc kéo chúng vào vùng làm việc.',
    },
    zh: {
      intro: '添加多个 PDF，按所需顺序排列，然后合并为一个文件。合并会拼接文档，不会自动压缩文件大小。',
      question: 'Merge PDF 可以只处理一个 PDF 文件吗？',
      answer: '可以。Merge PDF 接受一个或多个 PDF 文件。处理单个文件会生成一份独立的 PDF 副本。只有在合并多个文档时才需要选择两个或更多 PDF。原始文件不会被修改。',
      step: '从设备中选择一个或多个 PDF 文档，或将它们拖入合并工作区。',
    },
    tl: {
      intro: 'Magdagdag ng mga PDF, ayusin ang mga ito sa tamang pagkakasunod-sunod, at pagsamahin sa isang file. Pinagdurugtong ng merge ang mga dokumento; hindi nito awtomatikong pinapaliit ang laki ng file.',
      question: 'Maaari bang gamitin ang Merge PDF sa iisang PDF lang?',
      answer: 'Oo. Tumatanggap ang Merge PDF ng isa o higit pang PDF file. Kapag isang file lang ang pinroseso, gagawa ito ng hiwalay na kopya ng PDF. Pumili lang ng dalawa o higit pang PDF kung pagsasamahin ang maraming dokumento. Hindi binabago ang mga orihinal na file.',
      step: 'Pumili ng isa o higit pang PDF na dokumento mula sa device mo o i-drag ang mga ito papunta sa merge workspace.',
    },
    es: {
      intro: 'Añade varios PDF, ordénalos como quieras y combínalos en un solo archivo. Unir documentos no reduce automáticamente el tamaño del archivo.',
      question: '¿Puedo usar Merge PDF con un solo archivo PDF?',
      answer: 'Sí. Merge PDF acepta uno o varios archivos PDF. Al procesar un solo archivo se crea una copia PDF independiente. Selecciona dos o más PDF solo cuando quieras combinar documentos. Los archivos originales no se modifican.',
      step: 'Selecciona uno o varios documentos PDF de tu dispositivo o arrástralos al espacio de combinación.',
    },
    nl: {
      intro: 'Voeg PDF-bestanden toe, zet ze in de gewenste volgorde en combineer ze tot één bestand. Samenvoegen verkleint het bestand niet automatisch.',
      question: 'Kan ik Merge PDF met één PDF-bestand gebruiken?',
      answer: "Ja. Merge PDF ondersteunt één of meer PDF-bestanden. Als je één bestand verwerkt, wordt er een aparte kopie gemaakt; selecteer twee of meer PDF's om documenten samen te voegen. Het originele bestand blijft ongewijzigd.",
      step: 'Selecteer één of meer PDF-documenten op je apparaat of sleep ze naar de samenvoegwerkruimte.',
    },
    pl: {
      intro: 'Dodaj pliki PDF, ustaw je w odpowiedniej kolejności i połącz w jeden dokument. Łączenie nie zmniejsza automatycznie rozmiaru pliku.',
      question: 'Czy mogę użyć Merge PDF z jednym plikiem PDF?',
      answer: 'Tak. Merge PDF przyjmuje jeden lub więcej plików PDF. Przetworzenie jednego pliku tworzy osobną kopię PDF. Wybierz co najmniej dwa pliki PDF tylko wtedy, gdy chcesz połączyć dokumenty. Oryginalne pliki nie są zmieniane.',
      step: 'Wybierz jeden lub więcej dokumentów PDF na urządzeniu albo przeciągnij je do obszaru łączenia.',
    },
    sv: {
      intro: 'Lägg till PDF-filer, ordna dem i önskad följd och slå ihop dem till en fil. Sammanfogning minskar inte automatiskt filstorleken.',
      question: 'Kan Merge PDF användas med en enda PDF-fil?',
      answer: 'Ja. Merge PDF accepterar en eller flera PDF-filer. När en fil behandlas skapas en separat PDF-kopia. Välj två eller fler PDF-filer endast när du vill sammanfoga dokument. Originalfilerna ändras inte.',
      step: 'Välj ett eller flera PDF-dokument på enheten eller dra dem till arbetsytan för sammanfogning.',
    },
  };

  for (const [locale, expectedCopy] of Object.entries(expected)) {
    const mergeContent = localizedToolContent[locale].tools.merge;
    if (expectedCopy.intro) assert.equal(mergeContent.intro, expectedCopy.intro, `${locale} intro`);
    if (expectedCopy.question) assert.equal(mergeContent.faqs[0].question, expectedCopy.question, `${locale} question`);
    if (expectedCopy.answer) assert.equal(mergeContent.faqs[0].answer, expectedCopy.answer, `${locale} answer`);
    assert.equal(mergeContent.steps[0].description, expectedCopy.step, `${locale} first step`);
  }
});

const mergePdfLocales = [
  'en', 'ja', 'ur', 'de', 'hi', 'ar', 'zh', 'tl', 'es', 'fr', 'it',
  'no', 'pt', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi',
];
const mergePdfUiKeys = [
  'previewBtn',
  'previewThisFile',
  'previewProcessedFile',
  'mergePdfNoFilesError',
  'mergePdfUnreadableFileError',
  'mergePdfInputMemoryError',
  'mergePdfUnsupportedFormError',
  'mergePdfXfaError',
  'mergePdfSignatureError',
  'mergePdfSaveMemoryError',
  'mergePdfSaveError',
  'mergePdfGenericError',
];
const mergePdfFilenameKeys = [
  'mergePdfUnreadableFileError',
  'mergePdfInputMemoryError',
  'mergePdfUnsupportedFormError',
  'mergePdfXfaError',
  'mergePdfSignatureError',
];

test('Merge PDF preview and error messages are localized in all 21 supported languages', () => {
  assert.deepEqual(Object.keys(translations).sort(), [...mergePdfLocales].sort());

  for (const locale of mergePdfLocales) {
    const copy = translations[locale];
    for (const key of mergePdfUiKeys) {
      assert.equal(typeof copy[key], 'string', `${locale} ${key} has a translation`);
      assert.ok(copy[key].trim(), `${locale} ${key} is not empty`);
      if (locale !== 'en') {
        assert.notEqual(copy[key], translations.en[key], `${locale} ${key} does not fall back to English`);
      }
    }

    for (const key of mergePdfFilenameKeys) {
      assert.deepEqual(copy[key].match(/\{[^}]+\}/g), ['{fileName}'], `${locale} ${key} has exactly one filename placeholder`);
    }
  }
});

test('Merge PDF error codes render localized copy without exposing internal errors', () => {
  const filename = 'sample-$&-input.pdf';
  const errorCases = [
    ['no-files', 'mergePdfNoFilesError'],
    ['unreadable-file', 'mergePdfUnreadableFileError'],
    ['input-memory', 'mergePdfInputMemoryError'],
    ['unsupported-form', 'mergePdfUnsupportedFormError'],
    ['dynamic-xfa', 'mergePdfXfaError'],
    ['digital-signature', 'mergePdfSignatureError'],
    ['save-memory', 'mergePdfSaveMemoryError'],
    ['save-failed', 'mergePdfSaveError'],
  ];

  for (const locale of mergePdfLocales) {
    const copy = translations[locale];
    for (const [code, key] of errorCases) {
      const error = new MergePdfUserError(code, 'private parser details', filename);
      const message = formatMergePdfErrorMessage(error, copy);
      const expected = copy[key].replace('{fileName}', () => filename);
      assert.equal(message, expected, `${locale} ${code} uses its localized message`);
      assert.ok(!message.includes('{fileName}'), `${locale} ${code} replaces the filename placeholder`);
      assert.ok(!message.includes('private parser details'), `${locale} ${code} does not expose internal error text`);
    }
  }

  const unknownError = new Error('private worker stack details');
  assert.equal(
    formatMergePdfErrorMessage(unknownError, translations.ur),
    translations.ur.mergePdfGenericError,
  );
});
