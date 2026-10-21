import {
  Document, Packer, Paragraph, TextRun, Textbox, Table, TableRow, TableCell, ExternalHyperlink, ImageRun,
  AlignmentType, BorderStyle, HeightRule, HeadingLevel, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  PageOrientation, SectionType, TableAnchorType, TextWrappingType, WidthType, LevelFormat, LineRuleType,
  type ILevelsOptions
} from 'docx';
import JSZip from 'jszip';
import { emus, findRuledTables, isRtlText, lineCells, twips } from './pdfWordGeometry';
import type { PdfWordOptions, PdfWordReport, WordLine, WordPage, WordSpan } from './pdfWordTypes';
import { wordAbort } from './pdfWordRuntimeChecks';

function spanRuns(span: WordSpan) {
  const pieces = span.text.split(/([\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]+)/u).filter(Boolean);
  const runs = pieces.map(text => new TextRun({
    text, font: { ascii: span.font, hAnsi: span.font, eastAsia: span.font, cs: span.font },
    size: Math.max(2, Math.round(span.size * 2)), sizeComplexScript: Math.max(2, Math.round(span.size * 2)),
    color: span.color, bold: span.bold, boldComplexScript: span.bold,
    italics: span.italic, italicsComplexScript: span.italic, rightToLeft: isRtlText(text)
  }));
  return span.link ? [new ExternalHyperlink({ link: span.link, children: runs })] : runs;
}
function lineRuns(spans: WordSpan[]) {
  return spans.flatMap((span, index) => {
    const previous = spans[index - 1];
    const needsSpace = previous && !/\s$/.test(previous.text) && !/^\s/.test(span.text) &&
      (span.rtl || span.x - previous.x - previous.width > span.size * .12);
    return [...(needsSpace ? [new TextRun({ text: ' ', size: Math.round(span.size * 2) })] : []), ...spanRuns(span)];
  });
}
const pt = (number: number) => `${Math.max(0, number).toFixed(2)}pt` as `${number}pt`;
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

/** Produce real OOXML paragraphs, tables, positioned text and independently placed PNG assets. */
export async function buildAdvancedWord(pages: WordPage[], options: PdfWordOptions, title: string, signal?: AbortSignal): Promise<{ data: Uint8Array; report: PdfWordReport }> {
  const reports: PdfWordReport['pages'] = [];
  const numbering: { reference: string; levels: ILevelsOptions[] }[] = [];
  const sections: any[] = [];
  for (const page of pages) {
    wordAbort(signal);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const layout = options.mode === 'layout';
    const raster = page.artwork.some(image => image.role === 'page-image');
    const marginLeft = layout || raster ? 0 : Math.max(0, Math.min(...page.lines.map(line => line.x), 36));
    const marginTop = layout || raster ? 0 : Math.max(0, Math.min(...page.lines.map(line => line.y), 36));
    const ruledTables = raster ? [] : findRuledTables(page.lines, page.ruled);
    const columnModels = raster || layout || page.ruled ? [] : findRuledTables(page.lines, true).filter(model =>
      model.cells.length >= 3 && model.cells[0].some((cell, index, cells) =>
        index > 0 && cell[0].x - cells[index - 1].at(-1)!.x - cells[index - 1].at(-1)!.width > 48));
    const tableModels = [...ruledTables, ...columnModels];
    const tableLines = new Set(tableModels.flatMap(table => Array.from({ length: table.end - table.start + 1 }, (_, index) => table.start + index)));
    const children: (Paragraph | Table)[] = [];
    const floating: (ImageRun | Textbox)[] = page.artwork.map((image, index) => new ImageRun({
      type: 'png', data: image.data, transformation: { width: image.width * 96 / 72, height: image.height * 96 / 72 },
      altText: { title: image.role === 'image' ? 'PDF image / logo' : image.role === 'page-image' ? 'Non-editable page image' : 'PDF non-text artwork', description: `Source page ${page.number}, asset ${index + 1}`, name: `Page ${page.number} artwork ${index + 1}` },
      floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: emus(image.x) },
        verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: emus(image.y) },
        behindDocument: image.role !== 'image' || layout, allowOverlap: true,
        wrap: { type: layout || image.role !== 'image' ? TextWrappingType.NONE : TextWrappingType.SQUARE }
      }
    }));
    const makeTable = (model: typeof tableModels[number]) => {
      const first = page.lines[model.start], last = page.lines[model.end];
      const starts = model.cells[0].map(cell => cell[0].x);
      const right = model.cells.flatMap(row => row.flatMap(cell => cell.map(span => span.x + span.width)))
        .reduce((maximum, value) => Math.max(maximum, value), 0) + 6;
      const widths = starts.map((x, index) => twips((starts[index + 1] ?? right) - x));
      return new Table({
        width: { size: widths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA }, columnWidths: widths,
        ...(layout ? { float: { horizontalAnchor: TableAnchorType.PAGE, verticalAnchor: TableAnchorType.PAGE,
          absoluteHorizontalPosition: twips(first.x), absoluteVerticalPosition: twips(first.y) } } : {}),
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
        rows: model.cells.map((cells, rowIndex) => new TableRow({
          cantSplit: true,
          height: { value: twips(rowIndex + model.start < model.end ? page.lines[rowIndex + model.start + 1].y - page.lines[rowIndex + model.start].y : last.height * 1.15), rule: HeightRule.ATLEAST },
          children: cells.map((cell, column) => new TableCell({
            width: { size: widths[column], type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({ children: lineRuns(cell), bidirectional: cell.some(span => span.rtl),
              spacing: { before: 0, after: 0 }, alignment: cell.some(span => span.rtl) ? AlignmentType.RIGHT : AlignmentType.LEFT })]
          }))
        }))
      });
    };
    if (layout && !raster) {
      // One zero-flow anchor per source page: absolute boxes cannot add spurious body pages.
      for (const [index, line] of page.lines.entries()) {
        if (tableLines.has(index)) continue;
        for (const cell of lineCells(line)) {
          const left = Math.min(...cell.map(span => span.x));
          const right = Math.max(...cell.map(span => span.x + span.width));
          floating.push(new Textbox({
          // docx 9.12 types these as ParagraphChild[], although OOXML and its own
          // documentation require a paragraph inside w:txbxContent.
          children: [new Paragraph({
            children: lineRuns(line.rtl ? [...cell].reverse() : cell), bidirectional: line.rtl,
            alignment: line.rtl ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { before: 0, after: 0 }
          }) as unknown as TextRun],
          style: { position: 'absolute', left: pt(left), top: pt(line.y),
            width: pt(Math.min(page.width - left, right - left + 4)), height: pt(line.height * 1.4),
            positionHorizontalRelative: 'page', positionVerticalRelative: 'page', wrapStyle: 'none' }
        }));
        }
      }
      children.push(new Paragraph({ children: floating, spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
      children.push(...tableModels.map(makeTable));
    } else {
      if (floating.length) children.push(new Paragraph({ children: floating, spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
      let previousBottom = marginTop;
      const bodySizes = page.lines.flatMap(line => line.spans.map(span => span.size)).sort((a, b) => a - b);
      const bodySize = bodySizes[Math.floor(bodySizes.length / 2)] || 12;
      let listReference = '', nextListNumber = -1;
      for (const [index, line] of page.lines.entries()) {
        const table = tableModels.find(model => model.start === index);
        if (table) { children.push(makeTable(table)); previousBottom = page.lines[table.end].y + page.lines[table.end].height; continue; }
        if (tableLines.has(index)) continue;
        const text = line.spans.map(span => span.text).join(' ');
        const isHeading = line.height >= bodySize * 1.3 && text.length < 160;
        const prefix = line.spans[0]?.text.match(/^(\d{1,3})([.)])(?:\s+|$)/);
        const bullet = line.spans[0]?.text.match(/^[•◦▪●]\s*/);
        const contentSpans = prefix || bullet ? [
          { ...line.spans[0], text: line.spans[0].text.slice((prefix || bullet)![0].length) }, ...line.spans.slice(1)
        ].filter(span => span.text) : line.spans;
        if (prefix) {
          const value = Number(prefix[1]);
          if (!listReference || value !== nextListNumber) {
            listReference = `pdf-list-${page.number}-${index}`;
            numbering.push({ reference: listReference, levels: [{
              level: 0, format: LevelFormat.DECIMAL, text: `%1${prefix[2]}`, start: value,
              alignment: line.rtl ? AlignmentType.RIGHT : AlignmentType.LEFT
            }] });
          }
          nextListNumber = value + 1;
        } else { listReference = ''; nextListNumber = -1; }
        children.push(new Paragraph({
          children: lineRuns(contentSpans), bidirectional: line.rtl,
          ...(prefix ? { numbering: { reference: listReference, level: 0 } } : bullet ? { bullet: { level: 0 } } : {}),
          ...(isHeading ? { heading: line.height >= bodySize * 1.8 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 } : {}),
          alignment: line.rtl ? AlignmentType.RIGHT : Math.abs(line.x + line.width / 2 - page.width / 2) < 10 ? AlignmentType.CENTER : AlignmentType.LEFT,
          indent: { left: twips(Math.max(0, line.x - marginLeft) + (prefix || bullet ? line.height * 1.4 : 0)),
            ...(prefix || bullet ? { hanging: twips(line.height * 1.4) } : {}) },
          spacing: { before: twips(Math.max(0, line.y - previousBottom)), after: 0, line: twips(line.height), lineRule: LineRuleType.AT_LEAST }
        }));
        previousBottom = line.y + line.height;
      }
    }
    // Word requires at least one paragraph and a paragraph after a final table.
    if (!children.length || children.at(-1) instanceof Table) children.push(new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
    const warnings = [...page.warnings];
    if (tableModels.length) warnings.push('Ruled tables are reconstructed as editable Word cells with estimated column widths; merged cells, exact padding and row heights need review.');
    if (columnModels.length) warnings.push('Aligned multi-column blocks use borderless editable Word cells; paragraph flow between columns needs review.');
    if (layout && page.lines.length) warnings.push('Positioned editable text uses Word text boxes. Word, LibreOffice and Google Docs may lay out these boxes differently; source font metrics can cause reflow.');
    if (!layout && !raster) warnings.push('Editable paragraphs may reflow. Original headers, footers and column text are retained in page order, not inferred as repeating Word header/footer fields.');
    reports.push({ page: page.number, width: page.width, height: page.height, textLines: page.lines.length,
      images: page.artwork.filter(asset => asset.role === 'image').length, artworkLayers: page.artwork.filter(asset => asset.role === 'artwork').length,
      tables: ruledTables.length, ocr: page.ocr, rasterPage: raster, warnings, language: page.language });
    sections.push({
      properties: { type: SectionType.NEXT_PAGE, page: {
        // docx swaps these dimensions for landscape itself.
        size: { width: twips(Math.min(page.width, page.height)), height: twips(Math.max(page.width, page.height)),
          orientation: page.width > page.height ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
        margin: { top: twips(marginTop), left: twips(marginLeft), right: 0, bottom: 0, header: 0, footer: 0 }
     } }, children
    } as (typeof sections)[number]);
  }
  wordAbort(signal);
  const doc = new Document({ creator: 'ClickPDF', title, description: 'Client-side PDF to Word reconstruction; inspect the conversion quality report.',
    numbering: { config: numbering }, sections });
  const packed = await Packer.toArrayBuffer(doc);
  wordAbort(signal);
  const zip = await JSZip.loadAsync(packed);
  wordAbort(signal);
  const xml = await zip.file('word/document.xml')!.async('string');
  // Word's default textbox inset/border would displace every positioned PDF line.
  zip.file('word/document.xml', xml.replace(/<v:shape\b([^>]*)>/g, (_, attributes: string) =>
    `<v:shape${attributes.replace(/\s(?:filled|stroked)="[^"]*"/g, '')} filled="f" stroked="f">`)
    .replace(/<v:textbox\b([^>]*)>/g, (_, attributes: string) =>
      `<v:textbox${attributes.replace(/\sinset="[^"]*"/g, '')} inset="0,0,0,0">`));
  const report: PdfWordReport = { mode: options.mode, pages: reports,
    warnings: ['No pixel-perfect fidelity claim: PDF and Word use different layout engines.', 'Embedded PDF fonts are not embedded into DOCX; font substitutions depend on the receiving device.'],
    fonts: [...new Set(pages.flatMap(page => page.lines.flatMap(line => line.spans.map(span => span.font))))],
    fallbackPages: reports.filter(page => page.rasterPage).map(page => page.page) };
  zip.file('clickpdf/conversion-report.json', JSON.stringify(report, null, 2));
  const contentTypes = await zip.file('[Content_Types].xml')!.async('string');
  zip.file('[Content_Types].xml', contentTypes.replace('</Types>', '<Default Extension="json" ContentType="application/json"/></Types>'));
  const data = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  wordAbort(signal);
  return { data, report };
}
