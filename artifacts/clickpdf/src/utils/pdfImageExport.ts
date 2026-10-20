import { OutputArchive } from './outputArchive';
import type { LocalOutputStore } from './localOutputStore';
import { getPdfPagesInfo, organizePdfPagesWithRotations, renderPdfPagesToPng } from './pdfEngine';
import type { OrganizePageItem } from './pdfEngine';
import { yieldToMainThread } from './memoryManager';

export async function exportPdfDocumentsAsImages(
  files: File[],
  states: ReadonlyMap<File, { pages: OrganizePageItem[] }>,
  onProgress: (message: string) => void,
  store?: LocalOutputStore
): Promise<{ data: Uint8Array; fileName: string; details: string }> {
  const zip = new OutputArchive(store);
  const usedNames = new Set<string>();
  const failures: string[] = [];
  let documentCount = 0;
  let pageCount = 0;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    let folderName = '';
    try {
      onProgress(`Preparing ${file.name} (${index + 1} of ${files.length})...`);
      const saved = states.get(file);
      const pages = saved?.pages ?? (await getPdfPagesInfo(file)).pages.map((_page, originalIndex) => ({
        originalIndex,
        rotationDelta: 0,
      }));
      if (pages.length === 0) throw new Error('No pages left to export');
      const bytes = await organizePdfPagesWithRotations(file, pages);
      const baseName = file.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || `document_${index + 1}`;
      folderName = baseName;
      let suffix = 2;
      while (usedNames.has(folderName)) folderName = `${baseName}_${suffix++}`;
      usedNames.add(folderName);
      const folder = zip.folder(folderName);
      if (!folder) throw new Error('Could not create an image output folder');

      await renderPdfPagesToPng(bytes, (number, _total, image) => {
        folder.file(`page_${String(number).padStart(3, '0')}.png`, image);
      }, (number, total) => onProgress(`Rendering ${file.name}: page ${number} of ${total}...`));
      documentCount++;
      pageCount += pages.length;
    } catch (error) {
      if (folderName) zip.remove(folderName);
      failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Conversion failed'}`);
    }
    await yieldToMainThread(20);
  }

  if (!documentCount) throw new Error(`No PDF pages could be converted. ${failures.join('; ')}`);
  onProgress('Packaging PNG images...');
  const data = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' }, (progress) => {
    onProgress(`Packaging PNG images: ${Math.round(progress.percent)}%`);
  });
  return {
    data,
    fileName: 'pdf_pages_as_images.zip',
    details: `Converted ${pageCount} pages from ${documentCount} PDF document(s) to PNG images, with a folder for each document.${failures.length ? ` Skipped: ${failures.join('; ')}` : ''}`,
  };
}
