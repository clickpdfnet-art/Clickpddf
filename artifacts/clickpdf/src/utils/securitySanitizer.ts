import DOMPurify from 'dompurify';

/**
 * Security & Anti-Hacking Sanitizer
 * Protects against XSS, script injection, malicious URLs, and corrupted inputs.
 */

// Maximum recommended single file size for in-browser client-side RAM manipulation (500 MB)
export const MAX_SAFE_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

// Maximum total batch size for multiple files (1024 MB / 1 GB)
export const MAX_SAFE_TOTAL_BATCH_BYTES = 1024 * 1024 * 1024; // 1 GB

/**
 * Sanitizes arbitrary HTML using strict DOMPurify rules.
 * Disallows script, iframe, object, embed, or malicious event attributes.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'span', 'div', 'img',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'br', 'hr', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Validates a URL to prevent javascript: or data: XSS vectors.
 * Returns true only for http, https, or mailto protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  
  // Explicitly block malicious pseudo-protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:') ||
    trimmed.includes('<script')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    // Relative URLs starting with / or # are acceptable
    return trimmed.startsWith('/') || trimmed.startsWith('#');
  }
}

/**
 * Sanitizes a URL for safe rendering in href attributes.
 */
export function sanitizeUrl(url: string, fallback = '#'): string {
  return isSafeUrl(url) ? url.trim() : fallback;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates files to prevent memory exhaustion, browser freezing, or corrupted file loads.
 */
export function validateFileSafety(
  file: File,
  expectedType: 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'any' = 'pdf'
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'File is missing or undefined.' };
  }

  // 1. Zero-byte file check
  if (file.size === 0) {
    return {
      valid: false,
      error: `"${file.name}" is empty (0 bytes). Please upload a valid document.`
    };
  }

  // 2. Dangerous memory overload check (>500MB)
  if (file.size > MAX_SAFE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum supported file size is 500 MB.`
    };
  }

  const nameLower = (file.name || '').toLowerCase().trim();
  const typeLower = (file.type || '').toLowerCase().trim();

  // 3. File type check
  if (expectedType === 'pdf') {
    const isPdfExt = nameLower.endsWith('.pdf') || nameLower.endsWith('.pdf.clickpdf') || nameLower.includes('.pdf');
    const isPdfMime =
      typeLower.includes('pdf') ||
      typeLower.includes('octet-stream') ||
      typeLower.includes('binary') ||
      typeLower === '' ||
      typeLower.includes('document') ||
      typeLower.includes('application/x-pdf') ||
      typeLower.includes('acrobat') ||
      typeLower.includes('vnd.pdf');

    if (!isPdfExt && !isPdfMime) {
      return {
        valid: false,
        error: `"${file.name}" does not appear to be a supported PDF document.`
      };
    }
  } else if (expectedType === 'image') {
    const isImageExt = /\.(jpe?g|png|webp|bmp|gif|tif|tiff|jfif|svg)$/i.test(nameLower);
    const isImageMime = typeLower.startsWith('image/') || typeLower === '';
    if (!isImageExt && !isImageMime) {
      return {
        valid: false,
        error: `"${file.name}" does not appear to be a supported image format (JPEG, PNG, WebP).`
      };
    }
  } else if (expectedType === 'word') {
    const isWordExt = /\.(docx?|rtf|odt)$/i.test(nameLower);
    const isWordMime =
      typeLower.includes('word') ||
      typeLower.includes('document') ||
      typeLower.includes('officedocument') ||
      typeLower === '';
    if (!isWordExt && !isWordMime) {
      return {
        valid: false,
        error: `"${file.name}" does not appear to be a supported Word document (.docx, .doc).`
      };
    }
  } else if (expectedType === 'excel') {
    const isExcelExt = /\.(xlsx?|csv|ods)$/i.test(nameLower);
    const isExcelMime =
      typeLower.includes('excel') ||
      typeLower.includes('sheet') ||
      typeLower.includes('csv') ||
      typeLower === '';
    if (!isExcelExt && !isExcelMime) {
      return {
        valid: false,
        error: `"${file.name}" does not appear to be a supported spreadsheet format (.xlsx, .xls, .csv).`
      };
    }
  } else if (expectedType === 'powerpoint') {
    const isPptExt = /\.(pptx?|odp)$/i.test(nameLower);
    const isPptMime =
      typeLower.includes('powerpoint') ||
      typeLower.includes('presentation') ||
      typeLower === '';
    if (!isPptExt && !isPptMime) {
      return {
        valid: false,
        error: `"${file.name}" does not appear to be a supported presentation format (.pptx, .ppt).`
      };
    }
  }

  // Warning for moderately large files (>100MB)
  if (file.size > 100 * 1024 * 1024) {
    return {
      valid: true,
      warning: `Large file (${(file.size / (1024 * 1024)).toFixed(1)} MB). Processing may take a few seconds on your device CPU.`
    };
  }

  return { valid: true };
}

export interface FileBatchValidationResult {
  validFiles: File[];
  errors: string[];
  totalSizeBytes: number;
}

/**
 * Validates a selection together with files already in the workspace.
 * Each file remains capped at 500 MB and the total selection at 1 GB.
 */
export function validateFileBatch(
  selectedFiles: File[],
  expectedType: 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'any' = 'pdf',
  existingFiles: File[] = []
): FileBatchValidationResult {
  const validFiles: File[] = [];
  const errors: string[] = [];
  let totalSizeBytes = existingFiles.reduce((total, file) => total + file.size, 0);

  for (const file of selectedFiles) {
    const validation = validateFileSafety(file, expectedType);
    if (!validation.valid) {
      if (validation.error) errors.push(validation.error);
      continue;
    }

    if (totalSizeBytes + file.size > MAX_SAFE_TOTAL_BATCH_BYTES) {
      errors.push(
        `"${file.name}" was not added because the total batch limit is 1 GB. Remove files or add a smaller selection.`
      );
      continue;
    }

    validFiles.push(file);
    totalSizeBytes += file.size;
  }

  return { validFiles, errors, totalSizeBytes };
}
