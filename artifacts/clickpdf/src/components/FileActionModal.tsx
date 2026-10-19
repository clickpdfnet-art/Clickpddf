import React from 'react';
import { PDFTool } from '../types';
import { ToolIcon } from './ToolIcon';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  X,
  Sparkles,
  ArrowRight,
  HardDrive,
  Layers,
  Minimize2,
  Scissors,
  RotateCw,
  Stamp,
  Hash,
  LayoutGrid,
  FileSearch,
  Lock
} from 'lucide-react';

interface FileActionModalProps {
  isOpen: boolean;
  file?: File | null;
  files?: File[];
  tools: PDFTool[];
  onSelectTool: (tool: PDFTool, files: File[]) => void;
  onOpenBatchQueue?: (files: File[]) => void;
  onClose: () => void;
}

export const FileActionModal: React.FC<FileActionModalProps> = ({
  isOpen,
  file,
  files,
  tools,
  onSelectTool,
  onOpenBatchQueue,
  onClose
}) => {
  const { getToolTitle, getToolDescription } = useLanguage();

  const allFiles = React.useMemo(() => {
    if (files && files.length > 0) return files;
    if (file) return [file];
    return [];
  }, [files, file]);

  if (!isOpen || allFiles.length === 0) return null;

  const primaryFile = allFiles[0];
  const isMulti = allFiles.length > 1;
  const totalSizeBytes = allFiles.reduce((acc, f) => acc + f.size, 0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Group or rank popular tools first for quick access
  const priorityIds = ['compress', 'merge', 'organize', 'rotate', 'split', 'protect', 'metadata', 'watermark'];
  const priorityTools = tools.filter(t => priorityIds.includes(t.id));
  const otherTools = tools.filter(t => !priorityIds.includes(t.id) && t.id !== 'jpg-to-pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-action-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center ring-1 ring-indigo-200 dark:ring-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="file-action-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {isMulti ? `${allFiles.length} Files Loaded Successfully` : 'File Loaded Successfully'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isMulti
                  ? `Choose what you would like to do with these ${allFiles.length} documents`
                  : 'Choose what you would like to do with this document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Details Card */}
        <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 break-all leading-snug"
                  title={isMulti ? `${allFiles.length} PDF Documents (${primaryFile.name} + ${allFiles.length - 1} more)` : primaryFile.name}
                >
                  {isMulti ? `${allFiles.length} PDF Documents (${primaryFile.name} + ${allFiles.length - 1} more)` : primaryFile.name}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-md shrink-0">
                  {isMulti ? `${allFiles.length} PDFs` : 'PDF'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{formatFileSize(totalSizeBytes)}</span>
                <span>•</span>
                <span>Ready for instant local browser processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Tool Options */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Recommended Actions
            </div>

            {onOpenBatchQueue && (
              <div className="mb-3">
                <button
                  onClick={() => onOpenBatchQueue(allFiles)}
                  className="w-full group flex items-start gap-3 p-3.5 text-left rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 shadow-xs transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Add to Batch Processing Queue
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-600 text-white">
                        Batch
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      {isMulti
                        ? `Process all ${allFiles.length} files sequentially in a background queue with live status.`
                        : 'Queue this file alongside other documents to apply the same operation in sequence.'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {priorityTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool, allFiles)}
                  className="group flex items-start gap-3 p-3.5 text-left rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-transform">
                    <ToolIcon name={tool.iconName} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {getToolTitle(tool)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {getToolDescription(tool)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {otherTools.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                More Tools
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {otherTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool, allFiles)}
                    className="group flex items-start gap-3 p-3 text-left rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:text-indigo-500">
                      <ToolIcon name={tool.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 block truncate">
                        {getToolTitle(tool)}
                      </span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {getToolDescription(tool)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
