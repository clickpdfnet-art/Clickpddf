import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Upload, Plus, Eye, Download, Copy, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { PDFTool } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getToolSeoInfo } from '../data/toolSeoData';
import { ToolSeoContentSection } from './ToolSeoContentSection';
import { SortableFileList, OrderedFile, ProcessedFileInfo } from './SortableFileList';
import { PdfTextSourcePreview } from './PdfTextSourcePreview';
import { validateFileBatch } from '../utils/securitySanitizer';
import { downloadBlob } from '../utils/pdfEngine';
import { OutputArchive } from '../utils/outputArchive';
import { startDownloadCountdown, DownloadRequestGate } from '../utils/downloadCountdown';
import { extractPdfText, PdfTextResult } from '../utils/pdfTextExtraction';
import { uniqueTextOutputNames } from '../utils/pdfTextFormatting';

interface Props {
  tool: PDFTool;
  initialFiles?: File[];
  onBack: () => void;
  onSelectTool?: (tool: PDFTool) => void;
}
type Result = PdfTextResult & { baseName: string };
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer';

/** All text-tool state and behavior stay here, isolated from the other PDF tools. */
export function PdfTextWorkspace({ tool, initialFiles, onBack, onSelectTool }: Props) {
  const { t, language, getToolTitle, getToolDescription } = useLanguage();
  const [items, setItems] = useState<OrderedFile[]>([]);
  const [processed, setProcessed] = useState<Record<string, ProcessedFileInfo>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [format, setFormat] = useState<'txt' | 'md'>('txt');
  const [previewFormat, setPreviewFormat] = useState<'txt' | 'md'>('txt');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, page: 0, pages: 0, name: '' });
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [packing, setPacking] = useState(false);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const resultPreview = useRef<HTMLElement>(null);
  const controller = useRef<AbortController | null>(null);
  const timers = useRef<Record<string, () => void>>({});
  const gate = useRef(new DownloadRequestGate());
  const latestOutputs = useRef(processed);
  latestOutputs.current = processed;
  const initialized = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { setCopied(false); }, [activeId, previewFormat]);

  const cancelDownloads = () => {
    Object.values(timers.current).forEach(cancel => cancel());
    timers.current = {};
    gate.current.clear();
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      cancelDownloads();
    };
  }, []);

  const addFiles = (files: File[]) => {
    const validation = validateFileBatch(files, 'pdf');
    setError(validation.errors.length ? validation.errors.join(' ') : null);
    if (!validation.validFiles.length) return;
    setItems(current => [...current, ...validation.validFiles.map(file => ({ file, id: crypto.randomUUID() }))]);
    setFinished(false);
  };
  useEffect(() => {
    if (!initialized.current && initialFiles?.length) {
      initialized.current = true;
      addFiles(initialFiles);
    }
  }, [initialFiles]);

  const reset = () => {
    cancelDownloads();
    setItems([]); setProcessed({}); setResults({}); setActiveId(null); setError(null); setFinished(false); setShowQuickPreview(false);
  };
  const downloadItem = (item: OrderedFile, info: ProcessedFileInfo) => {
    timers.current[item.id]?.();
    delete timers.current[item.id];
    if (!gate.current.claim(item.id)) return;
    downloadBlob(info.data, info.fileName, info.fileName.endsWith('.md') ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
    setProcessed(current => ({ ...current, [item.id]: { ...current[item.id], autoDownloadSeconds: 0, autoDownloaded: true } }));
  };

  const process = async () => {
    if (processing || !items.length) return;
    cancelDownloads();
    const abort = new AbortController();
    controller.current = abort;
    const batch = [...items];
    const names = uniqueTextOutputNames(batch.map(item => item.file.name));
    const selectedFormat = format;
    setProcessing(true); setFinished(false); setError(null); setResults({}); setActiveId(null);
    setProcessed(Object.fromEntries(batch.map(item => [item.id, { status: 'pending', data: new Uint8Array(), fileName: item.file.name }])));
    setProgress({ completed: 0, total: batch.length, page: 0, pages: 0, name: '' });
    try {
      for (const [index, item] of batch.entries()) {
        if (abort.signal.aborted) break;
        setProgress({ completed: index, total: batch.length, page: 0, pages: 0, name: item.file.name });
        setProcessed(current => ({ ...current, [item.id]: { ...current[item.id], status: 'processing' } }));
        try {
          const result = await extractPdfText(item.file, (page, pages) => {
            if (mounted.current) setProgress({ completed: index, total: batch.length, page, pages, name: item.file.name });
          }, abort.signal);
          if (!mounted.current || abort.signal.aborted) break;
          const content = selectedFormat === 'txt' ? result.text : result.markdown;
          const data = new Blob([content], { type: selectedFormat === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8' });
          const info: ProcessedFileInfo = { status: 'done', data, fileName: `${names[index]}.${selectedFormat}`, newSize: data.size, autoDownloadSeconds: 5, autoDownloaded: false };
          setResults(current => ({ ...current, [item.id]: { ...result, baseName: names[index] } }));
          setActiveId(current => current || item.id);
          setProcessed(current => ({ ...current, [item.id]: info }));
          timers.current[item.id] = startDownloadCountdown(seconds => {
            if (mounted.current) setProcessed(current => current[item.id]?.status === 'done' && !current[item.id].autoDownloaded
              ? { ...current, [item.id]: { ...current[item.id], autoDownloadSeconds: seconds } } : current);
          }, () => {
            delete timers.current[item.id];
            const latest = latestOutputs.current[item.id];
            if (mounted.current && latest?.status === 'done' && !latest.autoDownloaded) downloadItem(item, latest);
          });
        } catch (failure: any) {
          if (!mounted.current) return;
          setProcessed(current => ({ ...current, [item.id]: {
            status: 'error', data: new Uint8Array(), fileName: item.file.name,
            errorMessage: abort.signal.aborted ? 'Cancelled. You can retry this file.' : failure?.message || 'Could not extract this PDF.'
          } }));
        }
        if (mounted.current) setProgress(current => ({ ...current, completed: index + 1 }));
      }
    } finally {
      if (mounted.current) {
        if (abort.signal.aborted) {
          setProcessed(current => Object.fromEntries(Object.entries(current).map(([id, info]) =>
            [id, info.status === 'pending' || info.status === 'processing'
              ? { ...info, status: 'error', errorMessage: 'Cancelled. You can retry this file.' } : info])));
        }
        setProcessing(false); setFinished(true);
      }
    }
  };

  const downloadZip = async () => {
    setPacking(true); setError(null);
    try {
      const zip = new OutputArchive();
      for (const item of items) {
        const result = results[item.id];
        if (!result) continue;
        zip.file(`${result.baseName}.txt`, result.text);
        zip.file(`${result.baseName}.md`, result.markdown);
      }
      downloadBlob(await zip.generateAsync({ type: 'uint8array' }), 'extracted_text_and_markdown.zip', 'application/zip');
    } catch (failure: any) { setError(failure?.message || 'Could not create ZIP. Individual downloads are still available.'); }
    finally { if (mounted.current) setPacking(false); }
  };
  const done = Object.keys(results).length;
  const failed = Object.values(processed).filter(info => info.status === 'error').length;
  const failedItems = items.filter(item => processed[item.id]?.status === 'error');
  const visibleItems = items.filter(item => processed[item.id]?.status !== 'error');
  const removeItem = (id: string) => {
    if (processing || packing) return;
    if (items.length === 1) { reset(); return; }
    timers.current[id]?.(); delete timers.current[id];
    setItems(current => current.filter(item => item.id !== id));
    setResults(current => { const next = { ...current }; delete next[id]; return next; });
    setProcessed(current => { const next = { ...current }; delete next[id]; return next; });
    if (activeId === id) setActiveId(null);
  };
  const active = activeId ? results[activeId] : undefined;
  const activeFile = items.find(item => item.id === activeId);
  const percentage = progress.total ? Math.round((progress.completed + (progress.pages ? progress.page / progress.pages : 0)) / progress.total * 100) : 0;

  return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex items-center justify-between gap-2 mb-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><ArrowLeft className="w-4 h-4" />{t.backToTools}</button>
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-md p-2 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" />{t.clientProcessingBadge}</span>
    </div>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center mb-6">
      <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center mb-3"><FileText /></div>
      <h1 className="font-bold text-xl text-slate-900 dark:text-white">{getToolTitle(tool)}</h1>
      <p className="text-sm text-slate-500 mt-2">{getToolDescription(tool)}</p>
    </div>
    <input ref={input} type="file" multiple accept=".pdf,application/pdf" className="hidden" aria-label="Select PDF files" onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} disabled={processing || packing} />
    {error && <div role="alert" className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm break-words"><AlertCircle className="inline w-4 h-4 mr-2" />{error}</div>}
    {!items.length ? <div role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }} className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer">
      <Upload className="w-8 h-8 mx-auto text-indigo-600 mb-4" /><p className="font-bold text-slate-900 dark:text-white">Drop your files here or click to browse</p><p className="text-xs text-slate-500 mt-2">Select multiple PDFs. Files stay on your device.</p>
      <span className={`${button} mt-4 bg-indigo-600 text-white border-indigo-600`}>Select Files from Device</span>
    </div> : <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Staged Files ({items.length})</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowQuickPreview(current => !current)} className={`${button} text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700`}><Eye className="w-4 h-4" />{showQuickPreview ? t.hidePreview : t.showPreview}</button>
            <button type="button" disabled={processing || packing} onClick={process} className={`${button} text-cyan-700 bg-cyan-50 border-cyan-200`}>Batch Process Each File</button>
            <button type="button" disabled={processing || packing} onClick={() => input.current?.click()} className={`${button} bg-indigo-50 text-indigo-700 border-indigo-200`}><Plus className="w-4 h-4" />Add More Files</button>
          </div>
        </div>
        {showQuickPreview && items[0] && <div className="mb-4"><PdfTextSourcePreview file={items[0].file} /></div>}
        <fieldset disabled={processing || packing} className={processing || packing ? 'min-w-0 pointer-events-none' : 'min-w-0'}>
          {!!visibleItems.length && <SortableFileList items={visibleItems} isMultiFile={true} toolId={tool.id} language={language} processedFiles={processed}
            onReorder={ordered => setItems([...ordered, ...failedItems])} onPreview={file => {
              // The shared row assigns PDF MIME to generated files too; use source identity here.
              if (items.some(item => item.file === file)) setPreviewFile(file);
              else {
                const item = items.find(entry => processed[entry.id]?.fileName === file.name);
                if (item) {
                  setActiveId(item.id);
                  setPreviewFormat(file.name.endsWith('.md') ? 'md' : 'txt');
                  resultPreview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }} onRemove={index => removeItem(visibleItems[index].id)} onClearAll={reset} onDownloadSingle={downloadItem} />}
          {failedItems.map(item => <div key={item.id} className="mt-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold break-all min-w-0 flex-1 text-slate-800 dark:text-slate-200">{item.file.name}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300"><AlertCircle className="w-3.5 h-3.5" />Failed</span>
              <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`} className="p-1 text-rose-700"><X className="w-4 h-4" /></button>
            </div>
            <p role="alert" className="text-xs mt-2 text-rose-700 dark:text-rose-300 break-words">{processed[item.id].errorMessage}</p>
          </div>)}
          {!visibleItems.length && !!failedItems.length && <button type="button" onClick={reset} className={`${button} mt-3 border-rose-200 text-rose-700`}>Clear All</button>}
        </fieldset>
      </div>
      <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-bold uppercase text-slate-500 mb-4">Configuration &amp; Parameters</h2>
        <label htmlFor="pdf-text-format" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Output format</label>
        <select id="pdf-text-format" value={format} onChange={event => setFormat(event.target.value as 'txt' | 'md')} disabled={processing || packing} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
          <option value="txt">Plain Text (.txt)</option><option value="md">Markdown (.md)</option>
        </select>
        <p className="mt-3 text-xs text-slate-500">Both formats remain available after extraction. Markdown detects basic headings, lists and page breaks; complex columns, tables and reading order may need review. Scanned images require OCR, which is not performed here.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={process} disabled={processing || packing} className={`${button} bg-slate-900 dark:bg-indigo-600 text-white border-transparent`}>{processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}{processing ? 'Extracting...' : 'Process Documents'}</button>
          {processing && <button type="button" onClick={() => controller.current?.abort()} className={`${button} text-rose-700 border-rose-200`}><X className="w-4 h-4" />Cancel Extraction</button>}
        </div>
        {processing && <div className="mt-4" role="status"><p className="text-xs text-slate-600 dark:text-slate-300 break-all">{progress.completed} of {progress.total} files complete — {progress.name}{progress.pages ? ` · Page ${progress.page} of ${progress.pages}` : ' · Loading PDF...'}</p><progress className="w-full mt-2 accent-indigo-600" max={100} value={Math.min(100, percentage)} aria-label="Text extraction progress" /></div>}
      </div>
    </>}
    {finished && <div role="status" className={`mt-6 p-5 rounded-2xl border text-center ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
      {done ? <CheckCircle2 className="w-8 h-8 mx-auto mb-3" /> : <AlertCircle className="w-8 h-8 mx-auto mb-3" />}
      <h2 className="font-bold">{done ? 'Ready for Download!' : 'No text could be extracted'}</h2>
      <p className="text-xs mt-2">{done} of {items.length} PDFs extracted successfully.{failed ? ` ${failed} file(s) failed or were cancelled; check their error messages above.` : ''}</p>
      {!!done && <><button type="button" onClick={downloadZip} disabled={packing || processing} className={`${button} mt-4 bg-emerald-600 text-white border-transparent`}>{packing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download All {done} Results as ZIP (TXT + Markdown)</button><p className="text-xs mt-2">ZIP contains both formats for each successful PDF and downloads only when clicked.</p></>}
      <button type="button" onClick={reset} disabled={packing || processing} className={`${button} mt-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300`}>{t.processAnotherBtn}</button>
    </div>}
    {!!done && <section ref={resultPreview} className="mt-6 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-0">
      <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Extracted Text Preview</h2>
      <label htmlFor="pdf-text-preview-document" className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">Preview document</label>
      <select id="pdf-text-preview-document" value={activeId || ''} onChange={event => setActiveId(event.target.value)} className="w-full min-w-0 max-w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
        {!active && <option value="">Select a completed document</option>}
        {items.filter(item => results[item.id]).map(item => <option key={item.id} value={item.id}>{item.file.name}</option>)}
      </select>
      {active && <><div className="flex flex-wrap gap-2 mt-3">
        {(['txt', 'md'] as const).map(type => <button key={type} type="button" aria-pressed={previewFormat === type} onClick={() => setPreviewFormat(type)} className={`${button} ${previewFormat === type ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{type === 'txt' ? 'Text Preview' : 'Markdown Preview'}</button>)}
      </div><p className="text-xs text-slate-500 mt-3">{active.pages} page(s) · {active.text.length.toLocaleString()} characters</p>
        {active.warnings.map(warning => <p key={warning} role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
        <pre dir="auto" className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed text-slate-800 dark:text-slate-200">{(previewFormat === 'txt' ? active.text : active.markdown).slice(0, 100000)}</pre>
        {(previewFormat === 'txt' ? active.text : active.markdown).length > 100000 && <p className="text-xs text-slate-500 mt-2">Preview shows the first 100,000 characters. Downloads contain the full extracted content.</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={async () => {
            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable in this browser. Please download TXT or Markdown instead.');
              await navigator.clipboard.writeText(previewFormat === 'txt' ? active.text : active.markdown);
              setCopied(true);
            } catch (failure: any) { setError(failure?.message || 'Clipboard access was denied. Please use a download instead.'); }
          }} className={`${button} text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700`}><Copy className="w-4 h-4" />{copied ? 'Copied' : 'Copy Text'}</button>
          {(['txt', 'md'] as const).map(type => <button key={type} type="button" onClick={() => {
            const content = type === 'txt' ? active.text : active.markdown;
            const data = new Blob([content], { type: type === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8' });
            if (activeFile && processed[activeFile.id]?.fileName === `${active.baseName}.${type}`) downloadItem(activeFile, { ...processed[activeFile.id], data, fileName: `${active.baseName}.${type}` });
            else downloadBlob(data, `${active.baseName}.${type}`, type === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8');
          }} className={`${button} text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800`}><Download className="w-4 h-4" />Download {type === 'txt' ? 'TXT' : 'Markdown'}</button>)}
          {activeFile && <button type="button" onClick={() => setPreviewFile(activeFile.file)} className={`${button} text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700`}><Eye className="w-4 h-4" />Preview Original PDF</button>}
        </div>
      </>}
    </section>}
    <ToolSeoContentSection tool={tool} seoInfo={getToolSeoInfo(tool.id)} onSelectRelatedTool={onSelectTool} stage={finished ? 'completed' : items.length ? 'active' : 'empty'} />
    {previewFile && <PdfTextSourcePreview file={previewFile} onClose={() => setPreviewFile(null)} onProcess={!processing && !finished ? process : undefined} />}
  </div>;
}
