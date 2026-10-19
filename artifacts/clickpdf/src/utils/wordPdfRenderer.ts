import { PDFDocument } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const SCALE = 2;
const MARGIN = 52;
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN;
const FONT_FAMILY = 'Arial, "Noto Naskh Arabic", "Noto Nastaliq Urdu", sans-serif';

function isRtl(text: string): boolean {
  return /[\u0590-\u08ff]/.test(text);
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const result: string[] = [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  let line = '';

  const pushLongWord = (word: string) => {
    let part = '';
    for (const character of Array.from(word)) {
      const candidate = part + character;
      if (part && context.measureText(candidate).width > maxWidth) {
        result.push(part);
        part = character;
      } else {
        part = candidate;
      }
    }
    line = part;
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) result.push(line);
    line = '';
    if (context.measureText(word).width > maxWidth) pushLongWord(word);
    else line = word;
  }

  if (line) result.push(line);
  return result;
}

function getElementText(element: Element): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  return (clone.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

async function loadEmbeddedImage(src: string): Promise<HTMLImageElement | null> {
  if (!src.startsWith('data:image/')) return null;
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
    return image;
  } catch {
    return null;
  }
}

/**
 * Render Mammoth's safe, locally-generated Word HTML into crisp A4 PDF pages.
 * Browser canvas rendering handles right-to-left scripts that PDF base fonts cannot encode.
 */
export async function renderWordHtmlToPdf(
  html: string,
  documentTitle: string,
  onProgress?: (message: string) => void
): Promise<{ data: Uint8Array; pageCount: number }> {
  const pdf = await PDFDocument.create();
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(PAGE_WIDTH * SCALE);
  canvas.height = Math.ceil(PAGE_HEIGHT * SCALE);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('This browser could not create a canvas for Word to PDF conversion.');

  let cursorY = MARGIN;
  let pageNumber = 1;
  let hasPageContent = false;

  const resetCanvas = () => {
    context.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    cursorY = MARGIN;
    hasPageContent = false;
  };

  const flushPage = async () => {
    if (!hasPageContent) return;
    context.save();
    context.font = `9pt ${FONT_FAMILY}`;
    context.fillStyle = '#64748b';
    context.textAlign = 'center';
    context.direction = 'ltr';
    context.fillText(String(pageNumber), PAGE_WIDTH / 2, PAGE_HEIGHT - 24);
    context.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const binary = atob(encoded);
    const imageBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);
    const image = await pdf.embedJpg(imageBytes);
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

    pageNumber++;
    resetCanvas();
  };

  const startNextPage = async () => {
    await flushPage();
  };

  const drawParagraph = async (
    text: string,
    options: { size?: number; bold?: boolean; indent?: number; color?: string; spacingAfter?: number } = {}
  ) => {
    const paragraph = text.trim();
    if (!paragraph) return;

    const size = options.size ?? 11;
    const indent = options.indent ?? 0;
    const rtl = isRtl(paragraph);
    const lineHeight = Math.max(14, size * 1.45);
    const width = PAGE_WIDTH - MARGIN * 2 - indent;
    context.font = `${options.bold ? '700 ' : ''}${size}pt ${FONT_FAMILY}`;
    context.fillStyle = options.color ?? '#1e293b';
    context.direction = rtl ? 'rtl' : 'ltr';
    context.textAlign = rtl ? 'right' : 'left';

    for (const paragraphLine of paragraph.split(/\r?\n/)) {
      const lines = wrapCanvasText(context, paragraphLine, width);
      for (const line of lines) {
        if (cursorY + lineHeight > CONTENT_BOTTOM) await startNextPage();
        const x = rtl ? PAGE_WIDTH - MARGIN - indent : MARGIN + indent;
        context.fillText(line, x, cursorY);
        cursorY += lineHeight;
        hasPageContent = true;
      }
    }

    cursorY += options.spacingAfter ?? 5;
  };

  const drawImage = async (src: string, alt: string) => {
    const image = await loadEmbeddedImage(src);
    if (!image) {
      if (alt) await drawParagraph(`[Image: ${alt}]`, { size: 9, color: '#64748b' });
      return;
    }

    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const maxHeight = PAGE_HEIGHT - MARGIN * 2;
    const factor = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * factor;
    const height = image.height * factor;
    if (cursorY + height > CONTENT_BOTTOM) await startNextPage();
    context.drawImage(image, MARGIN, cursorY, width, height);
    cursorY += height + 10;
    hasPageContent = true;
  };

  resetCanvas();
  onProgress?.('Laying out the Word document on A4 pages...');
  await drawParagraph(documentTitle, { size: 19, bold: true, color: '#172554', spacingAfter: 18 });

  const elements = Array.from(parsed.body.children);
  if (elements.length === 0 && parsed.body.textContent?.trim()) {
    await drawParagraph(parsed.body.textContent);
  }

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const tag = element.tagName.toLowerCase();
    onProgress?.(`Formatting Word content ${index + 1} of ${elements.length}...`);

    if (tag === 'table') {
      const rows = Array.from(element.querySelectorAll('tr')).map(row =>
        Array.from(row.querySelectorAll('th, td')).map(cell => getElementText(cell))
      ).filter(row => row.some(cell => cell.length > 0));
      const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 1);
      const columnWidth = (PAGE_WIDTH - MARGIN * 2) / columnCount;
      const cellFontSize = columnCount > 5 ? 8 : 9;
      const lineHeight = 12;

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const cellLines = Array.from({ length: columnCount }, (_, columnIndex) => {
          const text = row[columnIndex] || '';
          context.font = `${rowIndex === 0 ? '700 ' : ''}${cellFontSize}pt ${FONT_FAMILY}`;
          context.direction = isRtl(text) ? 'rtl' : 'ltr';
          return wrapCanvasText(context, text, Math.max(16, columnWidth - 10));
        });
        const maxLines = cellLines.reduce((max, lines) => Math.max(max, lines.length), 1);
        let lineOffset = 0;

        while (lineOffset < maxLines) {
          if (cursorY + lineHeight + 8 > CONTENT_BOTTOM) await startNextPage();
          const linesAvailable = Math.max(1, Math.floor((CONTENT_BOTTOM - cursorY - 8) / lineHeight));
          const linesThisPage = Math.min(linesAvailable, maxLines - lineOffset);
          const rowHeight = linesThisPage * lineHeight + 8;
          context.fillStyle = rowIndex === 0 ? '#e2e8f0' : (rowIndex % 2 ? '#ffffff' : '#f8fafc');
          context.fillRect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, rowHeight);
          context.strokeStyle = '#cbd5e1';
          context.lineWidth = 0.6;
          context.strokeRect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, rowHeight);

          for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const x = MARGIN + columnIndex * columnWidth;
            if (columnIndex > 0) context.beginPath(), context.moveTo(x, cursorY), context.lineTo(x, cursorY + rowHeight), context.stroke();
            const text = row[columnIndex] || '';
            context.font = `${rowIndex === 0 ? '700 ' : ''}${cellFontSize}pt ${FONT_FAMILY}`;
            context.fillStyle = '#1e293b';
            context.direction = isRtl(text) ? 'rtl' : 'ltr';
            context.textAlign = isRtl(text) ? 'right' : 'left';
            const textX = isRtl(text) ? x + columnWidth - 5 : x + 5;
            const visibleLines = cellLines[columnIndex].slice(lineOffset, lineOffset + linesThisPage);
            visibleLines.forEach((line, lineIndex) => {
              context.fillText(line, textX, cursorY + 5 + (lineIndex + 1) * lineHeight - 2);
            });
          }

          cursorY += rowHeight;
          lineOffset += linesThisPage;
          hasPageContent = true;
          if (lineOffset < maxLines) await startNextPage();
        }
      }
      cursorY += 10;
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(element.querySelectorAll(':scope > li'));
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const prefix = tag === 'ol' ? `${itemIndex + 1}. ` : '• ';
        await drawParagraph(`${prefix}${getElementText(items[itemIndex])}`, { indent: 16, spacingAfter: 3 });
      }
      cursorY += 4;
      continue;
    }

    const images = Array.from(element.querySelectorAll('img'));
    const text = getElementText(element);
    const isHeading = /^h[1-6]$/.test(tag);
    const isBold = isHeading || !!element.querySelector('strong, b');
    const headingSize = tag === 'h1' ? 17 : tag === 'h2' ? 15 : tag === 'h3' ? 13 : 12;
    await drawParagraph(text, {
      size: isHeading ? headingSize : 11,
      bold: isBold,
      spacingAfter: isHeading ? 10 : 6,
      color: isHeading ? '#172554' : '#1e293b'
    });
    for (const imageElement of images) {
      await drawImage(imageElement.getAttribute('src') || '', imageElement.getAttribute('alt') || '');
    }
  }

  await flushPage();
  if (pdf.getPageCount() === 0) {
    await drawParagraph('No readable content was found in this Word document.');
    await flushPage();
  }

  onProgress?.('Saving the finished PDF...');
  return { data: await pdf.save(), pageCount: pdf.getPageCount() };
}
