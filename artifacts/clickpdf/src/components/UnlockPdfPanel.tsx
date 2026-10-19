import React, { useState, useEffect } from 'react';
import {
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { inspectProtectedPdf } from '../utils/cryptoEngine';

interface UnlockPdfPanelProps {
  file: File;
  onUnlock: (password: string) => void;
  isProcessing: boolean;
}

export const UnlockPdfPanel: React.FC<UnlockPdfPanelProps> = ({
  file,
  onUnlock,
  isProcessing
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    file.arrayBuffer().then(async (buf) => {
      if (!isMounted) return;
      const info = await inspectProtectedPdf(new Uint8Array(buf));
      if (info && info.isProtected) {
        if (info.hint) setHint(info.hint);
        if (info.originalName) setOriginalName(info.originalName);
      }
    }).catch(() => {
      // ignore inspect error
    });
    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Please enter the document password to unlock.');
      return;
    }
    onUnlock(password);
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
          <Unlock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Web Crypto Decryption
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Client-Side AES-GCM
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Unlock Protected Document
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Decrypt <span className="font-semibold text-slate-800 dark:text-slate-200">{originalName || file.name}</span> in-browser memory with the document password.
          </p>
        </div>
      </div>

      {hint && (
        <div className="mb-5 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Password Reminder / Hint:</span>{' '}
            <span>{hint}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Enter Document Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password..."
              disabled={isProcessing}
              autoFocus
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isProcessing || !password}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <KeyRound className="w-4 h-4 text-amber-200" />
            <span>{isProcessing ? 'Decrypting...' : 'Decrypt & Unlock Document'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
