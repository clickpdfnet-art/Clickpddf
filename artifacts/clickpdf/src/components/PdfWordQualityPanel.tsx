import React from 'react';
import type { PdfWordReport } from '../utils/pdfWordTypes';

export interface WordReportEntry { source: File; outputName: string; report: PdfWordReport }
export function PdfWordQualityPanel({ reports, onPreview }: { reports: Record<string, WordReportEntry>; onPreview: (id: string) => void }) {
  if (!Object.keys(reports).length) return null;
  return <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
    <h2 className="font-bold text-sm text-slate-900 dark:text-white">Word conversion quality report</h2>
    <p className="text-xs text-slate-500 mt-2">Warnings are part of the result, not a claim of exact visual fidelity. The DOCX also includes this report in clickpdf/conversion-report.json.</p>
    {Object.entries(reports).map(([id, entry]) => <div key={id} className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold break-all text-slate-800 dark:text-slate-200">{entry.source.name} — {entry.report.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} Word</h3>
        <button type="button" onClick={() => onPreview(id)} className="rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Compare PDF / Word</button></div>
      <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">{entry.report.warnings.map(warning => <li key={warning}>• {warning}</li>)}</ul>
      {entry.report.pages.map(page => <details key={page.page} className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Page {page.page}: {Math.round(page.width)} × {Math.round(page.height)} pt · {page.textLines} text lines · {page.images} images · {page.artworkLayers} artwork layers · {page.tables} tables{page.ocr ? ' · OCR' : ''}{page.rasterPage ? ' · NON-EDITABLE PAGE IMAGE' : ''}</summary>
        {page.language && <p className="mt-2 text-slate-600 dark:text-slate-300">
          OCR selection: <b>{page.language.selectedModels.join(' + ') || 'none'}</b> · observed script: <b>{page.language.script}</b>
          {page.language.candidates.length ? ` · script suggestion: ${page.language.candidates.join(' / ')}` : ''}
          {page.language.confidence ? ` · script confidence ${page.language.confidence}%` : ''}
          {page.language.languageConfidence ? ` · language confidence ${page.language.languageConfidence}%` : ' · language not uniquely identified'}
          {' · '}{page.language.note}
        </p>}
        <ul className="mt-2 space-y-2 text-slate-500 dark:text-slate-300">{page.warnings.map((warning, index) => <li key={index}>• {warning}</li>)}</ul>
      </details>)}
    </div>)}
  </section>;
}
