/**
 * File objects are cloned as file references, not converted to giant main-thread
 * buffers. Final bytes are transferred (not copied) back from the worker.
 */
export function runPdfBackground(
  operation: 'merge' | 'optimize' | 'repair',
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/pdfOperations.worker.ts', import.meta.url), { type: 'module' });
    const fail = (message: string) => {
      worker.terminate();
      reject(new Error(message));
    };
    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === 'progress') onProgress?.(message.current, message.total);
      else if (message.type === 'error') fail(message.message);
      else if (message.type === 'result') {
        worker.terminate();
        resolve(message.data);
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      fail(event.message || 'Background PDF processing failed. Your selected files have been kept; available memory may be insufficient.');
    };
    worker.onmessageerror = () => fail('Could not receive background PDF output. Your selected files have been kept.');
    try {
      worker.postMessage({ operation, files });
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  });
}
