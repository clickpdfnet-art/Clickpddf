import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { downloadBlob } from './pdfEngine';
import { initPdfWorker } from './pdfWorkerSetup';
import { SUPPORTED_OCR_LANGUAGES, OcrLanguageOption } from './ocrLanguages';

// Ensure worker is configured safely
initPdfWorker();

export { SUPPORTED_OCR_LANGUAGES } from './ocrLanguages';
export type { OcrLanguageOption } from './ocrLanguages';

export interface PageOcrResult {
  pageNumber: number;
  text: string;
  confidence: number;
  wordsCount: number;
  linesCount: number;
  charactersCount: number;
  thumbnailUrl: string;
  processingTimeMs: number;
}

export interface FullOcrAnalysisResult {
  fileName: string;
  language: string;
  languageName: string;
  totalPagesProcessed: number;
  totalWords: number;
  totalCharacters: number;
  averageConfidence: number;
  combinedText: string;
  pages: PageOcrResult[];
  totalDurationMs: number;
}

export interface OcrProgressStatus {
  currentPage: number;
  totalPages: number;
  stage: 'rendering_page' | 'loading_model' | 'recognizing_text' | 'completed' | 'canceled';
  pageProgressPct: number; // 0 - 100
  overallProgressPct: number; // 0 - 100
  statusMessage: string;
}

export interface OcrOptions {
  language: string;
  pageSelection: 'all' | 'first' | 'range';
  customPageRange?: string; // e.g. "1-3, 5"
  scale?: number; // 1.5, 2.0 (default), 2.5
  enhanceScannedContrast?: boolean;
}

/**
 * Parses user input like "1, 3-5, 8" into valid 1-indexed page numbers.
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          result.add(p);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        result.add(num);
      }
    }
  }

  const sorted = Array.from(result).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [1];
}

/**
 * Pre-processes canvas image pixels to dramatically improve OCR accuracy for scanned pages:
 * - Grayscale conversion
 * - Adaptive contrast stretching
 */
function enhanceCanvasForOcr(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    // First pass: Calculate min and max luminance for contrast stretching
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < len; i += 4) {
      // Perceived luminance
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const lumRange = maxLum - minLum || 1;

    // Second pass: apply contrast expansion and binarization-friendly grayscale
    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Normalize and increase contrast
      let normalized = ((lum - minLum) / lumRange) * 255;
      
      // Slight S-curve contrast boost
      if (normalized < 128) {
        normalized = Math.max(0, normalized * 0.85); // darken ink
      } else {
        normalized = Math.min(255, 128 + (normalized - 128) * 1.15); // brighten paper
      }

      data[i] = normalized;
      data[i + 1] = normalized;
      data[i + 2] = normalized;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Contrast enhancement skipped:', err);
  }
}

/**
 * Renders a specific PDF page onto an HTML canvas using pdfjs-dist.
 */
export async function renderPdfPageToCanvas(
  file: File,
  pageNumber: number,
  scale = 2.0,
  enhanceContrast = true
): Promise<{ canvas: HTMLCanvasElement; dataUrl: string; width: number; height: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context 2D not supported');
  }

  // Pure white background for crisp text recognition
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render as any)({
    canvasContext: context,
    viewport,
  }).promise;

  if (enhanceContrast) {
    enhanceCanvasForOcr(canvas);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return {
    canvas,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Runs browser-native Tesseract.js OCR across chosen PDF pages.
 */
export async function executePdfOcr(
  file: File,
  totalDocPages: number,
  options: OcrOptions,
  onProgress?: (status: OcrProgressStatus) => void,
  checkIsCancelled?: () => boolean
): Promise<FullOcrAnalysisResult> {
  const startTime = Date.now();
  const scale = options.scale || 2.0;
  const enhance = options.enhanceScannedContrast !== false;
  const langCode = options.language || 'eng';
  const langObj = SUPPORTED_OCR_LANGUAGES.find((l) => l.code === langCode) || {
    code: langCode,
    name: langCode,
  };

  // Determine pages to process
  let targetPages: number[] = [];
  if (options.pageSelection === 'first') {
    targetPages = [1];
  } else if (options.pageSelection === 'range' && options.customPageRange) {
    targetPages = parsePageRangeString(options.customPageRange, totalDocPages);
  } else {
    // 'all'
    targetPages = Array.from({ length: totalDocPages }, (_, i) => i + 1);
  }

  if (targetPages.length === 0) {
    targetPages = [1];
  }

  const pageResults: PageOcrResult[] = [];
  const totalTargetCount = targetPages.length;

  for (let idx = 0; idx < totalTargetCount; idx++) {
    if (checkIsCancelled && checkIsCancelled()) {
      throw new Error('OCR process was canceled by user.');
    }

    const pageNum = targetPages[idx];
    const pageStart = Date.now();

    // 1. Notify rendering stage
    if (onProgress) {
      const baseProgress = (idx / totalTargetCount) * 100;
      onProgress({
        currentPage: pageNum,
        totalPages: totalTargetCount,
        stage: 'rendering_page',
        pageProgressPct: 15,
        overallProgressPct: Math.round(baseProgress + 5),
        statusMessage: `Rendering Page ${pageNum} to high-resolution image...`,
      });
    }

    // 2. Render page to canvas
    const { canvas, dataUrl } = await renderPdfPageToCanvas(file, pageNum, scale, enhance);

    if (checkIsCancelled && checkIsCancelled()) {
      throw new Error('OCR process was canceled by user.');
    }

    // 3. Notify OCR recognition stage
    if (onProgress) {
      const baseProgress = (idx / totalTargetCount) * 100;
      onProgress({
        currentPage: pageNum,
        totalPages: totalTargetCount,
        stage: 'recognizing_text',
        pageProgressPct: 25,
        overallProgressPct: Math.round(baseProgress + 15),
        statusMessage: `Running Tesseract.js OCR on Page ${pageNum} (${langObj.name})...`,
      });
    }

    // 4. Run Tesseract recognition
    const ocrResponse = await Tesseract.recognize(
      canvas,
      langCode,
      {
        logger: (m: any) => {
          if (checkIsCancelled && checkIsCancelled()) return;
          if (m && typeof m.progress === 'number' && onProgress) {
            const pagePct = Math.round(m.progress * 100);
            const overall = Math.round(((idx + m.progress) / totalTargetCount) * 100);
            let msg = `Recognizing text on Page ${pageNum}...`;
            if (m.status === 'loading tesseract core') msg = 'Loading Tesseract.js WebAssembly engine...';
            else if (m.status === 'loading language traineddata') msg = `Downloading ${langObj.name} OCR trained model...`;
            else if (m.status === 'initializing tesseract') msg = 'Initializing OCR neural recognition pipeline...';
            else if (m.status === 'recognizing text') msg = `Recognizing text on Page ${pageNum} (${pagePct}%)...`;

            onProgress({
              currentPage: pageNum,
              totalPages: totalTargetCount,
              stage: 'recognizing_text',
              pageProgressPct: pagePct,
              overallProgressPct: Math.min(99, overall),
              statusMessage: msg,
            });
          }
        },
      }
    );

    if (checkIsCancelled && checkIsCancelled()) {
      throw new Error('OCR process was canceled by user.');
    }

    const recognizedText = ocrResponse.data.text.trim();
    const confidence = Math.round(ocrResponse.data.confidence || 0);

    // Compute metrics
    const words = recognizedText ? recognizedText.split(/\s+/).filter(Boolean).length : 0;
    const lines = recognizedText ? recognizedText.split('\n').filter((l) => l.trim().length > 0).length : 0;
    const characters = recognizedText.length;
    const pageDuration = Date.now() - pageStart;

    pageResults.push({
      pageNumber: pageNum,
      text: recognizedText,
      confidence,
      wordsCount: words,
      linesCount: lines,
      charactersCount: characters,
      thumbnailUrl: dataUrl,
      processingTimeMs: pageDuration,
    });
  }

  const totalWords = pageResults.reduce((acc, p) => acc + p.wordsCount, 0);
  const totalCharacters = pageResults.reduce((acc, p) => acc + p.charactersCount, 0);
  const averageConfidence =
    pageResults.length > 0
      ? Math.round(pageResults.reduce((acc, p) => acc + p.confidence, 0) / pageResults.length)
      : 0;

  const combinedText = pageResults
    .map((p) => `--- [ Page ${p.pageNumber} ] ---\n\n${p.text || '[No recognizable text detected on this scanned page]'}\n`)
    .join('\n\n');

  if (onProgress) {
    onProgress({
      currentPage: targetPages[targetPages.length - 1],
      totalPages: totalTargetCount,
      stage: 'completed',
      pageProgressPct: 100,
      overallProgressPct: 100,
      statusMessage: `Completed OCR text recognition on ${totalTargetCount} pages!`,
    });
  }

  return {
    fileName: file.name,
    language: langCode,
    languageName: langObj.name,
    totalPagesProcessed: targetPages.length,
    totalWords,
    totalCharacters,
    averageConfidence,
    combinedText,
    pages: pageResults,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Export helpers for OCR results
 */
export function downloadOcrResult(
  result: FullOcrAnalysisResult,
  format: 'txt' | 'md' | 'json'
) {
  const baseName = result.fileName.replace(/\.pdf$/i, '');
  const encoder = new TextEncoder();

  if (format === 'txt') {
    const header = `=====================================================
CLICKPDF IN-BROWSER TESSERACT.JS OCR REPORT
=====================================================
Source File:            ${result.fileName}
Language Model:         ${result.languageName} (${result.language})
Pages Processed:        ${result.totalPagesProcessed}
Total Extracted Words:  ${result.totalWords.toLocaleString()}
Total Characters:       ${result.totalCharacters.toLocaleString()}
Average Confidence:     ${result.averageConfidence}%
Processing Time:        ${(result.totalDurationMs / 1000).toFixed(1)}s
Privacy Guarantee:      100% In-Browser Execution via Tesseract.js WebAssembly
=====================================================

`;
    const fullText = header + result.combinedText;
    downloadBlob(encoder.encode(fullText), `${baseName}_ocr_extracted.txt`, 'text/plain');
  } else if (format === 'md') {
    let md = `# Scanned OCR Text Extraction: ${result.fileName}\n\n`;
    md += `> **Model:** ${result.languageName} (${result.language}) | **Pages Processed:** ${result.totalPagesProcessed} | **Words:** ${result.totalWords.toLocaleString()} | **Confidence:** ${result.averageConfidence}%\n\n`;
    md += `*Generated entirely in browser using Tesseract.js with Zero Server Uploads.*\n\n---\n\n`;

    for (const p of result.pages) {
      md += `## Page ${p.pageNumber}\n\n`;
      md += `*Confidence: ${p.confidence}% | Words: ${p.wordsCount} | Lines: ${p.linesCount}*\n\n`;
      md += `\`\`\`text\n${p.text || '[No text detected]'}\n\`\`\`\n\n---\n\n`;
    }

    downloadBlob(encoder.encode(md), `${baseName}_ocr_extracted.md`, 'text/markdown');
  } else if (format === 'json') {
    const jsonOutput = JSON.stringify(
      {
        sourceFileName: result.fileName,
        engine: 'Tesseract.js WebAssembly In-Browser',
        language: result.language,
        languageName: result.languageName,
        totalPagesProcessed: result.totalPagesProcessed,
        totalWords: result.totalWords,
        totalCharacters: result.totalCharacters,
        averageConfidence: result.averageConfidence,
        totalDurationSeconds: Number((result.totalDurationMs / 1000).toFixed(2)),
        pages: result.pages.map((p) => ({
          pageNumber: p.pageNumber,
          confidence: p.confidence,
          wordsCount: p.wordsCount,
          linesCount: p.linesCount,
          charactersCount: p.charactersCount,
          processingTimeMs: p.processingTimeMs,
          text: p.text,
        })),
        combinedText: result.combinedText,
      },
      null,
      2
    );
    downloadBlob(encoder.encode(jsonOutput), `${baseName}_ocr_analysis.json`, 'application/json');
  }
}
