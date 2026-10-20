/** Temporary browser-local disk cache; never uploads document bytes. */
export class LocalOutputStore {
  private directory?: Promise<FileSystemDirectoryHandle>;
  private entries = new WeakMap<Uint8Array | Blob, Promise<Blob>>();
  private disposed = false;
  private readonly name = `clickpdf-output-${crypto.randomUUID()}`;

  constructor(private onWarning?: (message: string) => void) {}

  put(data: Uint8Array | Blob): Promise<Blob> {
    const cached = this.entries.get(data);
    if (cached) return cached;
    const result = this.write(data);
    this.entries.set(data, result);
    return result;
  }

  private async write(data: Uint8Array | Blob): Promise<Blob> {
    const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart]);
    if (this.disposed || blob.size < 8 * 1024 * 1024 || !navigator.storage?.getDirectory) return blob;
    try {
      this.directory ??= navigator.storage.getDirectory().then((root) =>
        root.getDirectoryHandle(this.name, { create: true }));
      const directory = await this.directory;
      if (this.disposed) return blob;
      const handle = await directory.getFileHandle(crypto.randomUUID(), { create: true });
      const writable = await handle.createWritable();
      try {
        await writable.write(blob);
        await writable.close();
      } catch (error) {
        await writable.abort().catch(() => {});
        throw error;
      }
      return await handle.getFile();
    } catch {
      this.onWarning?.('Local disk cache is unavailable or full. Outputs are kept in browser memory; reduce the batch if memory becomes limited.');
      return blob;
    }
  }

  async dispose() {
    this.disposed = true;
    if (!this.directory) return;
    try {
      await this.directory;
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(this.name, { recursive: true });
    } catch {
      // Best-effort cleanup, also used when the browser is closing the page.
    }
  }
}
