import React from 'react';
import { Laptop, Smartphone, Building2, Shield, Lock, Cpu, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 pt-8 sm:pt-12 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Work Your Way Section */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 block">
            {t.privacyTag}
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.workYourWayTitle}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t.workYourWaySubtitle}
          </p>
        </div>

        {/* 3 Value Cards - strictly 3 in 1 line */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-5">
                <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">
                {t.feature1Title}
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-normal sm:leading-relaxed line-clamp-4">
                {t.feature1Desc}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3 sm:mb-5">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">
                {t.feature2Title}
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-normal sm:leading-relaxed line-clamp-4">
                {t.feature2Desc}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 sm:mb-5">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">
                {t.feature3Title}
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-normal sm:leading-relaxed line-clamp-4">
                {t.feature3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 text-center max-w-4xl mx-auto shadow-xs">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
            {t.trustTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            {t.trustSubtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-left">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{t.trust1}</p>
                <p className="text-[10px] text-slate-400">{t.trust1Sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{t.trust2}</p>
                <p className="text-[10px] text-slate-400">{t.trust2Sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-cyan-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{t.trust3}</p>
                <p className="text-[10px] text-slate-400">{t.trust3Sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{t.trust4}</p>
                <p className="text-[10px] text-slate-400">{t.trust4Sub}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
