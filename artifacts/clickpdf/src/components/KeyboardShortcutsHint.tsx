import React, { useState } from 'react';
import { Command, X, Search, CornerDownLeft, Sparkles, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsHintProps {
  onOpenCommandPalette: () => void;
  onFocusSearch: () => void;
}

export const KeyboardShortcutsHint: React.FC<KeyboardShortcutsHintProps> = ({
  onOpenCommandPalette,
  onFocusSearch
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);

  const isMac = typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const SHORTCUTS = [
    { key: `${modKey}+K`, description: 'Open Command Palette & Global Search' },
    { key: '/', description: 'Quick jump to Search bar input' },
    { key: 'Esc', description: 'Close any active modal or return to Home from Tool' },
    { key: 'H', description: 'Go directly to Home dashboard (when not typing)' },
    { key: '?', description: 'View full Keyboard Shortcuts reference cheatsheet' },
  ];

  return (
    <>
      {/* Floating subtle shortcut pill badge in bottom-left */}
      {!isDismissed && (
        <aside
          aria-label="Keyboard Shortcuts Floating Pill"
          className="fixed bottom-4 left-4 z-30 hidden md:flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full shadow-lg shadow-slate-900/5 text-xs transition-all hover:border-indigo-400 dark:hover:border-indigo-500 group"
        >
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-medium"
            title="Press Ctrl+K or / anytime"
          >
            <Command className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-semibold">Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 shadow-2xs">
              {modKey}+K
            </kbd>
            <span className="text-slate-400">or</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 shadow-2xs">
              /
            </kbd>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            onClick={() => setShowHelperModal(true)}
            className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted cursor-pointer"
          >
            Cheatsheet
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss shortcut hint"
            className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* Cheatsheet Modal */}
      {showHelperModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts Cheatsheet"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowHelperModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Command className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Keyboard Shortcuts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Navigate ClickPDF like a power user</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelperModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {SHORTCUTS.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {s.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowHelperModal(false);
                  onOpenCommandPalette();
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Palette Now</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>

              <button
                onClick={() => setShowHelperModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
