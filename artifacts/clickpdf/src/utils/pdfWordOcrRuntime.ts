import type { Worker as OcrWorker } from 'tesseract.js';
import workerUrl from 'tesseract.js/dist/worker.min.js?url';
import coreUrl from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import { WORD_LANGUAGES, WORD_MODEL_BASE, validateWordLanguages } from './pdfWordLanguages';
import { wordAbort, wordAbortable, wordTimedOut } from './pdfWordRuntimeChecks';

const WORKER_INIT_TIMEOUT_MS = 120_000;

/** This PDF-to-Word-specific worker/core pair is bundled locally; no global PDF.js settings are changed. */
export function wordOcrAssets(base = location.href) {
  const worker = new URL(workerUrl, base), core = new URL(coreUrl, base);
  if (worker.origin !== new URL(base).origin || core.origin !== new URL(base).origin)
    throw new Error('PDF-to-Word OCR worker/core must use same-origin bundled assets.');
  return { workerPath: worker.href, corePath: core.href };
}

export async function createWordOcrWorker(
  ids: string[], signal: AbortSignal | undefined, status: (message: string) => void
): Promise<OcrWorker> {
  const selected = validateWordLanguages(ids);
  wordAbort(signal);
  const assets = wordOcrAssets();
  for (const [kind, url] of Object.entries(assets)) {
    const response = await wordAbortable(fetch(url, { method: 'HEAD', signal }), signal);
    if (!response.ok) throw new Error(`Bundled OCR ${kind} asset is unreachable (HTTP ${response.status}). No PDF was uploaded.`);
  }

  const estimatedMb = WORD_LANGUAGES.filter(language => selected.includes(language.id))
    .reduce((total, language) => total + language.estimatedMB, 0);
  status(`Loading selected OCR model(s) ${selected.join('+')} (about ${estimatedMb} MB; estimate only). PDF content remains on this device.`);

  // Tesseract.js 7 expects language codes here. Supplying {code,data} payloads
  // loads the model bytes but its initializer mistakenly treats data bytes as
  // the model name. Let the worker fetch only the selected .traineddata.gz.
  const { default: Tesseract } = await import('tesseract.js');
  const pending = Tesseract.createWorker(selected.join('+'), 1, {
    ...assets,
    langPath: WORD_MODEL_BASE,
    gzip: true,
    cacheMethod: 'write',
    workerBlobURL: false,
    logger: message => {
      const progress = typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : '';
      status(`OCR ${message.status}${progress}`);
    },
    errorHandler: error => status(`OCR worker error: ${String(error)}`)
  });
  let abandoned = false;
  void pending.then(worker => {
    if (signal?.aborted || abandoned) void worker.terminate().catch(() => {});
  }, () => {});

  try {
    const worker = await wordTimedOut(pending, signal, WORKER_INIT_TIMEOUT_MS,
      `OCR worker or selected language model did not initialize within ${WORKER_INIT_TIMEOUT_MS / 1000} seconds. Check your connection and browser WebAssembly/worker support.`);
    wordAbort(signal);
    status(`OCR engine ready (${selected.join('+')}); scanned pages stay in browser memory.`);
    return worker;
  } catch (error: any) {
    abandoned = true;
    wordAbort(signal);
    throw new Error(`Could not initialize OCR model(s) ${selected.join('+')}; no other language was substituted. ${error?.message || error}`);
  }
}
