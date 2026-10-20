import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Tag,
  BookOpen,
  Cpu,
  Layers,
  Trash2,
  Download,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Calendar,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';
import {
  extractPdfMetadata,
  PdfTechnicalMetadata,
} from '../utils/pdfEngine';

export interface MetadataFormValues {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

interface MetadataEditorPanelProps {
  file: File;
  value: MetadataFormValues | null;
  onChange: (value: MetadataFormValues) => void;
  onProcess: (value: MetadataFormValues, sanitize?: boolean) => Promise<void>;
  fileCount: number;
  processing: boolean;
  onPreviewRequested?: () => void;
}

export const MetadataEditorPanel: React.FC<MetadataEditorPanelProps> = ({
  file, value, onChange, onProcess, fileCount, processing, onPreviewRequested
}) => {
  const [originalMeta, setOriginalMeta] = useState<PdfTechnicalMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saving = processing;

  // Editable form fields
  const emptyValues: MetadataFormValues = { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' };
  const { title, author, subject, keywords, creator, producer } = value || emptyValues;
  const updateField = (field: keyof MetadataFormValues, text: string) =>
    onChange({ ...(value || emptyValues), [field]: text });
  const setTitle = (text: string) => updateField('title', text);
  const setAuthor = (text: string) => updateField('author', text);
  const setSubject = (text: string) => updateField('subject', text);
  const setKeywords = (text: string) => updateField('keywords', text);
  const setCreator = (text: string) => updateField('creator', text);
  const setProducer = (text: string) => updateField('producer', text);
  const valuesFromMetadata = (meta: PdfTechnicalMetadata): MetadataFormValues => ({
    title: meta.title || '', author: meta.author || '', subject: meta.subject || '',
    keywords: meta.keywords?.join(', ') || '', creator: meta.creator || '', producer: meta.producer || ''
  });

  // Load metadata on file change
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const meta = await extractPdfMetadata(file);
        if (isMounted) {
          setOriginalMeta(meta);
          // Only initialize once. Changing the inspected file must not replace the shared draft.
          if (!value) onChange(valuesFromMetadata(meta));
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to inspect PDF metadata');
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleResetToOriginal = () => {
    if (!originalMeta) return;
    onChange(valuesFromMetadata(originalMeta));
  };

  const handleClearAllFields = () => {
    onChange(emptyValues);
  };

  const handleSaveAndDownload = async () => {
    try {
      setError(null);
      await onProcess(value || emptyValues);
    } catch (err: any) {
      setError(err?.message || 'Error occurred while saving metadata');
    }
  };

  const handleSanitizeAndDownload = async () => {
    try {
      setError(null);
      await onProcess(value || emptyValues, true);
    } catch (err: any) {
      setError(err?.message || 'Error occurred while sanitizing metadata');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center animate-spin mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reading PDF metadata...</h4>
        <p className="text-xs text-slate-500 mt-1">Analyzing document properties entirely in local RAM.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview & Security Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white border border-indigo-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">PDF Metadata Editor</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Inspect and modify internal document fields (Title, Author, Creator, Producer) or sanitize them for privacy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPreviewRequested && (
              <button
                type="button"
                onClick={onPreviewRequested}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Document</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-indigo-700 dark:text-indigo-300">
        These fields apply to all {fileCount} selected PDFs. Switching the preview document keeps your changes.
      </p>

      {/* Main Metadata Form Card */}
      <fieldset disabled={saving} className="min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 flex-1 mr-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Document Properties</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 break-all" title={file.name}>
              Original file: <strong className="text-slate-700 dark:text-slate-300">{file.name}</strong> ({originalMeta?.fileSizeFormatted})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToOriginal}
              title="Reset fields back to original values from document"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleClearAllFields}
              title="Clear all fields"
              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Document Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Financial Report 2026"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Displayed in PDF viewer title bars</span>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Author / Organization</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. John Doe, ClickPDF Inc."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Original author or copyright owner</span>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Subject / Topic</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quarterly audit and fiscal overview"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Brief summary or category of the file</span>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Keywords (Comma separated)</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="report, finance, 2026, clickpdf"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Indexed by search engines & PDF indexing tools</span>
          </div>

          {/* Creator / Application */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>Application / Creator</span>
            </label>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="e.g. Adobe InDesign, Microsoft Word"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Originating program used to create the document</span>
          </div>

          {/* Producer / PDF Engine */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>PDF Producer</span>
            </label>
            <input
              type="text"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              placeholder="e.g. ClickPDF Engine (pdf-lib)"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">PDF conversion software or library</span>
          </div>
        </div>

        {/* Read-Only Technical Context */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Pages</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{originalMeta?.pageCount ?? '—'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">PDF Version</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{originalMeta?.pdfVersion ?? 'PDF 1.7'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Created On</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={originalMeta?.creationDate || 'Unknown'}>
              {originalMeta?.creationDate ? originalMeta.creationDate.split(',')[0] : 'Not recorded'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Security</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {originalMeta?.isEncrypted ? 'Encrypted' : 'Unencrypted'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSanitizeAndDownload}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>{fileCount > 1 ? 'Wipe Metadata from All Files (Privacy Sanitize)' : 'Wipe All Metadata (Privacy Sanitize)'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndDownload}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{saving ? 'Processing PDFs...' : fileCount > 1 ? `Apply Metadata to All ${fileCount} PDFs` : 'Save & Download PDF'}</span>
          </button>
        </div>
      </fieldset>
    </div>
  );
};
