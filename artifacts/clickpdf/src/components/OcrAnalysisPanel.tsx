import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ScanText,
  Languages,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertCircle,
  XCircle,
  RotateCw,
  Search,
  Sliders,
  FileText,
  Layers,
  ZoomIn,
  Eye,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Clock,
  Hash,
  Activity
} from 'lucide-react';
import {
  SUPPORTED_OCR_LANGUAGES,
  OcrOptions,
  OcrProgressStatus,
  FullOcrAnalysisResult,
  PageOcrResult,
  executePdfOcr,
  downloadOcrResult
} from '../utils/pdfOcrEngine';
import confetti from 'canvas-confetti';

interface OcrAnalysisPanelProps {
  file: File;
  totalPages: number;
}

export const OcrAnalysisPanel: React.FC<OcrAnalysisPanelProps> = ({ file, totalPages }) => {
  // Config state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('eng');
  const [pageSelection, setPageSelection] = useState<'all' | 'first' | 'range'>(totalPages > 3 ? 'first' : 'all');
  const [customRange, setCustomRange] = useState<string>('1');
  const [scaleFactor, setScaleFactor] = useState<number>(2.0);
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<OcrProgressStatus | null>(null);
  const [ocrResult, setOcrResult] = useState<FullOcrAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cancellation ref
  const isCancelledRef = useRef<boolean>(false);

  // Results display state
  const [activeViewMode, setActiveViewMode] = useState<'sideBySide' | 'combined' | 'byPage'>('sideBySide');
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const handleStartOcr = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      isCancelledRef.current = false;

      const options: OcrOptions = {
        language: selectedLanguage,
        pageSelection,
        customPageRange: customRange,
        scale: scaleFactor,
        enhanceScannedContrast: enhanceContrast,
      };

      const result = await executePdfOcr(
        file,
        totalPages,
        options,
        (status) => {
          setProgress(status);
        },
        () => isCancelledRef.current
      );

      setOcrResult(result);
      setActivePageIdx(0);

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      if (err.message?.includes('canceled')) {
        setErrorMessage('OCR extraction canceled.');
      } else {
        console.warn('OCR Notice:', err);
        setErrorMessage(
          err.message || 'An error occurred during OCR recognition. Please check your network connection if downloading language models for the first time.'
        );
      }
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleCancelOcr = () => {
    isCancelledRef.current = true;
    setProgress((prev) =>
      prev ? { ...prev, statusMessage: 'Canceling OCR operation...', stage: 'canceled' } : null
    );
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activePage: PageOcrResult | undefined = ocrResult?.pages[activePageIdx];

  // Highlight search matches
  const renderHighlightedText = (content: string) => {
    if (!searchQuery.trim() || !content) return content;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-500/50 text-slate-900 dark:text-white px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-cyan-50 via-indigo-50 to-purple-50 dark:from-cyan-950/30 dark:via-indigo-950/30 dark:to-purple-950/20 border border-cyan-200/80 dark:border-cyan-800/60 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-sm shrink-0 mt-0.5">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tesseract.js Optical Character Recognition (OCR)
                </h4>
                <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/80 text-cyan-800 dark:text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-700">
                  Client-Side Neural OCR
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                  100% Private
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Extract machine-readable, editable text directly from scanned pages, photocopied documents, invoices, and image-based PDFs without uploading a single byte to external servers.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Document</span>
            <span className="truncate max-w-[200px] font-mono text-[11px]">{file.name}</span>
          </div>
        </div>
      </div>

      {/* OCR Settings and Configuration Panel */}
      {!ocrResult && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>OCR Configuration</span>
            </h5>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAdvancedSettings ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Language Selector */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-slate-500" />
                <span>OCR Recognition Language</span>
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_OCR_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} {lang.nativeName && lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''} [{lang.code}]
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Tesseract downloads and caches language neural network traineddata locally in your browser.
              </p>
            </div>

            {/* Page Range Selection */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Pages to Scan ({totalPages} {totalPages === 1 ? 'Page Total' : 'Pages Total'})</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPageSelection('first')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                    pageSelection === 'first'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Page 1 (Fast)
                </button>
                <button
                  type="button"
                  onClick={() => setPageSelection('all')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                    pageSelection === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  All ({totalPages})
                </button>
                <button
                  type="button"
                  onClick={() => setPageSelection('range')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                    pageSelection === 'range'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Custom Range
                </button>
              </div>

              {pageSelection === 'range' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    placeholder="e.g. 1-2, 4"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Enter comma-separated numbers or page ranges (e.g. 1-3, 5). Max page: {totalPages}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Image Optimization Settings */}
          {showAdvancedSettings && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rasterization Render Scale (DPI)
                </label>
                <select
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={1.5}>1.5x (Fastest · ~110 DPI)</option>
                  <option value={2.0}>2.0x (Standard Recommended · ~150 DPI)</option>
                  <option value={2.5}>2.5x (Ultra Sharp · ~200 DPI · Best for faint text)</option>
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Higher scale renders sharper details from low-quality scans.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Scanned Document Filter
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enhanceContrast}
                    onChange={(e) => setEnhanceContrast(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Adaptive Contrast & Grayscale Enhancement
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Removes paper yellowing and strengthens faded ink lines before OCR.
                </p>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero server upload · 100% browser memory execution</span>
            </div>

            <button
              onClick={handleStartOcr}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {pageSelection === 'first'
                  ? 'Extract Text from Page 1'
                  : pageSelection === 'all'
                  ? `Extract Text from All ${totalPages} Pages`
                  : 'Extract Text from Custom Range'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Box during Execution */}
      {isProcessing && progress && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-md text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 animate-spin" />
          </div>

          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Running Browser Optical Character Recognition...
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
            {progress.statusMessage}
          </p>

          {/* Animated Progress Bar */}
          <div className="mt-5 max-w-md mx-auto">
            <div className="flex justify-between items-center text-xs mb-1.5 text-slate-600 dark:text-slate-400">
              <span>Overall Progress</span>
              <span className="font-bold font-mono">{progress.overallProgressPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress.overallProgressPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleCancelOcr}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel OCR Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null);
              handleStartOcr();
            }}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 font-semibold rounded-lg hover:bg-rose-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* OCR Results Showcase */}
      {ocrResult && !isProcessing && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Summary Metric Ribbon */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>OCR Recognition Finished</span>
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                      Tesseract.js {ocrResult.languageName}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Extracted from {ocrResult.totalPagesProcessed} {ocrResult.totalPagesProcessed === 1 ? 'page' : 'pages'} in {(ocrResult.totalDurationMs / 1000).toFixed(1)} seconds
                  </p>
                </div>
              </div>

              {/* Action Downloads & Copy */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => copyToClipboard(ocrResult.combinedText, 'all_ocr')}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'all_ocr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'all_ocr' ? 'Copied All!' : 'Copy All Text'}</span>
                </button>

                <button
                  onClick={() => downloadOcrResult(ocrResult, 'txt')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .TXT</span>
                </button>

                <button
                  onClick={() => downloadOcrResult(ocrResult, 'md')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </button>

                <button
                  onClick={() => downloadOcrResult(ocrResult, 'json')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                <button
                  onClick={() => {
                    setOcrResult(null);
                    setErrorMessage(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Rescan or adjust settings"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Total Words
                </span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {ocrResult.totalWords.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Total Characters
                </span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {ocrResult.totalCharacters.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Avg. Confidence
                </span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span
                    className={`text-lg font-extrabold font-mono ${
                      ocrResult.averageConfidence >= 80
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : ocrResult.averageConfidence >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {ocrResult.averageConfidence}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Processing Time
                </span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                  {(ocrResult.totalDurationMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* View Mode Tabs and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveViewMode('sideBySide')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'sideBySide'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Side-by-Side Verification
              </button>
              <button
                onClick={() => setActiveViewMode('combined')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'combined'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Combined Document
              </button>
              <button
                onClick={() => setActiveViewMode('byPage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'byPage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Page-by-Page
              </button>
            </div>

            {/* In-text search box */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recognized text..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Page Selector Tabs (when multiple pages) */}
          {ocrResult.pages.length > 1 && activeViewMode !== 'combined' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {ocrResult.pages.map((p, idx) => (
                <button
                  key={p.pageNumber}
                  onClick={() => setActivePageIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    activePageIdx === idx
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Page {p.pageNumber} ({p.wordsCount} words · {p.confidence}%)
                </button>
              ))}
            </div>
          )}

          {/* VIEW MODE 1: Side-by-side Verification (Image vs OCR Text) */}
          {activeViewMode === 'sideBySide' && activePage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: High-Res Scanned Page Image Preview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Scanned Source Image (Page {activePage.pageNumber})
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                      {scaleFactor}x Resolution
                    </span>
                  </div>
                  <button
                    onClick={() => setPreviewZoomImage(activePage.thumbnailUrl)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In</span>
                  </button>
                </div>

                <div className="max-h-[500px] overflow-auto rounded-xl bg-slate-950/5 dark:bg-slate-950/40 p-2 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  <img
                    src={activePage.thumbnailUrl}
                    alt={`Scanned page ${activePage.pageNumber}`}
                    className="max-h-[480px] w-auto object-contain rounded shadow-sm border border-slate-200/50"
                  />
                </div>
              </div>

              {/* Right Column: Extracted Text Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Extracted Text (Page {activePage.pageNumber})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        activePage.confidence >= 80
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : activePage.confidence >= 60
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {activePage.confidence}% Confidence
                    </span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(activePage.text, `page_${activePage.pageNumber}`)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `page_${activePage.pageNumber}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === `page_${activePage.pageNumber}` ? 'Copied!' : 'Copy Page'}</span>
                  </button>
                </div>

                <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                  {activePage.text ? (
                    renderHighlightedText(activePage.text)
                  ) : (
                    <span className="text-slate-400 italic">No text recognized on this page.</span>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{activePage.wordsCount} words · {activePage.linesCount} lines · {activePage.charactersCount} characters</span>
                  <span>Processed in {(activePage.processingTimeMs / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Combined Document View */}
          {activeViewMode === 'combined' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Extracted Document Content ({ocrResult.totalPagesProcessed} Pages Combined)
                </span>
                <button
                  onClick={() => copyToClipboard(ocrResult.combinedText, 'combined')}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'combined' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'combined' ? 'Copied Full Document!' : 'Copy Full Document'}</span>
                </button>
              </div>

              <div className="max-h-[520px] overflow-auto bg-slate-50 dark:bg-slate-950/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {renderHighlightedText(ocrResult.combinedText)}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Page-by-Page Accordion / Card List */}
          {activeViewMode === 'byPage' && (
            <div className="space-y-4">
              {ocrResult.pages.map((p) => (
                <div
                  key={p.pageNumber}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        #{p.pageNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Page {p.pageNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {p.wordsCount} words · {p.charactersCount} characters · {p.confidence}% confidence
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(p.text, `card_${p.pageNumber}`)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `card_${p.pageNumber}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === `card_${p.pageNumber}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-auto bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                    {p.text ? renderHighlightedText(p.text) : <span className="text-slate-400 italic">No text recognized</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal image zoom */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 border border-slate-800 overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-10 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <img
              src={previewZoomImage}
              alt="High-resolution zoomed scan"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
