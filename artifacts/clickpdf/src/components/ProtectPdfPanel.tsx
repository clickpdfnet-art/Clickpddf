import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  FileCode,
  KeyRound,
  Shield,
  Zap
} from 'lucide-react';
import { checkPasswordStrength } from '../utils/cryptoEngine';

interface ProtectPdfPanelProps {
  onProtect: (password: string, hint?: string) => void;
  isProcessing: boolean;
  fileName: string;
}

export const ProtectPdfPanel: React.FC<ProtectPdfPanelProps> = ({
  onProtect,
  isProcessing,
  fileName
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hint, setHint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const strength = checkPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 4) {
      setError('Password must contain at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match exactly.');
      return;
    }

    onProtect(password, hint.trim() || undefined);
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Web Crypto API Security
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              AES-256-GCM / 250k PBKDF2
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Client-Side Password Protection
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Lock <span className="font-semibold text-slate-800 dark:text-slate-200">{fileName}</span> with hardware-accelerated browser encryption. Your password never leaves your computer.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Choose Password
            </label>
            {password && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Strength: <span className="text-slate-900 dark:text-white">{strength.label}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter secure document password..."
              disabled={isProcessing}
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-colors"
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

          {/* Strength meter bar */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-colors ${
                      strength.score >= step
                        ? strength.color
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {strength.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            {passwordsMatch && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Passwords match
              </span>
            )}
            {passwordsMismatch && (
              <span className="text-[11px] font-semibold text-rose-500 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Passwords do not match
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Re-enter password to confirm..."
              disabled={isProcessing}
              className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                passwordsMismatch
                  ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/40'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500/40 focus:border-rose-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password Hint */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Password Reminder / Hint <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
          </div>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g., Office room number, favorite city..."
            disabled={isProcessing}
            maxLength={60}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-colors"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Displayed on the document cover page to help authorized recipients recall the secret.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Security architecture highlights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Zero-Knowledge Security Architecture
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Hardware-Accelerated:</strong> Powered by W3C Web Cryptography API (`crypto.subtle`).</span>
            </div>
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong>Key Derivation:</strong> PBKDF2 with SHA-256 and 250,000 hash iterations.</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span><strong>Cipher:</strong> 256-bit AES-GCM with authenticated integrity checks.</span>
            </div>
            <div className="flex items-start gap-2">
              <FileCode className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <span><strong>Dual Output:</strong> Generates Protected PDF and Standalone Offline Vault HTML.</span>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isProcessing || !password || password !== confirmPassword}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4 text-rose-200" />
            <span>{isProcessing ? 'Encrypting with Web Crypto...' : 'Protect PDF with Web Crypto'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
