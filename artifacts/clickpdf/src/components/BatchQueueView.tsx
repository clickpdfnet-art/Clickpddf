import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Play,
  RotateCw,
  Stamp,
  Hash,
  Minimize2,
  ShieldAlert,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  Upload,
  Plus,
  RefreshCw,
  Archive,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  Pause,
  X
} from 'lucide-react';
import {
  BatchItem,
  BatchToolAction,
  BatchToolOptionConfig,
  processBatchSingleFile,
  downloadAllBatchResultsAsZip
} from '../utils/batchEngine';
import { downloadBlob } from '../utils/pdfEngine';
import {
  formatMemoryErrorMessage,
  yieldToMainThread,
  auditMemoryPressure,
  MemoryAuditResult,
  executeConcurrentBatch,
  explicitMemoryCleanup
} from '../utils/memoryManager';
import { validateFileBatch } from '../utils/securitySanitizer';
import confetti from 'canvas-confetti';
import { AdsterraBanner } from './AdsterraBanner';

interface BatchQueueViewProps {
  initialFiles?: File[];
  onBackToHome: () => void;
  onClearInitialFiles?: () => void;
}

export const BatchQueueView: React.FC<BatchQueueViewProps> = ({
  initialFiles,
  onBackToHome,
  onClearInitialFiles,
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [selectedAction, setSelectedAction] = useState<BatchToolAction>('compress');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeProcessingId, setActiveProcessingId] = useState<string | null>(null);
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [autoDownloadSeconds, setAutoDownloadSeconds] = useState<number | null>(null);
  const [autoDownloadCancelled, setAutoDownloadCancelled] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const autoDownloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration options
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#EF4444');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right' | 'top-center'>('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState<'Page {n} of {total}' | '{n} / {total}' | '{n}'>('Page {n} of {total}');
  const [pageNumberStart, setPageNumberStart] = useState(1);
  const [protectPassword, setProtectPassword] = useState('');
  const [protectHint, setProtectHint] = useState('');
  const [concurrencySetting, setConcurrencySetting] = useState<'auto' | 1 | 2 | 3 | 4>('auto');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRequestedRef = useRef(false);
  const consumedInitialFilesRef = useRef<string | null>(null);

  const retryItem = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? {
      ...it,
      status: 'queued',
      progress: 0,
      stepDescription: 'Waiting in queue for retry',
      errorMessage: undefined
    } : it));
  };

  // Populate initial files if provided
  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) {
      consumedInitialFilesRef.current = null;
      return;
    }

    const signature = initialFiles
      .map(file => `${file.name}:${file.size}:${file.lastModified}`)
      .join('|');
    if (consumedInitialFilesRef.current === signature) return;
    consumedInitialFilesRef.current = signature;

    const batch = validateFileBatch(initialFiles, 'pdf', items.map(item => item.file));
    const newItems: BatchItem[] = batch.validFiles.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        status: 'queued',
        progress: 0,
        stepDescription: 'Waiting in queue',
        originalSize: file.size
      }));
    if (newItems.length > 0) setItems(prev => [...prev, ...newItems]);
    setUploadError(batch.errors[0] || null);
    onClearInitialFiles?.();
  }, [initialFiles, onClearInitialFiles, items]);

  const addFilesToQueue = (files: File[]) => {
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type.toLowerCase().includes('pdf'));
    const unsupportedCount = files.length - pdfFiles.length;
    const batch = validateFileBatch(pdfFiles, 'pdf', items.map(item => item.file));
    const errors = [
      ...(unsupportedCount > 0 ? [`${unsupportedCount} file(s) were skipped. This queue accepts PDF files only.`] : []),
      ...batch.errors
    ];

    const newItems: BatchItem[] = batch.validFiles.map(file => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      status: 'queued',
      progress: 0,
      stepDescription: 'Waiting in queue',
      originalSize: file.size
    }));

    if (newItems.length > 0) setItems(prev => [...prev, ...newItems]);
    setUploadError(errors[0] || null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const removeItem = (id: string) => {
    if (activeProcessingId === id && isProcessingAll) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    if (isProcessingAll) return;
    setItems([]);
  };

  const resetAllStatuses = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      status: 'queued',
      progress: 0,
      stepDescription: 'Waiting in queue',
      errorMessage: undefined,
      resultData: undefined,
      outputFileName: undefined,
      durationMs: undefined,
      savingsPercent: undefined
    })));
  };

  // Execution engine: run batch queue sequentially
  const startBatchExecution = async () => {
    if (items.length === 0 || isProcessingAll) return;

    if (selectedAction === 'protect' && (!protectPassword || protectPassword.length < 4)) {
      alert('Please enter a password with at least 4 characters to protect the files.');
      return;
    }

    cancelRequestedRef.current = false;
    setIsProcessingAll(true);
    setIsPaused(false);
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }

    const optionsConfig: BatchToolOptionConfig = {
      watermarkText,
      watermarkColor,
      watermarkOpacity,
      pageNumberPosition: pageNumberPos,
      pageNumberFormat,
      pageNumberStart,
      protectPassword,
      protectHint
    };

    const itemsToProcess = items.filter(it => it.status !== 'completed');
    if (itemsToProcess.length === 0) {
      setIsProcessingAll(false);
      return;
    }

    let actualConcurrency = 3;
    if (concurrencySetting === 'auto') {
      const audit = auditMemoryPressure(itemsToProcess.map(it => it.file));
      actualConcurrency = Math.max(1, Math.min(3, audit.recommendedConcurrency));
    } else {
      actualConcurrency = concurrencySetting;
    }

    let anyCompleted = false;

    await executeConcurrentBatch({
      items: itemsToProcess,
      concurrency: actualConcurrency,
      isCancelled: () => cancelRequestedRef.current,
      worker: async (currentItem, _index, onProgress, isCancelled) => {
        if (isCancelled()) throw new Error('Cancelled by user');
        setActiveProcessingId(currentItem.id);
        const startTime = performance.now();
        const result = await processBatchSingleFile(
          currentItem.file,
          selectedAction,
          optionsConfig,
          (percent, text) => {
            onProgress(percent, text);
            setItems(prev => prev.map(it => it.id === currentItem.id ? {
              ...it,
              progress: percent,
              stepDescription: text
            } : it));
          }
        );
        const duration = Math.round(performance.now() - startTime);
        anyCompleted = true;
        return { result, duration };
      },
      onItemStart: (currentItem) => {
        setItems(prev => prev.map(it => it.id === currentItem.id ? {
          ...it,
          status: 'processing',
          progress: 5,
          stepDescription: 'Processing in local browser memory...'
        } : it));
      },
      onItemSuccess: (currentItem, _index, { result, duration }) => {
        setItems(prev => prev.map(it => it.id === currentItem.id ? {
          ...it,
          status: 'completed',
          progress: 100,
          stepDescription: result.details || 'Processing complete',
          resultData: result.data,
          outputFileName: result.outputName,
          outputSize: result.data.byteLength,
          savingsPercent: result.savingsPercent,
          pageCount: result.pageCount,
          durationMs: duration
        } : it));
      },
      onItemError: (currentItem, _index, err) => {
        const errorMsg = formatMemoryErrorMessage(err, currentItem.file.name);
        setItems(prev => prev.map(it => it.id === currentItem.id ? {
          ...it,
          status: 'error',
          progress: 100,
          stepDescription: 'Memory / Processing Limit',
          errorMessage: errorMsg
        } : it));
      }
    });

    setActiveProcessingId(null);
    setIsProcessingAll(false);

    if (anyCompleted) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      // 5-second auto download of batch ZIP archive
      if (!autoDownloadCancelled) {
        setAutoDownloadSeconds(5);
        if (autoDownloadTimerRef.current) clearInterval(autoDownloadTimerRef.current);
        autoDownloadTimerRef.current = setInterval(() => {
          setAutoDownloadSeconds(prev => {
            if (prev === null) return null;
            if (prev <= 1) {
              if (autoDownloadTimerRef.current) {
                clearInterval(autoDownloadTimerRef.current);
                autoDownloadTimerRef.current = null;
              }
              handleDownloadAllZip();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleStop = () => {
    cancelRequestedRef.current = true;
    setIsProcessingAll(false);
    setActiveProcessingId(null);
  };

  const handleDownloadSingle = (item: BatchItem) => {
    if (!item.resultData) return;
    const isJson = item.outputFileName?.endsWith('.json');
    downloadBlob(item.resultData, item.outputFileName || 'document.pdf', isJson ? 'application/json' : 'application/pdf');
  };

  const handleDownloadAllZip = async () => {
    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }
    setAutoDownloadSeconds(null);
    setIsPackagingZip(true);
    try {
      const actionLabel = selectedAction.replace('-', '_');
      await downloadAllBatchResultsAsZip(items, `clickpdf_batch_${actionLabel}.zip`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate ZIP archive.');
    } finally {
      setIsPackagingZip(false);
    }
  };

  // Metrics
  const completedCount = items.filter(i => i.status === 'completed').length;
  const queuedCount = items.filter(i => i.status === 'queued').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const processingCount = items.filter(i => i.status === 'processing').length;
  const totalCount = items.length;
  const overallPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const availableActions: {
    id: BatchToolAction;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'compress',
      title: 'Compress PDF',
      description: 'Optimize binary streams & strip overhead',
      icon: <Minimize2 className="w-4 h-4 text-emerald-500" />,
      color: 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
    },
    {
      id: 'rotate-90',
      title: 'Rotate 90° CW',
      description: 'Turn all pages clockwise by 90 degrees',
      icon: <RotateCw className="w-4 h-4 text-indigo-500" />,
      color: 'border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/20'
    },
    {
      id: 'rotate-180',
      title: 'Rotate 180°',
      description: 'Flip all document pages upside down',
      icon: <RotateCw className="w-4 h-4 text-purple-500" />,
      color: 'border-purple-500/40 bg-purple-50/30 dark:bg-purple-950/20'
    },
    {
      id: 'watermark',
      title: 'Watermark Stamp',
      description: 'Overlay custom diagonal text on all pages',
      icon: <Stamp className="w-4 h-4 text-pink-500" />,
      color: 'border-pink-500/40 bg-pink-50/30 dark:bg-pink-950/20'
    },
    {
      id: 'page-numbers',
      title: 'Page Numbers',
      description: 'Insert sequential footer pagination',
      icon: <Hash className="w-4 h-4 text-violet-500" />,
      color: 'border-violet-500/40 bg-violet-50/30 dark:bg-violet-950/20'
    },
    {
      id: 'sanitize',
      title: 'Sanitize Metadata',
      description: 'Purge author, dates, and software tags',
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      color: 'border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20'
    },
    {
      id: 'protect',
      title: 'AES-256 Encrypt',
      description: 'Password-protect with Web Crypto container',
      icon: <Lock className="w-4 h-4 text-rose-500" />,
      color: 'border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20'
    },
    {
      id: 'analyze',
      title: 'Inspect & Count',
      description: 'Extract page counts, dimensions & JSON spec',
      icon: <FileSearch className="w-4 h-4 text-cyan-500" />,
      color: 'border-cyan-500/40 bg-cyan-50/30 dark:bg-cyan-950/20'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdsterraBanner className="mb-4" />
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Back to All PDF Tools</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Client-Side Parallel Memory Queue</span>
          </div>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Batch Processing Queue
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
                  Sequential Engine
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                Upload multiple documents at once and apply the identical transformation across all files sequentially,
                monitoring progress indicators and downloading results individually or in a unified ZIP bundle.
              </p>
            </div>
          </div>

          {/* Aggregate progress stat */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 min-w-[220px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Overall Progress</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{completedCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span>{overallPercent}% completed</span>
              {errorCount > 0 && <span className="text-rose-500 font-semibold">{errorCount} errors</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Tool Selection (Step 1) & Queue Management (Step 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Action Selector & Action Settings (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Chooser Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Step 1: Choose Batch Action</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableActions.map(action => {
                const isSelected = selectedAction === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (isProcessingAll) return;
                      setSelectedAction(action.id);
                    }}
                    disabled={isProcessingAll}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
                    } ${isProcessingAll ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                        {action.icon}
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{action.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Dynamic Settings */}
            {selectedAction === 'watermark' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Watermark Settings</span>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Stamp Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={e => setWatermarkColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{watermarkColor}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={e => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedAction === 'page-numbers' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pagination Settings</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Position</label>
                    <select
                      value={pageNumberPos}
                      onChange={e => setPageNumberPos(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-center">Top Center</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Format</label>
                    <select
                      value={pageNumberFormat}
                      onChange={e => setPageNumberFormat(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Page {n} of {total}">Page 1 of 10</option>
                      <option value="{n} / {total}">1 / 10</option>
                      <option value="{n}">1</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Start Count At</label>
                  <input
                    type="number"
                    min="1"
                    value={pageNumberStart}
                    onChange={e => setPageNumberStart(parseInt(e.target.value) || 1)}
                    className="w-24 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}

            {selectedAction === 'protect' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Crypto Container Key</span>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Encryption Password *</label>
                  <input
                    type="password"
                    value={protectPassword}
                    onChange={e => setProtectPassword(e.target.value)}
                    placeholder="Enter password (min 4 chars)"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Password Hint (optional)</label>
                  <input
                    type="text"
                    value={protectHint}
                    onChange={e => setProtectHint(e.target.value)}
                    placeholder="e.g. My university ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sequential Execution Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Queue Controls
            </h3>

            {/* Bounded Concurrency Selector */}
            <div className="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Concurrency Limiter</span>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {concurrencySetting === 'auto' ? 'Auto (Smart)' : `${concurrencySetting} file${concurrencySetting > 1 ? 's' : ''} at once`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-center">
                <button
                  type="button"
                  onClick={() => setConcurrencySetting('auto')}
                  className={`py-1 rounded transition-all cursor-pointer ${
                    concurrencySetting === 'auto' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                  title="Adapts based on total memory weight and device RAM"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setConcurrencySetting(1)}
                  className={`py-1 rounded transition-all cursor-pointer ${
                    concurrencySetting === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                  title="Strict Serial Queue (Recommended for large 100MB+ files)"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setConcurrencySetting(2)}
                  className={`py-1 rounded transition-all cursor-pointer ${
                    concurrencySetting === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => setConcurrencySetting(3)}
                  className={`py-1 rounded transition-all cursor-pointer ${
                    concurrencySetting === 3 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => setConcurrencySetting(4)}
                  className={`py-1 rounded transition-all cursor-pointer ${
                    concurrencySetting === 4 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  4
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                Limits simultaneous V8 heap operations to prevent browser crashes when processing batches of 15-50+ files.
              </p>
            </div>

            <div className="space-y-2.5">
              {!isProcessingAll ? (
                <button
                  onClick={startBatchExecution}
                  disabled={items.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    items.length === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
                  }`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Batch Processing ({items.length} Files)</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop / Abort Processing</span>
                </button>
              )}

              {completedCount > 0 && autoDownloadSeconds !== null && autoDownloadSeconds > 0 && !autoDownloadCancelled && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Auto-downloading ZIP in <strong>{autoDownloadSeconds}s</strong>...</span>
                  </div>
                  <button
                    onClick={() => {
                      if (autoDownloadTimerRef.current) clearInterval(autoDownloadTimerRef.current);
                      setAutoDownloadCancelled(true);
                      setAutoDownloadSeconds(null);
                    }}
                    className="text-[11px] underline text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isPackagingZip}
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border border-slate-700/50"
                >
                  {isPackagingZip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Generating ZIP Archive...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 text-cyan-400" />
                      <span>Download All as ZIP ({completedCount})</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={resetAllStatuses}
                  disabled={isProcessingAll || items.length === 0}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Reset Statuses
                </button>
                <button
                  onClick={clearQueue}
                  disabled={isProcessingAll || items.length === 0}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Clear Queue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Area & Sequential Items Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Always-mounted hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {uploadError && (
            <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
              {uploadError}
            </div>
          )}

          {/* Multi-file Dropzone - Disappears once files are added */}
          {items.length === 0 && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-900/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 rounded-2xl p-6 text-center transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Drop multiple PDF files here, or click to browse
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select 2, 10, or 50+ PDF documents. All processing runs 100% in local memory.
              </p>
            </div>
          )}

          {/* Queue List Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Batch File Queue ({items.length})
              </span>
              {queuedCount > 0 && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  {queuedCount} queued
                </span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingAll}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Files</span>
            </button>
          </div>

          {/* Queue Items */}
          {items.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-400" />
              <p className="text-sm font-medium">No files added to the queue yet.</p>
              <p className="text-xs mt-1">Drag and drop multiple PDFs above to start batch processing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const isItemProcessing = item.status === 'processing';
                const isItemCompleted = item.status === 'completed';
                const isItemError = item.status === 'error';
                const isItemQueued = item.status === 'queued';

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all shadow-2xs ${
                      isItemProcessing
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : isItemCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/10 dark:bg-emerald-950/10'
                        : isItemError
                        ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/10 dark:bg-rose-950/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Item row header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Index marker */}
                        <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.file.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{formatBytes(item.originalSize)}</span>
                            {item.outputSize && (
                              <>
                                <span>→</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {formatBytes(item.outputSize)}
                                </span>
                              </>
                            )}
                            {item.savingsPercent !== undefined && item.savingsPercent > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ({item.savingsPercent}% saved)
                              </span>
                            )}
                            {item.durationMs && (
                              <span>· {item.durationMs}ms</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isItemQueued && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            <span>Queued</span>
                          </div>
                        )}
                        {isItemProcessing && (
                          <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded font-semibold animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>Processing</span>
                          </div>
                        )}
                        {isItemCompleted && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Done</span>
                          </div>
                        )}
                        {isItemError && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded font-semibold border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Memory / Read Error</span>
                            </div>
                            {!isProcessingAll && (
                              <button
                                onClick={() => retryItem(item.id)}
                                title="Retry processing this file"
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Individual Download if completed */}
                        {isItemCompleted && item.resultData && (
                          <button
                            onClick={() => handleDownloadSingle(item)}
                            title="Download processed file"
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {/* Remove from queue */}
                        {!isProcessingAll && (
                          <button
                            onClick={() => removeItem(item.id)}
                            title="Remove file from queue"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator Bar */}
                    <div className="space-y-1.5 mt-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 rounded-full ${
                            isItemCompleted
                              ? 'bg-emerald-500'
                              : isItemError
                              ? 'bg-rose-500'
                              : isItemProcessing
                              ? 'bg-indigo-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`truncate ${
                          isItemError
                            ? 'text-rose-600 dark:text-rose-400 font-medium'
                            : isItemCompleted
                            ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.errorMessage || item.stepDescription}
                        </span>
                        <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px] shrink-0 ml-2">
                          {item.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
