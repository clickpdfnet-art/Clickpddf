import JSZip from 'jszip';
import {
  compressPdfFile,
  rotatePdfFile,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  sanitizePdfMetadata,
  inspectPdf,
  countPdfPages,
  downloadBlob,
} from './pdfEngine';
import { encryptPdfWithWebCrypto } from './cryptoEngine';
import {
  convertPdfToWordDocx,
  convertPdfToExcelXlsx,
  convertPdfToPowerPointPptx,
  convertWordToPdf,
  convertExcelToPdf,
  convertPowerPointToPdf,
} from './officeConverters';
import {
  executeConcurrentBatch,
  explicitMemoryCleanup,
  readSafeArrayBuffer,
  yieldToMainThread,
  formatMemoryErrorMessage,
} from './memoryManager';

export type BatchToolAction =
  | 'compress'
  | 'rotate-90'
  | 'rotate-180'
  | 'rotate-270'
  | 'watermark'
  | 'page-numbers'
  | 'sanitize'
  | 'protect'
  | 'analyze'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-powerpoint'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'powerpoint-to-pdf';

export interface BatchToolOptionConfig {
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  watermarkSize?: number;
  watermarkColor?: string;
  pageNumberPosition?: 'bottom-center' | 'bottom-right' | 'top-right' | 'top-center';
  pageNumberFormat?: 'Page {n} of {total}' | '{n} / {total}' | '{n}';
  pageNumberStart?: number;
  protectPassword?: string;
  protectHint?: string;
}

export type BatchItemStatus = 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  progress: number; // 0 to 100
  stepDescription: string;
  resultData?: Uint8Array;
  outputFileName?: string;
  originalSize: number;
  outputSize?: number;
  savingsPercent?: number;
  errorMessage?: string;
  durationMs?: number;
  pageCount?: number;
}

/**
 * Executes a specific tool action against an individual file with real-time progress callback
 * and guaranteed local variable memory release.
 */
export async function processBatchSingleFile(
  file: File,
  action: BatchToolAction,
  options: BatchToolOptionConfig,
  onProgress: (percent: number, stepText: string) => void
): Promise<{ data: Uint8Array; outputName: string; details?: string; savingsPercent?: number; pageCount?: number }> {
  onProgress(10, 'Initializing document reader...');
  await yieldToMainThread(15);

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  try {
    switch (action) {
      case 'compress': {
        onProgress(30, 'Analyzing PDF streams...');
        const res = await compressPdfFile(file, {
          onProgress: (_c, _t, text) => onProgress(60, text)
        });
        onProgress(95, 'Optimizing output buffer...');
        const savedPercent = Math.max(0, Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100));
        return {
          data: res.data,
          outputName: `${baseName}_compressed.pdf`,
          savingsPercent: savedPercent,
          details: `Saved ${savedPercent}% (${(res.newSize / 1024).toFixed(1)} KB)`
        };
      }

      case 'rotate-90':
      case 'rotate-180':
      case 'rotate-270': {
        const deg = action === 'rotate-90' ? 90 : action === 'rotate-180' ? 180 : 270;
        onProgress(40, `Calculating ${deg}° page rotations...`);
        const resData = await rotatePdfFile(file, deg);
        onProgress(95, 'Finalizing rotated PDF...');
        return {
          data: resData,
          outputName: `${baseName}_rotated_${deg}deg.pdf`,
          details: `Rotated all pages ${deg}° clockwise`
        };
      }

      case 'watermark': {
        const text = options.watermarkText?.trim() || 'CONFIDENTIAL';
        onProgress(40, `Stamping watermark "${text}"...`);
        const resData = await addWatermarkToPdf(file, text, {
          opacity: options.watermarkOpacity ?? 0.25,
          size: options.watermarkSize ?? 48,
          angle: options.watermarkAngle ?? 45,
          colorHex: options.watermarkColor ?? '#EF4444'
        });
        onProgress(95, 'Finalizing watermarked PDF...');
        return {
          data: resData,
          outputName: `${baseName}_watermarked.pdf`,
          details: `Stamped with "${text}"`
        };
      }

      case 'page-numbers': {
        onProgress(40, 'Inserting pagination badges...');
        const resData = await addPageNumbersToPdf(file, {
          position: options.pageNumberPosition || 'bottom-center',
          format: options.pageNumberFormat || 'Page {n} of {total}',
          startAt: options.pageNumberStart || 1,
          fontSize: 10
        });
        onProgress(95, 'Writing paginated document...');
        return {
          data: resData,
          outputName: `${baseName}_numbered.pdf`,
          details: `Page numbers inserted (${options.pageNumberPosition || 'bottom-center'})`
        };
      }

      case 'sanitize': {
        onProgress(45, 'Scrubbing hidden metadata & timestamps...');
        const resData = await sanitizePdfMetadata(file);
        onProgress(95, 'Finalizing sanitized PDF...');
        return {
          data: resData,
          outputName: `${baseName}_sanitized.pdf`,
          details: 'Metadata & identifiers purged for total privacy'
        };
      }

      case 'protect': {
        if (!options.protectPassword || options.protectPassword.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }
        onProgress(25, 'Deriving PBKDF2 encryption key...');
        const arrayBuf = await readSafeArrayBuffer(file);
        const fBytes = new Uint8Array(arrayBuf);
        onProgress(60, 'Encrypting binary stream with AES-256-GCM...');
        const encRes = await encryptPdfWithWebCrypto(fBytes, options.protectPassword, {
          fileName: file.name,
          hint: options.protectHint || undefined
        });
        onProgress(95, 'Finalizing crypto container...');
        return {
          data: encRes.protectedPdfBytes,
          outputName: encRes.fileName || `${baseName}.protected.pdf`,
          details: 'AES-256-GCM Web Crypto Protected'
        };
      }

      case 'analyze': {
        onProgress(40, 'Measuring pages and dimensions...');
        const [info, analysis] = await Promise.all([
          inspectPdf(file),
          countPdfPages(file)
        ]);
        onProgress(85, 'Generating JSON summary report...');
        const report = {
          fileName: file.name,
          fileSizeBytes: file.size,
          totalPages: analysis.totalPages,
          portraitPages: analysis.portraitCount,
          landscapePages: analysis.landscapeCount,
          primaryPaperFormat: analysis.primaryPaperFormat,
          title: info.title,
          processedAt: new Date().toISOString()
        };
        const jsonBytes = new TextEncoder().encode(JSON.stringify(report, null, 2));
        return {
          data: jsonBytes,
          outputName: `${baseName}_analysis.json`,
          pageCount: analysis.totalPages,
          details: `${analysis.totalPages} pages (${analysis.primaryPaperFormat})`
        };
      }

      case 'pdf-to-word': {
        onProgress(30, 'Extracting document layout and typography...');
        const wordRes = await convertPdfToWordDocx(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: wordRes.data,
          outputName: wordRes.fileName,
          details: wordRes.details
        };
      }

      case 'pdf-to-excel': {
        onProgress(30, 'Scanning text coordinates into spreadsheet grids...');
        const xlsxRes = await convertPdfToExcelXlsx(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: xlsxRes.data,
          outputName: xlsxRes.fileName,
          details: xlsxRes.details
        };
      }

      case 'pdf-to-powerpoint': {
        onProgress(30, 'Converting slides to PowerPoint presentation...');
        const pptxRes = await convertPdfToPowerPointPptx(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: pptxRes.data,
          outputName: pptxRes.fileName,
          details: pptxRes.details
        };
      }

      case 'word-to-pdf': {
        onProgress(30, 'Parsing Word DOCX document streams...');
        const docxRes = await convertWordToPdf(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: docxRes.data,
          outputName: docxRes.fileName,
          details: docxRes.details
        };
      }

      case 'excel-to-pdf': {
        onProgress(30, 'Converting spreadsheet sheets to PDF...');
        const xlsxPdfRes = await convertExcelToPdf(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: xlsxPdfRes.data,
          outputName: xlsxPdfRes.fileName,
          details: xlsxPdfRes.details
        };
      }

      case 'powerpoint-to-pdf': {
        onProgress(30, 'Converting PowerPoint slides to PDF vector...');
        const pptPdfRes = await convertPowerPointToPdf(file, (_curr, _tot, txt) => onProgress(65, txt));
        return {
          data: pptPdfRes.data,
          outputName: pptPdfRes.fileName,
          details: pptPdfRes.details
        };
      }

      default:
        throw new Error(`Unsupported batch tool action: ${action}`);
    }
  } catch (err) {
    throw new Error(formatMemoryErrorMessage(err, file.name));
  }
}

/**
 * Packages all completed batch result items into a single ZIP archive for 1-click download.
 */
export async function downloadAllBatchResultsAsZip(
  items: BatchItem[],
  zipFilename = 'clickpdf_batch_results.zip'
): Promise<void> {
  const completedItems = items.filter(i => i.status === 'completed' && i.resultData);
  if (completedItems.length === 0) {
    throw new Error('No completed files available to package.');
  }

  const zip = new JSZip();

  // Keep track of names to avoid collisions inside ZIP
  const usedNames = new Set<string>();

  completedItems.forEach(item => {
    let name = item.outputFileName || `${item.file.name.replace(/\.[^/.]+$/, '')}_processed.pdf`;
    if (usedNames.has(name.toLowerCase())) {
      const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
      const base = name.replace(/\.[^/.]+$/, '');
      let counter = 2;
      while (usedNames.has(`${base}_(${counter})${ext}`.toLowerCase())) {
        counter++;
      }
      name = `${base}_(${counter})${ext}`;
    }
    usedNames.add(name.toLowerCase());

    if (item.resultData) {
      zip.file(name, item.resultData);
    }
  });

  const zipBlob = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  downloadBlob(zipBlob, zipFilename, 'application/zip');
}
