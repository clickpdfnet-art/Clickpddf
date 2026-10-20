import { PDFDocument } from 'pdf-lib';

type Request = { operation: 'merge' | 'optimize' | 'repair'; files: File[] };

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const { operation, files } = event.data;
    if (operation === 'merge') {
      const output = await PDFDocument.create();
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        try {
          const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
          const indices = source.getPageIndices();
          // Bound transient copied-page arrays and yield between chunks.
          for (let offset = 0; offset < indices.length; offset += 25) {
            const pages = await output.copyPages(source, indices.slice(offset, offset + 25));
            for (const page of pages) output.addPage(page);
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        } catch (error) {
          throw new Error(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
        self.postMessage({ type: 'progress', current: index + 1, total: files.length });
      }
      self.postMessage({ type: 'progress', current: files.length, total: files.length, saving: true });
      const data = await output.save({ useObjectStreams: true, objectsPerTick: 25 });
      self.postMessage({ type: 'result', data }, { transfer: [data.buffer] });
    } else {
      const source = await PDFDocument.load(await files[0].arrayBuffer(), {
        ignoreEncryption: false, throwOnInvalidObject: operation !== 'repair',
      });
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
