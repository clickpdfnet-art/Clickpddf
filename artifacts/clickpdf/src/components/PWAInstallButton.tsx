import React, { useState } from 'react';
import {
  Download,
  Check,
  Monitor,
  Smartphone,
  Apple,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';
import { INSTALL_MODAL_TRANSLATIONS } from '../i18n/installModalTranslations';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'footer';
  className?: string;
  footerLabel?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  footerLabel,
}) => {
  const { language } = useLanguage();
  const copy = INSTALL_MODAL_TRANSLATIONS[language];
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    // If browser supports native automated prompt (Chrome, Edge, Android)
    if (isInstallable) {
      const installed = await installApp();
      if (!installed) {
        // If user dismissed or browser blocked in iframe preview, show the helpful guidance modal
        setShowModal(true);
      }
    } else {
      // In development / preview iframe or Safari/Firefox, open modern install guidance modal
      setShowModal(true);
    }
  };

  const handleCopyUrl = () => {
    const liveUrl = window.location.href.split('?')[0];
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={copy.ariaLabel}
          title={copy.title}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-white animate-bounce" />
          <span className="hidden xs:inline sm:inline">{copy.headerLabel}</span>
          <span className="xs:hidden sm:hidden">{copy.shortLabel}</span>
        </button>
      ) : variant === 'drawer' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>{copy.drawerLabel}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{footerLabel || copy.footerFallback}</span>
        </button>
      )}

      {/* Modern Interactive Installation Modal for Desktop & Mobile */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-start">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label={copy.closeModal}
              title={copy.closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {copy.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            {/* Environment notification notice */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-950 dark:text-indigo-200 text-xs mb-5 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{copy.quickTitle}</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {copy.quickDescription}
              </p>
            </div>

            {/* Steps per platform */}
            <div className="space-y-3.5 text-xs">
              {/* Option 1: Chrome / Edge on Windows & Mac */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Laptop className="w-4 h-4 text-indigo-500" />
                  <span>{copy.chromeTitle}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {copy.chromeDescription}
                </p>
              </div>

              {/* Option 2: Mobile Chrome / Android */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>{copy.androidTitle}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {copy.androidDescription}
                </p>
              </div>

              {/* Option 3: Safari on iPhone & iPad */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Apple className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>{copy.iphoneTitle}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {copy.iphoneDescription}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copied ? copy.linkCopied : copy.copyWebsiteUrl}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {copy.gotIt}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
