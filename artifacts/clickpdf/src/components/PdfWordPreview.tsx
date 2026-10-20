import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import { sanitizeHtml } from '../utils/securitySanitizer';
import { PdfTextSourcePreview } from './PdfTextSourcePreview';

/** Actual DOCX content preview, deliberately not presented as a Word layout renderer. */
export function PdfWordPreview({ source, output, onClose }: {
  source: File; output?: Uint8Array | Blob; onClose: () => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!output) return;
    let active = true;
    setHtml(null); setError(null);
    void (async () => {
      const buffer = output instanceof Blob ? await output.arrayBuffer() : Uint8Array.from(output).buffer;
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      let content = result.value;
      if (!content.trim()) {
        const zip = await JSZip.loadAsync(buffer);
        const xml = new DOMParser().parseFromString(await zip.file('word/document.xml')!.async('string'), 'application/xml');
        const texts = Array.from(xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't'));
        const div = document.createElement('div');
        for (const text of texts) { const p = document.createElement('p'); p.textContent = text.textContent; div.append(p); }
        content = div.innerHTML;
      }
      if (active) setHtml(sanitizeHtml(content || '<p>No editable text in this image-fallback document.</p>'));
    })().catch(failure => { if (active) setError(failure?.message || 'DOCX content preview is unavailable. Download and inspect in Word.'); });
    return () => { active = false; };
  }, [output]);
  return <div role="dialog" aria-modal="true" aria-label="PDF to Word comparison" className="fixed inset-0 z-50 bg-slate-950/80 p-3 sm:p-6 flex items-center justify-center">
    <div className="max-w-6xl w-full max-h-[92vh] overflow-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Source and generated Word content</h2><button type="button" autoFocus onClick={onClose} aria-label="Close Word comparison" className="p-2"><X className="w-5 h-5" /></button></div>
      <div className={`p-4 grid gap-4 ${output ? 'lg:grid-cols-2' : ''}`}>
        <PdfTextSourcePreview file={source} />
        {output && <section className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Generated DOCX — content preview</h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 my-3">Read from the actual generated DOCX. This HTML reader does not reproduce Word page layout, floating text boxes, borders or all artwork. Compare final pagination and positioning in Microsoft Word or LibreOffice.</p>
          {error ? <p role="alert" className="text-xs text-rose-700">{error}</p> : html === null ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="prose prose-sm max-w-none dark:prose-invert break-words [&_img]:max-w-full [&_img]:h-auto bg-white dark:bg-slate-950 p-4 rounded-xl" dir="auto" dangerouslySetInnerHTML={{ __html: html }} />}
        </section>}
      </div>
    </div>
  </div>;
}
