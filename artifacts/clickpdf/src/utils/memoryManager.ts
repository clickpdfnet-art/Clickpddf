/**
 * Memory Management, Stream/Chunked Reading & Concurrency Limiting Architecture
 * Production-grade client-side browser execution protection against:
 * 1. Out-Of-Memory (OOM) crashes and V8 heap exhaustion
 * 2. Main-thread freezing during heavy file loads (100MB to 200MB+)
 * 3. Browser tab crashes on large file batches (15 to 50+ files)
 * 4. Dropzone / form state resets during processing errors
 */

export interface MemoryAuditResult {
  isSafe: boolean;
  totalSizeBytes: number;
  totalSizeMb: number;
  fileCount: number;
  warning?: string;
  recommendedConcurrency: number;
}

/**
 * Evaluates memory pressure for incoming files and dynamically recommends
 * an optimal concurrency level (1 to 5) to protect browser stability.
 */
export function auditMemoryPressure(files: File[]): MemoryAuditResult {
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMb = totalSizeBytes / (1024 * 1024);
  const fileCount = files.length;

  let recommendedConcurrency = 3;
  let warning: string | undefined = undefined;

  // Adapt concurrency dynamically based on total memory weight and file volume
  if (totalSizeMb > 250 || fileCount > 30) {
    recommendedConcurrency = 1; // Strict serial processing for extreme loads
    warning = `Large batch detected (${totalSizeMb.toFixed(1)} MB across ${fileCount} files). Processing sequentially with garbage collection to prevent browser tab crashing.`;
  } else if (totalSizeMb > 120 || fileCount > 12) {
    recommendedConcurrency = 2; // Controlled concurrency
    warning = `Moderate batch weight (${totalSizeMb.toFixed(1)} MB across ${fileCount} files). Processing 2 files at a time to keep browser responsive.`;
  } else if (fileCount > 5) {
    recommendedConcurrency = 3;
  } else {
    recommendedConcurrency = Math.min(3, Math.max(1, fileCount));
  }

  // Detect individual giant files (>80MB)
  const hugeFiles = files.filter(f => f.size > 80 * 1024 * 1024);
  if (hugeFiles.length > 0) {
    recommendedConcurrency = 1;
    const names = hugeFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(0)} MB)`).join(', ');
    warning = `High-capacity documents detected: ${names}. Processing with dedicated streaming buffers.`;
  }

  return {
    isSafe: true,
    totalSizeBytes,
    totalSizeMb,
    fileCount,
    warning,
    recommendedConcurrency
  };
}

/**
 * Lightweight in-browser concurrency queue limiter.
 * Ensures at most `concurrency` asynchronous operations run simultaneously.
 */
export function createConcurrencyLimiter(concurrency = 3) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    active--;
    if (queue.length > 0) {
      const task = queue.shift();
      if (task) task();
    }
  };

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}

/**
 * Production-grade Concurrent Batch Queue Engine.
 * Processes an array of items with bounded concurrency (e.g. 3-4 files at a time),
 * per-item real-time callbacks, strict memory cleanup after each item,
 * and isolated try-catch error boundary so one failing file never resets the queue.
 */
export interface BatchQueueOptions<TItem, TResult> {
  items: TItem[];
  concurrency?: number;
  worker: (
    item: TItem,
    index: number,
    onProgress: (percent: number, statusText: string) => void,
    isCancelled: () => boolean
  ) => Promise<TResult>;
  onItemStart?: (item: TItem, index: number) => void;
  onItemProgress?: (item: TItem, index: number, percent: number, statusText: string) => void;
  onItemSuccess?: (item: TItem, index: number, result: TResult) => void;
  onItemError?: (item: TItem, index: number, error: Error) => void;
  onQueueProgress?: (completed: number, total: number, active: number) => void;
  yieldIntervalMs?: number;
  isCancelled?: () => boolean;
}

export interface BatchQueueResult<TItem, TResult> {
  successes: Array<{ item: TItem; index: number; result: TResult }>;
  failures: Array<{ item: TItem; index: number; error: Error }>;
  cancelled: boolean;
  totalProcessed: number;
}

export async function executeConcurrentBatch<TItem, TResult>(
  options: BatchQueueOptions<TItem, TResult>
): Promise<BatchQueueResult<TItem, TResult>> {
  const {
    items,
    concurrency = 3,
    worker,
    onItemStart,
    onItemProgress,
    onItemSuccess,
    onItemError,
    onQueueProgress,
    yieldIntervalMs = 30,
    isCancelled = () => false
  } = options;

  const total = items.length;
  const successes: Array<{ item: TItem; index: number; result: TResult }> = [];
  const failures: Array<{ item: TItem; index: number; error: Error }> = [];

  let nextIndex = 0;
  let activeWorkers = 0;
  let completedCount = 0;

  return new Promise((resolve) => {
    if (total === 0) {
      resolve({ successes, failures, cancelled: false, totalProcessed: 0 });
      return;
    }

    const actualConcurrency = Math.max(1, Math.min(concurrency, total));

    const spawnWorker = async () => {
      while (nextIndex < total && !isCancelled()) {
        const currentIndex = nextIndex++;
        const currentItem = items[currentIndex];
        activeWorkers++;

        onQueueProgress?.(completedCount, total, activeWorkers);
        onItemStart?.(currentItem, currentIndex);

        try {
          const itemResult = await worker(
            currentItem,
            currentIndex,
            (percent, statusText) => {
              onItemProgress?.(currentItem, currentIndex, percent, statusText);
            },
            isCancelled
          );

          successes.push({ item: currentItem, index: currentIndex, result: itemResult });
          onItemSuccess?.(currentItem, currentIndex, itemResult);
        } catch (err: any) {
          const formattedError = err instanceof Error ? err : new Error(String(err));
          failures.push({ item: currentItem, index: currentIndex, error: formattedError });
          onItemError?.(currentItem, currentIndex, formattedError);
        } finally {
          completedCount++;
          activeWorkers--;
          onQueueProgress?.(completedCount, total, activeWorkers);

          // Force garbage collection breathing room between task completions
          await yieldToMainThread(yieldIntervalMs);
        }
      }

      if (activeWorkers === 0) {
        resolve({
          successes,
          failures,
          cancelled: isCancelled(),
          totalProcessed: completedCount
        });
      }
    };

    // Kick off pool of parallel worker slots
    for (let w = 0; w < actualConcurrency; w++) {
      spawnWorker();
    }
  });
}

/**
 * Yields execution back to the browser's main event loop to allow:
 * 1. UI rendering, layout, and smooth progress updates
 * 2. V8 garbage collector passes on dereferenced memory buffers
 */
export function yieldToMainThread(delayMs = 25): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Detects whether an exception was triggered by Out-Of-Memory (OOM)
 * or V8 typed-array buffer allocation failure.
 */
export function isMemoryError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('out of memory') ||
    msg.includes('allocation failed') ||
    msg.includes('array buffer') ||
    msg.includes('heap') ||
    msg.includes('oom') ||
    msg.includes('maximum call stack') ||
    msg.includes('memory limit') ||
    msg.includes('cannot allocate') ||
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    err instanceof RangeError
  );
}

/**
 * Formats a clean, user-friendly, non-destructive error message for memory-related issues.
 */
export function formatMemoryErrorMessage(err: unknown, fileName?: string): string {
  if (isMemoryError(err)) {
    return fileName
      ? `File is too large for browser memory: "${fileName}". Please try compressing or splitting the file first, or close heavy background tabs.`
      : 'Document exceeded available browser memory. Please try processing fewer pages or smaller file batches.';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err || 'An unexpected processing error occurred.');
}

/**
 * Memory-safe ArrayBuffer loader with chunked streaming fallback.
 * Loads an ArrayBuffer and catches allocation failures cleanly.
 * For huge files (100MB+), uses chunked FileReader reading if standard arrayBuffer() fails.
 */
export async function readSafeArrayBuffer(
  file: File,
  onProgress?: (percent: number, bytesRead: number) => void
): Promise<ArrayBuffer> {
  // Strategy 1: Fast direct read for small and moderate files (<60MB)
  if (file.size <= 60 * 1024 * 1024) {
    try {
      const buf = await file.arrayBuffer();
      onProgress?.(100, file.size);
      return buf;
    } catch (err) {
      if (!isMemoryError(err)) throw err;
      // Fall through to chunked stream below
    }
  }

  // Strategy 2: Stream / Chunked reassembly for large files (60MB to 200MB+)
  try {
    const totalBytes = file.size;
    const chunkSize = 8 * 1024 * 1024; // 8MB chunks
    // Allocate the destination once and copy each chunk into it immediately.
    // Retaining all chunks and then assembling them doubled peak memory use.
    const finalBuffer = new Uint8Array(totalBytes);
    let bytesRead = 0;

    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, totalBytes);
      const slice = file.slice(offset, end);
      
      const chunkBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error || new Error('FileReader chunk read error'));
        reader.readAsArrayBuffer(slice);
      });

      finalBuffer.set(new Uint8Array(chunkBuf), offset);
      bytesRead += (end - offset);

      const percent = Math.min(99, Math.round((bytesRead / totalBytes) * 100));
      onProgress?.(percent, bytesRead);

      // Yield event loop between 8MB chunks so GC can recycle intermediate slice objects
      await yieldToMainThread(10);
    }

    onProgress?.(100, totalBytes);
    return finalBuffer.buffer as ArrayBuffer;
  } catch (err) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    if (isMemoryError(err)) {
      throw new Error(`File is too large for browser memory: "${file.name}" (${sizeMb} MB). Try processing in smaller batches or close other tabs.`);
    }
    throw new Error(`Failed to load "${file.name}" (${sizeMb} MB): ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Memory-safe Uint8Array loader.
 * Directly produces Uint8Array, avoiding unnecessary duplication.
 */
export async function readSafeUint8Array(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file, (pct) => onProgress?.(pct));
  return new Uint8Array(arrayBuffer);
}

/**
 * Streamed chunk reader for very large files.
 * Reads slices of a file in specified chunk sizes (e.g. 5MB) using FileReader.
 */
export async function streamReadFileInChunks(
  file: File,
  chunkSizeBytes = 5 * 1024 * 1024,
  onChunk?: (chunk: ArrayBuffer, bytesRead: number, totalBytes: number) => void | Promise<void>
): Promise<void> {
  const total = file.size;
  let offset = 0;

  while (offset < total) {
    const end = Math.min(offset + chunkSizeBytes, total);
    const slice = file.slice(offset, end);
    const chunkBuffer = await slice.arrayBuffer();
    
    if (onChunk) {
      await onChunk(chunkBuffer, end, total);
    }

    offset = end;
    // Yield between chunks to let GC clean up intermediate slices
    await yieldToMainThread(15);
  }
}

/**
 * Explicit memory cleanup utility to nullify references, detach canvases, and assist V8 GC.
 */
export function explicitMemoryCleanup(targets: Record<string, any>): void {
  for (const key of Object.keys(targets)) {
    try {
      const val = targets[key];
      if (val instanceof HTMLCanvasElement) {
        val.width = 0;
        val.height = 0;
      } else if (val instanceof Uint8Array || val instanceof ArrayBuffer) {
        // Zero-length detachment hint
        targets[key] = null;
      } else {
        targets[key] = null;
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Deep dereference & disposal helper for single objects or arrays.
 */
export function disposeMemory(target: any): void {
  if (!target) return;
  try {
    if (target instanceof HTMLCanvasElement) {
      target.width = 0;
      target.height = 0;
    } else if (Array.isArray(target)) {
      target.length = 0;
    }
  } catch {}
}

/**
 * Centralized Object URL Tracker that prevents memory leaks
 * by providing automated tracking and batch revoking.
 */
class BlobUrlRegistry {
  private urls = new Set<string>();

  create(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revoke(url: string | null | undefined): void {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    } catch {}
  }

  revokeAll(): void {
    this.urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    this.urls.clear();
  }
}

export const safeBlobUrls = new BlobUrlRegistry();
