import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type,
  Image as ImageIcon,
  Move,
  RotateCw,
  Sliders,
  Check,
  Upload,
  Trash2,
  Maximize2,
  FileText,
  Eye,
  Grid,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { WatermarkOptions } from '../utils/pdfEngine';
import { renderPdfPageThumbnail } from '../utils/pdfThumbnail';

export interface WatermarkPanelProps {
  primaryFile?: File;
  options: WatermarkOptions;
  onChange: (options: WatermarkOptions) => void;
}

const PRESET_TEXTS = [
  'CONFIDENTIAL',
  'DRAFT',
  'SAMPLE',
  'DO NOT COPY',
  'TOP SECRET',
  'APPROVED',
  'FOR REVIEW'
];

const PRESET_COLORS = [
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Royal Blue', hex: '#3B82F6' },
  { name: 'Charcoal Slate', hex: '#1E293B' },
  { name: 'Neutral Gray', hex: '#6B7280' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Rose Pink', hex: '#F43F5E' },
  { name: 'Cyan Teal', hex: '#06B6D4' }
];

const PRESET_ANGLES = [
  { label: '0° Flat', angle: 0 },
  { label: '45° Diagonal', angle: 45 },
  { label: '-45° Reverse', angle: -45 },
  { label: '90° Vertical', angle: 90 }
];

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  primaryFile,
  options,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>(options.type || 'text');
  const [useRealPdfBackground, setUseRealPdfBackground] = useState<boolean>(true);
  const [realPdfThumbnail, setRealPdfThumbnail] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(options.imageDataUrl || null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const watermarkElementRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load thumbnail of uploaded PDF if available
  useEffect(() => {
    let isMounted = true;
    if (primaryFile && primaryFile.type === 'application/pdf') {
      setIsLoadingThumbnail(true);
      renderPdfPageThumbnail(primaryFile, 1, 480)
        .then((url) => {
          if (isMounted) {
            setRealPdfThumbnail(url);
            setIsLoadingThumbnail(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setRealPdfThumbnail(null);
            setIsLoadingThumbnail(false);
          }
        });
    } else {
      setRealPdfThumbnail(null);
      setIsLoadingThumbnail(false);
    }
    return () => {
      isMounted = false;
    };
  }, [primaryFile]);

  // Handle image upload for image watermark
  const handleImageUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreviewUrl(dataUrl);
      onChange({
        ...options,
        type: 'image',
        imageDataUrl: dataUrl,
        imageFile: file,
        size: options.size > 100 ? 40 : options.size // adjust default scale %
      });
      setActiveTab('image');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop interactive coordinate positioning
  const updatePositionFromClientCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!previewContainerRef.current) return;
      const rect = previewContainerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      let xPct = Math.round((relativeX / rect.width) * 100);
      let yPct = Math.round((relativeY / rect.height) * 100);

      // Snap to center if close
      if (Math.abs(xPct - 50) <= 2) xPct = 50;
      if (Math.abs(yPct - 50) <= 2) yPct = 50;

      xPct = Math.max(2, Math.min(98, xPct));
      yPct = Math.max(2, Math.min(98, yPct));

      onChange({
        ...options,
        xPercent: xPct,
        yPercent: yPct
      });
    },
    [onChange, options]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePositionFromClientCoordinates(e.clientX, e.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      updatePositionFromClientCoordinates(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePresetPosition = (x: number, y: number, angle?: number) => {
    onChange({
      ...options,
      xPercent: x,
      yPercent: y,
      angle: angle !== undefined ? angle : options.angle
    });
  };

  const currentX = options.xPercent ?? 50;
  const currentY = options.yPercent ?? 50;
  const currentOpacity = options.opacity ?? 0.25;
  const currentAngle = options.angle ?? 45;
  const currentSize = options.size ?? 48;
  const currentColor = options.colorHex ?? '#EF4444';
  const currentText = options.text ?? 'CONFIDENTIAL';
  const currentFont = options.fontFamily ?? 'Helvetica-Bold';
  const currentPageRange = options.pageRange ?? 'all';

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Interactive Watermark Live Studio</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Drag & Drop Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag the watermark directly on the demo page or fine-tune with the Left/Right and Up/Down scroll sliders.
          </p>
        </div>

        {/* Mode tabs: Text vs Image Watermark */}
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              onChange({ ...options, type: 'text' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Watermark</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('image');
              onChange({
                ...options,
                type: 'image',
                size: options.size > 100 ? 40 : options.size
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image / Logo Watermark</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left is Live Interactive Dummy PDF Canvas, Right is Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Interactive Preview Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Interactive Page Canvas</span>
            </span>

            {/* Toggle background view if real PDF thumbnail is available */}
            {realPdfThumbnail && (
              <button
                type="button"
                onClick={() => setUseRealPdfBackground(!useRealPdfBackground)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {useRealPdfBackground ? 'Show Dummy Document' : 'Show Uploaded PDF'}
              </button>
            )}
          </div>

          {/* Interactive Document Page Container */}
          <div className="w-full max-w-[360px] sm:max-w-[400px]">
            <div
              ref={previewContainerRef}
              onPointerDown={handlePointerDown}
              className={`relative w-full aspect-[1/1.414] bg-white rounded-xl shadow-lg border-2 select-none overflow-hidden transition-shadow ${
                isDragging
                  ? 'border-indigo-500 shadow-indigo-100 dark:shadow-indigo-950/40 cursor-grabbing'
                  : 'border-slate-300 hover:border-indigo-400 cursor-crosshair'
              }`}
              style={{
                touchAction: 'none'
              }}
              title="Click or drag anywhere to place the watermark"
            >
              {/* Document Background: Uploaded PDF or Simulated Dummy Document */}
              {useRealPdfBackground && realPdfThumbnail ? (
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={realPdfThumbnail}
                    alt="Document Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                /* High-Fidelity Dummy PDF Document Page */
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between pointer-events-none text-slate-400">
                  {/* Dummy Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-slate-200 rounded-sm" />
                        <div className="h-2 w-16 bg-slate-100 rounded-sm" />
                      </div>
                      <div className="text-[9px] font-mono text-slate-300">
                        PAGE 1 OF 1
                      </div>
                    </div>

                    {/* Dummy Body Content Paragraphs */}
                    <div className="mt-5 space-y-3">
                      <div className="h-2.5 w-3/4 bg-slate-200 rounded-sm" />
                      <div className="h-2 w-full bg-slate-100 rounded-sm" />
                      <div className="h-2 w-full bg-slate-100 rounded-sm" />
                      <div className="h-2 w-5/6 bg-slate-100 rounded-sm" />
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <div className="h-2 w-full bg-slate-100 rounded-sm" />
                      <div className="h-2 w-full bg-slate-100 rounded-sm" />
                      <div className="h-2 w-4/5 bg-slate-100 rounded-sm" />
                    </div>

                    {/* Dummy Data Table block */}
                    <div className="mt-5 border border-slate-150 rounded p-2 space-y-1.5 bg-slate-50/50">
                      <div className="flex justify-between">
                        <div className="h-2 w-16 bg-slate-200 rounded-sm" />
                        <div className="h-2 w-12 bg-slate-200 rounded-sm" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-1.5 w-24 bg-slate-150 rounded-sm" />
                        <div className="h-1.5 w-8 bg-slate-150 rounded-sm" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-1.5 w-20 bg-slate-150 rounded-sm" />
                        <div className="h-1.5 w-10 bg-slate-150 rounded-sm" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="h-2 w-full bg-slate-100 rounded-sm" />
                      <div className="h-2 w-2/3 bg-slate-100 rounded-sm" />
                    </div>
                  </div>

                  {/* Dummy Signature / Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-300">
                    <div className="space-y-1">
                      <div className="h-1.5 w-20 bg-slate-200 rounded-sm" />
                      <div>AUTHORIZED SIGNATURE</div>
                    </div>
                    <div>CONFIDENTIAL & PROPRIETARY</div>
                  </div>
                </div>
              )}

              {/* Center Crosshair Alignment Guides (subtle visual indicator) */}
              <div className="absolute inset-0 pointer-events-none">
                {Math.abs(currentX - 50) < 1 && (
                  <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-indigo-400/80" />
                )}
                {Math.abs(currentY - 50) < 1 && (
                  <div className="absolute left-0 right-0 top-1/2 h-px border-t border-dashed border-indigo-400/80" />
                )}
              </div>

              {/* Watermark Overlay Element (Interactive & Draggable) */}
              <div
                ref={watermarkElementRef}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none group transition-transform ${
                  isDragging ? 'scale-105' : ''
                }`}
                style={{
                  left: `${currentX}%`,
                  top: `${currentY}%`,
                  transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
                  opacity: currentOpacity
                }}
              >
                {activeTab === 'text' || !imagePreviewUrl ? (
                  <div
                    className="font-bold tracking-wider whitespace-nowrap px-3 py-1 transition-colors"
                    style={{
                      color: currentColor,
                      fontSize: `${Math.max(14, Math.round(currentSize * 0.45))}px`,
                      fontFamily: currentFont.includes('Times')
                        ? 'Times New Roman, serif'
                        : currentFont.includes('Courier')
                        ? 'Courier New, monospace'
                        : 'Helvetica, Arial, sans-serif'
                    }}
                  >
                    {currentText || 'WATERMARK'}
                  </div>
                ) : (
                  <div
                    className="p-1 rounded transition-all"
                    style={{
                      width: `${Math.max(40, Math.min(260, currentSize * 2.4))}px`
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Watermark Stamp"
                      className="w-full h-auto object-contain pointer-events-none"
                    />
                  </div>
                )}

                {/* Subtle Grab Bounding Box Outline */}
                <div className="absolute inset-0 border border-dashed border-indigo-500/50 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Coordinates Indicator Pill */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono pointer-events-none flex items-center gap-1.5 shadow-sm">
                <Move className="w-2.5 h-2.5 text-indigo-400" />
                <span>
                  X: {currentX}% · Y: {currentY}% · {currentAngle}°
                </span>
              </div>
            </div>

            {/* Helper Hint */}
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Move className="w-3 h-3 text-indigo-500" />
              <span>Click or drag on the page to reposition watermark</span>
            </p>
          </div>
        </div>

        {/* Right Column: Controls & Fine-Tuning Sliders */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. POSITION CONTROLS (X & Y SCROLL SLIDERS & 9-POINT GRID) */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Position & Alignment Controls</span>
              </label>

              {/* Quick Center Button */}
              <button
                type="button"
                onClick={() => handlePresetPosition(50, 50, 45)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
              >
                Reset Center (50%, 50%)
              </button>
            </div>

            {/* 9-Point Alignment Preset Grid + Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* 9-Point Presets Box */}
              <div className="sm:col-span-4 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <Grid className="w-3 h-3" />
                  <span>Quick Anchors</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[120px]">
                  {[
                    { label: 'TL', x: 20, y: 15, title: 'Top-Left' },
                    { label: 'TC', x: 50, y: 15, title: 'Top-Center' },
                    { label: 'TR', x: 80, y: 15, title: 'Top-Right' },
                    { label: 'ML', x: 20, y: 50, title: 'Middle-Left' },
                    { label: 'C', x: 50, y: 50, title: 'Center' },
                    { label: 'MR', x: 80, y: 50, title: 'Middle-Right' },
                    { label: 'BL', x: 20, y: 85, title: 'Bottom-Left' },
                    { label: 'BC', x: 50, y: 85, title: 'Bottom-Center' },
                    { label: 'BR', x: 80, y: 85, title: 'Bottom-Right' }
                  ].map((pos) => {
                    const isActive = currentX === pos.x && currentY === pos.y;
                    return (
                      <button
                        key={pos.label}
                        type="button"
                        title={pos.title}
                        onClick={() => handlePresetPosition(pos.x, pos.y)}
                        className={`w-8 h-8 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-Tuning X and Y Position Scroll Sliders */}
              <div className="sm:col-span-8 space-y-3.5">
                {/* Horizontal (Left <-> Right) Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Horizontal (Left ↔ Right)</span>
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {currentX}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...options, xPercent: Math.max(0, currentX - 1) })}
                      title="Nudge Left 1%"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentX}
                      onChange={(e) =>
                        onChange({ ...options, xPercent: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...options, xPercent: Math.min(100, currentX + 1) })}
                      title="Nudge Right 1%"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Vertical (Up <-> Down) Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Vertical (Top ↕ Down)</span>
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {currentY}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...options, yPercent: Math.max(0, currentY - 1) })}
                      title="Nudge Up 1%"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentY}
                      onChange={(e) =>
                        onChange({ ...options, yPercent: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...options, yPercent: Math.min(100, currentY + 1) })}
                      title="Nudge Down 1%"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TEXT WATERMARK DETAILS */}
          {activeTab === 'text' && (
            <div className="space-y-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs">
              {/* Text Input & Quick Badges */}
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={currentText}
                  onChange={(e) => onChange({ ...options, text: e.target.value })}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_TEXTS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => onChange({ ...options, text })}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        currentText === text
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Swatches & Custom Picker */}
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                  Color Palette & Swatches
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => {
                    const isSelected = currentColor.toLowerCase() === col.hex.toLowerCase();
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => onChange({ ...options, colorHex: col.hex })}
                        title={col.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer relative shadow-xs ${
                          isSelected
                            ? 'scale-115 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                      </button>
                    );
                  })}

                  {/* Native HTML Color Picker for Custom Hex */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => onChange({ ...options, colorHex: e.target.value })}
                      title="Choose Custom Color"
                      className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase">
                      {currentColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Font Family & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Font Family
                  </label>
                  <select
                    value={currentFont}
                    onChange={(e: any) => onChange({ ...options, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Helvetica-Bold">Helvetica Bold</option>
                    <option value="Helvetica">Helvetica Regular</option>
                    <option value="Times-Roman-Bold">Times New Roman Bold</option>
                    <option value="Times-Roman">Times New Roman Regular</option>
                    <option value="Courier-Bold">Courier Bold</option>
                    <option value="Courier">Courier Regular</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Font Size
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {currentSize} pt
                    </span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="110"
                    value={currentSize}
                    onChange={(e) =>
                      onChange({ ...options, size: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-indigo-600 cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. IMAGE WATERMARK DETAILS */}
          {activeTab === 'image' && (
            <div className="space-y-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
                className="hidden"
              />

              {imagePreviewUrl ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
                      <img
                        src={imagePreviewUrl}
                        alt="Watermark Stamp"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Custom Image Watermark
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG with alpha transparency or JPG supported
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreviewUrl(null);
                        onChange({
                          ...options,
                          imageDataUrl: undefined,
                          imageFile: undefined,
                          type: 'text'
                        });
                        setActiveTab('text');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/60 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Upload Watermark Logo or Signature Stamp
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select PNG, JPEG, SVG, or WebP image
                  </p>
                </div>
              )}

              {/* Image Scale Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Image Scale (% of Page Width)
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                    {Math.min(100, Math.max(10, currentSize))}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.min(100, Math.max(10, currentSize))}
                  onChange={(e) =>
                    onChange({ ...options, size: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 4. OPACITY & ROTATION CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs text-xs">
            {/* Opacity Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Opacity
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={currentOpacity}
                onChange={(e) =>
                  onChange({ ...options, opacity: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Subtle)</span>
                <span>25% (Standard)</span>
                <span>95% (Solid)</span>
              </div>
            </div>

            {/* Rotation Angle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Rotation Angle</span>
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {currentAngle}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={currentAngle}
                onChange={(e) =>
                  onChange({ ...options, angle: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />

              {/* Snap Angle Buttons */}
              <div className="flex gap-1.5 mt-1.5">
                {PRESET_ANGLES.map((item) => (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => onChange({ ...options, angle: item.angle })}
                    className={`flex-1 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                      currentAngle === item.angle
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. TARGET PAGES SELECTOR */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs text-xs">
            <label className="font-bold text-slate-900 dark:text-white block mb-1.5">
              Pages to Apply Watermark
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All Pages' },
                { id: 'first', label: 'First Page Only' },
                { id: 'odd', label: 'Odd Pages Only' },
                { id: 'even', label: 'Even Pages Only' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...options, pageRange: opt.id })}
                  className={`py-1.5 px-2 rounded-lg border font-semibold text-center text-[11px] transition-colors cursor-pointer ${
                    currentPageRange === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
