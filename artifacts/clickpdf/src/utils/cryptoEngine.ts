import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Interface for encryption metadata stored in package header
 */
export interface EncryptedPackageMetadata {
  algo: string;
  algorithm?: string;
  iterations: number;
  originalFileName: string;
  originalName?: string;
  originalSize: number;
  hint?: string;
  timestamp?: string;
}

export type EncryptionMetadata = EncryptedPackageMetadata;

/**
 * Result of client-side PDF protection
 */
export interface ProtectPdfResult {
  protectedPdfBytes: Uint8Array;
  rawPackageBytes: Uint8Array;
  rawEncryptedPackage: Uint8Array;
  vaultHtml: string;
  fileName: string;
  vaultFileName: string;
  metadata: EncryptedPackageMetadata;
}

/**
 * Result of client-side PDF unlocking
 */
export interface DecryptPdfResult {
  decryptedBytes: Uint8Array;
  originalName: string;
  originalSize: number;
  hint?: string;
  metadata: EncryptedPackageMetadata;
}

// Magic identifier for ClickPDF Web Crypto Encrypted Package (8 bytes)
const MAGIC_HEADER = new Uint8Array([0x43, 0x50, 0x44, 0x46, 0x45, 0x4e, 0x43, 0x31]); // "CPDFENC1"
export const DEFAULT_PBKDF2_ITERATIONS = 100000;

/**
 * Password strength calculation
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string;
} {
  if (!password) {
    return { score: 0, label: 'Very Weak', color: 'bg-slate-300', feedback: 'Enter a password to protect your file' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;

  const finalScore = Math.min(4, Math.floor(score));

  switch (finalScore) {
    case 0:
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-rose-500', feedback: 'Use at least 8 characters with numbers & symbols' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500', feedback: 'Add capital letters or special symbols for better safety' };
    case 3:
      return { score: 3, label: 'Strong', color: 'bg-emerald-500', feedback: 'Great password for client-side encryption' };
    case 4:
    default:
      return { score: 4, label: 'Very Strong', color: 'bg-teal-500', feedback: 'Excellent high-entropy password' };
  }
}

/**
 * Encrypt a PDF file using the browser-native Web Crypto API (PBKDF2 + AES-GCM 256).
 */
export async function encryptPdfWithWebCrypto(
  fileOrBytes: File | Uint8Array,
  password: string,
  options?: {
    iterations?: number;
    hint?: string;
    originalFileName?: string;
    fileName?: string;
  }
): Promise<ProtectPdfResult> {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const pdfBytes = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  const rawFileName = options?.originalFileName || options?.fileName || (fileOrBytes instanceof File ? fileOrBytes.name : 'document.pdf');
  const iterations = options?.iterations || DEFAULT_PBKDF2_ITERATIONS;

  // 1. Generate cryptographic salt (16 bytes) and IV (12 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Derive AES-GCM 256-bit key from password using PBKDF2-SHA256
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 3. Encrypt the raw PDF bytes with AES-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    pdfBytes as unknown as BufferSource
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // 4. Assemble encrypted package metadata
  const metadata: EncryptedPackageMetadata = {
    algo: 'AES-256-GCM',
    algorithm: 'AES-GCM-256',
    iterations,
    originalFileName: rawFileName,
    originalName: rawFileName,
    originalSize: pdfBytes.byteLength,
    timestamp: new Date().toISOString(),
    hint: options?.hint?.trim() || undefined,
  };

  const metaJsonBytes = enc.encode(JSON.stringify(metadata));
  const metaLen = metaJsonBytes.byteLength;

  // Layout: [MAGIC (8)] + [SALT (16)] + [IV (12)] + [METASIZE (4 BE)] + [META (N)] + [CIPHERTEXT (M)]
  const totalPkgLength = 8 + 16 + 12 + 4 + metaLen + ciphertext.byteLength;
  const rawEncryptedPackage = new Uint8Array(totalPkgLength);

  let offset = 0;
  rawEncryptedPackage.set(MAGIC_HEADER, offset);
  offset += 8;
  rawEncryptedPackage.set(salt, offset);
  offset += 16;
  rawEncryptedPackage.set(iv, offset);
  offset += 12;

  // 4 bytes big endian for metadata length
  const dv = new DataView(rawEncryptedPackage.buffer, rawEncryptedPackage.byteOffset + offset, 4);
  dv.setUint32(0, metaLen, false);
  offset += 4;

  rawEncryptedPackage.set(metaJsonBytes, offset);
  offset += metaLen;

  rawEncryptedPackage.set(ciphertext, offset);

  // 5. Build visual PDF Protective Wrapper
  const protectedDoc = await PDFDocument.create();
  const page = protectedDoc.addPage([595.28, 841.89]); // Standard A4 points
  const fontHelvetica = await protectedDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await protectedDoc.embedFont(StandardFonts.HelveticaBold);

  // Background subtle tint
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: rgb(0.98, 0.98, 0.99),
  });

  // Top security banner
  page.drawRectangle({
    x: 0,
    y: 750,
    width: 595.28,
    height: 91.89,
    color: rgb(0.08, 0.11, 0.18),
  });

  page.drawText('CLICKPDF SECURITY VAULT', {
    x: 50,
    y: 795,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.95, 0.77, 0.25),
  });

  page.drawText('ENCRYPTED WITH CLIENT-SIDE WEB CRYPTO API', {
    x: 50,
    y: 775,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  // Main status box
  page.drawRectangle({
    x: 50,
    y: 470,
    width: 495.28,
    height: 240,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.90, 0.94),
    borderWidth: 1.5,
  });

  // Rose accent bar
  page.drawRectangle({
    x: 50,
    y: 695,
    width: 495.28,
    height: 15,
    color: rgb(0.88, 0.22, 0.22),
  });

  page.drawText('THIS DOCUMENT IS PASSWORD PROTECTED', {
    x: 75,
    y: 655,
    size: 18,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.15, 0.22),
  });

  page.drawText(`Military-Grade AES-256-GCM / ${iterations.toLocaleString()} PBKDF2-SHA256 Iterations`, {
    x: 75,
    y: 635,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.40, 0.44, 0.52),
  });

  // File metadata listing
  page.drawText(`Protected File: ${rawFileName}`, {
    x: 75,
    y: 595,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.18, 0.25),
  });

  page.drawText(`Original Size: ${(pdfBytes.byteLength / 1024).toFixed(1)} KB`, {
    x: 75,
    y: 575,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.35, 0.40, 0.48),
  });

  page.drawText(`Encryption Date: ${new Date().toUTCString()}`, {
    x: 75,
    y: 555,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.35, 0.40, 0.48),
  });

  if (options?.hint) {
    page.drawText(`Password Hint: ${options.hint}`, {
      x: 75,
      y: 525,
      size: 10.5,
      font: fontHelveticaBold,
      color: rgb(0.75, 0.45, 0.10),
    });
  }

  page.drawText('Zero-Server Guarantee: Encryption performed purely inside browser memory.', {
    x: 75,
    y: 490,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.20, 0.55, 0.35),
  });

  // Instructions card
  page.drawRectangle({
    x: 50,
    y: 250,
    width: 495.28,
    height: 190,
    color: rgb(0.94, 0.96, 1.0),
    borderColor: rgb(0.75, 0.82, 0.95),
    borderWidth: 1,
  });

  page.drawText('HOW TO UNLOCK THIS DOCUMENT', {
    x: 75,
    y: 405,
    size: 13,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.25, 0.55),
  });

  page.drawText('1. Open ClickPDF (or use the ClickPDF Unlock Tool).', {
    x: 75,
    y: 375,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.18, 0.22, 0.32),
  });

  page.drawText('2. Upload this protected file and enter the secret password.', {
    x: 75,
    y: 350,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.18, 0.22, 0.32),
  });

  page.drawText('3. The browser Web Crypto engine will verify and decrypt original pages instantly.', {
    x: 75,
    y: 325,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.18, 0.22, 0.32),
  });

  page.drawText('Or use the companion Offline Decryptor Vault HTML file if provided.', {
    x: 75,
    y: 295,
    size: 10,
    font: fontHelveticaBold,
    color: rgb(0.35, 0.40, 0.65),
  });

  // Footer note
  page.drawText('ClickPDF · Client-Side PDF Tools · Compliant with ISO 32000 & W3C Web Cryptography', {
    x: 50,
    y: 40,
    size: 8.5,
    font: fontHelvetica,
    color: rgb(0.55, 0.60, 0.68),
  });

  // Attach the full encrypted binary payload
  await protectedDoc.attach(rawEncryptedPackage, 'encrypted_payload.bin', {
    mimeType: 'application/octet-stream',
    description: 'ClickPDF Web Crypto AES-256 Encrypted Payload',
  });

  // Save the base PDF
  const baseSaved = await protectedDoc.save();

  // Also append trailer comment with base64 payload to ensure 100% recoverable persistence
  const b64Payload = uint8ArrayToBase64(rawEncryptedPackage);
  const trailerString = `\n%--CPDF_PAYLOAD_START--\n${b64Payload}\n%--CPDF_PAYLOAD_END--\n`;
  const trailerBytes = enc.encode(trailerString);

  const combinedProtected = new Uint8Array(baseSaved.byteLength + trailerBytes.byteLength);
  combinedProtected.set(baseSaved, 0);
  combinedProtected.set(trailerBytes, baseSaved.byteLength);

  // Generate self-decrypting standalone HTML
  const vaultHtml = generateStandaloneDecryptorHtml(rawEncryptedPackage, metadata);

  const cleanName = rawFileName.replace(/\.pdf$/i, '');
  const outFileName = `${cleanName}.protected.pdf`;
  const vaultFileName = `${cleanName}_offline_vault.html`;

  return {
    protectedPdfBytes: combinedProtected,
    rawPackageBytes: rawEncryptedPackage,
    rawEncryptedPackage,
    vaultHtml,
    fileName: outFileName,
    vaultFileName,
    metadata,
  };
}

/**
 * Decrypt a PDF protected with ClickPDF Web Crypto API.
 */
export async function decryptPdfWithWebCrypto(
  fileOrBytes: File | Uint8Array,
  password: string
): Promise<DecryptPdfResult> {
  if (!password) {
    throw new Error('Please enter the document password.');
  }

  const inputBytes = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  // 1. Locate the encrypted package
  const pkg = extractEncryptedPackageFromBytes(inputBytes);
  if (!pkg) {
    throw new Error('This file does not appear to be protected with ClickPDF Web Crypto encryption.');
  }

  // 2. Parse package structure
  // Layout: [MAGIC (8)] + [SALT (16)] + [IV (12)] + [METASIZE (4 BE)] + [META (N)] + [CIPHERTEXT (M)]
  if (pkg.byteLength < 8 + 16 + 12 + 4 + 16) {
    throw new Error('Corrupted or incomplete encrypted payload.');
  }

  let offset = 8; // skip MAGIC
  const salt = pkg.slice(offset, offset + 16);
  offset += 16;
  const iv = pkg.slice(offset, offset + 12);
  offset += 12;

  const dv = new DataView(pkg.buffer, pkg.byteOffset + offset, 4);
  const metaLen = dv.getUint32(0, false);
  offset += 4;

  if (pkg.byteLength < offset + metaLen + 16) {
    throw new Error('Invalid encrypted package headers.');
  }

  const metaBytes = pkg.slice(offset, offset + metaLen);
  offset += metaLen;

  let metadata: EncryptedPackageMetadata = {
    algo: 'AES-256-GCM',
    algorithm: 'AES-GCM-256',
    originalFileName: 'decrypted_document.pdf',
    originalName: 'decrypted_document.pdf',
    originalSize: 0,
    timestamp: '',
    iterations: DEFAULT_PBKDF2_ITERATIONS,
  };

  try {
    const metaStr = new TextDecoder().decode(metaBytes);
    const parsed = JSON.parse(metaStr);
    metadata = {
      ...metadata,
      ...parsed,
      originalFileName: parsed.originalFileName || parsed.originalName || 'decrypted_document.pdf',
      originalName: parsed.originalName || parsed.originalFileName || 'decrypted_document.pdf',
      algo: parsed.algo || 'AES-256-GCM',
    };
  } catch {
    // ignore meta decode error
  }

  const ciphertext = pkg.slice(offset);

  // 3. Derive key with password & salt
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const iterations = metadata.iterations || DEFAULT_PBKDF2_ITERATIONS;

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 4. Decrypt via AES-GCM
  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      aesKey,
      ciphertext as unknown as BufferSource
    );
  } catch {
    throw new Error('Incorrect password. AES-GCM cryptographic authentication failed.');
  }

  const decryptedBytes = new Uint8Array(decryptedBuffer);

  return {
    decryptedBytes,
    originalName: metadata.originalFileName,
    originalSize: metadata.originalSize || decryptedBytes.byteLength,
    hint: metadata.hint,
    metadata,
  };
}

/**
 * Inspect an uploaded PDF or binary to check if protected with ClickPDF Web Crypto
 */
export async function inspectEncryptedPdf(
  fileOrBytes: File | Uint8Array
): Promise<(EncryptedPackageMetadata & { isProtected: boolean }) | null> {
  try {
    const bytes = fileOrBytes instanceof File
      ? new Uint8Array(await fileOrBytes.arrayBuffer())
      : fileOrBytes;

    const pkg = extractEncryptedPackageFromBytes(bytes);
    if (!pkg || pkg.byteLength < 40) {
      return null;
    }

    let offset = 8 + 16 + 12; // skip MAGIC (8), SALT (16), IV (12)
    const dv = new DataView(pkg.buffer, pkg.byteOffset + offset, 4);
    const metaLen = dv.getUint32(0, false);
    offset += 4;
    const metaBytes = pkg.slice(offset, offset + metaLen);
    const metaStr = new TextDecoder().decode(metaBytes);
    const parsed = JSON.parse(metaStr);

    return {
      isProtected: true,
      algo: parsed.algo || 'AES-256-GCM',
      algorithm: parsed.algorithm || 'AES-GCM-256',
      iterations: parsed.iterations || DEFAULT_PBKDF2_ITERATIONS,
      originalFileName: parsed.originalFileName || parsed.originalName || 'document.pdf',
      originalName: parsed.originalName || parsed.originalFileName || 'document.pdf',
      originalSize: parsed.originalSize || 0,
      hint: parsed.hint,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Inspect a byte buffer synchronously to check if protected with ClickPDF Web Crypto
 */
export function inspectProtectedPdf(bytes: Uint8Array): {
  isProtected: boolean;
  hint?: string;
  originalName?: string;
  originalSize?: number;
  timestamp?: string;
} {
  const pkg = extractEncryptedPackageFromBytes(bytes);
  if (!pkg || pkg.byteLength < 40) {
    return { isProtected: false };
  }

  try {
    let offset = 8 + 16 + 12; // skip MAGIC (8), SALT (16), IV (12)
    const dv = new DataView(pkg.buffer, pkg.byteOffset + offset, 4);
    const metaLen = dv.getUint32(0, false);
    offset += 4;
    const metaBytes = pkg.slice(offset, offset + metaLen);
    const metaStr = new TextDecoder().decode(metaBytes);
    const parsed = JSON.parse(metaStr);

    return {
      isProtected: true,
      hint: parsed.hint,
      originalName: parsed.originalName || parsed.originalFileName || 'document.pdf',
      originalSize: parsed.originalSize || 0,
      timestamp: parsed.timestamp
    };
  } catch {
    return { isProtected: true };
  }
}

/**
 * Check if the provided file is protected with ClickPDF Web Crypto
 */
export function isProtectedByWebCrypto(inputBytes: Uint8Array): boolean {
  return extractEncryptedPackageFromBytes(inputBytes) !== null;
}

/**
 * Extract encrypted package from raw binary or PDF trailer
 */
function extractEncryptedPackageFromBytes(bytes: Uint8Array): Uint8Array | null {
  // Case A: Bytes start directly with CPDFENC1
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x43 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x45 &&
    bytes[5] === 0x4e &&
    bytes[6] === 0x43 &&
    bytes[7] === 0x31
  ) {
    return bytes;
  }

  // Case B: Embedded in PDF trailer text comment: %--CPDF_PAYLOAD_START--\n ... \n%--CPDF_PAYLOAD_END--
  try {
    const text = new TextDecoder('latin1').decode(bytes);
    const startTag = '%--CPDF_PAYLOAD_START--';
    const endTag = '%--CPDF_PAYLOAD_END--';
    const startIdx = text.lastIndexOf(startTag);
    if (startIdx !== -1) {
      const endIdx = text.indexOf(endTag, startIdx);
      if (endIdx !== -1) {
        const b64 = text.substring(startIdx + startTag.length, endIdx).trim();
        return base64ToUint8Array(b64);
      }
    }
  } catch {
    // ignore
  }

  // Case C: Check for magic anywhere in the byte stream
  const magic = [0x43, 0x50, 0x44, 0x45, 0x4e, 0x43, 0x31];
  for (let i = 0; i <= bytes.length - 8; i++) {
    if (
      bytes[i] === magic[0] &&
      bytes[i + 1] === magic[1] &&
      bytes[i + 2] === magic[2] &&
      bytes[i + 3] === magic[3] &&
      bytes[i + 4] === magic[4] &&
      bytes[i + 5] === magic[5] &&
      bytes[i + 6] === magic[6] &&
      bytes[i + 7] === magic[7]
    ) {
      return bytes.slice(i);
    }
  }

  return null;
}

/**
 * Helper to convert Uint8Array to Base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Helper to convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a standalone offline HTML vault that any recipient can open in any browser to decrypt the PDF.
 */
export function generateStandaloneDecryptorHtml(
  rawPackage: Uint8Array,
  meta: EncryptedPackageMetadata
): string {
  const b64 = uint8ArrayToBase64(rawPackage);
  const originalFileName = meta.originalFileName || meta.originalName || 'document.pdf';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protected Vault: ${originalFileName}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --sub: #94a3b8;
      --accent: #f43f5e;
      --accent-hover: #e11d48;
      --danger: #f43f5e;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      max-width: 480px;
      width: 100%;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header { text-align: center; margin-bottom: 1.75rem; }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #fda4af;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.25);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    p.sub { font-size: 0.875rem; color: var(--sub); line-height: 1.4; }
    .info {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      font-size: 0.8125rem;
      margin-bottom: 1.5rem;
    }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: var(--sub); }
    .info-val { font-weight: 600; color: var(--text); }
    .input-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 0.625rem;
      color: var(--text);
      font-size: 1rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="password"]:focus { border-color: var(--accent); }
    button.btn {
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9375rem;
      border: none;
      border-radius: 0.625rem;
      cursor: pointer;
      transition: background 0.15s, transform 0.05s;
    }
    button.btn:hover { background: var(--accent-hover); }
    button.btn:active { transform: scale(0.99); }
    .error {
      display: none;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid var(--danger);
      border-radius: 0.5rem;
      color: #fda4af;
      font-size: 0.8125rem;
    }
    .success {
      display: none;
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--success);
      border-radius: 0.625rem;
      text-align: center;
    }
    .success a {
      display: inline-block;
      margin-top: 0.75rem;
      padding: 0.625rem 1.25rem;
      background: var(--success);
      color: #064e3b;
      font-weight: 700;
      text-decoration: none;
      border-radius: 0.5rem;
    }
    .footer-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: var(--sub);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Web Crypto ${meta.algo || 'AES-256-GCM'}</div>
      <h1>Protected PDF Vault</h1>
      <p class="sub">This document is protected with client-side zero-knowledge encryption.</p>
    </div>

    <div class="info">
      <div class="info-row">
        <span class="info-label">File:</span>
        <span class="info-val">${originalFileName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Original Size:</span>
        <span class="info-val">${((meta.originalSize || 0) / 1024).toFixed(1)} KB</span>
      </div>
      ${meta.hint ? `<div class="info-row"><span class="info-label">Password Hint:</span><span class="info-val" style="color:#f59e0b;">${meta.hint}</span></div>` : ''}
    </div>

    <form id="decryptForm" onsubmit="handleDecrypt(event)">
      <div class="input-group">
        <label for="password">Document Password</label>
        <input type="password" id="password" placeholder="Enter password to unlock..." required autofocus />
      </div>
      <button type="submit" id="submitBtn" class="btn">Unlock & Download PDF</button>
    </form>

    <div id="errorBox" class="error"></div>
    <div id="successBox" class="success">
      <div style="font-weight:700; color:#34d399; margin-bottom:0.25rem;">Document Unlocked!</div>
      <div style="font-size:0.8125rem; color:#a7f3d0;">Your PDF was decrypted inside your browser memory.</div>
      <a id="downloadLink" href="#" download="${originalFileName}">Download Decrypted PDF</a>
    </div>

    <div class="footer-text">
      Decrypted 100% locally using W3C Web Crypto API (${(meta.iterations || 100000).toLocaleString()} rounds). Zero server involvement.
    </div>
  </div>

  <script>
    const ENCRYPTED_B64 = "${b64}";

    function b64ToUint8(base64) {
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }

    async function handleDecrypt(e) {
      e.preventDefault();
      const pwInput = document.getElementById('password');
      const errorBox = document.getElementById('errorBox');
      const successBox = document.getElementById('successBox');
      const submitBtn = document.getElementById('submitBtn');
      const downloadLink = document.getElementById('downloadLink');

      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Decrypting...';

      try {
        const pkg = b64ToUint8(ENCRYPTED_B64);
        let offset = 8;
        const salt = pkg.slice(offset, offset + 16);
        offset += 16;
        const iv = pkg.slice(offset, offset + 12);
        offset += 12;

        const dv = new DataView(pkg.buffer, pkg.byteOffset + offset, 4);
        const metaLen = dv.getUint32(0, false);
        offset += 4;
        offset += metaLen; // skip meta

        const ciphertext = pkg.slice(offset);

        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
          'raw',
          enc.encode(pwInput.value),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: ${meta.iterations || 100000},
            hash: 'SHA-256'
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertext
        );

        const blob = new Blob([decrypted], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        successBox.style.display = 'block';
        submitBtn.style.display = 'none';
        pwInput.disabled = true;

        // Auto trigger download
        downloadLink.click();
      } catch (err) {
        errorBox.textContent = 'Incorrect password or corrupted file. Decryption failed.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Unlock & Download PDF';
      }
    }
  </script>
</body>
</html>`;
}
