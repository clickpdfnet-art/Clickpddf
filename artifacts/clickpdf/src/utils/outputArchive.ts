import JSZip from 'jszip';
import type { LocalOutputStore } from './localOutputStore';

/** Collision-safe names across every batch tool; compressed outputs use STORE. */
export class OutputArchive {
  private readonly zip: JSZip;
  private readonly pending: Promise<unknown>[];
  private readonly usedNames: Set<string>;

  constructor(
    private store?: LocalOutputStore,
    private prefix = '',
    root?: { zip: JSZip; pending: Promise<unknown>[]; usedNames: Set<string> }
  ) {
    this.zip = root?.zip ?? new JSZip();
    this.pending = root?.pending ?? [];
    this.usedNames = root?.usedNames ?? new Set();
  }

  folder(name: string): OutputArchive {
    return new OutputArchive(this.store, `${this.prefix}${name}/`, {
      zip: this.zip, pending: this.pending, usedNames: this.usedNames,
    });
  }

  file(name: string, data: Uint8Array | Blob | string) {
    const safeName = name.replace(/[\\]/g, '/').split('/').filter((part) => part && part !== '.' && part !== '..').join('/');
    const fullName = `${this.prefix}${safeName}`;
    const dot = fullName.lastIndexOf('.');
    const stem = dot > fullName.lastIndexOf('/') ? fullName.slice(0, dot) : fullName;
    const extension = dot > fullName.lastIndexOf('/') ? fullName.slice(dot) : '';
    let unique = fullName;
    let counter = 2;
    while (this.usedNames.has(unique.toLowerCase())) unique = `${stem}_${counter++}${extension}`;
    this.usedNames.add(unique.toLowerCase());
    const stored = typeof data !== 'string' && this.store ? this.store.put(data) : Promise.resolve(data);
    this.pending.push(stored);
    this.zip.file(unique, stored);
    return this;
  }

  remove(name: string) {
    this.zip.remove(`${this.prefix}${name}`);
    return this;
  }

  async generateAsync(
    _options: JSZip.JSZipGeneratorOptions<'uint8array'>,
    onUpdate?: JSZip.OnUpdateCallback
  ): Promise<Uint8Array> {
    await Promise.all(this.pending);
    // PDFs, Office documents and PNGs are already compressed. Avoid running a
    // second expensive deflate pass over every output while retaining them all.
    return this.zip.generateAsync({ type: 'uint8array', compression: 'STORE', streamFiles: true }, onUpdate);
  }
}
