import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  RefreshCw,
  CheckSquare,
  Square,
  Check,
  FileText,
  Eye,
  SlidersHorizontal,
  Undo2,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { PageRotationMap, PdfPageDetail, getPdfPagesInfo } from '../utils/pdfEngine';
import { renderAllPageThumbnails } from '../utils/pdfThumbnail';

interface RotatePdfPanelProps {
  file: File;
  onRotateComplete: (pageRotations: PageRotationMap, globalDelta: number) => Promise<void>;
  isProcessing: boolean;
  onPreviewOriginal?: () => void;
  onReplaceFile?: () => void;
}

export const RotatePdfPanel: React.FC<RotatePdfPanelProps> = ({
  file,
  onRotateComplete,
  isProcessing,
  onPreviewOriginal,
  onReplaceFile,
}) => {
  const [pages, setPages] = useState<PdfPageDetail[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);
  const [thumbProgress, setThumbProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Load page structure and kick off thumbnail rendering
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingPages(true);
    setError(null);
    setPageRotations({});
    setSelectedPages(new Set());
    setThumbnails(new Map());

    getPdfPagesInfo(file)
      .then((info) => {
        if (isCancelled) return;
        setPages(info.pages);
        setIsLoadingPages(false);
        setThumbProgress({ current: 0, total: info.pageCount });

        // Asynchronously render thumbnails with progressive updates
        renderAllPageThumbnails(
          file, 
          240, 
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
            console.warn('Thumbnail generation error:', err);
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
    };
  }, [file]);

  // Rotate a single page clockwise (+90°) or counter-clockwise (-90°)
  const rotateSinglePage = useCallback((pageNum: number, delta: number) => {
    setPageRotations((prev) => {
      const currentDelta = prev[pageNum] ?? 0;
      const nextDelta = ((currentDelta + delta) % 360 + 360) % 360;
      if (nextDelta === 0) {
        const copy = { ...prev };
        delete copy[pageNum];
        return copy;
      }
      return {
        ...prev,
        [pageNum]: nextDelta,
      };
    });
  }, []);

  // Reset a single page to 0°
  const resetSinglePage = useCallback((pageNum: number) => {
    setPageRotations((prev) => {
      const copy = { ...prev };
      delete copy[pageNum];
      return copy;
    });
  }, []);

  // Rotate all pages by delta
  const rotateAllPages = useCallback((delta: number) => {
    setPageRotations((prev) => {
      const updated: Record<number, number> = {};
      pages.forEach((p) => {
        const currentDelta = prev[p.pageNumber] ?? 0;
        const nextDelta = ((currentDelta + delta) % 360 + 360) % 360;
        if (nextDelta !== 0) {
          updated[p.pageNumber] = nextDelta;
        }
      });
      return updated;
    });
  }, [pages]);

  // Reset all pages to 0°
  const resetAllPages = useCallback(() => {
    setPageRotations({});
  }, []);

  // Rotate only currently selected pages
  const rotateSelectedPages = useCallback((delta: number) => {
    if (selectedPages.size === 0) return;
    setPageRotations((prev) => {
      const next = { ...prev };
      selectedPages.forEach((pageNum) => {
        const currentDelta = next[pageNum] ?? 0;
        const nextDelta = ((currentDelta + delta) % 360 + 360) % 360;
        if (nextDelta === 0) {
          delete next[pageNum];
        } else {
          next[pageNum] = nextDelta;
        }
      });
      return next;
    });
  }, [selectedPages]);

  // Toggle selection of a single page
  const togglePageSelection = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  // Selection presets
  const selectAll = useCallback(() => {
    setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
  }, [pages]);

  const selectNone = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const selectOddPages = useCallback(() => {
    setSelectedPages(new Set(pages.filter((_, idx) => (idx + 1) % 2 === 1).map((p) => p.pageNumber)));
  }, [pages]);

  const selectEvenPages = useCallback(() => {
    setSelectedPages(new Set(pages.filter((_, idx) => (idx + 1) % 2 === 0).map((p) => p.pageNumber)));
  }, [pages]);

  // Count modified pages
  const modifiedCount = useMemo(() => {
    return Object.keys(pageRotations).length;
  }, [pageRotations]);

  const allSelected = pages.length > 0 && selectedPages.size === pages.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRotateComplete(pageRotations, 0);
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Overview & Quick Batch Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rotate PDF Pages
              </h3>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 min-w-0">
              <span
                className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2 break-all leading-snug"
                title={file.name}
              >
                {file.name}
              </span>
              <span aria-hidden="true" className="shrink-0">·</span>
              <span className="shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
              {modifiedCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {modifiedCount} {modifiedCount === 1 ? 'page modified' : 'pages modified'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Document-level Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
              Document:
            </span>
            <button
              type="button"
              onClick={() => rotateAllPages(270)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Rotate all pages 90° counter-clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>All 90° CCW</span>
            </button>

            <button
              type="button"
              onClick={() => rotateAllPages(90)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Rotate all pages 90° clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>All 90° CW</span>
            </button>

            <button
              type="button"
              onClick={() => rotateAllPages(180)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Invert all pages 180°"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>All 180°</span>
            </button>

            {modifiedCount > 0 && (
              <button
                type="button"
                onClick={resetAllPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
                title="Reset all pages to 0°"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            )}

            {onPreviewOriginal && (
              <button
                type="button"
                onClick={onPreviewOriginal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer ml-auto sm:ml-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview PDF</span>
              </button>
            )}

            {onReplaceFile && (
              <button
                type="button"
                onClick={onReplaceFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Change File</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Selection Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Select:</span>
            <button
              type="button"
              onClick={allSelected ? selectNone : selectAll}
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              {allSelected ? 'None' : 'All'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={selectOddPages}
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              Odd Pages
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={selectEvenPages}
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              Even Pages
            </button>
          </div>

          {selectedPages.size > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <span className="font-semibold">
                {selectedPages.size} {selectedPages.size === 1 ? 'page selected' : 'pages selected'}:
              </span>
              <button
                type="button"
                onClick={() => rotateSelectedPages(270)}
                className="hover:underline flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-300 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>-90°</span>
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => rotateSelectedPages(90)}
                className="hover:underline flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-300 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>+90°</span>
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-[11px]"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoadingPages && (
        <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Inspecting document structure...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <p className="font-semibold">Unable to load document pages:</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Page Thumbnails Grid */}
      {!isLoadingPages && pages.length > 0 && (
        <div className="space-y-4">
          {/* Progressive thumbnail rendering status indicator */}
          {thumbProgress.total > 0 && thumbProgress.current < thumbProgress.total && (
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                <span>
                  Rendering visual previews: <strong className="font-semibold">{thumbProgress.current}</strong> of <strong className="font-semibold">{thumbProgress.total}</strong> pages loaded. You can interact with and rotate any page immediately!
                </span>
              </div>
              <div className="w-32 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((thumbProgress.current / thumbProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map((p) => {
              const delta = pageRotations[p.pageNumber] ?? 0;
              const totalAngle = (p.initialRotation + delta) % 360;
              const isSelected = selectedPages.has(p.pageNumber);
              const thumbUrl = thumbnails.get(p.pageNumber);
              const isModified = delta !== 0;

              return (
                <div
                  key={p.pageNumber}
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : isModified
                      ? 'border-amber-300 dark:border-amber-700 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => togglePageSelection(p.pageNumber)}
                      className="flex items-center gap-2 text-left cursor-pointer select-none"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Page {p.pageNumber}
                      </span>
                    </button>

                    {/* Angle indicator */}
                    <div className="flex items-center gap-1.5">
                      {isModified ? (
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          {delta > 0 ? `+${delta}°` : `${delta}°`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          0°
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div
                    onClick={() => togglePageSelection(p.pageNumber)}
                    className="p-4 flex-1 flex items-center justify-center min-h-[220px] bg-slate-100/70 dark:bg-slate-950/50 cursor-pointer overflow-hidden select-none"
                  >
                    <div
                      className="relative transition-transform duration-300 ease-out origin-center flex items-center justify-center shadow-md bg-white rounded-md overflow-hidden border border-slate-200/80 dark:border-slate-700"
                      style={{
                        transform: `rotate(${delta}deg)`,
                        width: '130px',
                        height: p.width > p.height ? '92px' : '170px',
                      }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="w-full h-full object-contain pointer-events-none select-none"
                          loading="lazy"
                        />
                      ) : (
                        /* Crisp SVG fallback wireframe */
                        <div className="w-full h-full p-2.5 flex flex-col justify-between bg-white text-slate-300 select-none pointer-events-none">
                          <div className="space-y-1.5">
                            <div className="h-2 w-3/4 bg-slate-200 rounded-xs" />
                            <div className="h-1.5 w-full bg-slate-100 rounded-xs" />
                            <div className="h-1.5 w-5/6 bg-slate-100 rounded-xs" />
                            <div className="h-1.5 w-2/3 bg-slate-100 rounded-xs" />
                          </div>
                          <div className="flex items-center justify-center text-slate-400 font-bold text-xs py-2">
                            {p.pageNumber}
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-slate-100 rounded-xs" />
                            <div className="h-1.5 w-4/5 bg-slate-100 rounded-xs" />
                          </div>
                        </div>
                      )}

                      {/* Rotation watermark indicator when turned */}
                      {isModified && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-xs shadow-xs pointer-events-none">
                          {totalAngle}°
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dimension & Orientation Info */}
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span>
                      {p.width > p.height ? 'Landscape' : 'Portrait'}
                    </span>
                    <span className="font-mono">
                      {p.width} × {p.height} pt
                    </span>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateSinglePage(p.pageNumber, 270);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Rotate counter-clockwise 90°"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[11px]">-90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateSinglePage(p.pageNumber, 90);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Rotate clockwise 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[11px]">+90°</span>
                    </button>

                    {isModified && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetSinglePage(p.pageNumber);
                        }}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Reset page to 0°"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Save / Apply Bar */}
          <div className="sticky bottom-4 z-20 mt-6 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-800 dark:border-slate-700 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-xs">
              <p className="font-bold text-sm text-white flex items-center gap-2">
                <span>
                  {modifiedCount === 0
                    ? 'No pages rotated yet'
                    : modifiedCount === pages.length
                    ? `All ${pages.length} pages rotated`
                    : `${modifiedCount} of ${pages.length} pages rotated`}
                </span>
                {modifiedCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Ready to Save
                  </span>
                )}
              </p>
              <p className="text-slate-400 mt-0.5">
                Rotations are applied losslessly in-browser memory without quality degradation.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {modifiedCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllPages}
                  disabled={isProcessing}
                  className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Reset All
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Rotations...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Apply Rotations & Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
