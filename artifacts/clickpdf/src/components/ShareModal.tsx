import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title = 'ClickPDF — Free In-Browser PDF Tools & Editor',
  text = 'Free, private, in-browser PDF tools suite. Merge, split, compress, convert, and protect PDFs with 100% privacy and zero server uploads.',
  url = typeof window !== 'undefined' ? window.location.href : 'https://clickpdf.net'
}) => {
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setSupportsNativeShare(true);
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://clickpdf.net');
  const shareText = text || 'Check out ClickPDF for free and secure in-browser PDF editing!';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: currentUrl
        });
        onClose();
      } catch {
        // User cancelled share
      }
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(`${title}\n\n${shareText}`);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075-1.527-.765-2.529-1.365-3.535-3.097-.264-.454.264-.421.756-1.405.083-.166.042-.311-.021-.436-.063-.125-.676-1.63-.927-2.234-.244-.588-.493-.508-.676-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.2 2.124 3.243 5.145 4.549 2.059.89 2.87.892 3.896.741 1.05-.155 2.279-.931 2.605-1.83.326-.899.326-1.669.226-1.83-.1-.161-.301-.261-.602-.411zm-5.466 7.423c-2.079 0-4.043-.635-5.698-1.73l-.409-.272-4.225 1.109 1.127-4.121-.266-.424a9.92 9.92 0 01-1.524-5.344c0-5.514 4.486-10 10-10 2.673 0 5.186 1.042 7.076 2.932a9.94 9.94 0 012.924 7.068c0 5.514-4.486 10-10 10z" />
        </svg>
      ),
      bg: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      href: `https://api.whatsapp.com/send?text=${encodedText}%0A%0A${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: 'bg-blue-600 hover:bg-blue-700 text-white',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: <Send className="w-4 h-4" />,
      bg: 'bg-sky-500 hover:bg-sky-600 text-white',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      bg: 'bg-blue-700 hover:bg-blue-800 text-white',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <Share2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Share with Colleagues & Friends
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          Share ClickPDF to help others edit and manage PDF documents for free with 100% privacy.
        </p>

        {/* Native Mobile Share Button (if supported) */}
        {supportsNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Share via Phone Apps (WhatsApp, etc.)</span>
          </button>
        )}

        {/* Social Share Icon Buttons */}
        <div className="mt-5 grid grid-cols-5 gap-2.5">
          {shareLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer ${item.bg}`}
              title={`Share on ${item.name}`}
            >
              {item.icon}
              <span className="text-[10px] font-bold truncate max-w-full">{item.name}</span>
            </a>
          ))}
        </div>

        {/* Direct Link Copy Field */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-left">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
            Or copy direct web link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 dark:text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500">
          Zero server uploads · Private & client-side
        </div>
      </div>
    </div>
  );
};
