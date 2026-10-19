import React, { useEffect, useState } from 'react';
import { X, Eye, FileText, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { inspectPdf } from '../utils/pdfEngine';
import { useLanguage } from '../context/LanguageContext';
import { PdfThumbnailPreviewer } from './PdfThumbnailPreviewer';

interface FilePreviewModalProps {
  file: File | null;
  onClose: () => void;
  onProcess?: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onProcess }) => {
  const { t, language } = useLanguage();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      setPageCount(null);
      return;
    }

    // Generate client-side blob URL for instant verification
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setIsLoading(true);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      inspectPdf(file)
        .then((info) => {
          setPageCount(info.pageCount);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    // Clean up memory
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !objectUrl) return null;

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              {isPdf ? <FileText className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 break-all leading-snug"
                  title={file.name}
                >
                  {file.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {t.verifiedLocal}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
                {pageCount !== null && ` · ${pageCount} ${pageCount === 1 ? 'Page' : 'Pages'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {objectUrl && (
              <a
                href={objectUrl}
                download={file.name}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Download original file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.inBrowserBadge}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title={t.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-1.5 sm:p-3 overflow-hidden relative flex items-center justify-center">
          {isPdf ? (
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner bg-slate-900 flex flex-col border border-slate-200 dark:border-slate-800">
              <PdfThumbnailPreviewer
                file={file}
                className="w-full h-full flex-1 border-0 rounded-2xl"
              />
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={objectUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.previewNotSupported}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{t.previewSandboxNote}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {objectUrl && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {t.closeBtn}
            </button>
            {onProcess && (
              <button
                onClick={() => {
                  onClose();
                  onProcess();
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {t.looksGoodBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
