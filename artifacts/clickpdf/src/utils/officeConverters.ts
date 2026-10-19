import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import { initPdfWorker } from './pdfWorkerSetup';
import { yieldToMainThread, readSafeArrayBuffer } from './memoryManager';

export interface OfficeConversionResult {
  data: Uint8Array;
  fileName: string;
  details: string;
  pageCount?: number;
  itemCount?: number;
}

export interface ConversionProgressCallback {
  (current: number, total: number, statusText: string): void;
}

/**
 * 1. Convert PDF to Genuine Editable Microsoft Word (.docx)
 * Extracts real text, headings, bullet points, and paragraph layout.
 */
export async function convertPdfToWordDocx(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  initPdfWorker();
  onProgress?.(0, 100, 'Loading PDF document into memory...');

  const arrayBuffer = await readSafeArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const docxElements: (Paragraph | Table)[] = [];
  let totalParagraphs = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages, `Extracting text & formatting from page ${pageNum} of ${numPages}...`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) {
      docxElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${pageNum}: No selectable text detected. If scanned, consider using OCR.]`,
              italics: true,
              color: '888888',
              size: 20
            })
          ]
        })
      );
      continue;
    }

    // Group text items by Y coordinate into distinct visual lines
    // In PDF.js transform: [scaleX, skewY, skewX, scaleY, transX, transY]
    const lineBuckets: { y: number; height: number; items: any[] }[] = [];
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 4) return yB - yA; // top to bottom
      return a.transform[4] - b.transform[4]; // left to right
    });

    for (const item of sortedItems) {
      const y = item.transform[5];
      const height = item.height || Math.abs(item.transform[0]) || 12;
      const bucket = lineBuckets.find(b => Math.abs(b.y - y) <= 4);

      if (bucket) {
        bucket.items.push(item);
      } else {
        lineBuckets.push({ y, height, items: [item] });
      }
    }

    // Sort lines from top to bottom
    lineBuckets.sort((a, b) => b.y - a.y);

    let currentParagraphRuns: TextRun[] = [];
    let isHeading = false;
    let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;

    for (let i = 0; i < lineBuckets.length; i++) {
      const line = lineBuckets[i];
      // Sort items horizontally
      line.items.sort((a, b) => a.transform[4] - b.transform[4]);

      // Combine text in line with space detection
      let lineText = '';
      let isBold = false;
      let isItalic = false;
      let maxFontSize = line.height;

      for (let j = 0; j < line.items.length; j++) {
        const it = line.items[j];
        if (j > 0) {
          const prev = line.items[j - 1];
          const gap = it.transform[4] - (prev.transform[4] + (prev.width || 0));
          if (gap > 2) lineText += ' ';
        }
        lineText += it.str;
        if (it.fontName && /bold/i.test(it.fontName)) isBold = true;
        if (it.fontName && /italic|oblique/i.test(it.fontName)) isItalic = true;
        if (it.height > maxFontSize) maxFontSize = it.height;
      }

      const trimmed = lineText.trim();
      if (!trimmed) continue;

      // Detect Headings based on font height (standard body is ~10-12pt)
      if (maxFontSize >= 18) {
        isHeading = true;
        headingLevel = HeadingLevel.HEADING_1;
      } else if (maxFontSize >= 14) {
        isHeading = true;
        headingLevel = HeadingLevel.HEADING_2;
      } else {
        isHeading = false;
      }

      // Check bullet point
      const isBullet = /^[-*•]\s+/.test(trimmed);
      const cleanText = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed;

      if (isHeading) {
        if (currentParagraphRuns.length > 0) {
          docxElements.push(new Paragraph({ children: currentParagraphRuns, spacing: { after: 120 } }));
          totalParagraphs++;
          currentParagraphRuns = [];
        }
        docxElements.push(
          new Paragraph({
            heading: headingLevel,
            children: [
              new TextRun({
                text: cleanText,
                bold: true,
                size: Math.round(maxFontSize * 2),
                color: '1E293B'
              })
            ],
            spacing: { before: 240, after: 120 }
          })
        );
        totalParagraphs++;
      } else if (isBullet) {
        if (currentParagraphRuns.length > 0) {
          docxElements.push(new Paragraph({ children: currentParagraphRuns, spacing: { after: 120 } }));
          totalParagraphs++;
          currentParagraphRuns = [];
        }
        docxElements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: cleanText,
                bold: isBold,
                italics: isItalic,
                size: Math.max(18, Math.round(maxFontSize * 1.8)),
                color: '334155'
              })
            ],
            spacing: { after: 60 }
          })
        );
        totalParagraphs++;
      } else {
        // Body text: check gap to next line to determine paragraph break
        currentParagraphRuns.push(
          new TextRun({
            text: (currentParagraphRuns.length > 0 ? ' ' : '') + cleanText,
            bold: isBold,
            italics: isItalic,
            size: Math.max(18, Math.round(maxFontSize * 1.8)),
            color: '1E293B'
          })
        );

        const nextLine = lineBuckets[i + 1];
        const isBigGap = nextLine ? (line.y - nextLine.y) > (line.height * 1.8) : true;
        if (isBigGap || i === lineBuckets.length - 1) {
          docxElements.push(new Paragraph({ children: currentParagraphRuns, spacing: { after: 140 } }));
          totalParagraphs++;
          currentParagraphRuns = [];
        }
      }
    }

    // Add visual page separator between document pages
    if (pageNum < numPages) {
      docxElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `--- Page Break (Original Page ${pageNum}) ---`,
              color: '94A3B8',
              size: 16,
              italics: true
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );
    }

    await yieldToMainThread(20);
  }

  onProgress?.(90, 100, 'Packaging editable Word (.docx) document...');

  const doc = new Document({
    creator: 'ClickPDF (clickpdf.net)',
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Generated by ClickPDF In-Browser Converter',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: docxElements.length > 0 ? docxElements : [new Paragraph({ text: 'Converted from PDF' })]
      }
    ]
  });

  const arrayBuf = await Packer.toArrayBuffer(doc);
  const docxUint8 = new Uint8Array(arrayBuf);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const outName = `${baseName}.docx`;

  onProgress?.(100, 100, 'Word conversion completed successfully!');

  return {
    data: docxUint8,
    fileName: outName,
    details: `Extracted ${totalParagraphs} formatted paragraphs across ${numPages} page(s) into editable Microsoft Word (.docx).`,
    pageCount: numPages,
    itemCount: totalParagraphs
  };
}

/**
 * 2. Convert PDF to Microsoft Excel (.xlsx)
 * Detects table grids, structured rows, and columns from text coordinates.
 */
export async function convertPdfToExcelXlsx(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  initPdfWorker();
  onProgress?.(0, 100, 'Reading PDF for tabular data extraction...');

  const arrayBuffer = await readSafeArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const wb = XLSX.utils.book_new();
  let totalRowsExtracted = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages, `Extracting tables from page ${pageNum} of ${numPages}...`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) continue;

    // Group by row using Y tolerance (~5px)
    const rowBuckets: { y: number; items: any[] }[] = [];
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      let bucket = rowBuckets.find(b => Math.abs(b.y - y) <= 5);
      if (!bucket) {
        bucket = { y, items: [] };
        rowBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort rows from top to bottom
    rowBuckets.sort((a, b) => b.y - a.y);

    const sheetRows: (string | number)[][] = [];

    for (const row of rowBuckets) {
      // Sort cells horizontally from left to right
      row.items.sort((a, b) => a.transform[4] - b.transform[4]);

      const cells: (string | number)[] = [];
      let currentCellText = '';

      for (let j = 0; j < row.items.length; j++) {
        const item = row.items[j];
        if (j > 0) {
          const prev = row.items[j - 1];
          const gap = item.transform[4] - (prev.transform[4] + (prev.width || 0));

          // If gap between text tokens is greater than 14 points, treat as separate column cell!
          if (gap > 14) {
            cells.push(formatCellValue(currentCellText));
            currentCellText = '';
          } else if (gap > 2) {
            currentCellText += ' ';
          }
        }
        currentCellText += item.str;
      }

      if (currentCellText) {
        cells.push(formatCellValue(currentCellText));
      }

      if (cells.length > 0) {
        sheetRows.push(cells);
        totalRowsExtracted++;
      }
    }

    if (sheetRows.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Auto-fit column widths
      const colWidths: { wch: number }[] = [];
      sheetRows.forEach(r => {
        r.forEach((c, cIdx) => {
          const len = String(c).length;
          colWidths[cIdx] = { wch: Math.max(colWidths[cIdx]?.wch || 10, Math.min(len + 3, 50)) };
        });
      });
      ws['!cols'] = colWidths;

      const sheetName = numPages === 1 ? 'Data' : `Page ${pageNum}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    await yieldToMainThread(20);
  }

  onProgress?.(90, 100, 'Generating Excel (.xlsx) spreadsheet...');

  // Fallback if no sheets were populated
  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No tabular data detected in PDF document']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  }

  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const outData = new Uint8Array(xlsxBuffer);
  const baseName = file.name.replace(/\.pdf$/i, '');
  const outName = `${baseName}.xlsx`;

  onProgress?.(100, 100, 'Excel spreadsheet ready for download!');

  return {
    data: outData,
    fileName: outName,
    details: `Extracted ${totalRowsExtracted} table rows across ${wb.SheetNames.length} sheet(s) into Microsoft Excel (.xlsx).`,
    pageCount: numPages,
    itemCount: totalRowsExtracted
  };
}

/**
 * 3. Convert PDF to Microsoft PowerPoint Presentation (.pptx)
 * Creates widescreen presentation slides with slide titles, body cards, and bullet points.
 */
export async function convertPdfToPowerPointPptx(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  initPdfWorker();
  onProgress?.(0, 100, 'Reading PDF pages for slide generation...');

  const arrayBuffer = await readSafeArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pptx.author = 'ClickPDF (clickpdf.net)';
  pptx.company = 'ClickPDF';
  pptx.title = file.name.replace(/\.pdf$/i, '');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages, `Composing slide ${pageNum} of ${numPages}...`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    const slide = pptx.addSlide();

    // Subtle modern background
    slide.background = { color: 'F8FAFC' };

    // Group items into lines
    const lineBuckets: { y: number; text: string; fontSize: number }[] = [];
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 4) return yB - yA;
      return a.transform[4] - b.transform[4];
    });

    for (const item of sortedItems) {
      const y = Math.round(item.transform[5]);
      const bucket = lineBuckets.find(b => Math.abs(b.y - y) <= 4);
      if (bucket) {
        bucket.text += ' ' + item.str;
        if (item.height > bucket.fontSize) bucket.fontSize = item.height;
      } else {
        lineBuckets.push({
          y,
          text: item.str,
          fontSize: item.height || 12
        });
      }
    }

    lineBuckets.sort((a, b) => b.y - a.y);
    const nonEmptyLines = lineBuckets.map(b => b.text.trim()).filter(Boolean);

    // Slide Title
    const slideTitle = nonEmptyLines[0] || `Slide ${pageNum}`;
    const bodyLines = nonEmptyLines.slice(1);

    // Add Title Bar
    slide.addText(slideTitle, {
      x: 0.8,
      y: 0.5,
      w: 8.4,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: '1E293B',
      fontFace: 'Arial'
    });

    // Add Content Container / Card
    if (bodyLines.length > 0) {
      // Create bullet point objects
      const bulletItems = bodyLines.slice(0, 10).map(line => ({
        text: line,
        options: {
          fontSize: 13,
          color: '334155',
          bullet: true,
          breakLine: true
        }
      }));

      slide.addText(bulletItems, {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.4,
        fontFace: 'Arial',
        lineSpacing: 22
      });
    } else {
      slide.addText('Document content extracted from PDF page.', {
        x: 0.8,
        y: 2.0,
        w: 8.4,
        h: 1.0,
        fontSize: 14,
        color: '64748B',
        fontFace: 'Arial'
      });
    }

    // Slide Footer
    slide.addText(`ClickPDF • Slide ${pageNum} of ${numPages}`, {
      x: 0.8,
      y: 5.1,
      w: 8.4,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      fontFace: 'Arial'
    });

    await yieldToMainThread(20);
  }

  onProgress?.(90, 100, 'Packaging presentation file (.pptx)...');

  const pptxBuffer = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;
  const baseName = file.name.replace(/\.pdf$/i, '');
  const outName = `${baseName}.pptx`;

  onProgress?.(100, 100, 'PowerPoint presentation completed!');

  return {
    data: pptxBuffer,
    fileName: outName,
    details: `Successfully transformed ${numPages} PDF page(s) into editable PowerPoint (.pptx) slides.`,
    pageCount: numPages
  };
}

/**
 * 4. Convert PowerPoint (.pptx) to PDF
 * Unzips .pptx OpenXML structure, extracts slide shapes, titles, and text, and renders onto 16:9 PDF slides.
 */
export async function convertPowerPointToPdf(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  onProgress?.(0, 100, 'Unpacking PowerPoint presentation (.pptx)...');

  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // Find all slide XML files (ppt/slides/slide1.xml, slide2.xml, ...)
  const slideEntries: { name: string; num: number; file: JSZip.JSZipObject }[] = [];

  zipContent.forEach((relativePath, zipEntry) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideEntries.push({
        name: relativePath,
        num: parseInt(match[1], 10),
        file: zipEntry
      });
    }
  });

  slideEntries.sort((a, b) => a.num - b.num);

  if (slideEntries.length === 0) {
    throw new Error('No slides found in this PowerPoint (.pptx) file. Please ensure it is a valid OpenXML presentation.');
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const totalSlides = slideEntries.length;

  for (let i = 0; i < totalSlides; i++) {
    const entry = slideEntries[i];
    onProgress?.(i + 1, totalSlides, `Rendering slide ${i + 1} of ${totalSlides} to PDF...`);

    const xmlText = await entry.file.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Extract slide text runs
    const paragraphs = Array.from(xmlDoc.getElementsByTagName('a:p'));
    const slideLines: { text: string; isBold: boolean; isTitle: boolean }[] = [];

    paragraphs.forEach((p, pIdx) => {
      const textNodes = Array.from(p.getElementsByTagName('a:t'));
      const combined = textNodes.map(t => t.textContent || '').join('').trim();
      if (combined) {
        // Detect bold in <a:rPr b="1">
        const rPr = p.getElementsByTagName('a:rPr')[0];
        const isBold = rPr ? rPr.getAttribute('b') === '1' : false;
        slideLines.push({
          text: combined,
          isBold,
          isTitle: pIdx === 0
        });
      }
    });

    // 16:9 widescreen standard PDF page: 960 x 540 points
    const page = pdfDoc.addPage([960, 540]);

    // Slide background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 960,
      height: 540,
      color: rgb(0.97, 0.98, 0.99)
    });

    // Top accent bar
    page.drawRectangle({
      x: 40,
      y: 532,
      width: 880,
      height: 4,
      color: rgb(0.38, 0.40, 0.95) // Indigo
    });

    let currentY = 470;
    const title = slideLines[0]?.text || `Slide ${entry.num}`;

    // Draw Slide Title
    page.drawText(truncateText(title, 60), {
      x: 50,
      y: currentY,
      size: 24,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.23)
    });

    currentY -= 45;

    // Draw body bullet items
    const bodyItems = slideLines.slice(1);
    if (bodyItems.length > 0) {
      for (const item of bodyItems.slice(0, 12)) {
        if (currentY < 80) break;

        // Draw bullet circle
        page.drawCircle({
          x: 56,
          y: currentY + 4,
          size: 3,
          color: rgb(0.38, 0.40, 0.95)
        });

        // Draw text with word wrapping
        const wrapped = wrapText(item.text, 80);
        wrapped.slice(0, 2).forEach((line, lineIdx) => {
          page.drawText(line, {
            x: 70,
            y: currentY - lineIdx * 16,
            size: 13,
            font: item.isBold ? fontBold : fontRegular,
            color: rgb(0.20, 0.25, 0.33)
          });
        });

        currentY -= Math.max(26, wrapped.length * 18);
      }
    } else {
      page.drawText('(Empty slide or diagram presentation)', {
        x: 70,
        y: currentY,
        size: 13,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6)
      });
    }

    // Slide Footer
    page.drawText(`ClickPDF • Slide ${i + 1} of ${totalSlides}`, {
      x: 50,
      y: 25,
      size: 10,
      font: fontRegular,
      color: rgb(0.58, 0.64, 0.72)
    });

    await yieldToMainThread(15);
  }

  onProgress?.(95, 100, 'Assembling PDF presentation...');
  const pdfBytes = await pdfDoc.save();
  const baseName = file.name.replace(/\.pptx?$/i, '');
  const outName = `${baseName}.pdf`;

  onProgress?.(100, 100, 'PowerPoint to PDF completed!');

  return {
    data: pdfBytes,
    fileName: outName,
    details: `Converted ${totalSlides} PowerPoint slide(s) into 16:9 landscape PDF pages.`,
    pageCount: totalSlides
  };
}

/**
 * 5. Convert Word (.docx) to PDF
 * Extracts structured headings, paragraphs, and lists, and paginates into standard A4 PDF document.
 */
export async function convertWordToPdf(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  onProgress?.(0, 100, 'Reading Word (.docx) document...');

  const arrayBuffer = await readSafeArrayBuffer(file);

  // Extract raw text and structure using mammoth
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = rawResult.value || '';
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Word document contains no readable text content.');
  }

  onProgress?.(30, 100, 'Typesetting text and styling pages with PDF-Lib...');

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions: 595.28 x 841.89 points
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 54;
  const MARGIN_RIGHT = 54;
  const MARGIN_TOP = 60;
  const MARGIN_BOTTOM = 60;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = PAGE_HEIGHT - MARGIN_TOP;
  let pageNumber = 1;

  const addNewPage = () => {
    // Add page footer to current page before switching
    currentPage.drawText(`Page ${pageNumber}`, {
      x: PAGE_WIDTH / 2 - 20,
      y: 30,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6)
    });

    pageNumber++;
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currentY = PAGE_HEIGHT - MARGIN_TOP;
  };

  // Header banner on first page
  const docTitle = file.name.replace(/\.docx?$/i, '');
  currentPage.drawText(truncateText(docTitle, 50), {
    x: MARGIN_LEFT,
    y: currentY,
    size: 20,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.23)
  });
  currentY -= 35;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = line.length < 60 && !line.endsWith('.') && (i === 0 || lines[i - 1]?.length === 0);
    const fontSize = isHeading ? 14 : 10.5;
    const lineHeight = isHeading ? 20 : 15;
    const font = isHeading ? fontBold : fontRegular;
    const textColor = isHeading ? rgb(0.12, 0.16, 0.23) : rgb(0.2, 0.25, 0.3);

    // Wrap line to fit content width
    const words = line.split(' ');
    let currentLineText = '';

    for (let w = 0; w < words.length; w++) {
      const testLine = currentLineText ? `${currentLineText} ${words[w]}` : words[w];
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > CONTENT_WIDTH && currentLineText) {
        if (currentY <= MARGIN_BOTTOM + lineHeight) {
          addNewPage();
        }
        currentPage.drawText(currentLineText, {
          x: MARGIN_LEFT,
          y: currentY,
          size: fontSize,
          font,
          color: textColor
        });
        currentY -= lineHeight;
        currentLineText = words[w];
      } else {
        currentLineText = testLine;
      }
    }

    if (currentLineText) {
      if (currentY <= MARGIN_BOTTOM + lineHeight) {
        addNewPage();
      }
      currentPage.drawText(currentLineText, {
        x: MARGIN_LEFT,
        y: currentY,
        size: fontSize,
        font,
        color: textColor
      });
      currentY -= lineHeight + (isHeading ? 8 : 4);
    }
  }

  // Draw footer on last page
  currentPage.drawText(`Page ${pageNumber}`, {
    x: PAGE_WIDTH / 2 - 20,
    y: 30,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6)
  });

  onProgress?.(95, 100, 'Saving PDF document...');
  const pdfBytes = await pdfDoc.save();
  const outName = `${docTitle}.pdf`;

  onProgress?.(100, 100, 'Word to PDF conversion complete!');

  return {
    data: pdfBytes,
    fileName: outName,
    details: `Converted Word document (.docx) into ${pageNumber} paginated PDF page(s).`,
    pageCount: pageNumber
  };
}

/**
 * 6. Convert Excel (.xlsx, .xls, .csv) to PDF
 * Renders worksheets as publication-quality paginated PDF tables with headers, borders, and zebra striping.
 */
export async function convertExcelToPdf(
  file: File,
  onProgress?: ConversionProgressCallback
): Promise<OfficeConversionResult> {
  onProgress?.(0, 100, 'Parsing Excel workbook (.xlsx)...');

  const arrayBuffer = await readSafeArrayBuffer(file);
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('No worksheets found in this spreadsheet file.');
  }

  onProgress?.(30, 100, 'Generating printable PDF table layout...');

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for wide table visibility: 841.89 x 595.28 points
  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;
  const TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let totalPages = 0;

  for (let sIdx = 0; sIdx < wb.SheetNames.length; sIdx++) {
    const sheetName = wb.SheetNames[sIdx];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];

    if (!rows || rows.length === 0) continue;

    onProgress?.(sIdx + 1, wb.SheetNames.length, `Formatting sheet "${sheetName}" (${rows.length} rows)...`);

    // Determine max columns
    let maxCols = 0;
    rows.forEach(r => {
      if (r.length > maxCols) maxCols = r.length;
    });

    if (maxCols === 0) continue;
    const colCount = Math.min(maxCols, 12); // clamp to 12 columns per page view
    const colWidth = TABLE_WIDTH / colCount;
    const ROW_HEIGHT = 22;

    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    totalPages++;
    let currentY = PAGE_HEIGHT - MARGIN_TOP;

    // Draw Sheet Title
    currentPage.drawText(`Sheet: ${sheetName}`, {
      x: MARGIN_LEFT,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.23)
    });
    currentY -= 28;

    const drawHeaderRow = (yPos: number) => {
      // Header background
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: yPos - 5,
        width: TABLE_WIDTH,
        height: ROW_HEIGHT,
        color: rgb(0.24, 0.27, 0.54) // Indigo header
      });

      const headerRow = rows[0] || [];
      for (let c = 0; c < colCount; c++) {
        const val = truncateText(String(headerRow[c] || `Col ${c + 1}`), 18);
        currentPage.drawText(val, {
          x: MARGIN_LEFT + c * colWidth + 6,
          y: yPos,
          size: 9.5,
          font: fontBold,
          color: rgb(1, 1, 1)
        });
      }
    };

    drawHeaderRow(currentY);
    currentY -= ROW_HEIGHT;

    // Data rows
    for (let rIdx = 1; rIdx < rows.length; rIdx++) {
      if (currentY <= MARGIN_BOTTOM + ROW_HEIGHT) {
        // Add new page and repeat header
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        totalPages++;
        currentY = PAGE_HEIGHT - MARGIN_TOP;
        drawHeaderRow(currentY);
        currentY -= ROW_HEIGHT;
      }

      const row = rows[rIdx] || [];
      const isZebra = rIdx % 2 === 0;

      // Draw row background
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: currentY - 5,
        width: TABLE_WIDTH,
        height: ROW_HEIGHT,
        color: isZebra ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1)
      });

      // Cell border bottom
      currentPage.drawLine({
        start: { x: MARGIN_LEFT, y: currentY - 5 },
        end: { x: MARGIN_LEFT + TABLE_WIDTH, y: currentY - 5 },
        thickness: 0.5,
        color: rgb(0.88, 0.91, 0.94)
      });

      for (let c = 0; c < colCount; c++) {
        const val = truncateText(String(row[c] ?? ''), 20);
        currentPage.drawText(val, {
          x: MARGIN_LEFT + c * colWidth + 6,
          y: currentY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3)
        });
      }

      currentY -= ROW_HEIGHT;
    }

    await yieldToMainThread(15);
  }

  onProgress?.(95, 100, 'Saving Excel to PDF...');
  const pdfBytes = await pdfDoc.save();
  const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
  const outName = `${baseName}.pdf`;

  onProgress?.(100, 100, 'Excel to PDF conversion complete!');

  return {
    data: pdfBytes,
    fileName: outName,
    details: `Converted ${wb.SheetNames.length} Excel worksheet(s) into ${totalPages} landscape PDF page(s).`,
    pageCount: totalPages,
    itemCount: wb.SheetNames.length
  };
}

// Helper utilities
function formatCellValue(raw: string): string | number {
  const trimmed = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && trimmed.length < 15) {
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
  }
  return trimmed;
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '...' : text;
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current += (current ? ' ' : '') + w;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}
