import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  FileText,
  Eye,
  Trash2,
  MoveUp,
  MoveDown,
  ArrowUpDown,
  FileCheck,
  Image as ImageIcon,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export interface OrderedFile {
  id: string;
  file: File;
}

export interface ProcessedFileInfo {
  data: Uint8Array | Blob;
  fileName: string;
  originalSize?: number;
  newSize?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  savedPercent?: number;
  autoDownloadSeconds?: number | null;
  autoDownloaded?: boolean;
}

interface SortableFileCardProps {
  item: OrderedFile;
  index: number;
  total: number;
  isMultiFile: boolean;
  processedInfo?: ProcessedFileInfo;
  language?: string;
  onPreview: (file: File) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDownloadSingle?: (item: OrderedFile, info: ProcessedFileInfo) => void;
}

const SortableFileCard: React.FC<SortableFileCardProps> = ({
  item,
  index,
  total,
  isMultiFile,
  processedInfo,
  language,
  onPreview,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDownloadSingle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImage = (item.file.type || '').startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(item.file.name);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only generate object URL thumbnail for first 16 images to conserve GPU/RAM texture memory
    if (isImage && index < 16) {
      try {
        const url = URL.createObjectURL(item.file);
        setThumbUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch {
        setThumbUrl(null);
      }
    }
    return undefined;
  }, [item.file, isImage, index]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl border text-xs transition-all ${
        isDragging
          ? 'z-40 bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-500 shadow-md ring-2 ring-indigo-400/40 opacity-90'
          : processedInfo?.status === 'done'
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400'
          : processedInfo?.status === 'error'
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 hover:border-rose-400'
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/70'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Drag handle */}
        {isMultiFile && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-200/50 dark:hover:bg-slate-700/50 touch-none transition-colors"
            title="Drag to reorder"
            aria-label={`Drag to reorder file ${item.file.name}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Sequential Index Badge */}
        {isMultiFile && (
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 border ${
              processedInfo?.status === 'done'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : processedInfo?.status === 'error'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                : index === 0
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            }`}
            title={`File #${index + 1}`}
          >
            {index + 1}
          </span>
        )}

        {/* File Icon & Info */}
        <div
          onClick={() => {
            if (processedInfo?.status === 'done' && processedInfo.data) {
              const blob = new Blob([processedInfo.data as unknown as BlobPart], { type: 'application/pdf' });
              const procFile = new File([blob], processedInfo.fileName || item.file.name, { type: 'application/pdf' });
              onPreview(procFile);
            } else {
              onPreview(item.file);
            }
          }}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group/info flex-1"
          title="Click to preview file"
        >
          {isImage && thumbUrl ? (
            <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 group-hover/info:scale-105 transition-transform shadow-2xs">
              <img
                src={thumbUrl}
                alt={item.file.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 group-hover/info:scale-105 transition-transform ${
              processedInfo?.status === 'done'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : processedInfo?.status === 'error'
                ? 'bg-rose-100/70 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isImage ? <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> : <FileText className="w-4 h-4" />}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm line-clamp-2 break-all group-hover/info:text-indigo-600 dark:group-hover/info:text-indigo-400 transition-colors leading-snug"
              title={item.file.name}
            >
              {item.file.name}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex-wrap">
              <span>{formatSize(item.file.size)}</span>
              {processedInfo?.status === 'done' ? (
                <>
                  <span>→</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatSize(processedInfo.newSize || 0)}
                  </span>
                  {typeof processedInfo.savedPercent === 'number' && processedInfo.savedPercent > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      -{processedInfo.savedPercent}%
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                </>
              ) : processedInfo?.status === 'processing' ? (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </span>
                </>
              ) : processedInfo?.status === 'error' ? (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    <span>Failed (Memory Limit)</span>
                  </span>
                </>
              ) : (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="w-3 h-3" />
                    <span>Ready</span>
                  </span>
                </>
              )}
            </div>

            {/* Error Message Details Callout */}
            {processedInfo?.status === 'error' && (
              <div className="mt-1.5 p-2 rounded-md bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-1.5 font-medium leading-tight">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="break-words">{processedInfo.errorMessage || 'File is too large for browser memory. Other files remain safe.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {/* Direct Individual Download Button for this file once completed */}
        {processedInfo?.status === 'done' && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadSingle?.(item, processedInfo);
              }}
              className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-bold shadow-xs text-xs"
              title={`Download ${item.file.name}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* 5-Second Auto-Download Countdown Badge */}
            {typeof processedInfo.autoDownloadSeconds === 'number' && processedInfo.autoDownloadSeconds > 0 && !processedInfo.autoDownloaded && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Auto: {processedInfo.autoDownloadSeconds}s</span>
              </span>
            )}

            {processedInfo.autoDownloaded && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Downloaded ✓</span>
              </span>
            )}
          </div>
        )}

        {/* Processing Spinner Badge in action row */}
        {processedInfo?.status === 'processing' && (
          <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-lg flex items-center gap-1 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={() => {
            if (processedInfo?.status === 'done' && processedInfo.data) {
              const blob = new Blob([processedInfo.data as unknown as BlobPart], { type: 'application/pdf' });
              const procFile = new File([blob], processedInfo.fileName || item.file.name, { type: 'application/pdf' });
              onPreview(procFile);
            } else {
              onPreview(item.file);
            }
          }}
          className="px-2.5 py-1 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white bg-indigo-50/70 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-semibold border border-indigo-100 dark:border-indigo-800"
          title={processedInfo?.status === 'done' ? 'Preview processed file' : 'Preview this file'}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Keyboard/Accessible Move Arrows */}
        {isMultiFile && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              title="Move Up"
              aria-label={`Move ${item.file.name} up`}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <MoveUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={index === total - 1}
              title="Move Down"
              aria-label={`Move ${item.file.name} down`}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <MoveDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="Remove file"
          aria-label={`Remove ${item.file.name}`}
          className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer ml-0.5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface SortableFileListProps {
  items: OrderedFile[];
  isMultiFile: boolean;
  toolId: string;
  processedFiles?: Record<string, ProcessedFileInfo>;
  language?: string;
  onReorder: (newItems: OrderedFile[]) => void;
  onPreview: (file: File) => void;
  onRemove: (index: number) => void;
  onClearAll?: () => void;
  onDownloadSingle?: (item: OrderedFile, info: ProcessedFileInfo) => void;
}

export const SortableFileList: React.FC<SortableFileListProps> = ({
  items,
  isMultiFile,
  toolId,
  processedFiles,
  language,
  onReorder,
  onPreview,
  onRemove,
  onClearAll,
  onDownloadSingle,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // 4px drag activation prevents accidental drags on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Guarantee strict uniqueness of IDs to prevent @dnd-kit collisions
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((it) => {
      if (!it || !it.id) return false;
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = uniqueItems.findIndex((item) => item.id === active.id);
      const newIndex = uniqueItems.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(uniqueItems, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const reordered = arrayMove(uniqueItems, index, index - 1);
      onReorder(reordered);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < uniqueItems.length - 1) {
      const reordered = arrayMove(uniqueItems, index, index + 1);
      onReorder(reordered);
    }
  };

  const handleReverse = () => {
    onReorder([...uniqueItems].reverse());
  };

  const handleSortByName = () => {
    const sorted = [...uniqueItems].sort((a, b) =>
      a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    onReorder(sorted);
  };

  // Render all uploaded items directly with virtual/smooth DOM handling
  const displayItems = uniqueItems;

  const totalBatchBytes = React.useMemo(() => {
    return uniqueItems.reduce((acc, it) => acc + (it.file.size || 0), 0);
  }, [uniqueItems]);

  const totalBatchMb = totalBatchBytes / (1024 * 1024);

  const errorFilesCount = React.useMemo(() => {
    if (!processedFiles) return 0;
    return uniqueItems.filter(it => processedFiles[it.id]?.status === 'error').length;
  }, [uniqueItems, processedFiles]);

  return (
    <div>
      {/* Batch Health & Concurrency Guard Bar for multiple files */}
      {uniqueItems.length > 3 && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {uniqueItems.length} documents
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {totalBatchMb >= 1 ? `${totalBatchMb.toFixed(1)} MB` : `${(totalBatchBytes / 1024).toFixed(0)} KB`} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>RAM Isolation Guard Active</span>
            </span>

            {errorFilesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>{errorFilesCount} memory limit{errorFilesCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>
      )}
      {/* Informative reorder banner for Merge tool or multi-file workflows */}
      {isMultiFile && uniqueItems.length > 1 && (
        <div className="mb-3 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <ArrowUpDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {toolId === 'merge' ? (
                <>
                  <strong className="font-semibold">Drag and drop</strong> files by their handle to adjust merge order. Documents will merge sequentially from <strong className="font-semibold">#1 to #{uniqueItems.length}</strong>.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Drag & drop</strong> to reorder files as needed (<span className="font-bold text-indigo-700 dark:text-indigo-300">{uniqueItems.length}</span> files loaded).
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleSortByName}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
              title="Sort files by name (A-Z)"
            >
              A-Z
            </button>
            <button
              type="button"
              onClick={handleReverse}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
              title="Reverse file sequence"
            >
              Reverse
            </button>
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                title="Remove all files"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sortable List with DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayItems.map((it) => it.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5 custom-scrollbar">
            {displayItems.map((item, idx) => (
              <SortableFileCard
                key={item.id}
                item={item}
                index={idx}
                total={uniqueItems.length}
                isMultiFile={isMultiFile}
                processedInfo={processedFiles?.[item.id]}
                language={language}
                onPreview={onPreview}
                onRemove={onRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDownloadSingle={onDownloadSingle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>


    </div>
  );
};
