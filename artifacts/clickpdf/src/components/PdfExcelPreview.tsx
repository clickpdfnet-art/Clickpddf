import React, { useState } from 'react';
import { Check, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExcelSheetPreview } from '../utils/pdfExcelTypes';

const ROWS_PER_PAGE = 50, MAX_VISIBLE_COLUMNS = 30;
export function PdfExcelPreview({ sheets, name, issues }: { sheets: ExcelSheetPreview[]; name: string; issues: string[] }) {
  const [selected, setSelected] = useState(0), [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState('');
  const sheet = sheets[Math.min(selected, sheets.length - 1)];
  if (!sheet) return null;
  const totalCols = sheet.rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const rows = sheet.rows.slice(index * ROWS_PER_PAGE, (index + 1) * ROWS_PER_PAGE);
  const copy = async () => {
    setCopied(false); setCopyError('');
    try {
      const text = rows.map(row => row.slice(0, MAX_VISIBLE_COLUMNS).map(cell => {
        const value = cell.text.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
        // Pasting PDF text into a spreadsheet must not turn it into a formula.
        return cell.kind === 'text' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
      }).join('\t')).join('\n');
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is not available in this browser.');
      await navigator.clipboard.writeText(text);
      setCopied(true); window.setTimeout(() => setCopied(false), 2200);
    } catch (error: any) { setCopyError(error?.message || 'Copy failed. Download the XLSX instead.'); }
  };
  return <section className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 min-w-0">
    <h2 className="font-bold text-sm text-slate-900 dark:text-white break-all">Excel preview — {name}</h2>
    <p className="text-xs text-slate-500 mt-1">{sheets.length} worksheet{sheets.length === 1 ? '' : 's'} · Editable spreadsheet cells, not PDF page pictures</p>
    {issues.length > 0 && <details className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs">
      <summary className="cursor-pointer font-semibold">{issues.length} conversion notes / extraction warnings</summary>
      <ul className="mt-2 space-y-1">{issues.map((issue, id) => <li key={id}>• {issue}</li>)}</ul>
    </details>}
    <div role="tablist" aria-label="Excel worksheets" className="flex gap-2 overflow-x-auto mt-4 pb-2">
      {sheets.map((entry, number) => <button type="button" role="tab" aria-selected={number === selected} key={entry.name}
        onClick={() => { setSelected(number); setIndex(0); setCopyError(''); }}
        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${number === selected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{entry.name}</button>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mt-2">
      <p className="text-slate-500">{sheet.type === 'table' ? 'Detected table' : 'Extracted text'} · {sheet.rows.length} rows · {totalCols} columns · source page{sheet.pages.length === 1 ? '' : 's'} {sheet.pages.join(', ')}
        {totalCols > MAX_VISIBLE_COLUMNS && ` · first ${MAX_VISIBLE_COLUMNS} columns shown`}</p>
      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : `Copy shown ${Math.min(ROWS_PER_PAGE, rows.length)} rows as TSV`}
      </button>
    </div>
    {copyError && <p role="alert" className="mt-2 text-xs text-rose-700">{copyError}</p>}
    {!!sheet.issues.length && <ul className="my-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
      {sheet.issues.map((warning, number) => <li key={number}>• {warning}</li>)}
    </ul>}
    <div className="mt-3 max-h-[430px] overflow-auto border border-slate-200 dark:border-slate-700 rounded-xl" role="region" aria-label={`${sheet.name} cells`}>
      <table dir={sheet.rtl ? 'rtl' : 'ltr'} className="w-full min-w-max border-collapse text-xs text-slate-800 dark:text-slate-200">
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-slate-50 dark:even:bg-slate-800/70">
          <th scope="row" className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 border border-slate-200 dark:border-slate-700 tabular-nums">{index * ROWS_PER_PAGE + rowIndex + 1}</th>
          {row.slice(0, MAX_VISIBLE_COLUMNS).map((cell, col) => <td key={col} dir={cell.rtl ? 'rtl' : 'auto'}
            title={cell.kind === 'date' ? `${cell.text} (date)` : cell.kind === 'number' ? `${cell.text} (numeric)` : cell.text}
            className={`min-w-24 max-w-64 truncate p-2 border border-slate-200 dark:border-slate-700 ${cell.bold ? 'font-bold' : ''} ${cell.italic ? 'italic' : ''} ${cell.kind === 'number' ? 'text-right tabular-nums' : ''}`}>{cell.text || '\u00a0'}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    {sheet.rows.length > ROWS_PER_PAGE && <div className="flex justify-end items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
      <button type="button" aria-label="Previous preview rows" disabled={index === 0} onClick={() => setIndex(value => value - 1)} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
      Rows {index * ROWS_PER_PAGE + 1}–{Math.min((index + 1) * ROWS_PER_PAGE, sheet.rows.length)} of {sheet.rows.length}
      <button type="button" aria-label="Next preview rows" disabled={(index + 1) * ROWS_PER_PAGE >= sheet.rows.length} onClick={() => setIndex(value => value + 1)} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
    </div>}
  </section>;
}
