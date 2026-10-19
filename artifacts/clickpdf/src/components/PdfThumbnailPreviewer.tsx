import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  LayoutGrid,
  Columns,
  Eye,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { initPdfWorker } from '../utils/pdfWorkerSetup';
import { readSafeArrayBuffer, formatMemoryErrorMessage } from '../utils/memoryManager';

// Initialize bundled safe worker
initPdfWorker();

interface PdfThumbnailPreviewerProps {
  file: File;
  onFullscreenRequested?: () => void;
  className?: string;
  initialPage?: number;
}

export const PdfThumbnailPreviewer: React.FC<PdfThumbnailPreviewerProps> = ({
  file,
  onFullscreenRequested,
  className = '',
  initialPage = 1,
}) => {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageInputVal, setPageInputVal] = useState<string>(String(initialPage));
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderProgress, setRenderProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [nativeBlobUrl, setNativeBlobUrl] = useState<string | null>(null);

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const thumbnailsStripRef = useRef<HTMLDivElement | null>(null);
  const thumbButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Keep input in sync with currentPage and reset scroll to top of page
  useEffect(() => {
    setPageInputVal(String(currentPage));
    if (canvasContainerRef.current) {
      canvasContainerRef.current.scrollTop = 0;
      canvasContainerRef.current.scrollLeft = 0;
    }
  }, [currentPage]);

  // Auto-scroll active thumbnail horizontally ONLY without pulling parent container vertically
  useEffect(() => {
    const btn = thumbButtonRefs.current.get(currentPage);
    const strip = thumbnailsStripRef.current;
    if (btn && strip) {
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const stripWidth = strip.clientWidth;
      strip.scrollTo({
        left: btnLeft - (stripWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [currentPage]);

  // Load document with pdf.js
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setThumbnails(new Map());
    setTotalPages(0);
    setCurrentPage(1);

    // Create a native blob URL for fallback in case of strict CSP or canvas failure
    const blobUrl = URL.createObjectURL(file);
    setNativeBlobUrl(blobUrl);

    const loadDoc = async () => {
      try {
        initPdfWorker();
        let doc: any = null;

        // Try streaming directly via blob URL first (memory-safe for huge files like 283 MB)
        try {
          const loadingTask = pdfjsLib.getDocument({
            url: blobUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
            cMapPacked: true,
          });
          doc = await loadingTask.promise;
        } catch {
          // Fallback to arrayBuffer if blob URL fetch is blocked
          if (!isCancelled) {
            const arrayBuffer = await readSafeArrayBuffer(file);
            const fallbackTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
              cMapPacked: true,
            });
            doc = await fallbackTask.promise;
          }
        }

        if (isCancelled || !doc) return;

        pdfDocRef.current = doc;
        const count = doc.numPages;
        setTotalPages(count);
        setRenderProgress({ current: 0, total: count });
        setIsLoading(false);

        // Memory-safe progressive thumbnail generation
        // For large PDFs (e.g. 50-330+ pages or 100MB+ files), render priority window around active page first
        // and pause between renders so browser never runs out of RAM or refreshes.
        const thumbMap = new Map<number, string>();
        
        // Priority pages: 1 to min(4 for huge files, 10 for normal files, count)
        const isHugeFile = file.size > 80 * 1024 * 1024;
        const initialBatch = isHugeFile ? Math.min(count, 4) : Math.min(count, 10);
        for (let p = 1; p <= initialBatch; p++) {
          if (isCancelled) break;
          try {
            const page = await doc.getPage(p);
            const vp = page.getViewport({ scale: 1 });
            const thumbScale = Math.min(130 / vp.width, 1);
            const scaledVp = page.getViewport({ scale: thumbScale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(scaledVp.width);
            canvas.height = Math.floor(scaledVp.height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              await (page.render as any)({
                canvasContext: ctx,
                viewport: scaledVp,
                canvas: canvas,
              }).promise;

              thumbMap.set(p, canvas.toDataURL('image/jpeg', 0.65));
              setThumbnails(new Map(thumbMap));
              setRenderProgress({ current: p, total: count });

              // Release canvas memory allocations
              canvas.width = 0;
              canvas.height = 0;
            }
            try { page.cleanup(); } catch {}
          } catch (thumbErr) {
            console.warn(`[pdf.js] Thumbnail render skipped for page ${p}:`, thumbErr);
          }
          // Yield to event loop to keep UI thread silky smooth
          await new Promise((r) => setTimeout(r, isHugeFile ? 40 : 20));
        }

        // For remaining pages, render up to page 15 for huge files or 30 for normal files.
        const maxBgThumbnails = isHugeFile ? Math.min(count, 15) : (count > 40 ? 30 : count);
        if (count > initialBatch && !isCancelled) {
          for (let p = initialBatch + 1; p <= maxBgThumbnails; p++) {
            if (isCancelled) break;
            try {
              const page = await doc.getPage(p);
              const vp = page.getViewport({ scale: 1 });
              const thumbScale = Math.min(130 / vp.width, 1);
              const scaledVp = page.getViewport({ scale: thumbScale });

              const canvas = document.createElement('canvas');
              canvas.width = Math.floor(scaledVp.width);
              canvas.height = Math.floor(scaledVp.height);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                await (page.render as any)({
                  canvasContext: ctx,
                  viewport: scaledVp,
                  canvas: canvas,
                }).promise;

                thumbMap.set(p, canvas.toDataURL('image/jpeg', 0.60));
                if (p % 4 === 0 || p === maxBgThumbnails) {
                  setThumbnails(new Map(thumbMap));
                }
                setRenderProgress({ current: p, total: count });

                // Release canvas memory allocations
                canvas.width = 0;
                canvas.height = 0;
              }
              try { page.cleanup(); } catch {}
            } catch {
              // Gracefully continue
            }
            // Generous pause to prevent mobile CPU/RAM spikes
            await new Promise((r) => setTimeout(r, 35));
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[pdf.js] PDF preview notice:', err);
          setError(formatMemoryErrorMessage(err, file.name));
          setIsLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch {
          // ignore
        }
        pdfDocRef.current = null;
      }
    };
  }, [file]);

  // Render active high-res page on main canvas
  useEffect(() => {
    if (!pdfDocRef.current || !mainCanvasRef.current || totalPages === 0) return;

    let isCancelled = false;

    const renderActivePage = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const page = await pdfDocRef.current.getPage(currentPage);
        if (isCancelled) return;

        const canvas = mainCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const baseVp = page.getViewport({ scale: 1 });
        const containerWidth = Math.max(280, Math.min(window.innerWidth - 48, 640));
        const baseScale = (containerWidth / baseVp.width) * zoomLevel;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayViewport = page.getViewport({ scale: baseScale });
        
        // Memory guard: Clamp maximum canvas pixel dimension to 2000px to prevent GPU/canvas OOM crash on massive PDFs
        const maxCanvasDim = 2000;
        let effectiveScale = baseScale * dpr;
        if (baseVp.width * effectiveScale > maxCanvasDim || baseVp.height * effectiveScale > maxCanvasDim) {
          effectiveScale = maxCanvasDim / Math.max(baseVp.width, baseVp.height);
        }
        const renderViewport = page.getViewport({ scale: effectiveScale });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(displayViewport.width)}px`;
        canvas.style.height = `${Math.floor(displayViewport.height)}px`;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: renderViewport,
          canvas: canvas,
        };

        const task = (page.render as any)(renderContext);
        renderTaskRef.current = task;
        await task.promise;

        // Force reset scroll to the very top (0,0) of the freshly rendered page
        if (canvasContainerRef.current) {
          canvasContainerRef.current.scrollTop = 0;
          canvasContainerRef.current.scrollLeft = 0;
        }
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          console.warn('[pdf.js] High-res render error:', renderErr);
        }
      }
    };

    renderActivePage();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, totalPages, zoomLevel]);

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleSelectPage = (pageNum: number) => {
    const valid = Math.max(1, Math.min(totalPages || 1, pageNum));
    setCurrentPage(valid);
    if (viewMode === 'grid') {
      setViewMode('single');
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInputVal, 10);
    if (!isNaN(val)) {
      handleSelectPage(val);
    } else {
      setPageInputVal(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(z - 0.25, 0.6));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md transition-all flex flex-col ${className}`}>
      {/* Top Controls Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                In-Browser PDF Page Preview
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                pdf.js
              </span>
            </div>
            <p
              className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 break-all leading-snug"
              title={file.name}
            >
              {file.name} · {totalPages > 0 ? `${totalPages} Pages` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Single Page High-Res View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="All Pages Grid Overview"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls (Single Mode) - fully visible on mobile & desktop */}
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.6}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Button */}
          {onFullscreenRequested && (
            <button
              type="button"
              onClick={onFullscreenRequested}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Expand to Fullscreen Modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Work Area */}
      <div className="relative bg-slate-950 flex-1 min-h-[460px] sm:min-h-[560px] flex flex-col justify-between overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-white text-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 flex items-center justify-center animate-spin mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-200">Initializing in-browser PDF preview...</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Reading binary streams in browser memory safely</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-100 break-all line-clamp-2" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Use native browser viewer or open fullscreen preview to inspect all pages.
            </p>
            {nativeBlobUrl && (
              <div className="mt-4 flex items-center gap-2">
                {onFullscreenRequested && (
                  <button
                    type="button"
                    onClick={onFullscreenRequested}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Native Preview</span>
                  </button>
                )}
                <a
                  href={nativeBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Tab</span>
                </a>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View of all rendered page thumbnails */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                const thumbData = thumbnails.get(pNum);
                const isSelected = pNum === currentPage;
                return (
                  <div
                    key={pNum}
                    onClick={() => handleSelectPage(pNum)}
                    className={`group relative bg-slate-900 rounded-xl p-2.5 border transition-all duration-150 cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/30'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="relative w-full aspect-[1/1.3] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-md">
                      {thumbData ? (
                        <img
                          src={thumbData}
                          alt={`Page ${pNum}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                          <FileText className="w-5 h-5 text-slate-500" />
                          <span className="font-bold text-[10px]">Page {pNum}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between w-full px-1">
                      <span className="text-[11px] font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">
                        Page {pNum}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Single Page Crisp Canvas View - justify-start & pt-4 ensures top coordinate is ALWAYS 100% visible */
          <div
            ref={canvasContainerRef}
            className="flex-1 overflow-auto pt-4 pb-8 px-3 sm:px-6 flex flex-col items-center justify-start custom-scrollbar"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="relative shadow-2xl rounded-sm shrink-0 my-0">
              <canvas
                ref={mainCanvasRef}
                className="bg-white rounded-sm shadow-xl max-w-full block"
              />
            </div>
          </div>
        )}

        {/* Bottom Pagination & Page Thumbnails Rail */}
        {totalPages > 0 && !isLoading && !error && (
          <div className="bg-slate-900/95 border-t border-slate-800 p-2 sm:p-2.5 flex items-center justify-between gap-2 shrink-0">
            {/* Quick First & Previous Navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleFirstPage}
                disabled={currentPage <= 1}
                title="Go to First Page (Page 1)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                title="Previous Page"
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">Prev</span>
              </button>
            </div>

            {/* Jump-To-Page Form Indicator */}
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 shrink-0 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInputVal}
                onChange={(e) => setPageInputVal(e.target.value)}
                onBlur={() => {
                  const val = parseInt(pageInputVal, 10);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    handleSelectPage(val);
                  } else {
                    setPageInputVal(String(currentPage));
                  }
                }}
                className="w-10 bg-slate-900 text-center font-bold text-indigo-300 rounded px-1 py-0.5 border border-slate-600 focus:outline-none focus:border-indigo-400 text-xs"
              />
              <span className="text-[11px] text-slate-400 font-medium">/ {totalPages}</span>
            </form>

            {/* Horizontal Mini Thumbnails Strip — FIXED justify-start to allow scrolling back to Page 1 smoothly */}
            <div
              ref={thumbnailsStripRef}
              className="flex-1 max-w-md sm:max-w-lg overflow-x-auto flex items-center justify-start gap-1.5 py-1 px-2 custom-scrollbar scroll-smooth"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                const isSelected = pNum === currentPage;
                const thumbData = thumbnails.get(pNum);
                return (
                  <button
                    key={pNum}
                    ref={(el) => {
                      if (el) thumbButtonRefs.current.set(pNum, el);
                      else thumbButtonRefs.current.delete(pNum);
                    }}
                    type="button"
                    onClick={() => handleSelectPage(pNum)}
                    title={`Jump to page ${pNum}`}
                    className={`relative shrink-0 w-8 h-10 rounded border overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-400/80 scale-105 z-10'
                        : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                    }`}
                  >
                    {thumbData ? (
                      <img
                        src={thumbData}
                        alt={`Thumb ${pNum}`}
                        className="w-full h-full object-cover bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                        {pNum}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 bg-slate-950/90 text-[8px] font-bold text-white px-0.5 rounded-tl">
                      {pNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Next & Last Navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                title="Next Page"
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLastPage}
                disabled={currentPage >= totalPages}
                title={`Go to Last Page (Page ${totalPages})`}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>In-browser local engine · 100% Client-Side</span>
        </div>
        <div className="flex items-center gap-3">
          {renderProgress.current < renderProgress.total && (
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              Generating thumbnails: {renderProgress.current}/{renderProgress.total}
            </span>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>
      </div>
    </div>
  );
};
