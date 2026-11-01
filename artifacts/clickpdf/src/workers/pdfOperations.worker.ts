import { PDFDocument } from 'pdf-lib';
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
      const output = await PDFDocument.create();
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        try {
          const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
          const indices = source.getPageIndices();
          // One copier per source preserves shared image/font references. Calling
          // copyPages for separate chunks duplicates shared resources in each chunk.
          const pages = await output.copyPages(source, indices);
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            output.addPage(pages[pageIndex]);
            if (pageIndex % 25 === 24) await new Promise((resolve) => setTimeout(resolve, 0));
          }
        } catch (error) {
          throw new Error(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
        self.postMessage({ type: 'progress', current: index + 1, total: files.length });
      }
      self.postMessage({ type: 'progress', current: files.length, total: files.length, saving: true });
      const data = await output.save({ useObjectStreams: true, objectsPerTick: 25 });
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
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
