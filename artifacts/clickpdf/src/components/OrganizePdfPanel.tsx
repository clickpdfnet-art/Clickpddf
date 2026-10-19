import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Eye,
  FileText,
  Maximize2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Square,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  Sparkles,
  Info,
  ShieldCheck,
  Layers,
  ArrowDownUp
} from 'lucide-react';
import { getPdfPagesInfo, organizePdfPagesWithRotations, OrganizePageItem } from '../utils/pdfEngine';
import { renderAllPageThumbnails } from '../utils/pdfThumbnail';
import { useLanguage } from '../context/LanguageContext';

export interface OrganizePageCardItem {
  id: string;
  originalIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed original page number
  rotationDelta: number; // 0, 90, 180, 270
  width: number;
  height: number;
}

interface OrganizePdfPanelProps {
  file: File;
  allFiles?: File[];
  onSelectDifferentFile?: (file: File) => void;
  onOrganizeComplete: (reorganizedData: Uint8Array, activePagesCount: number, details: string) => Promise<void>;
  isProcessing: boolean;
  onPreviewOriginal?: () => void;
  onReplaceFile?: () => void;
}

export const OrganizePdfPanel: React.FC<OrganizePdfPanelProps> = ({
  file,
  allFiles = [],
  onSelectDifferentFile,
  onOrganizeComplete,
  isProcessing,
  onPreviewOriginal,
  onReplaceFile,
}) => {
  const { t } = useLanguage();
  const [pages, setPages] = useState<OrganizePageCardItem[]>([]);
  const [deletedPages, setDeletedPages] = useState<OrganizePageCardItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);
  const [thumbProgress, setThumbProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Zoom / Card size: 'sm' | 'md' | 'lg'
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Preview modal for a single page
  const [previewPage, setPreviewPage] = useState<OrganizePageCardItem | null>(null);

  // Undo notification toast for recently deleted pages
  const [lastDeletedNotice, setLastDeletedNotice] = useState<{
    item: OrganizePageCardItem;
    originalSequenceIndex: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show/Hide deleted tray
  const [showDeletedDrawer, setShowDeletedDrawer] = useState<boolean>(false);

  // Load PDF structure and render thumbnails
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingPages(true);
    setError(null);
    setPages([]);
    setDeletedPages([]);
    setSelectedIds(new Set());
    setThumbnails(new Map());
    setLastDeletedNotice(null);

    getPdfPagesInfo(file)
      .then((info) => {
        if (isCancelled) return;
        const initialCards: OrganizePageCardItem[] = info.pages.map((p, idx) => ({
          id: `page-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          originalIndex: idx,
          pageNumber: p.pageNumber,
          rotationDelta: 0,
          width: p.width,
          height: p.height,
        }));
        setPages(initialCards);
        setIsLoadingPages(false);
        setThumbProgress({ current: 0, total: info.pageCount });

        // Progressively render high-fidelity thumbnails
        renderAllPageThumbnails(
          file,
          320,
          (rendered, total) => {
            if (!isCancelled) {
              setThumbProgress({ current: rendered, total });
            }
          },
          (pageNum, dataUrl) => {
            if (!isCancelled) {
              setThumbnails((prev) => {
                const next = new Map(prev);
                next.set(pageNum, dataUrl);
                return next;
              });
            }
          }
        )
          .then((thumbMap) => {
            if (!isCancelled) {
              setThumbnails(thumbMap);
            }
          })
          .catch((err) => {
            console.warn('Organize thumbnail error:', err);
          });
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to inspect PDF structure.');
          setIsLoadingPages(false);
        }
      });

    return () => {
      isCancelled = true;
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, [file]);

  // Reordering: Move Left / Up (swap with i - 1)
  const movePageLeft = useCallback((index: number) => {
    if (index <= 0) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }, []);

  // Reordering: Move Right / Down (swap with i + 1)
  const movePageRight = useCallback((index: number) => {
    setPages((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }, []);

  // Reordering: Move to First
  const movePageToFirst = useCallback((index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  }, []);

  // Reordering: Move to Last
  const movePageToLast = useCallback((index: number) => {
    setPages((prev) => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.push(item);
      return copy;
    });
  }, []);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    setPages((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, draggedItem);
      return copy;
    });

    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Rotation: Rotate single page (+90 or -90)
  const rotatePage = useCallback((id: string, delta: number) => {
    setPages((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextRotation = ((item.rotationDelta + delta) % 360 + 360) % 360;
        return { ...item, rotationDelta: nextRotation };
      })
    );
  }, []);

  // Reset single page rotation
  const resetPageRotation = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rotationDelta: 0 } : item))
    );
  }, []);

  // Delete a single page
  const deletePage = useCallback((id: string) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const itemToDelete = prev[idx];
      setDeletedPages((d) => [...d, itemToDelete]);

      // Set undo notification
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      setLastDeletedNotice({ item: itemToDelete, originalSequenceIndex: idx });
      undoTimeoutRef.current = setTimeout(() => {
        setLastDeletedNotice(null);
      }, 6000);

      // Unselect if selected
      setSelectedIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });

      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }, []);

  // Undo last delete
  const undoLastDelete = useCallback(() => {
    if (!lastDeletedNotice) return;
    const { item, originalSequenceIndex } = lastDeletedNotice;

    setDeletedPages((d) => d.filter((p) => p.id !== item.id));
    setPages((prev) => {
      const copy = [...prev];
      const insertIdx = Math.min(originalSequenceIndex, copy.length);
      copy.splice(insertIdx, 0, item);
      return copy;
    });

    setLastDeletedNotice(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  }, [lastDeletedNotice]);

  // Restore a specific deleted page
  const restoreDeletedPage = useCallback((id: string) => {
    setDeletedPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      setPages((active) => [...active, target]);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Restore all deleted pages
  const restoreAllDeleted = useCallback(() => {
    setPages((prev) => [...prev, ...deletedPages]);
    setDeletedPages([]);
    setLastDeletedNotice(null);
  }, [deletedPages]);

  // Duplicate a single page
  const duplicatePage = useCallback((index: number) => {
    setPages((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const clone: OrganizePageCardItem = {
        ...target,
        id: `page-clone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      const copy = [...prev];
      copy.splice(index + 1, 0, clone);
      return copy;
    });
  }, []);

  // Multi-select toggle
  const toggleSelectPage = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all / Deselect all
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const invertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      pages.forEach((p) => {
        if (!prev.has(p.id)) {
          next.add(p.id);
        }
      });
      return next;
    });
  }, [pages]);

  // Batch delete selected pages
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const itemsToDelete = pages.filter((p) => selectedIds.has(p.id));
    setDeletedPages((d) => [...d, ...itemsToDelete]);
    setPages((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  }, [selectedIds, pages]);

  // Batch rotate selected pages (+90)
  const rotateSelected = useCallback((delta: number) => {
    if (selectedIds.size === 0) return;
    setPages((prev) =>
      prev.map((item) => {
        if (!selectedIds.has(item.id)) return item;
        const nextRotation = ((item.rotationDelta + delta) % 360 + 360) % 360;
        return { ...item, rotationDelta: nextRotation };
      })
    );
  }, [selectedIds]);

  // Reverse page order
  const reverseOrder = useCallback(() => {
    setPages((prev) => [...prev].reverse());
  }, []);

  // Sort by original page order
  const sortByOriginalOrder = useCallback(() => {
    setPages((prev) => [...prev].sort((a, b) => a.originalIndex - b.originalIndex));
  }, []);

  // Reset all changes (restores original pages, order, and rotations)
  const resetAllChanges = useCallback(() => {
    if (pages.length === 0 && deletedPages.length === 0) return;
    const all = [...pages, ...deletedPages];
    // deduplicate by originalIndex and sort
    const uniqueMap = new Map<number, OrganizePageCardItem>();
    all.forEach((item) => {
      if (!uniqueMap.has(item.originalIndex)) {
        uniqueMap.set(item.originalIndex, { ...item, rotationDelta: 0 });
      }
    });
    const restored = Array.from(uniqueMap.values()).sort((a, b) => a.originalIndex - b.originalIndex);
    setPages(restored);
    setDeletedPages([]);
    setSelectedIds(new Set());
    setLastDeletedNotice(null);
  }, [pages, deletedPages]);

  // Execute reorganize & generate final PDF
  const handleSaveReorganized = async () => {
    if (pages.length === 0) {
      setError('Cannot save an empty PDF document. Please keep at least one page.');
      return;
    }

    try {
      setError(null);
      const pageItems: OrganizePageItem[] = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotationDelta: p.rotationDelta,
      }));

      const outputBytes = await organizePdfPagesWithRotations(file, pageItems);
      const detailsMsg = `Reorganized ${pages.length} pages (removed ${deletedPages.length}, custom rotations preserved).`;
      await onOrganizeComplete(outputBytes, pages.length, detailsMsg);
    } catch (err: any) {
      console.warn('Error saving reorganized PDF:', err);
      setError(err?.message || 'Failed to save reorganized PDF document.');
    }
  };

  // Card grid column class depending on selected size
  const gridClass = useMemo(() => {
    switch (cardSize) {
      case 'sm':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3';
      case 'lg':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
      case 'md':
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }
  }, [cardSize]);

  return (
    <div className="space-y-6">
      {/* Top Document Header & File Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 break-all leading-snug"
                  title={file.name}
                >
                  {file.name}
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>
                  {t.organizeKeptPages}: <strong className="text-teal-600 dark:text-teal-400">{pages.length}</strong>
                </span>
                <span>•</span>
                <span>
                  {t.organizeTotalPages}: <strong>{pages.length + deletedPages.length}</strong>
                </span>
                {deletedPages.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-500 font-medium">
                      {deletedPages.length} {t.organizeDeletedPages}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {onPreviewOriginal && (
              <button
                type="button"
                onClick={onPreviewOriginal}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.previewOriginalBtn}</span>
              </button>
            )}
            {onReplaceFile && (
              <button
                type="button"
                onClick={onReplaceFile}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.replaceFileBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-file switcher if user passed multiple files */}
        {allFiles.length > 1 && onSelectDifferentFile && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] shrink-0 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Documents:
            </span>
            {allFiles.map((f, idx) => (
              <button
                key={`${f.name}-${idx}`}
                type="button"
                onClick={() => onSelectDifferentFile(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium truncate max-w-[200px] shrink-0 transition-all cursor-pointer ${
                  f.name === file.name && f.size === file.size
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Interactive Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Selection actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={selectedIds.size === pages.length ? deselectAll : selectAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.size === pages.length && pages.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.organizeDeselectAll}</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {t.organizeSelectAll} {selectedIds.size > 0 && `(${selectedIds.size})`}
                  </span>
                </>
              )}
            </button>

            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                  title={t.organizeInvertSelection}
                >
                  {t.organizeInvertSelection}
                </button>

                <button
                  type="button"
                  onClick={() => rotateSelected(90)}
                  className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t.organizeRotateSelected}</span>
                </button>

                <button
                  type="button"
                  onClick={deleteSelected}
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {t.organizeDeleteSelected} ({selectedIds.size})
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Center / Right: Global Reorder Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={reverseOrder}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={t.organizeReverseOrder}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{t.organizeReverseOrder}</span>
            </button>

            <button
              type="button"
              onClick={sortByOriginalOrder}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={t.organizeSortOriginal}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t.organizeSortOriginal}</span>
            </button>

            <button
              type="button"
              onClick={resetAllChanges}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={t.organizeResetAll}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.organizeResetAll}</span>
            </button>

            {/* Thumbnail size toggles */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCardSize('sm')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  cardSize === 'sm'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                S
              </button>
              <button
                type="button"
                onClick={() => setCardSize('md')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  cardSize === 'md'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setCardSize('lg')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  cardSize === 'lg'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                L
              </button>
            </div>
          </div>
        </div>

        {/* Drag-and-drop hint */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            {t.organizeDragHint}
          </span>
          {deletedPages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeletedDrawer((prev) => !prev)}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {t.organizeRemovedPagesDrawer} ({deletedPages.length})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Undo Notification Banner */}
      {lastDeletedNotice && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>
              {t.organizePageBadge} {lastDeletedNotice.originalSequenceIndex + 1} (
              {t.organizeOriginalBadge} #{lastDeletedNotice.item.pageNumber}) removed.
            </span>
          </div>
          <button
            type="button"
            onClick={undoLastDelete}
            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
            <span>{t.organizeUndoDelete}</span>
          </button>
        </div>
      )}

      {/* Drawer / Tray of Removed Pages */}
      {showDeletedDrawer && deletedPages.length > 0 && (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                {t.organizeRemovedPagesDrawer} ({deletedPages.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreAllDeleted}
                className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              >
                {t.organizeRestoreAll}
              </button>
              <button
                type="button"
                onClick={() => setShowDeletedDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {deletedPages.map((dp) => (
              <div
                key={`del-${dp.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 w-28 shrink-0 flex flex-col items-center shadow-xs"
              >
                <div className="w-20 h-28 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative flex items-center justify-center">
                  {thumbnails.get(dp.pageNumber) ? (
                    <img
                      src={thumbnails.get(dp.pageNumber)}
                      alt={`Deleted Page ${dp.pageNumber}`}
                      className="w-full h-full object-contain opacity-60"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-slate-800 text-white px-1 rounded">
                    #{dp.pageNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => restoreDeletedPage(dp.id)}
                  className="mt-2 w-full py-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>{t.organizeRestorePage}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progressive Thumbnail Rendering Progress Bar */}
      {thumbProgress.total > 0 && thumbProgress.current < thumbProgress.total && (
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl p-3 flex items-center gap-3">
          <div className="animate-spin text-teal-600 dark:text-teal-400">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-teal-900 dark:text-teal-200 mb-1">
              <span>Rendering live page previews in browser RAM...</span>
              <span>
                {thumbProgress.current} / {thumbProgress.total}
              </span>
            </div>
            <div className="w-full bg-teal-200 dark:bg-teal-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 dark:bg-teal-400 h-full transition-all duration-200"
                style={{ width: `${(thumbProgress.current / thumbProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      {pages.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            All pages have been removed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            You can restore removed pages or reset to original structure.
          </p>
          <button
            type="button"
            onClick={restoreAllDeleted}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {t.organizeRestoreAll} ({deletedPages.length})
          </button>
        </div>
      ) : (
        <div className={`grid ${gridClass} transition-all`}>
          {pages.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            const isDragging = draggedIndex === index;
            const isDropTarget = dropTargetIndex === index;
            const thumbUrl = thumbnails.get(item.pageNumber);
            const isRotated = item.rotationDelta !== 0;

            return (
              <div
                key={item.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-2.5 transition-all flex flex-col justify-between select-none shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 dark:ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'} ${
                  isDropTarget ? 'border-teal-500 ring-2 ring-teal-400 scale-[1.02]' : ''
                }`}
              >
                {/* Header row: Checkbox, Position Badge, Original Page Badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectPage(item.id)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-teal-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isRotated && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                        {item.rotationDelta}°
                      </span>
                    )}
                    <span
                      className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate"
                      title={`Original Page ${item.pageNumber}`}
                    >
                      Orig: {item.pageNumber}
                    </span>
                  </div>
                </div>

                {/* Page Thumbnail Preview Container */}
                <div
                  onClick={() => toggleSelectPage(item.id)}
                  className="relative aspect-[3/4] bg-slate-50 dark:bg-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800/60 cursor-pointer group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800 transition-all p-2"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={`Page ${index + 1}`}
                      className="max-w-full max-h-full object-contain rounded shadow-xs transition-transform duration-300 pointer-events-none"
                      style={{
                        transform: `rotate(${item.rotationDelta}deg)`,
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                      <FileText className="w-8 h-8 animate-pulse" />
                      <span className="text-[10px] mt-1 font-medium">Page {item.pageNumber}</span>
                    </div>
                  )}

                  {/* Hover Quick View / Zoom Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewPage(item);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                    title={t.organizeInspectPage}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Action Toolbar (Reorder, Rotate, Delete, Duplicate) */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  {/* Left / Up Arrow */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => movePageLeft(index)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    title={t.organizeMoveLeft}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Right / Down Arrow */}
                  <button
                    type="button"
                    disabled={index === pages.length - 1}
                    onClick={() => movePageRight(index)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    title={t.organizeMoveRight}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Rotate CCW (-90) */}
                  <button
                    type="button"
                    onClick={() => rotatePage(item.id, -90)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title={t.organizeRotateCcw}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Rotate CW (+90) */}
                  <button
                    type="button"
                    onClick={() => rotatePage(item.id, 90)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title={t.organizeRotateCw}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate Page */}
                  <button
                    type="button"
                    onClick={() => duplicatePage(index)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title={t.organizeDuplicatePage}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Page */}
                  <button
                    type="button"
                    onClick={() => deletePage(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                    title={t.organizeDeletePage}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message banner if any */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Sticky Action Bar: Save Organized PDF */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t.organizeSaveBtn}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {pages.length} Pages
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              100% processed in browser RAM with instant lossless export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={resetAllChanges}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {t.organizeResetAll}
          </button>

          <button
            type="button"
            onClick={handleSaveReorganized}
            disabled={isProcessing || pages.length === 0}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {t.organizeSaveBtn} ({pages.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Page Zoom Modal */}
      {previewPage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPage(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Page Preview (Original #{previewPage.pageNumber})
                </span>
                {previewPage.rotationDelta !== 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">
                    {previewPage.rotationDelta}°
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-[70vh] overflow-auto flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-xl w-full">
              {thumbnails.get(previewPage.pageNumber) ? (
                <img
                  src={thumbnails.get(previewPage.pageNumber)}
                  alt={`Enlarged Page ${previewPage.pageNumber}`}
                  className="max-h-[60vh] max-w-full object-contain rounded shadow-lg transition-transform duration-300"
                  style={{
                    transform: `rotate(${previewPage.rotationDelta}deg)`,
                  }}
                />
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Loading high-res preview...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotatePage(previewPage.id, -90)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => rotatePage(previewPage.id, 90)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+90°</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
