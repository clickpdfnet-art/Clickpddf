import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenCookiesPolicy: () => void;
}

const COOKIE_CONSENT_KEY = 'clickpdf_cookie_consent_v1';
const CONSENT_CHANGED_EVENT = 'clickpdf-cookie-consent-change';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenCookiesPolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Show after a brief delay so it doesn't jarringly pop up during initial paint
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage unavailable
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {}
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    } catch {}
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" />
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-bold text-white tracking-wide">Cookie & Privacy Notice</h4>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-medium inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              0 Server Uploads
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            ClickPDF processes all PDF documents 100% locally in your browser. We use standard browser storage and partner with third-party advertising networks that use standard cookies to serve and measure ads. Review our{' '}
            <button
              type="button"
              onClick={onOpenCookiesPolicy}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              Cookies Policy
            </button>{' '}
            for complete transparency.
          </p>

          <div className="mt-3.5 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              Accept Cookies
            </button>
            <button
              type="button"
              onClick={onOpenCookiesPolicy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              Manage & Settings
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white transition-colors -mr-1 -mt-1 cursor-pointer"
          aria-label="Dismiss cookie notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
