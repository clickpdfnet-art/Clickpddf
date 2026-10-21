import React from 'react';
import type { PdfWordOptions } from '../utils/pdfWordTypes';
import { WORD_LANGUAGES, wordLanguageSupportText } from '../utils/pdfWordLanguages';
import { inspectWordBrowser } from '../utils/pdfWordRuntimeChecks';

export function PdfWordOptionsPanel({ value, onChange, disabled, onPreview, primaryLanguage, onPrimaryLanguageChange, files }: {
  value: PdfWordOptions; onChange: (value: PdfWordOptions) => void; disabled: boolean; onPreview: () => void;
  primaryLanguage: string; onPrimaryLanguageChange: (value: string) => void; files: File[];
}) {
  const features = inspectWordBrowser();
  const selectedLanguages = [...new Set([primaryLanguage, ...(value.ocrLanguages || [])])];
  const selectedModels = WORD_LANGUAGES.filter(language => selectedLanguages.includes(language.id));
  const estimatedModelMb = selectedModels.reduce((total, language) => total + language.estimatedMB, 0);
  const downloadSupport = () => {
    const url = URL.createObjectURL(new Blob([wordLanguageSupportText()], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clickpdf-pdf-to-word-browser-language-support.txt';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
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
    <section className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3" aria-labelledby="pdf-word-ocr-heading">
      <h3 id="pdf-word-ocr-heading" className="text-xs font-bold text-slate-800 dark:text-slate-200">Scanned-page OCR and language settings</h3>
      <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={value.enableOcr !== false} onChange={event => onChange({ ...value, enableOcr: event.target.checked, ...(event.target.checked ? {} : { forceOcr: false }) })} />
        <span>Recognize scanned pages and image-only pages with OCR (off by default for searchable text PDFs).</span>
      </label>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="pdf-word-ocr-language">Primary OCR language</label>
      <select id="pdf-word-ocr-language" value={primaryLanguage} onChange={event => {
        const next = event.target.value;
        onPrimaryLanguageChange(next);
        onChange({ ...value, ocrLanguages: (value.ocrLanguages || []).filter(id => id !== next) });
      }} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100">
        {WORD_LANGUAGES.map(language => <option key={language.id} value={language.id}>{language.name} — {language.nativeName} ({language.id}, {language.direction.toUpperCase()})</option>)}
      </select>
      <p className="text-[11px] text-slate-500">Selectable Unicode text is preserved as text; OCR runs only on scanned or explicitly forced pages. The script suggestion never changes your chosen OCR language.</p>
      <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">Add languages for mixed-script pages (models load only when needed)</summary>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WORD_LANGUAGES.filter(language => language.id !== primaryLanguage).map(language => (
            <label key={language.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input type="checkbox" checked={(value.ocrLanguages || []).includes(language.id)}
                onChange={event => {
                  const current = value.ocrLanguages || [];
                  const next = event.target.checked ? [...current, language.id] : current.filter(id => id !== language.id);
                  onChange({ ...value, ocrLanguages: next });
                }} />
              <span>{language.name} ({language.id}) · {language.direction.toUpperCase()} · ~{language.estimatedMB} MB. OCR: {language.ocrTest}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Selected model estimates: {estimatedModelMb} MB in total (estimate only). Multiple models increase download time and RAM usage. Models are fetched from the listed, pinned model host when OCR runs; the PDF itself stays in this browser.</p>
      </details>
      <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={value.forceOcr === true} disabled={value.enableOcr === false}
          onChange={event => onChange({ ...value, forceOcr: event.target.checked })} />
        <span>Force OCR on selectable-text pages (may produce duplicates or worse text; use only for pages you know are scans).</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={value.lockLanguages !== false} onChange={event => onChange({ ...value, lockLanguages: event.target.checked })} />
        <span>Use the same selected OCR languages for all pages</span>
      </label>
      {value.lockLanguages === false && <>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="pdf-word-page-models">Per-page OCR language overrides</label>
        <input id="pdf-word-page-models" value={value.pageModels || ''} onChange={event => onChange({ ...value, pageModels: event.target.value })}
          placeholder="2:urd+eng; 5:jpn" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs" />
        <p className="text-[11px] text-slate-500">Format: page or page-range: language codes, e.g. 2:urd+eng; 5:jpn. Pages not listed use the selected language combination. No automatic substitutions.</p>
      </>}
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="pdf-word-page-range">Pages to convert (leave blank for all pages)</label>
      <input id="pdf-word-page-range" value={value.pageRange || ''} onChange={event => onChange({ ...value, pageRange: event.target.value })}
        placeholder="e.g. 1-3, 5, 8" inputMode="numeric" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs" />
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="pdf-word-memory-limit">Per-page image memory limit</label>
      <select id="pdf-word-memory-limit" value={value.maxRenderPixels || 6_000_000} onChange={event => onChange({ ...value, maxRenderPixels: Number(event.target.value) })}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs">
        <option value={3_000_000}>3 MP — lower memory / slower or smaller OCR</option>
        <option value={6_000_000}>6 MP — balanced (default)</option>
        <option value={9_000_000}>9 MP — more detail / more memory</option>
      </select>
      <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={value.allowPartialText === true} disabled={value.enableOcr !== false}
          onChange={event => onChange({ ...value, allowPartialText: event.target.checked })} />
        <span>When OCR is off, allow text-only output for scan pages with an explicit partial-content warning. Never include an unconverted page image without choosing image fallback.</span>
      </label>
      <p className="text-[11px] text-slate-500">Feature check on this browser: {Object.entries(features).map(([name, supported]) => `${name} ${supported ? 'yes' : 'no'}`).join(' · ')}. The WebAssembly OCR core and worker are bundled same-origin. OCR model data is fetched on demand; previously used data may be cached if browser storage allows.</p>
      {files.some(file => file.size > 100 * 1024 * 1024) && <p role="status" className="text-xs font-semibold text-amber-700 dark:text-amber-300">Large-file notice: one or more PDFs exceed 100 MB. Browser memory is limited; process fewer pages/files or lower the image limit. Cancellation prevents delivery but a library's active packing operation may finish in the background first.</p>}
      <button type="button" onClick={downloadSupport} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300">Download language and browser support report (.txt)</button>
    </section>
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
