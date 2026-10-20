import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  PDFDocument, StandardFonts, rgb, PDFName, PDFString, PDFHexString,
  beginText, endText, setFontAndSize, moveText, showText
} from 'pdf-lib';

const directory = '/tmp/clickpdf-word-fixtures';
await mkdir(directory, { recursive: true });
const save = async (name, doc) => writeFile(`${directory}/${name}`, await doc.save());
const doc = await PDFDocument.create();
const bold = await doc.embedFont(StandardFonts.HelveticaBold), italic = await doc.embedFont(StandardFonts.HelveticaOblique);
const regular = await doc.embedFont(StandardFonts.Helvetica);
const first = doc.addPage([612, 792]);
first.drawRectangle({ x: 20, y: 20, width: 572, height: 752, borderColor: rgb(.2, .4, .7), borderWidth: 1 });
first.drawText('ACME Report Header', { x: 50, y: 740, size: 22, font: bold, color: rgb(.1, .3, .7) });
first.drawText('Editable italic paragraph and link', { x: 50, y: 690, size: 12, font: italic, color: rgb(.7, .15, .2) });
first.drawText('https://example.com', { x: 50, y: 660, size: 12, font: regular });
const annotation = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [50, 657, 180, 675],
  Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of('https://example.com') } }));
first.node.set(PDFName.of('Annots'), doc.context.obj([annotation]));
for (let row = 0; row < 3; row++) for (let column = 0; column < 2; column++) {
  first.drawRectangle({ x: 50 + column * 220, y: 570 - row * 30, width: 220, height: 30, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  first.drawText([['Name', 'Value'], ['Alpha', 'Forty two'], ['Beta', 'Seven']][row][column],
    { x: 60 + column * 220, y: 580 - row * 30, size: 12, font: regular });
}
const logo = await doc.embedPng(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64'));
first.drawImage(logo, { x: 480, y: 685, width: 40, height: 30 });
first.drawText('Page 1 / ACME Footer', { x: 50, y: 40, size: 10, font: regular });
const landscape = doc.addPage([842, 595]);
landscape.drawText('Landscape page two', { x: 45, y: 550, size: 20, font: bold });
landscape.drawText('Left column paragraph 1', { x: 45, y: 500, size: 11, font: regular });
landscape.drawText('Right column paragraph 1', { x: 440, y: 500, size: 11, font: regular });
landscape.drawText('Left column paragraph 2', { x: 45, y: 480, size: 11, font: regular });
landscape.drawText('Right column paragraph 2', { x: 440, y: 480, size: 11, font: regular });
landscape.drawText('Left column paragraph 3', { x: 45, y: 460, size: 11, font: regular });
landscape.drawText('Right column paragraph 3', { x: 440, y: 460, size: 11, font: regular });
landscape.drawText('Page 2 / ACME Footer', { x: 45, y: 35, size: 10, font: regular });
doc.addPage([420, 595]); // Real blank source page, not an inserted output page.
await save('english-layout.pdf', doc);

/** Embed complete fixture fonts with an explicit Unicode CMap; no production dependency added. */
async function unicodeFixture(name, fontPath, text, glyphText = text) {
  const font = await readFile(fontPath), view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tables = {};
  for (let i = 0; i < view.getUint16(4); i++) {
    const at = 12 + i * 16, tag = font.subarray(at, at + 4).toString();
    tables[tag] = view.getUint32(at + 8);
  }
  const cmap = tables.cmap, subtables = [];
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const offset = cmap + view.getUint32(cmap + 4 + i * 8 + 4), format = view.getUint16(offset);
    if (format === 4 || format === 12) subtables.push({ offset, format });
  }
  subtables.sort((a, b) => b.format - a.format);
  const glyph = code => {
    for (const { offset, format } of subtables) {
      if (format === 12) {
        for (let i = 0; i < view.getUint32(offset + 12); i++) {
          const at = offset + 16 + i * 12, start = view.getUint32(at), end = view.getUint32(at + 4);
          if (code >= start && code <= end) return view.getUint32(at + 8) + code - start;
        }
      } else {
        const count = view.getUint16(offset + 6) / 2;
        for (let i = 0; i < count; i++) {
          const end = view.getUint16(offset + 14 + i * 2), start = view.getUint16(offset + 16 + count * 2 + i * 2);
          if (code < start || code > end) continue;
          const delta = view.getInt16(offset + 16 + count * 4 + i * 2), rangeAt = offset + 16 + count * 6 + i * 2;
          const range = view.getUint16(rangeAt);
          const value = range ? view.getUint16(rangeAt + range + (code - start) * 2) : code;
          return value ? (value + delta) & 65535 : 0;
        }
      }
    }
    return 0;
  };
  const units = view.getUint16(tables.head + 18), metricCount = view.getUint16(tables.hhea + 34);
  const base = [...text], displayed = [...glyphText];
  assert.equal(base.length, displayed.length);
  const ids = displayed.map(character => glyph(character.codePointAt(0)));
  assert.ok(ids.every(id => id > 0), `${name}: all fixture glyphs must exist in the actual embedded font`);
  const widths = ids.map(id => Math.round(view.getUint16(tables.hmtx + Math.min(id, metricCount - 1) * 4) / units * 1000));
  const pdf = await PDFDocument.create(), page = pdf.addPage([612, 792]), context = pdf.context;
  const fontStream = context.register(context.flateStream(font, { Length1: font.length }));
  const descriptor = context.register(context.obj({ Type: 'FontDescriptor', FontName: name, Flags: 4, FontBBox: [-1000, -400, 3000, 2000],
    ItalicAngle: 0, Ascent: 1000, Descent: -300, CapHeight: 700, StemV: 80, FontFile2: fontStream }));
  const map = Buffer.alloc((ids.length + 1) * 2);
  ids.forEach((id, index) => map.writeUInt16BE(id, (index + 1) * 2));
  const cid = context.register(context.obj({ Type: 'Font', Subtype: 'CIDFontType2', BaseFont: name,
    CIDSystemInfo: { Registry: PDFString.of('Adobe'), Ordering: PDFString.of('Identity'), Supplement: 0 },
    FontDescriptor: descriptor, DW: 1000, W: [1, widths], CIDToGIDMap: context.register(context.flateStream(map)) }));
  const hex = value => value.toString(16).padStart(4, '0');
  const unicode = `/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def /CMapName /Fixture def /CMapType 2 def 1 begincodespacerange <0000> <ffff> endcodespacerange ${base.length} beginbfchar ${base.map((character, index) => `<${hex(index + 1)}> <${hex(character.codePointAt(0))}>`).join(' ')} endbfchar endcmap CMapName currentdict /CMap defineresource pop end end`;
  const reference = context.register(context.obj({ Type: 'Font', Subtype: 'Type0', BaseFont: name, Encoding: 'Identity-H',
    DescendantFonts: [cid], ToUnicode: context.register(context.flateStream(unicode)) }));
  const resource = page.node.newFontDictionary('FixtureFont', reference);
  page.pushOperators(beginText(), setFontAndSize(resource, 24), moveText(60, 700),
    showText(PDFHexString.of(base.map((_, index) => hex(index + 1)).join(''))), endText());
  await save(`${name}.pdf`, pdf);
}
// Glyph order is visual RTL; ToUnicode retains base Urdu characters for extraction.
await unicodeFixture('urdu-text', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  [...'اردو زبان'].reverse().join(''), [...'اردو زﺑﺎن'].reverse().join(''));
try { await unicodeFixture('japanese-text', '/tmp/clickpdf-test-japanese.ttf', '日本語の文章'); }
catch (error) { console.warn(`Japanese fixture not generated: ${error.message}`); }
console.log(`PDF fixtures: ${directory}`);
