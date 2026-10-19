import React from 'react';
import { Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FloatingShareButtonProps {
  onOpenShare: () => void;
}

export const FloatingShareButton: React.FC<FloatingShareButtonProps> = ({ onOpenShare }) => {
  const { language } = useLanguage();

  const shareLabel = 'Share';

  return (
    <aside
      aria-label="Share ClickPDF Floating Button"
      className="fixed bottom-5 right-5 z-30 flex items-center"
    >
      <button
        type="button"
        onClick={onOpenShare}
        aria-label="Share ClickPDF on WhatsApp and Social Media"
        title="Share ClickPDF with Friends & Colleagues (WhatsApp, Facebook, Twitter, Telegram)"
        className="group relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 backdrop-blur-xs"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
        </span>
        <Share2 className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
        <span className="tracking-wide">{shareLabel}</span>
      </button>
    </aside>
  );
};
