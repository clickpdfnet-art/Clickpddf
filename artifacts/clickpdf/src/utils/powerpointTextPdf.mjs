import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function decodeXmlText(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export function extractPowerPointSlideLines(xmlText) {
  const paragraphs = [...xmlText.matchAll(/<(?:[\w.-]+:)?p\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?p>/g)];
  return paragraphs.flatMap((match, index) => {
    const paragraph = match[1];
    const text = [...paragraph.matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g)]
      .map((run) => decodeXmlText(run[1]))
      .join('')
      .trim();
    if (!text) return [];
    return [{
      text,
      isBold: /<(?:[\w.-]+:)?(?:rPr|defRPr)\b[^>]*\bb=["']1["']/i.test(paragraph),
      isTitle: index === 0,
    }];
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function isSupportedPowerPointFile(fileName) {
  return /\.pptx$/i.test(fileName);
}

export async function convertPptxTextToPdf(fileBytes, fileName, onProgress = () => {}) {
  if (!isSupportedPowerPointFile(fileName)) {
    throw new Error('Only .pptx files are supported. Save legacy .ppt presentations as .pptx first.');
  }

  const zip = await JSZip.loadAsync(fileBytes);
  const slideEntries = [];
  zip.forEach((relativePath, entry) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match && !entry.dir) slideEntries.push({ number: Number(match[1]), entry });
  });
  slideEntries.sort((left, right) => left.number - right.number);
  if (!slideEntries.length) {
    throw new Error('No PPTX slide files were found. Check that this is a valid .pptx presentation.');
  }

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const slides = [];

  for (let index = 0; index < slideEntries.length; index++) {
    const slide = extractPowerPointSlideLines(await slideEntries[index].entry.async('text'));
    for (const line of slide) {
      try {
        regular.encodeText(line.text);
      } catch {
        throw new Error('This presentation contains characters not supported by the built-in PDF font. No output was created.');
      }
    }
    slides.push(slide);
    onProgress(index + 1, slideEntries.length);
  }

  for (let index = 0; index < slides.length; index++) {
    const page = pdf.addPage([960, 540]);
    page.drawRectangle({ x: 0, y: 0, width: 960, height: 540, color: rgb(0.97, 0.98, 0.99) });
    page.drawRectangle({ x: 40, y: 532, width: 880, height: 4, color: rgb(0.38, 0.40, 0.95) });

    const lines = slides[index];
    const titleLine = lines[0];
    const title = titleLine?.text || `Slide ${slideEntries[index].number}`;
    try {
      bold.encodeText(title);
    } catch {
      throw new Error('This presentation contains characters not supported by the built-in PDF font. No output was created.');
    }
    page.drawText(title, {
      x: 50, y: 470, size: 22, font: bold,
      maxWidth: 860, lineHeight: 27, color: rgb(0.12, 0.16, 0.23),
    });

    let y = 415;
    for (const line of lines.slice(1).slice(0, 12)) {
      if (y < 75) break;
      page.drawCircle({ x: 56, y: y + 4, size: 3, color: rgb(0.38, 0.40, 0.95) });
      const font = line.isBold ? bold : regular;
      try {
        font.encodeText(line.text);
      } catch {
        throw new Error('This presentation contains characters not supported by the built-in PDF font. No output was created.');
      }
      const wrapped = wrapText(line.text, font, 13, 820).slice(0, 2);
      wrapped.forEach((text, lineIndex) => page.drawText(text, {
        x: 70, y: y - lineIndex * 17, size: 13, font, color: rgb(0.2, 0.25, 0.33),
      }));
      y -= Math.max(27, wrapped.length * 19);
    }
    if (lines.length <= 1) {
      page.drawText('No selectable slide text was found.', {
        x: 70, y: 415, size: 13, font: regular, color: rgb(0.45, 0.5, 0.58),
      });
    }
    page.drawText(`Text-only reconstruction • Slide ${index + 1} of ${slides.length}`, {
      x: 50, y: 25, size: 10, font: regular, color: rgb(0.58, 0.64, 0.72),
    });
  }

  const data = await pdf.save();
  const outputName = `${fileName.replace(/\.pptx$/i, '')}.pdf`;
  return {
    data,
    fileName: outputName,
    pageCount: slides.length,
    details: `Created ${slides.length} basic PDF page(s) from selectable PPTX text. Original slide images, layout, charts, speaker notes, and animations are not preserved; review the output before use.`,
  };
}
