import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck, FileSpreadsheet, Upload, Plus, Eye, Download, AlertCircle, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { PDFTool } from '../types';
import { SortableFileList, type OrderedFile, type ProcessedFileInfo } from './SortableFileList';
import { PdfTextSourcePreview } from './PdfTextSourcePreview';
import { PdfExcelPreview } from './PdfExcelPreview';
import { getToolSeoInfo } from '../data/toolSeoData';
import { ToolSeoContentSection } from './ToolSeoContentSection';
import { validateFileBatch } from '../utils/securitySanitizer';
import { downloadBlob } from '../utils/pdfEngine';
import { OutputArchive } from '../utils/outputArchive';
import { DownloadRequestGate, startDownloadCountdown } from '../utils/downloadCountdown';
import { LocalOutputStore } from '../utils/localOutputStore';
import { SUPPORTED_OCR_LANGUAGES } from '../utils/ocrLanguages';
import { convertAdvancedPdfToExcel } from '../utils/pdfExcelConverter';
import { DEFAULT_PDF_EXCEL_OPTIONS, type PdfExcelOptions, type PdfExcelResult } from '../utils/pdfExcelTypes';

interface Props { tool: PDFTool; initialFiles?: File[]; onBack: () => void; onSelectTool?: (tool: PDFTool) => void }
type Preview = Omit<PdfExcelResult, 'data'>;
const btn = 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border disabled:opacity-40 cursor-pointer';
const xlsxMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** This workspace and converter are mounted only for pdf-to-excel. */
export function PdfExcelWorkspace({ tool, initialFiles, onBack, onSelectTool }: Props) {
  const { t, language, getToolTitle, getToolDescription } = useLanguage();
  const [items, setItems] = useState<OrderedFile[]>([]);
  const [output, setOutput] = useState<Record<string, ProcessedFileInfo>>({});
  const [results, setResults] = useState<Record<string, Preview>>({});
  const [options, setOptions] = useState<PdfExcelOptions>(DEFAULT_PDF_EXCEL_OPTIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false), [packing, setPacking] = useState(false);
  const [progress, setProgress] = useState({ file: 0, total: 0, page: 0, pages: 0, status: '' });
  const input = useRef<HTMLInputElement>(null);
  const initialized = useRef(false), mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const timers = useRef<Record<string, () => void>>({});
  const gate = useRef(new DownloadRequestGate());
  const latest = useRef(output); latest.current = output;
  const store = useRef<LocalOutputStore | null>(null);
  if (!store.current) store.current = new LocalOutputStore(message => { if (mounted.current) setError(message); });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; abort.current?.abort(); Object.values(timers.current).forEach(cancel => cancel()); void store.current?.dispose(); };
  }, []);
  const stopTimers = () => { Object.values(timers.current).forEach(cancel => cancel()); timers.current = {}; gate.current.clear(); };
  const addFiles = (files: File[]) => {
    if (processing || packing) return;
    const batch = validateFileBatch(files, 'pdf');
    setError(batch.errors.join(' '));
    if (batch.validFiles.length) setItems(previous => [...previous, ...batch.validFiles.map(file => ({ id: crypto.randomUUID(), file }))]);
  };
  useEffect(() => {
    if (initialFiles?.length && !initialized.current) { initialized.current = true; addFiles(initialFiles); }
  }, [initialFiles]);
  const reset = () => {
    if (processing || packing) return;
    stopTimers(); setItems([]); setOutput({}); setResults({});
    setActiveId(null); setSourcePreview(null); setError('');
    setProgress({ file: 0, total: 0, page: 0, pages: 0, status: '' });
  };
  const remove = (id: string) => {
    if (processing || packing) return;
    if (items.length === 1) { reset(); return; }
    timers.current[id]?.(); delete timers.current[id];
    setItems(previous => previous.filter(item => item.id !== id));
    setOutput(previous => { const next = { ...previous }; delete next[id]; return next; });
    setResults(previous => { const next = { ...previous }; delete next[id]; return next; });
    if (activeId === id) setActiveId(null);
  };
  const downloadItem = (item: OrderedFile, info: ProcessedFileInfo) => {
    if (info.status !== 'done' || !gate.current.claim(item.id)) return;
    timers.current[item.id]?.(); delete timers.current[item.id];
    downloadBlob(info.data, info.fileName, xlsxMime);
    setOutput(previous => previous[item.id]?.status === 'done'
      ? { ...previous, [item.id]: { ...previous[item.id], autoDownloadSeconds: 0, autoDownloaded: true } } : previous);
  };
  const process = async () => {
    if (processing || packing || !items.length) return;
    const batch = [...items], selected = { ...options };
    stopTimers(); setProcessing(true); setError(''); setActiveId(null); setResults({});
    setOutput(Object.fromEntries(batch.map(item => [item.id, { data: new Blob(), fileName: item.file.name, status: 'pending' as const }])));
    setProgress({ file: 0, total: batch.length, page: 0, pages: 0, status: 'Starting PDF to Excel conversion…' });
    const controller = new AbortController(); abort.current = controller;
    const names = new Set<string>();
    try {
      for (const [position, item] of batch.entries()) {
        if (controller.signal.aborted) break;
        const base = item.file.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
        let fileName = `${base}.xlsx`, suffix = 2;
        while (names.has(fileName.toLocaleLowerCase())) fileName = `${base}_${suffix++}.xlsx`;
        names.add(fileName.toLocaleLowerCase());
        setProgress({ file: position, total: batch.length, page: 0, pages: 0, status: `Converting ${item.file.name}…` });
        setOutput(previous => ({ ...previous, [item.id]: { ...previous[item.id], status: 'processing' } }));
        try {
          const result = await convertAdvancedPdfToExcel(item.file, selected, (page, pages, status) => {
            if (mounted.current) setProgress({ file: position, total: batch.length, page, pages, status });
          }, controller.signal);
          if (!mounted.current || controller.signal.aborted) break;
          const staged = await store.current!.put(result.data);
          if (!mounted.current || controller.signal.aborted) break;
          const { data: _generated, ...preview } = result;
          setResults(previous => ({ ...previous, [item.id]: { ...preview, fileName } }));
          setActiveId(previous => previous || item.id);
          const info: ProcessedFileInfo = { data: staged, fileName, originalSize: item.file.size,
            newSize: staged.size, status: 'done', autoDownloadSeconds: 5, autoDownloaded: false };
          setOutput(previous => ({ ...previous, [item.id]: info }));
          timers.current[item.id] = startDownloadCountdown(seconds => {
            if (mounted.current) setOutput(previous => previous[item.id]?.status === 'done' && !previous[item.id].autoDownloaded
              ? { ...previous, [item.id]: { ...previous[item.id], autoDownloadSeconds: seconds } } : previous);
          }, () => {
            delete timers.current[item.id];
            const current = latest.current[item.id];
            if (mounted.current && current?.status === 'done' && !current.autoDownloaded) downloadItem(item, current);
          });
        } catch (failure: any) {
          if (!mounted.current) return;
          setOutput(previous => ({ ...previous, [item.id]: { data: new Blob(), fileName, originalSize: item.file.size,
            status: 'error', errorMessage: controller.signal.aborted ? 'Conversion cancelled.' : failure?.message || 'Could not convert this PDF.' } }));
        }
        if (mounted.current) setProgress(previous => ({ ...previous, file: position + 1, page: 0, pages: 0 }));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      if (mounted.current) {
        if (controller.signal.aborted) setOutput(previous => Object.fromEntries(Object.entries(previous).map(([id, info]) =>
          [id, info.status === 'pending' || info.status === 'processing' ? { ...info, status: 'error', errorMessage: 'Conversion cancelled.' } : info])));
        setProcessing(false); abort.current = null;
      }
    }
  };
  const downloadZip = async () => {
    const completed = items.filter(item => output[item.id]?.status === 'done');
    if (!completed.length || packing) return;
    setPacking(true); setError('');
    try {
      const zip = new OutputArchive();
      for (const item of completed) zip.file(output[item.id].fileName, output[item.id].data);
      downloadBlob(await zip.generateAsync({ type: 'uint8array' }), `converted_excel_${completed.length}_files.zip`, 'application/zip');
    } catch (failure: any) { setError(failure?.message || 'ZIP creation failed; individual XLSX downloads remain available.'); }
    finally { if (mounted.current) setPacking(false); }
  };
  const completed = items.filter(item => output[item.id]?.status === 'done');
  const failed = items.filter(item => output[item.id]?.status === 'error');
  const visible = items.filter(item => output[item.id]?.status !== 'error');
  const current = activeId && results[activeId], currentFile = items.find(item => item.id === activeId);
  const percent = progress.total ? Math.min(100, Math.round((progress.file + (progress.pages ? progress.page / progress.pages : 0)) / progress.total * 100)) : 0;
  const seo = getToolSeoInfo(tool.id);
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><ArrowLeft className="w-4 h-4" />{t.backToTools}</button>
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-md p-2 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" />{t.clientProcessingBadge}</span>
    </div>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center mb-6">
      <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center mb-3"><FileSpreadsheet /></div>
      <h1 className="font-bold text-xl text-slate-900 dark:text-white">{getToolTitle(tool)}</h1>
      <p className="text-sm text-slate-500 mt-2">{getToolDescription(tool)}</p>
    </div>
    <input ref={input} type="file" multiple accept=".pdf,application/pdf" className="hidden" aria-label="Select PDF files"
      disabled={processing || packing} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
    {error && <div role="alert" className="p-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs break-words"><AlertCircle className="w-4 h-4 inline mr-2" />{error}</div>}
    {!items.length ? <div role="button" tabIndex={0} onClick={() => input.current?.click()}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }}
      onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}
      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/60">
      <Upload className="w-8 h-8 mx-auto text-indigo-600 mb-4" />
      <p className="font-bold text-slate-900 dark:text-white">Drop your files here or click to browse</p>
      <p className="text-xs text-slate-500 mt-2">Select multiple PDF files. Processing stays on your device.</p>
      <span className={`${btn} mt-4 bg-indigo-600 text-white border-indigo-600`}>Select Files from Device</span>
    </div> : <>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Staged PDFs ({items.length}) · In-browser</h2>
          <button type="button" disabled={processing || packing} onClick={() => input.current?.click()} className={`${btn} border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300`}><Plus className="w-3.5 h-3.5" />Add More Files</button>
        </div>
        {!!visible.length && <SortableFileList items={visible} isMultiFile={true} toolId={tool.id} language={language} processedFiles={output}
          onReorder={reordered => setItems(previous => [...reordered, ...previous.filter(item => output[item.id]?.status === 'error')])}
          onPreview={file => {
            if (items.some(item => item.file === file)) setSourcePreview(file);
            else {
              const item = items.find(entry => output[entry.id]?.fileName === file.name);
              if (item) setActiveId(item.id);
            }
          }} onRemove={index => remove(visible[index].id)} onClearAll={reset} onDownloadSingle={downloadItem} />}
        {failed.map(item => <div key={item.id} className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs">
          <div className="flex items-center gap-2"><span className="flex-1 font-semibold break-all">{item.file.name}</span>
            <span className="text-rose-700 dark:text-rose-300">Failed</span><button type="button" disabled={processing || packing} aria-label={`Remove ${item.file.name}`} onClick={() => remove(item.id)}><X className="w-4 h-4 text-rose-700" /></button></div>
          <p role="alert" className="mt-2 text-rose-700 dark:text-rose-300">{output[item.id]?.errorMessage}</p>
        </div>)}
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 mt-4">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Conversion settings</h2>
        <fieldset disabled={processing || packing} className="space-y-4">
          <legend className="sr-only">PDF to Excel extraction mode</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ['tables', 'Extract Tables', 'Each detected table gets an editable worksheet; report uncertain columns.'],
              ['text', 'Extract All Text', 'All readable lines with page and line numbers in separate columns.'],
              ['ocr', 'Scanned PDF / OCR', 'Recognize scanned pages, reconstruct tables where possible.']
            ] as const).map(([mode, title, description]) => <label key={mode} className={`rounded-xl border p-3 cursor-pointer ${options.mode === mode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
              <span className="flex gap-2 font-bold text-xs text-slate-800 dark:text-slate-200"><input type="radio" name="pdf-excel-mode" value={mode} checked={options.mode === mode}
                onChange={() => setOptions(previous => ({ ...previous, mode }))} />{title}</span>
              <span className="text-[11px] text-slate-500 mt-2 block leading-relaxed">{description}</span>
            </label>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.mode === 'ocr' && <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">OCR language
              <select value={options.language} onChange={event => setOptions(previous => ({ ...previous, language: event.target.value }))}
                className="block mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5">
                {SUPPORTED_OCR_LANGUAGES.map(option => <option key={option.code} value={option.code}>{option.name}{option.nativeName !== option.name ? ` — ${option.nativeName}` : ''}</option>)}
              </select>
            </label>}
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number separators
              <select value={options.numberLocale} onChange={event => setOptions(previous => ({ ...previous, numberLocale: event.target.value as PdfExcelOptions['numberLocale'] }))}
                className="block mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5">
                <option value="auto">Auto-detect (ambiguous dates stay text)</option><option value="dot">Decimal point (1,234.50)</option><option value="comma">Decimal comma (1.234,50)</option>
              </select>
            </label>
          </div>
          {options.mode !== 'text' && <label className="flex gap-2 text-xs text-slate-700 dark:text-slate-300"><input type="checkbox" checked={options.combineContinued}
            onChange={event => setOptions(previous => ({ ...previous, combineContinued: event.target.checked }))} />Combine tables across adjacent pages only when headings and columns match</label>}
          <p className="text-[11px] text-slate-500">Scans need a downloadable OCR language model. OCR and table detection can be uncertain; inspect each worksheet and warning. Your files remain in the browser. Very large PDFs/ZIPs depend on your device memory.</p>
        </fieldset>
        {processing && <div role="status" className="mt-4" aria-live="polite">
          <p className="text-xs text-slate-600 dark:text-slate-300">{progress.status} · {Math.min(progress.file + 1, progress.total)}/{progress.total} files</p>
          <progress value={percent} max={100} className="mt-2 w-full h-2 accent-indigo-600" aria-label="PDF to Excel conversion progress" />
          <p className="text-[11px] text-slate-500">{percent}% {progress.pages ? `· page ${progress.page}/${progress.pages}` : ''}</p>
        </div>}
        <div className="flex flex-wrap gap-2 mt-5">
          <button type="button" onClick={() => void process()} disabled={processing || packing} className={`${btn} bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-900`}>
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Convert {items.length > 1 ? `${items.length} PDFs` : 'PDF'} to Excel (.xlsx)
          </button>
          {processing && <button type="button" onClick={() => abort.current?.abort()} className={`${btn} text-rose-700 border-rose-200`}><X className="w-4 h-4" />Cancel</button>}
          {completed.length > 1 && <button type="button" disabled={packing} onClick={() => void downloadZip()} className={`${btn} border-emerald-300 text-emerald-700 dark:text-emerald-300`}>
            {packing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download All {completed.length} as ZIP
          </button>}
        </div>
      </section>
      {completed.length > 0 && <div role="status" className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="w-4 h-4 inline mr-2" />{completed.length} real Excel workbook{completed.length === 1 ? '' : 's'} created. Select a file to inspect its worksheets; manual XLSX downloads remain available.
      </div>}
      {completed.length > 1 && <div className="flex flex-wrap gap-2 mt-3">{completed.map(item => <button type="button" key={item.id}
        onClick={() => setActiveId(item.id)} className={`${btn} ${item.id === activeId ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'} break-all`}>
        <Eye className="w-3.5 h-3.5" />{item.file.name}</button>)}</div>}
      {current && currentFile && <PdfExcelPreview key={activeId} sheets={current.sheets} name={currentFile.file.name} issues={current.issues} />}
    </>}
    <ToolSeoContentSection tool={tool} seoInfo={seo} onSelectRelatedTool={onSelectTool}
      stage={completed.length && !processing ? 'completed' : items.length ? 'active' : 'empty'} />
    {sourcePreview && <PdfTextSourcePreview file={sourcePreview} onClose={() => setSourcePreview(null)} />}
  </div>;
}
