/**
 * Safety & Anti-Hang Guard Utilities
 * Prevents browser tab freezes, memory leaks, and unresponsive scripts.
 */

export class OperationTimeoutError extends Error {
  constructor(message = 'The operation exceeded the safe time limit and was paused to prevent browser freezing.') {
    super(message);
    this.name = 'OperationTimeoutError';
  }
}

/**
 * Wraps an async Promise with a strict timeout limit.
 * If the promise doesn't resolve within the specified timeoutMs, it rejects
 * with an OperationTimeoutError instead of hanging the browser tab.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 180000,
  timeoutMessage = 'Operation took longer than safe limits. Try processing in smaller batches.'
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new OperationTimeoutError(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Safe Object URL Manager that prevents RAM leaks.
 */
export class ObjectUrlManager {
  private urls = new Set<string>();

  public create(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  public revoke(url: string | null | undefined): void {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    } catch {
      // Ignore already revoked URLs
    }
  }

  public revokeAll(): void {
    this.urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    });
    this.urls.clear();
  }
}
