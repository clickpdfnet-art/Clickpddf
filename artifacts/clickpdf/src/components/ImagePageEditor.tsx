import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Copy,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Square,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface ImagePageItem {
  id: string;
  file: File;
  originalIndex: number;
  rotationDelta: number;
  isDuplicate?: boolean;
}

interface ImagePageEditorProps {
  files: File[];
  pages: ImagePageItem[];
  deletedPages: ImagePageItem[];
  onPagesChange: (pages: ImagePageItem[]) => void;
  onDeletedPagesChange: (pages: ImagePageItem[]) => void;
}

const createPageId = () => `image-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface ImagePageCardProps {
  page: ImagePageItem;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (delta: -1 | 1) => void;
  onRotate: (delta: -90 | 90) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const ImagePageCard: React.FC<ImagePageCardProps> = ({
  page,
  index,
  total,
  selected,
  onSelect,
  onMove,
  onRotate,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(page.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [page.file]);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`min-w-0 rounded-xl border bg-white dark:bg-slate-900 overflow-hidden transition-colors ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={page.file.name}
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `rotate(${page.rotationDelta}deg)` }}
          />
        ) : (
          <ImageIcon className="w-9 h-9 text-slate-400" />
        )}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`Select page ${index + 1}`}
          className="absolute left-2 top-2 rounded-md bg-white/95 dark:bg-slate-900/90 p-1.5 text-indigo-600 shadow-sm"
        >
          {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
        <span className="absolute right-2 top-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-semibold text-white">
          Page {index + 1}
        </span>
        {page.isDuplicate && (
          <span className="absolute bottom-2 right-2 rounded-md bg-indigo-600/90 px-2 py-1 text-[9px] font-semibold text-white">
            Copy
          </span>
        )}
      </div>

      <div className="p-2.5">
        <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300" title={page.file.name}>
          {page.file.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              title="Move earlier"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              title="Move later"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRotate(-90)}
              title="Rotate counter-clockwise"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRotate(90)}
              title="Rotate clockwise"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicate page"
              className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete page"
              className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export const ImagePageEditor: React.FC<ImagePageEditorProps> = ({
  files,
  pages,
  deletedPages,
  onPagesChange,
  onDeletedPagesChange,
}) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds((current) => {
      const visibleIds = new Set(pages.map((page) => page.id));
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [pages]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const movePage = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    onPagesChange(next);
  };

  const rotatePage = (id: string, delta: -90 | 90) => {
    onPagesChange(pages.map((page) =>
      page.id === id
        ? { ...page, rotationDelta: ((page.rotationDelta + delta) % 360 + 360) % 360 }
        : page
    ));
  };

  const duplicatePage = (index: number) => {
    const source = pages[index];
    if (!source) return;
    const next = [...pages];
    next.splice(index + 1, 0, {
      ...source,
      id: createPageId(),
      isDuplicate: true,
    });
    onPagesChange(next);
  };

  const deletePage = (id: string) => {
    const removed = pages.find((page) => page.id === id);
    if (removed) onDeletedPagesChange([...deletedPages, removed]);
    onPagesChange(pages.filter((page) => page.id !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const deleteSelected = () => {
    const removed = pages.filter((page) => selectedIds.has(page.id));
    if (removed.length === 0) return;
    onDeletedPagesChange([...deletedPages, ...removed]);
    onPagesChange(pages.filter((page) => !selectedIds.has(page.id)));
    setSelectedIds(new Set());
  };

  const rotateSelected = () => {
    if (selectedIds.size === 0) return;
    onPagesChange(pages.map((page) =>
      selectedIds.has(page.id)
        ? { ...page, rotationDelta: (page.rotationDelta + 90) % 360 }
        : page
    ));
  };

  const reorderTo = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = [...pages];
    const fromIndex = next.findIndex((page) => page.id === draggedId);
    const toIndex = next.findIndex((page) => page.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onPagesChange(next);
    setDraggedId(null);
  };

  const resetPages = () => {
    onPagesChange(files.map((file, index) => ({
      id: createPageId(),
      file,
      originalIndex: index,
      rotationDelta: 0,
    })));
    onDeletedPagesChange([]);
    setSelectedIds(new Set());
  };

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arrange image pages</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {pages.length} {t.organizeKeptPages.toLowerCase()} · drag cards or use the page controls
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSelectedIds(new Set(pages.map((page) => page.id)))} className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
            {t.organizeSelectAll}
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {t.organizeDeselectAll}
          </button>
          <button type="button" disabled={selectedIds.size === 0} onClick={rotateSelected} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 disabled:opacity-40 dark:bg-indigo-950/40 dark:text-indigo-300">
            {t.organizeRotateSelected}
          </button>
          <button type="button" disabled={selectedIds.size === 0} onClick={deleteSelected} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 disabled:opacity-40 dark:bg-rose-950/40 dark:text-rose-300">
            {t.organizeDeleteSelected}
          </button>
          {deletedPages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onPagesChange([...pages, ...deletedPages]);
                onDeletedPagesChange([]);
              }}
              className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {t.organizeRestoreAll} ({deletedPages.length})
            </button>
          )}
          <button type="button" onClick={resetPages} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            {t.organizeResetAll}
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No active pages. Add more images or restore a deleted page.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pages.map((page, index) => (
            <ImagePageCard
              key={page.id}
              page={page}
              index={index}
              total={pages.length}
              selected={selectedIds.has(page.id)}
              onSelect={() => toggleSelected(page.id)}
              onMove={(delta) => movePage(index, delta)}
              onRotate={(delta) => rotatePage(page.id, delta)}
              onDuplicate={() => duplicatePage(index)}
              onDelete={() => deletePage(page.id)}
              onDragStart={() => setDraggedId(page.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => reorderTo(page.id)}
              onDragEnd={() => setDraggedId(null)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
