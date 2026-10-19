import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  User,
  Calendar,
  Cpu,
  Layers,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Tag,
  Maximize2,
  Lock,
  Unlock,
  Sparkles,
  FileCode,
  ShieldAlert,
  Hash,
  Printer,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  ScanText
} from 'lucide-react';
import {
  extractPdfMetadata,
  countPdfPages,
  sanitizePdfMetadata,
  downloadBlob,
  PdfTechnicalMetadata,
  PdfPageCountAnalysis,
  PageBreakdownItem
} from '../utils/pdfEngine';
import { OcrAnalysisPanel } from './OcrAnalysisPanel';
import confetti from 'canvas-confetti';

interface MetadataInspectorProps {
  file: File;
  onPreviewRequested?: () => void;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({ file, onPreviewRequested }) => {
  const [metadata, setMetadata] = useState<PdfTechnicalMetadata | null>(null);
  const [pageAnalysis, setPageAnalysis] = useState<PdfPageCountAnalysis | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'pageCount' | 'ocr' | 'inventory' | 'metadata'>('pageCount');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [strippedSuccess, setStrippedSuccess] = useState(false);

  // Inventory filtering state
  const [pageSearch, setPageSearch] = useState('');
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'portrait' | 'landscape'>('all');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setStrippedSuccess(false);

    Promise.all([
      extractPdfMetadata(file),
      countPdfPages(file)
    ])
      .then(([metaData, pageData]) => {
        if (isMounted) {
          setMetadata(metaData);
          setPageAnalysis(pageData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Metadata/Page extraction notice:', err);
          setError('Failed to analyze PDF file. The file may be password encrypted or corrupted.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [file]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyPageCount = () => {
    if (!pageAnalysis) return;
    copyToClipboard(`${pageAnalysis.totalPages} ${pageAnalysis.totalPages === 1 ? 'page' : 'pages'}`, 'page_count');
  };

  const handleCopyJson = () => {
    if (!metadata || !pageAnalysis) return;
    const combined = {
      ...metadata,
      pageAnalysis
    };
    const jsonStr = JSON.stringify(combined, null, 2);
    copyToClipboard(jsonStr, 'all_json');
  };

  const handleDownloadJson = () => {
    if (!metadata || !pageAnalysis) return;
    const combined = {
      ...metadata,
      pageAnalysis
    };
    const jsonStr = JSON.stringify(combined, null, 2);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);
    const downloadName = `${metadata.fileName.replace(/\.pdf$/i, '')}_analysis_report.json`;
    downloadBlob(data, downloadName, 'application/json');
  };

  const handleDownloadPageCsv = () => {
    if (!pageAnalysis) return;
    const header = 'Page Number,Orientation,Paper Format,Width (mm),Height (mm),Width (in),Height (in),Width (pt),Height (pt),Aspect Ratio\n';
    const rows = pageAnalysis.pages.map(p =>
      `${p.pageNumber},${p.orientation},${p.paperFormat},${p.widthMm},${p.heightMm},${p.widthInches},${p.heightInches},${p.widthPoints},${p.heightPoints},"${p.aspectRatio}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const downloadName = `${file.name.replace(/\.pdf$/i, '')}_page_manifest.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTextReport = () => {
    if (!metadata || !pageAnalysis) return;
    const report = `=====================================================
CLICKPDF ANALYSIS & TOTAL PAGE COUNT REPORT (100% IN-BROWSER)
=====================================================
File Name:              ${metadata.fileName}
File Size:              ${metadata.fileSizeFormatted} (${metadata.fileSizeBytes.toLocaleString()} bytes)
Total Pages:            ${pageAnalysis.totalPages}
PDF Specification:      ${metadata.pdfVersion}
Encryption State:       ${metadata.isEncrypted ? 'Encrypted / Protected' : 'None (Standard)'}

-----------------------------------------------------
PAGE STRUCTURE & COUNT ANALYSIS:
-----------------------------------------------------
Total Page Count:       ${pageAnalysis.totalPages}
Portrait Pages:         ${pageAnalysis.portraitCount}
Landscape Pages:        ${pageAnalysis.landscapeCount}
Square Pages:           ${pageAnalysis.squareCount}
Odd / Even Pages:       ${pageAnalysis.oddPagesCount} Odd / ${pageAnalysis.evenPagesCount} Even
Primary Paper Format:   ${pageAnalysis.primaryPaperFormat}
Uniformity:             ${pageAnalysis.isUniformDimensions ? 'Uniform Dimensions across all pages' : 'Mixed page dimensions'}
Duplex Sheets Needed:   ${pageAnalysis.duplexSheetsRequired} sheets (Double-sided printing)
Simplex Sheets Needed:  ${pageAnalysis.simplexSheetsRequired} sheets (Single-sided printing)
Est. Reading Time:      ~${pageAnalysis.estimatedReadTimeMinutes} minutes

-----------------------------------------------------
AUTHORSHIP & PROVENANCE:
-----------------------------------------------------
Title:                  ${metadata.title || 'Not specified'}
Author:                 ${metadata.author || 'Not specified'}
Producer:               ${metadata.producer || 'Not specified'}
Creator:                ${metadata.creator || 'Not specified'}
Subject:                ${metadata.subject || 'Not specified'}
Keywords:               ${metadata.keywords.length > 0 ? metadata.keywords.join(', ') : 'None'}

-----------------------------------------------------
TIMESTAMPS:
-----------------------------------------------------
Creation Date:          ${metadata.creationDate || 'Not specified'}
Creation ISO:           ${metadata.creationDateIso || 'N/A'}
Modification Date:      ${metadata.modificationDate || 'Not specified'}
Modification ISO:       ${metadata.modificationDateIso || 'N/A'}

=====================================================
Generated client-side via ClickPDF with zero server uploads.
`;
    const encoder = new TextEncoder();
    const data = encoder.encode(report);
    const downloadName = `${metadata.fileName.replace(/\.pdf$/i, '')}_analysis_report.txt`;
    downloadBlob(data, downloadName, 'text/plain');
  };

  const handleSanitizeAndDownload = async () => {
    try {
      setIsStripping(true);
      const cleanBytes = await sanitizePdfMetadata(file);
      const cleanName = `anonymized_${file.name}`;
      downloadBlob(cleanBytes, cleanName);
      setStrippedSuccess(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (e: any) {
      alert(`Error stripping metadata: ${e.message}`);
    } finally {
      setIsStripping(false);
    }
  };

  // Filtered pages for inventory view
  const filteredPages = useMemo(() => {
    if (!pageAnalysis) return [];
    return pageAnalysis.pages.filter((page) => {
      const matchesSearch =
        pageSearch.trim() === '' ||
        page.pageNumber.toString().includes(pageSearch.trim()) ||
        page.paperFormat.toLowerCase().includes(pageSearch.toLowerCase());

      const matchesOrientation =
        orientationFilter === 'all' ||
        page.orientation.toLowerCase() === orientationFilter;

      return matchesSearch && matchesOrientation;
    });
  }, [pageAnalysis, pageSearch, orientationFilter]);

  if (isLoading) {
    return (
      <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center animate-pulse">
        <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
          <Cpu className="w-6 h-6 animate-spin" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Analyzing PDF Document & Counting Pages...
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Parsing page dictionary tree, page dimensions, binary metadata, and structures in browser memory.
        </p>
      </div>
    );
  }

  if (error || !metadata || !pageAnalysis) {
    return (
      <div className="mt-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center text-xs text-rose-700 dark:text-rose-300">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600 dark:text-rose-400" />
        <p className="font-semibold">{error || 'Could not analyze document.'}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 break-all leading-snug"
                  title={metadata.fileName}
                >
                  {metadata.fileName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {metadata.pdfVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {metadata.fileSizeFormatted} · {pageAnalysis.totalPages} {pageAnalysis.totalPages === 1 ? 'Page' : 'Pages'} · {metadata.isEncrypted ? 'Encrypted' : 'Unencrypted'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyPageCount}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'page_count' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Hash className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'page_count' ? 'Copied Count!' : `Copy: ${pageAnalysis.totalPages} Pages`}</span>
            </button>

            {onPreviewRequested && (
              <button
                onClick={onPreviewRequested}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Preview Document</span>
              </button>
            )}

            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'all_json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'all_json' ? 'JSON Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveInspectorTab('pageCount')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeInspectorTab === 'pageCount'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Page Count & Structure Utility</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold ml-1">
              {pageAnalysis.totalPages}
            </span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('ocr')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeInspectorTab === 'ocr'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ScanText className="w-3.5 h-3.5 text-cyan-500" />
            <span>OCR Text Recognition</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-extrabold ml-1">
              Tesseract.js
            </span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('inventory')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeInspectorTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Per-Page Inventory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-1">
              {pageAnalysis.pages.length} Pages
            </span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('metadata')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeInspectorTab === 'metadata'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Technical Metadata & Origin</span>
          </button>
        </div>

        {/* Highlight Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-center">
          <div className="p-3 rounded-xl bg-gradient-to-b from-indigo-50/80 to-indigo-100/30 dark:from-indigo-950/50 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-900/60">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block tracking-wider">
              Total Page Count
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">
              {pageAnalysis.totalPages} {pageAnalysis.totalPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">File Size</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{metadata.fileSizeFormatted}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Primary Format</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{pageAnalysis.primaryPaperFormat}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Security State</span>
            <span className="text-base font-extrabold flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
              {metadata.isEncrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{metadata.isEncrypted ? 'Protected' : 'Open'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: Dedicated Total Page Count & Document Structure Utility */}
      {activeInspectorTab === 'pageCount' && (
        <div className="space-y-6">
          {/* Hero Page Counter Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <span>Document Page Verification Utility</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-3">
                  <span>{pageAnalysis.totalPages}</span>
                  <span className="text-lg sm:text-xl font-medium text-indigo-200">
                    Total {pageAnalysis.totalPages === 1 ? 'Page' : 'Pages'} Detected
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-1.5 max-w-lg">
                  Analyzed 100% in-browser memory using ClickPDF engine. Verified across all document stream trees with complete geometry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <button
                  onClick={handleCopyPageCount}
                  className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {copiedKey === 'page_count' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                  <span>{copiedKey === 'page_count' ? 'Page Count Copied!' : `Copy "${pageAnalysis.totalPages} Pages"`}</span>
                </button>

                <button
                  onClick={handleDownloadPageCsv}
                  className="px-5 py-2.5 bg-indigo-800/80 hover:bg-indigo-800 text-white border border-indigo-700/60 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-cyan-300" />
                  <span>Export Page Inventory (.CSV)</span>
                </button>

                <button
                  onClick={() => setActiveInspectorTab('ocr')}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ScanText className="w-4 h-4 text-cyan-200" />
                  <span>OCR Scanned Text</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Inside Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/60 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-indigo-300 mb-0.5">
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">Duplex Sheets (2-Sided)</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  {pageAnalysis.duplexSheetsRequired} {pageAnalysis.duplexSheetsRequired === 1 ? 'sheet' : 'sheets'}
                </div>
                <span className="text-[10px] text-indigo-300/70">
                  {pageAnalysis.simplexSheetsRequired} sheets for 1-sided printing
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-indigo-300 mb-0.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">Orientations</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  {pageAnalysis.portraitCount} Portrait · {pageAnalysis.landscapeCount} Land.
                </div>
                <span className="text-[10px] text-indigo-300/70">
                  {pageAnalysis.squareCount > 0 ? `${pageAnalysis.squareCount} square pages` : 'Standard rectangular pages'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-indigo-300 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Estimated Read Time</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  ~{pageAnalysis.estimatedReadTimeMinutes} mins
                </div>
                <span className="text-[10px] text-indigo-300/70">Standard reading speed</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-indigo-300 mb-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">Even / Odd Split</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  {pageAnalysis.oddPagesCount} Odd · {pageAnalysis.evenPagesCount} Even
                </div>
                <span className="text-[10px] text-indigo-300/70">
                  {pageAnalysis.isUniformDimensions ? 'Uniform page dimensions' : 'Mixed dimensions detected'}
                </span>
              </div>
            </div>
          </div>

          {/* Page Structure Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card: Page Geometry & Dimensions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <span>Page Geometry & Layout</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {pageAnalysis.isUniformDimensions ? 'Uniform Format' : 'Mixed Formats'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Primary Paper Standard</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {pageAnalysis.primaryPaperFormat}
                    </span>
                  </div>
                  {metadata.firstPageDimensions && (
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {metadata.firstPageDimensions.widthMm} × {metadata.firstPageDimensions.heightMm} mm
                    </div>
                  )}
                </div>

                {metadata.firstPageDimensions && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Points (pt)</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {metadata.firstPageDimensions.widthPoints} × {metadata.firstPageDimensions.heightPoints}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inches (in)</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {metadata.firstPageDimensions.widthInches}″ × {metadata.firstPageDimensions.heightInches}″
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Millimeters</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {metadata.firstPageDimensions.widthMm} × {metadata.firstPageDimensions.heightMm} mm
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Orientation Distribution
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                      {pageAnalysis.portraitCount} Portrait
                    </span>
                    {pageAnalysis.landscapeCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                        {pageAnalysis.landscapeCount} Landscape
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Document Structure & Quick Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Page Utilities & Actions</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Export structured summaries, copy total page figures for invoicing or documentation, or inspect individual pages.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveInspectorTab('inventory')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inspect All Pages</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {pageAnalysis.totalPages} items
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Search, view dimensions, and browse every page.
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadPageCsv}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Export CSV</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        .csv format
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Spreadsheet manifest with dimensions & formats.
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadTextReport}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Audit Report</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        .txt format
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Plaintext technical report for compliance logs.
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Machine JSON</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                        .json format
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Structured schema for automation pipelines.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OCR Text Recognition Powered by Tesseract.js */}
      {activeInspectorTab === 'ocr' && (
        <OcrAnalysisPanel file={file} totalPages={pageAnalysis.totalPages} />
      )}

      {/* TAB 2: Per-Page Inventory (Detailed Table / Grid) */}
      {activeInspectorTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Page-by-Page Inventory & Dimension Manifest ({pageAnalysis.totalPages} Total)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect width, height, paper size category, and aspect ratio of every individual page.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPageCsv}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                placeholder="Search by page number (e.g. 5) or format (e.g. A4)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto">
              <button
                onClick={() => setOrientationFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  orientationFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({pageAnalysis.totalPages})
              </button>
              <button
                onClick={() => setOrientationFilter('portrait')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  orientationFilter === 'portrait'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Portrait ({pageAnalysis.portraitCount})
              </button>
              <button
                onClick={() => setOrientationFilter('landscape')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  orientationFilter === 'landscape'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Landscape ({pageAnalysis.landscapeCount})
              </button>
            </div>
          </div>

          {/* Table of Pages */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Page #</th>
                  <th className="px-4 py-2.5">Format</th>
                  <th className="px-4 py-2.5">Orientation</th>
                  <th className="px-4 py-2.5">Dimensions (mm)</th>
                  <th className="px-4 py-2.5">Dimensions (in)</th>
                  <th className="px-4 py-2.5">Points (pt)</th>
                  <th className="px-4 py-2.5 text-right">Aspect Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                      No pages matched your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((p) => (
                    <tr
                      key={p.pageNumber}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-2 font-bold text-slate-900 dark:text-white font-sans">
                        <span className="inline-flex items-center justify-center w-7 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-900/60">
                          #{p.pageNumber}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.paperFormat}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            p.orientation === 'Portrait'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {p.orientation}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {p.widthMm} × {p.heightMm} mm
                      </td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                        {p.widthInches}″ × {p.heightInches}″
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {p.widthPoints} × {p.heightPoints} pt
                      </td>
                      <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400">
                        {p.aspectRatio}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Main Technical Metadata & Origin */}
      {activeInspectorTab === 'metadata' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Authorship & Origin */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <User className="w-4 h-4" />
              <span>Authorship & Provenance</span>
            </div>

            <dl className="space-y-3.5 text-xs">
              {/* Author */}
              <div>
                <dt className="text-slate-400 font-semibold mb-0.5 flex items-center justify-between">
                  <span>Author:</span>
                  {metadata.author && (
                    <button
                      onClick={() => copyToClipboard(metadata.author!, 'author')}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedKey === 'author' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'author' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 break-words">
                  {metadata.author || <span className="text-slate-400 italic font-normal">Not specified in document</span>}
                </dd>
              </div>

              {/* Producer */}
              <div>
                <dt className="text-slate-400 font-semibold mb-0.5 flex items-center justify-between">
                  <span>PDF Producer (Library / Engine):</span>
                  {metadata.producer && (
                    <button
                      onClick={() => copyToClipboard(metadata.producer!, 'producer')}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedKey === 'producer' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'producer' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 break-words">
                  {metadata.producer || <span className="text-slate-400 italic font-normal">Not specified</span>}
                </dd>
              </div>

              {/* Creator / Application */}
              <div>
                <dt className="text-slate-400 font-semibold mb-0.5 flex items-center justify-between">
                  <span>Creator (Application Software):</span>
                  {metadata.creator && (
                    <button
                      onClick={() => copyToClipboard(metadata.creator!, 'creator')}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedKey === 'creator' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'creator' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 break-words">
                  {metadata.creator || <span className="text-slate-400 italic font-normal">Not specified</span>}
                </dd>
              </div>

              {/* Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Title:</dt>
                  <dd className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 truncate">
                    {metadata.title || <span className="text-slate-400 italic font-normal">None</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Subject:</dt>
                  <dd className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 truncate">
                    {metadata.subject || <span className="text-slate-400 italic font-normal">None</span>}
                  </dd>
                </div>
              </div>

              {/* Keywords */}
              {metadata.keywords.length > 0 && (
                <div>
                  <dt className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Keywords:</span>
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {metadata.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md text-[11px] font-medium border border-indigo-100 dark:border-indigo-800"
                      >
                        {kw}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card 2: Timestamps & Technical Dimensions */}
          <div className="space-y-5">
            {/* Timestamps */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
                <span>Timestamps & History</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Creation Date & Time:</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {metadata.creationDate || <span className="text-slate-400 italic font-normal">Not recorded</span>}
                    </p>
                    {metadata.creationDateIso && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {metadata.creationDateIso}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Last Modification Date:</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {metadata.modificationDate || <span className="text-slate-400 italic font-normal">Not modified</span>}
                    </p>
                    {metadata.modificationDateIso && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {metadata.modificationDateIso}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Page Geometry */}
            {metadata.firstPageDimensions && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <span>Page Layout & Geometry (Page 1)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Orientation</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {metadata.firstPageDimensions.orientation}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Dimensions (mm)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {metadata.firstPageDimensions.widthMm} × {metadata.firstPageDimensions.heightMm} mm
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Dimensions (in)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {metadata.firstPageDimensions.widthInches}″ × {metadata.firstPageDimensions.heightInches}″
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export & Privacy Action Panel */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Export & Privacy Actions</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download structured technical audit reports or strip identifying author metadata for privacy.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPageCsv}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={handleDownloadTextReport}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download TXT Report</span>
            </button>

            <button
              onClick={handleSanitizeAndDownload}
              disabled={isStripping}
              className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isStripping ? 'Sanitizing...' : 'Sanitize & Strip Metadata'}</span>
            </button>
          </div>
        </div>

        {strippedSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Success! Anonymized PDF with stripped Author, Producer, and Creator tags downloaded.</span>
          </div>
        )}
      </div>
    </div>
  );
};
