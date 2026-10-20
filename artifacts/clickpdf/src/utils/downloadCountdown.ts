/** Coalesce a manual click racing an auto request, but permit deliberate retries. */
export class DownloadRequestGate {
  private requestedAt = new Map<string, number>();

  claim(id: string, now = Date.now()): boolean {
    const previous = this.requestedAt.get(id);
    if (previous !== undefined && now - previous < 1500) return false;
    this.requestedAt.set(id, now);
    return true;
  }

  clear() { this.requestedAt.clear(); }
}

/** Owns only a timer, never the document bytes. Returns a cancellation callback. */
export function startDownloadCountdown(
  onTick: (seconds: number) => void,
  onComplete: () => void,
  seconds = 5,
) {
  let remaining = seconds;
  let active = true;
  onTick(remaining);
  const timer = setInterval(() => {
    if (!active) return;
    remaining--;
    if (remaining > 0) onTick(remaining);
    else {
      active = false;
      clearInterval(timer);
      onComplete();
    }
  }, 1000);
  return () => {
    active = false;
    clearInterval(timer);
  };
}
