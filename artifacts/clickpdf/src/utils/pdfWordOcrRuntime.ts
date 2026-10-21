import type { Worker as OcrWorker } from 'tesseract.js';
import workerUrl from 'tesseract.js/dist/worker.min.js?url';
import coreUrl from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import { WORD_LANGUAGES, validateWordLanguages, wordModelUrl } from './pdfWordLanguages';
import { wordAbort, wordAbortable, wordTimedOut } from './pdfWordRuntimeChecks';

const MODEL_CACHE = 'clickpdf-word-models-tessdata-4-validated-v1';
const cacheCall = <T,>(operation: Promise<T>, label: string) =>
  wordTimedOut(operation, undefined, 8_000, `Optional browser cache ${label} timed out.`);
export function wordOcrAssets(base = location.href) {
  const worker = new URL(workerUrl, base), core = new URL(coreUrl, base);
  if (worker.origin !== new URL(base).origin || core.origin !== new URL(base).origin)
    throw new Error('PDF-to-Word OCR worker/core must use same-origin bundled assets.');
  return { workerPath: worker.href, corePath: core.href };
}
function validModel(bytes: Uint8Array) {
  // The engine performs semantic traineddata validation. Do not cache its data before that succeeds.
  return bytes.length > 1024 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}
async function modelBytes(id: string, signal: AbortSignal | undefined, status: (message: string) => void) {
  const url = wordModelUrl(id);
  const language = validateWordLanguages([id])[0];
  const entry = WORD_LANGUAGES.find(item => item.id === language)!;
  const maximumBytes = Math.max(5, entry.estimatedMB + 5) * 1024 * 1024;
  let cache: Cache | undefined;
  try { if (typeof caches !== 'undefined') cache = await cacheCall(caches.open(MODEL_CACHE), 'open'); }
  catch { status('Model cache unavailable (private mode/quota); using temporary browser memory.'); }
  if (cache) {
    let saved: Response | undefined;
    try { saved = (await cacheCall(cache.match(url), 'read')) || undefined; }
    catch { status(`Optional browser cache read for ${id} timed out; fetching the selected model instead.`); }
    if (saved) {
      const bytes = new Uint8Array(await wordTimedOut(saved.arrayBuffer(), signal, 15_000, `Cached ${id} OCR model read timed out.`));
      if (validModel(bytes)) { status(`Using cached ${id} model (tessdata 4.0.0, ${(bytes.length / 1048576).toFixed(1)} MB).`); return { bytes, cache, url, cached: true }; }
      await cache.delete(url);
    }
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    wordAbort(signal);
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`Model ${id} is unavailable (HTTP ${response.status}); no other language was substituted.`);
    const size = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let downloaded = 0;
    if (reader) {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        if (downloaded + next.value.length > maximumBytes) {
          await reader.cancel();
          throw new Error(`OCR model ${id} exceeded its ${Math.round(maximumBytes / 1048576)} MB safety limit.`);
        }
        chunks.push(next.value); downloaded += next.value.length;
        status(`Loading ${id} OCR model 4.0.0: ${(downloaded / 1048576).toFixed(1)} MB${size ? ` / ${(size / 1048576).toFixed(1)} MB (${Math.round(downloaded / size * 100)}%)` : ' (total size not supplied)'}`);
      }
    } else {
      const responseBuffer = new Uint8Array(await response.arrayBuffer());
      if (responseBuffer.byteLength > maximumBytes) throw new Error(`OCR model ${id} exceeded its ${Math.round(maximumBytes / 1048576)} MB safety limit.`);
      chunks.push(responseBuffer); downloaded = responseBuffer.length;
    }
    const bytes = new Uint8Array(downloaded); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    if (!validModel(bytes)) throw new Error(`Model ${id} did not contain valid compressed traineddata. It was not cached.`);
    return { bytes, cache, url, cached: false };
  } catch (error: any) {
    wordAbort(signal);
    throw new Error(`Could not load selected OCR model "${id}" (offline, blocked host, timeout, corrupt data or memory limit): ${error?.message || error}`);
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
}
export async function createWordOcrWorker(ids: string[], signal: AbortSignal | undefined, status: (message: string) => void): Promise<OcrWorker> {
  validateWordLanguages(ids); wordAbort(signal);
  const assets = wordOcrAssets();
  for (const [kind, url] of Object.entries(assets)) {
    const response = await wordAbortable(fetch(url, { method: 'HEAD', signal }), signal);
    if (!response.ok) throw new Error(`Bundled OCR ${kind} asset is unreachable (HTTP ${response.status}). No PDF was uploaded.`);
  }
  const models: ({ id: string } & Awaited<ReturnType<typeof modelBytes>>)[] = [];
  for (const id of ids) {
    models.push({ id, ...await modelBytes(id, signal, status) });
    if (models.reduce((sum, model) => sum + model.bytes.byteLength, 0) > 128 * 1048576)
      throw new Error('Selected OCR language models exceed the 128 MB in-memory safety limit. Choose fewer languages.');
  }
  wordAbort(signal);
  const { default: Tesseract } = await import('tesseract.js');
  const pending = Tesseract.createWorker(models.map(model => ({ code: model.id, data: model.bytes })), 1, {
    ...assets, workerBlobURL: false, cacheMethod: 'none',
    logger: message => status(`${message.status}${typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : ''}`),
    errorHandler: () => { /* The SDK's rejected job is handled by the caller. */ }
  });
  // If cancellation wins worker initialization, terminate the late worker as soon as it becomes available.
  let abandoned = false;
  void pending.then(worker => { if (signal?.aborted || abandoned) void worker.terminate().catch(() => {}); }, () => {});
  let worker: OcrWorker;
  try { worker = await wordTimedOut(pending, signal, 90_000, 'OCR worker initialization timed out. Check browser WebAssembly/worker support and retry.'); }
  catch (error) {
    abandoned = true;
    for (const model of models) if (model.cached) await model.cache?.delete(model.url).catch(() => {});
    throw error;
  }
  try {
    for (const model of models) if (!model.cached && model.cache) {
      wordAbort(signal);
      try { await wordTimedOut(model.cache.put(model.url, new Response(new Blob([model.bytes as BlobPart]), { headers: { 'Content-Type': 'application/gzip' } })),
        signal, 8_000, 'Optional OCR model cache write timed out.'); }
      catch { status(`Model ${model.id} loaded, but the browser refused cache storage; it remains temporary.`); }
    }
    wordAbort(signal);
    return worker;
  } catch (error) { await worker.terminate().catch(() => {}); throw error; }
}
