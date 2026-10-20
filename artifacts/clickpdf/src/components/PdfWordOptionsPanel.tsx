import React from 'react';
import type { PdfWordOptions } from '../utils/pdfWordTypes';

export function PdfWordOptionsPanel({ value, onChange, disabled, onPreview }: {
  value: PdfWordOptions; onChange: (value: PdfWordOptions) => void; disabled: boolean; onPreview: () => void;
}) {
  return <fieldset disabled={disabled} className="min-w-0 space-y-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4">
    <legend className="px-2 text-sm font-bold text-slate-900 dark:text-white">Conversion mode</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {([
        ['editable', 'Editable Word', 'Editable paragraphs, headings, text styling, links and simple ruled tables. Content may reflow.'],
        ['layout', 'Layout-Preserved Word', 'Original page sizes, positioned editable text boxes, tables and separately placed artwork. Layout depends on the Word reader.']
      ] as const).map(([mode, title, description]) => <label key={mode} className={`p-3 rounded-xl border cursor-pointer ${value.mode === mode ? 'bg-white dark:bg-slate-900 border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
        <span className="flex gap-2 items-center font-bold text-xs text-slate-800 dark:text-slate-200"><input type="radio" name="pdf-word-mode" value={mode} checked={value.mode === mode} onChange={() => onChange({ ...value, mode })} />{title}</span>
        <span className="mt-2 block text-xs text-slate-500">{description}</span>
      </label>)}
    </div>
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="pdf-word-image-fallback">Optional page-image fallback</label>
    <select id="pdf-word-image-fallback" value={value.imageFallback} onChange={event => onChange({ ...value, imageFallback: event.target.value as PdfWordOptions['imageFallback'] })} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-3">
      <option value="never">Off — keep text editable (default)</option>
      <option value="unrecognized">Only pages OCR cannot recognize — those pages are not editable</option>
      <option value="all">All pages as images — no normally editable text</option>
    </select>
    <p className="text-xs text-slate-500">No full-page images by default. Logos/photos are separate image assets; vector artwork may be flattened into a non-text layer. PDF fonts are not embedded. Font substitutions, complex tables and clipping can differ. No pixel-perfect conversion is promised.</p>
    {value.imageFallback !== 'never' && <p role="status" className="text-xs font-semibold text-amber-700 dark:text-amber-300">Image-fallback pages do not contain normally editable text. The quality report identifies every such page.</p>}
    <button type="button" onClick={onPreview} className="rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300">Preview Original PDF</button>
  </fieldset>;
}
