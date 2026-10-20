import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, X } from 'lucide-react';
import { initPdfWorker } from '../utils/pdfWorkerSetup';
import { downloadBlob } from '../utils/pdfEngine';

/** Text-tool-only source preview. Does not alter previews in any other tool. */
export function PdfTextSourcePreview({ file, onClose, onProcess }: {
  file: File; onClose?: () => void; onProcess?: () => void;
}) {
  const [loaded, setLoaded] = useState<{ file: File; document: pdfjs.PDFDocumentProxy } | null>(null);
  const document = loaded?.file === file ? loaded.document : null;
  const [pageNumber, setPageNumber] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    initPdfWorker();
    let active = true;
    const url = URL.createObjectURL(file);
    const task = pdfjs.getDocument({ url, stopAtErrors: true });
    setLoaded(null); setPageNumber(1); setBusy(true); setError(null);
    void task.promise.then(pdf => {
      if (active) setLoaded({ file, document: pdf });
    }).catch(failure => {
      if (active) { setError(failure?.message || 'Could not preview this PDF.'); setBusy(false); }
    });
    return () => { active = false; void task.destroy().catch(() => {}); URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    if (!document) return;
    let active = true;
    let render: ReturnType<pdfjs.PDFPageProxy['render']> | undefined;
    setBusy(true); setError(null);
    void (async () => {
      const page = await document.getPage(Math.min(pageNumber, document.numPages));
      if (!active || !canvas.current) return;
      try {
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(900 / natural.width, 1.5) });
        const target = canvas.current;
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        const context = target.getContext('2d');
        if (!context) throw new Error('Canvas preview is unavailable in this browser.');
        render = page.render({ canvas: target, canvasContext: context, viewport });
        await render.promise;
        if (active) setBusy(false);
      } finally { page.cleanup(); }
    })().catch(failure => {
      if (active) { setBusy(false); setError(failure?.message || 'Could not render this page.'); }
    });
    return () => { active = false; render?.cancel(); };
  }, [document, pageNumber]);

  useEffect(() => {
    if (!onClose) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose]);

  const content = <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
    <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
      <h2 className="font-bold text-sm break-all min-w-0 text-slate-900 dark:text-white">Original PDF Preview — {file.name}</h2>
      {onClose && <button type="button" autoFocus onClick={onClose} aria-label="Close PDF preview" className="p-2 shrink-0 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>}
    </div>
    <div className="overflow-auto min-h-0 p-3 bg-slate-100 dark:bg-slate-950">
      {busy && <p role="status" className="flex items-center justify-center gap-2 p-4 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Loading PDF page…</p>}
      {error && <p role="alert" className="p-4 text-sm text-rose-700 dark:text-rose-300 break-words">{error}</p>}
      <canvas ref={canvas} aria-label={`Original PDF page ${pageNumber}`} className={`mx-auto max-w-full h-auto bg-white ${busy || error || !document ? 'hidden' : ''}`} />
    </div>
    <div className="p-3 flex flex-wrap items-center justify-center gap-4 text-xs border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
      <button type="button" aria-label="Previous PDF page" disabled={busy || !document || pageNumber <= 1} onClick={() => setPageNumber(number => number - 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
      <span>Page {pageNumber} of {document?.numPages ?? '…'}</span>
      <button type="button" aria-label="Next PDF page" disabled={busy || !document || pageNumber >= document.numPages} onClick={() => setPageNumber(number => number + 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
      <button type="button" onClick={() => downloadBlob(file, file.name, 'application/pdf')} className="inline-flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700"><Download className="w-3.5 h-3.5" />Download Original</button>
      <button type="button" onClick={() => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }} className="inline-flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700"><ExternalLink className="w-3.5 h-3.5" />Open in Tab</button>
      {onProcess && <button type="button" onClick={() => { onClose?.(); onProcess(); }} className="p-2 rounded-lg bg-indigo-600 text-white">Process Documents</button>}
    </div>
  </div>;
  return onClose
    ? <div role="dialog" aria-modal="true" aria-label="Original PDF preview" className="fixed inset-0 z-50 bg-slate-950/75 p-3 sm:p-6 flex items-center justify-center">{content}</div>
    : content;
}
