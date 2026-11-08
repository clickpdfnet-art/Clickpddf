import { PDFDocument } from 'pdf-lib';
import { MergePdfUserError, mergePdfDocuments } from '../utils/mergePdfDocument';
import { cropPdfMargins, repairPdfBytes } from '../utils/pdfToolOperations.mjs';

type Request = {
  operation: 'merge' | 'optimize' | 'repair' | 'crop';
  files: File[];
  marginPercent?: number;
};

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const { operation, files, marginPercent = 0 } = event.data;
    if (operation === 'merge') {
      const data = await mergePdfDocuments(
        files,
        (current, total) => self.postMessage({ type: 'progress', current, total }),
        { yieldToMainThread: (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)) },
      );
      self.postMessage({ type: 'progress', current: files.length, total: files.length, saving: true });
      self.postMessage({ type: 'result', data }, { transfer: [data.buffer] });
    } else if (operation === 'repair') {
      const data = await repairPdfBytes(new Uint8Array(await files[0].arrayBuffer()));
      self.postMessage({ type: 'result', data }, { transfer: [data.buffer] });
    } else if (operation === 'crop') {
      const data = await cropPdfMargins(
        new Uint8Array(await files[0].arrayBuffer()),
        marginPercent ?? 0,
      );
      self.postMessage({ type: 'result', data }, { transfer: [data.buffer] });
    } else {
      const source = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: false });
      if (operation === 'optimize') {
        source.setTitle('');
        source.setAuthor('');
        source.setSubject('');
        source.setKeywords([]);
        source.setProducer('ClickPDF Compression Engine');
        source.setCreator('ClickPDF');
      }
      const data = await source.save({ useObjectStreams: true, updateFieldAppearances: false, objectsPerTick: 25 });
      self.postMessage({ type: 'result', data }, { transfer: [data.buffer] });
    }
  } catch (error) {
    const mergeError = error instanceof MergePdfUserError ? error : undefined;
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      ...(mergeError ? {
        mergePdfErrorCode: mergeError.mergePdfErrorCode,
        fileName: mergeError.fileName,
      } : {}),
    });
  }
};
