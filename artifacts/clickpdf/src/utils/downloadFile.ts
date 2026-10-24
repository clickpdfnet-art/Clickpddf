const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  txt: 'text/plain;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
  markdown: 'text/markdown;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json;charset=utf-8',
  html: 'text/html;charset=utf-8',
  htm: 'text/html;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  rtf: 'application/rtf',
};

const OBJECT_URL_LIFETIME_MS = 120_000;

function resolveMimeType(data: Uint8Array | Blob, fileName: string, mimeType?: string): string {
  if (mimeType && mimeType !== 'application/pdf') return mimeType;

  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES_BY_EXTENSION[extension]
    || (data instanceof Blob ? data.type : '')
    || mimeType
    || 'application/octet-stream';
}

/**
 * Starts a browser download from a fresh Blob URL on each call.
 * The attached anchor and URL stay alive for two minutes for mobile download
 * managers that read the Blob asynchronously.
 */
export function downloadFile(data: Uint8Array | Blob, fileName: string, mimeType?: string): boolean {
  let objectUrl: string | undefined;
  let anchor: HTMLAnchorElement | undefined;

  try {
    const resolvedMime = resolveMimeType(data, fileName, mimeType);
    const blob = new Blob([data as unknown as BlobPart], { type: resolvedMime });
    const legacyNavigator = typeof navigator === 'undefined'
      ? undefined
      : navigator as Navigator & { msSaveOrOpenBlob?: (blob: Blob, name: string) => boolean };

    if (typeof legacyNavigator?.msSaveOrOpenBlob === 'function') {
      return legacyNavigator.msSaveOrOpenBlob(blob, fileName);
    }

    if (typeof URL.createObjectURL !== 'function' || typeof document === 'undefined' || !document.body) {
      return false;
    }

    // Never reuse URLs: every button press receives a new URL backed by the
    // current output bytes, which also makes deliberate retries reliable.
    objectUrl = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.type = resolvedMime;
    anchor.rel = 'noopener noreferrer';
    anchor.target = '_self';
    anchor.tabIndex = -1;
    anchor.setAttribute('aria-hidden', 'true');
    anchor.style.position = 'fixed';
    anchor.style.left = '-10000px';
    anchor.style.top = '0';
    anchor.style.width = '1px';
    anchor.style.height = '1px';
    anchor.style.opacity = '0';
    anchor.style.pointerEvents = 'none';
    document.body.appendChild(anchor);

    // Keep the native anchor click synchronous with a user's button press.
    anchor.click();
    window.setTimeout(() => {
      try {
        anchor?.parentNode?.removeChild(anchor);
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    }, OBJECT_URL_LIFETIME_MS);

    return true;
  } catch (error) {
    console.error('Failed to start browser download:', error);
    try {
      anchor?.parentNode?.removeChild(anchor);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    } catch {
      // Best-effort cleanup only.
    }
    return false;
  }
}
