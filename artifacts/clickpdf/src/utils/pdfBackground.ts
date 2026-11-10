/**
 * File objects are cloned as file references, not converted to giant main-thread
 * buffers. Final bytes are transferred (not copied) back from the worker.
 */
export class PdfBackgroundCancelledError extends Error {
  constructor() {
    super('PDF processing was cancelled.');
    this.name = 'AbortError';
  }
}

export function runPdfBackground(
  operation: 'merge' | 'optimize' | 'repair' | 'crop',
  files: File[],
  onProgress?: (current: number, total: number) => void,
  options?: { marginPercent?: number },
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (signal?.aborted) return Promise.reject(new PdfBackgroundCancelledError());

  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/pdfOperations.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      reject(error);
      return;
    }

    let settled = false;
    let terminated = false;

    const terminateOnce = () => {
      if (terminated) return;
      terminated = true;
      worker.terminate();
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
    };

    const settle = (complete: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        terminateOnce();
      } finally {
        complete();
      }
    };

    const rejectWithError = (error: Error) => settle(() => reject(error));
    const fail = (message: string) => rejectWithError(new Error(message));
    const handleAbort = () => rejectWithError(new PdfBackgroundCancelledError());

    signal?.addEventListener('abort', handleAbort, { once: true });
    if (signal?.aborted) {
      handleAbort();
      return;
    }

    worker.onmessage = (event) => {
      if (settled) return;
      const message = event.data;
      if (message?.type === 'progress') {
        try {
          onProgress?.(message.current, message.total);
        } catch (error) {
          rejectWithError(error instanceof Error ? error : new Error(String(error)));
        }
      } else if (message?.type === 'error') {
        const error = new Error(message.message || 'Background PDF processing failed.');
        if (operation === 'merge' && typeof message.mergePdfErrorCode === 'string') {
          Object.assign(error, {
            mergePdfErrorCode: message.mergePdfErrorCode,
            fileName: message.fileName,
          });
        }
        rejectWithError(error);
      } else if (message?.type === 'result') {
        settle(() => resolve(message.data));
      }
    };
    worker.onerror = (event) => {
      if (settled) return;
      event.preventDefault();
      fail(operation === 'merge'
        ? 'The selected PDFs could not be combined in the background. Your files are still available; check that each PDF is readable and try again.'
        : event.message || 'Background PDF processing failed. Your selected files have been kept; available memory may be insufficient.');
    };
    worker.onmessageerror = () => {
      if (!settled) fail('Could not receive background PDF output. Your selected files have been kept.');
    };

    try {
      worker.postMessage({ operation, files, ...options });
    } catch (error) {
      rejectWithError(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
