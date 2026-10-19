import React, { useState, useEffect } from 'react';
import {
  Hash,
  Palette,
  Type,
  Check,
  Eye,
  SlidersHorizontal,
  Bold,
  ShieldCheck,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { PageNumberFont } from '../utils/pdfEngine';
import { renderPdfPageThumbnail } from '../utils/pdfThumbnail';
import { useLanguage } from '../context/LanguageContext';

export interface PageNumberSettings {
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  format: 'Page {n} of {total}' | '{n} / {total}' | '{n}' | '- {n} -' | 'Page {n}';
  startAt: number;
  fontSize: number;
  colorHex: string;
  fontFamily: PageNumberFont;
  isBold: boolean;
  skipCoverPage: boolean;
  margin: number;
}

export interface PageNumberPanelProps {
  primaryFile?: File;
  totalFilesCount?: number;
  settings: PageNumberSettings;
  onChange: (settings: PageNumberSettings) => void;
}

const COLOR_PRESETS = [
  { name: 'Charcoal Slate', hex: '#334155' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Subtle Gray', hex: '#64748B' },
  { name: 'Deep Navy', hex: '#1E3A8A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Emerald Green', hex: '#16A34A' },
  { name: 'Indigo Violet', hex: '#6366F1' },
];

const STANDARD_SIZES = [
  { size: 10, label: '10 pt (Small)' },
  { size: 12, label: '12 pt (Standard)' },
  { size: 14, label: '14 pt (Medium)' },
  { size: 16, label: '16 pt (Large)' },
  { size: 18, label: '18 pt (X-Large)' },
];

const POSITION_OPTIONS: {
  id: PageNumberSettings['position'];
  label: string;
  group: 'header' | 'footer';
}[] = [
  { id: 'top-left', label: 'Top Left', group: 'header' },
  { id: 'top-center', label: 'Top Center', group: 'header' },
  { id: 'top-right', label: 'Top Right', group: 'header' },
  { id: 'bottom-left', label: 'Bottom Left', group: 'footer' },
  { id: 'bottom-center', label: 'Bottom Center', group: 'footer' },
  { id: 'bottom-right', label: 'Bottom Right', group: 'footer' },
];

export const PageNumberPanel: React.FC<PageNumberPanelProps> = ({
  primaryFile,
  totalFilesCount = 1,
  settings,
  onChange,
}) => {
  const { t } = useLanguage();
  const [realThumbnail, setRealThumbnail] = useState<string | null>(null);
  const [, setIsLoadingThumb] = useState<boolean>(false);
  const [useThumbnailBg, setUseThumbnailBg] = useState<boolean>(true);
  const [isCustomSize, setIsCustomSize] = useState<boolean>(
    ![10, 12, 14, 16, 18].includes(settings.fontSize)
  );

  // Extract first page thumbnail when primaryFile changes
  useEffect(() => {
    let active = true;
    if (primaryFile && (primaryFile.type === 'application/pdf' || primaryFile.name.toLowerCase().endsWith('.pdf'))) {
      setIsLoadingThumb(true);
      renderPdfPageThumbnail(primaryFile, 1, 460)
        .then((url) => {
          if (active) {
            setRealThumbnail(url);
            setIsLoadingThumb(false);
          }
        })
        .catch(() => {
          if (active) {
            setRealThumbnail(null);
            setIsLoadingThumb(false);
          }
        });
    } else {
      setRealThumbnail(null);
      setIsLoadingThumb(false);
    }
    return () => {
      active = false;
    };
  }, [primaryFile]);

  // Compute sample text
  const sampleNumberText = settings.format
    .replace('{n}', String(settings.startAt || 1))
    .replace('{total}', '10');

  // Helper to toggle bold weight
  const toggleBold = (makeBold: boolean) => {
    const baseFamily = settings.fontFamily.replace('-Bold', '') as 'Helvetica' | 'Times-Roman' | 'Courier';
    const newFamily: PageNumberFont = makeBold
      ? ((baseFamily + '-Bold') as PageNumberFont)
      : baseFamily;
    onChange({
      ...settings,
      isBold: makeBold,
      fontFamily: newFamily,
    });
  };

  // Helper to change base font family while preserving bold state
  const handleFontFamilyChange = (baseName: 'Helvetica' | 'Times-Roman' | 'Courier') => {
    const finalFont = settings.isBold
      ? ((baseName + '-Bold') as PageNumberFont)
      : baseName;
    onChange({
      ...settings,
      fontFamily: finalFont,
    });
  };

  // CSS font family string for preview
  const previewFontFamily = settings.fontFamily.includes('Times')
    ? '"Times New Roman", Times, serif'
    : settings.fontFamily.includes('Courier')
    ? '"Courier New", Courier, monospace'
    : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 transition-all">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Page Numbering Visual Studio</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Live Page Demo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive document sheet showing exact placement, thickness, font size, and color.
          </p>
        </div>

        {/* Large file badge & file counter */}
        <div className="flex items-center gap-2">
          {primaryFile && (
            <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {(primaryFile.size / (1024 * 1024)).toFixed(1)} MB
                {totalFilesCount > 1 ? ` · ${totalFilesCount} files ready` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Left = Interactive Demo Page, Right = Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Document Page Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.pageNumberDemoTitle}</span>
            </span>

            {realThumbnail && (
              <button
                type="button"
                onClick={() => setUseThumbnailBg(!useThumbnailBg)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {useThumbnailBg ? 'Show Dummy Layout' : 'Show Uploaded Page'}
              </button>
            )}
          </div>

          {/* Interactive Document Page Container */}
          <div className="w-full max-w-[340px] sm:max-w-[380px]">
            <div
              className="relative w-full aspect-[1/1.414] bg-white rounded-xl shadow-lg border-2 border-slate-300 dark:border-slate-700 select-none overflow-hidden transition-all group"
              title="Click on any placement position on the sheet"
            >
              {/* Optional Real PDF Background */}
              {useThumbnailBg && realThumbnail ? (
                <img
                  src={realThumbnail}
                  alt="Document Page 1"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85"
                />
              ) : (
                /* Simulated Document Content Skeleton */
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-60">
                  {/* Top document simulated header */}
                  <div className="space-y-2">
                    <div className="h-2 w-1/3 bg-slate-300 dark:bg-slate-400 rounded-sm" />
                    <div className="h-3 w-3/4 bg-slate-400 dark:bg-slate-500 rounded-sm mb-4" />
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-4/5 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                  </div>

                  {/* Middle document paragraphs */}
                  <div className="space-y-2 my-auto">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-11/12 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-4/5 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                  </div>

                  {/* Bottom document lines */}
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-400 rounded-xs" />
                    <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-slate-400 rounded-xs" />
                  </div>
                </div>
              )}

              {/* Margin boundary guides (subtle dashed box) */}
              <div
                className="absolute inset-0 pointer-events-none border border-dashed border-indigo-300/40 dark:border-indigo-600/40 rounded-lg m-5"
              />

              {/* 6 Clickable Placement Targets (Anchors) */}
              {POSITION_OPTIONS.map((pos) => {
                const isSelected = settings.position === pos.id;
                // Position CSS styles
                let posClasses = '';
                if (pos.id === 'top-left') posClasses = 'top-4 left-5';
                if (pos.id === 'top-center') posClasses = 'top-4 left-1/2 -translate-x-1/2';
                if (pos.id === 'top-right') posClasses = 'top-4 right-5';
                if (pos.id === 'bottom-left') posClasses = 'bottom-4 left-5';
                if (pos.id === 'bottom-center') posClasses = 'bottom-4 left-1/2 -translate-x-1/2';
                if (pos.id === 'bottom-right') posClasses = 'bottom-4 right-5';

                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => onChange({ ...settings, position: pos.id })}
                    title={`Place page numbers at ${pos.label}`}
                    className={`absolute z-10 transition-all cursor-pointer flex items-center justify-center ${posClasses}`}
                  >
                    {isSelected ? (
                      /* Active Rendered Page Number: Plain text ONLY, no circle, no square box */
                      <div
                        className="whitespace-nowrap transition-transform duration-150 inline-block select-none pointer-events-none drop-shadow-2xs"
                        style={{
                          color: settings.colorHex,
                          fontFamily: previewFontFamily,
                          fontWeight: settings.isBold ? 700 : 400,
                          fontSize: `${Math.max(11, Math.min(22, Math.round(settings.fontSize * 0.95)))}px`,
                          lineHeight: 1,
                        }}
                      >
                        {sampleNumberText}
                      </div>
                    ) : (
                      /* Minimal click target for alternate placements */
                      <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/70 flex items-center justify-center text-[10px] text-slate-400 hover:text-indigo-600 transition-colors bg-white/40 backdrop-blur-2xs">
                        +
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Status pill on preview */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-xs text-white text-[10px] font-mono pointer-events-none flex items-center gap-1.5 shadow-sm">
                <Hash className="w-2.5 h-2.5 text-indigo-400" />
                <span className="capitalize">{settings.position.replace('-', ' ')}</span>
                <span>·</span>
                <span>{settings.fontSize}pt</span>
                <span>·</span>
                <span>{settings.isBold ? t.pageNumberBold : t.pageNumberRegular}</span>
              </div>
            </div>

            {/* Helper Caption */}
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>{t.pageNumberClickHint}</span>
            </p>
          </div>
        </div>

        {/* Right Column: Settings & Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. POSITION SELECTION BUTTONS (Top Left/Center/Right, Bottom Left/Center/Right) */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.pageNumberPositionLabel}</span>
              </label>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/50 capitalize">
                {settings.position.replace('-', ' ')}
              </span>
            </div>

            {/* Top / Header Zone Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                {t.pageNumberHeaderZone}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'top-left' as const, label: t.pageNumberPositionTopLeft, icon: AlignLeft },
                  { id: 'top-center' as const, label: t.pageNumberPositionTopCenter, icon: AlignCenter },
                  { id: 'top-right' as const, label: t.pageNumberPositionTopRight, icon: AlignRight },
                ].map((pos) => {
                  const isSelected = settings.position === pos.id;
                  const Icon = pos.icon;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => onChange({ ...settings, position: pos.id })}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom / Footer Zone Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                {t.pageNumberFooterZone}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom-left' as const, label: t.pageNumberPositionBottomLeft, icon: AlignLeft },
                  { id: 'bottom-center' as const, label: t.pageNumberPositionBottomCenter, icon: AlignCenter },
                  { id: 'bottom-right' as const, label: t.pageNumberPositionBottomRight, icon: AlignRight },
                ].map((pos) => {
                  const isSelected = settings.position === pos.id;
                  const Icon = pos.icon;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => onChange({ ...settings, position: pos.id })}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. THICKNESS & WEIGHT + FONT STYLE */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bold className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.pageNumberThicknessLabel}</span>
              </label>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
                {settings.isBold ? t.pageNumberBold : t.pageNumberRegular}
              </span>
            </div>

            {/* Thickness Toggle: Regular vs Bold */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleBold(false)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !settings.isBold
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-normal'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{t.pageNumberRegular}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleBold(true)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.isBold
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
                <span>{t.pageNumberBold}</span>
              </button>
            </div>

            {/* Font Family Selection */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {t.pageNumberFontLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Helvetica' as const, label: 'Helvetica', desc: 'Clean Sans' },
                  { id: 'Times-Roman' as const, label: 'Times Roman', desc: 'Formal Serif' },
                  { id: 'Courier' as const, label: 'Courier', desc: 'Monospace' },
                ].map((f) => {
                  const isSelected = settings.fontFamily.replace('-Bold', '') === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFontFamilyChange(f.id)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/40'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs">{f.label}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. FONT SIZE CONTROLS (10, 12, 14, 16, 18, Custom) */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.pageNumberSizeLabel} (10, 12, 14, 16, 18 pt & Custom)</span>
              </label>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                {settings.fontSize} pt
              </span>
            </div>

            {/* Standard Size Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {STANDARD_SIZES.map((item) => {
                const isSelected = !isCustomSize && settings.fontSize === item.size;
                return (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => {
                      onChange({ ...settings, fontSize: item.size });
                      setIsCustomSize(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomSize(true)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isCustomSize || ![10, 12, 14, 16, 18].includes(settings.fontSize)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.pageNumberCustomSize}
              </button>
            </div>

            {/* Custom Range Slider & Numeric Stepper */}
            {(isCustomSize || ![10, 12, 14, 16, 18].includes(settings.fontSize)) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                <input
                  type="range"
                  min="8"
                  max="36"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => {
                    const sz = parseInt(e.target.value) || 12;
                    onChange({ ...settings, fontSize: sz });
                    setIsCustomSize(true);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="8"
                    max="48"
                    value={settings.fontSize}
                    onChange={(e) => {
                      const sz = Math.max(6, Math.min(60, parseInt(e.target.value) || 12));
                      onChange({ ...settings, fontSize: sz });
                      setIsCustomSize(true);
                    }}
                    className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400">pt</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. COLOR SELECTION & PALETTES */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t.pageNumberColorLabel}</span>
              </label>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {settings.colorHex}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {COLOR_PRESETS.map((col) => {
                const isSelected = settings.colorHex.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => onChange({ ...settings, colorHex: col.hex })}
                    title={col.name}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-2xs ${
                      isSelected
                        ? 'scale-115 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-xs'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                  </button>
                );
              })}

              {/* Native Color Wheel / Custom Hex Picker */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <input
                  type="color"
                  value={settings.colorHex}
                  onChange={(e) => onChange({ ...settings, colorHex: e.target.value })}
                  title="Choose Any Custom Hex Color"
                  className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Custom</span>
              </div>
            </div>
          </div>

          {/* 5. NUMBERING FORMAT & STARTING PAGE */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Numbering Format */}
              <div>
                <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block mb-1">
                  {t.pageNumberFormatLabel}
                </label>
                <select
                  value={settings.format}
                  onChange={(e: any) => onChange({ ...settings, format: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Page {n} of {total}">Page 1 of N (Standard)</option>
                  <option value="{n} / {total}">1 / N (Slash)</option>
                  <option value="{n}">1 (Number only)</option>
                  <option value="- {n} -">- 1 - (Hyphenated)</option>
                  <option value="Page {n}">Page 1 (No Total)</option>
                </select>
              </div>

              {/* Starting Number */}
              <div>
                <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block mb-1">
                  {t.pageNumberStartLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.startAt}
                  onChange={(e) => onChange({ ...settings, startAt: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Margin Offset */}
              <div>
                <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block mb-1">
                  {t.pageNumberMarginLabel}
                </label>
                <select
                  value={settings.margin}
                  onChange={(e) => onChange({ ...settings, margin: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="15">Compact (15 pt - Closer to Edge)</option>
                  <option value="25">Standard (25 pt - Recommended)</option>
                  <option value="40">Spacious (40 pt - Inside Margin)</option>
                </select>
              </div>

              {/* Skip Cover Page Toggle */}
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.skipCoverPage}
                    onChange={(e) => onChange({ ...settings, skipCoverPage: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-medium">{t.pageNumberSkipCoverLabel}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
