import React, { useState, useMemo } from 'react';
import { PDFTool, BlogPost } from '../types';
import {
  generateSitemapXml,
  getSitemapEntries,
  downloadSitemapXmlFile,
  normalizeBaseUrl,
  SitemapEntry
} from '../utils/sitemapGenerator';
import { buildAppPath } from '../utils/routeParser';
import {
  X,
  Download,
  Copy,
  Check,
  Globe,
  Search,
  ExternalLink,
  Code,
  List,
  Sparkles,
  FileText,
  Layers,
  BookOpen,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: PDFTool[];
  articles: BlogPost[];
  onSelectTool?: (tool: PDFTool) => void;
  onSelectArticle?: (article: BlogPost) => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  tools,
  articles,
  onSelectTool,
  onSelectArticle
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'xml'>('visual');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [customDomain, setCustomDomain] = useState(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://clickpdf.net';
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const entries = useMemo(() => {
    return getSitemapEntries({
      baseUrl: customDomain,
      tools,
      articles
    });
  }, [customDomain, tools, articles]);

  const rawXml = useMemo(() => {
    return generateSitemapXml({
      baseUrl: customDomain,
      tools,
      articles,
      includeImages: true
    });
  }, [customDomain, tools, articles]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCat =
        categoryFilter === 'all' ||
        (categoryFilter === 'tools' && entry.category === 'tool') ||
        (categoryFilter === 'blog' && (entry.category === 'blog-index' || entry.category === 'blog-post')) ||
        (categoryFilter === 'core' && entry.category === 'core');

      const matchesSearch =
        entry.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        entry.path.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (entry.description && entry.description.toLowerCase().includes(searchFilter.toLowerCase()));

      return matchesCat && matchesSearch;
    });
  }, [entries, categoryFilter, searchFilter]);

  if (!isOpen) return null;

  const handleCopyXml = async () => {
    try {
      await navigator.clipboard.writeText(rawXml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = rawXml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownload = () => {
    downloadSitemapXmlFile({
      baseUrl: customDomain,
      tools,
      articles
    });
  };

  const handleEntryClick = (entry: SitemapEntry) => {
    if (entry.category === 'tool') {
      const toolId = entry.path.replace('/?tool=', '');
      const toolMatch = tools.find((t) => t.id === toolId);
      if (toolMatch && onSelectTool) {
        onSelectTool(toolMatch);
        onClose();
        return;
      }
    } else if (entry.category === 'blog-post') {
      const slug = entry.path.replace(/^\/blog\//, '').replace('/?article=', '');
      const articleMatch = articles.find((a) => a.slug === slug);
      if (articleMatch && onSelectArticle) {
        onSelectArticle(articleMatch);
        onClose();
        return;
      }
    }
    // Otherwise open in same window or tab
    window.location.href = buildAppPath(entry.path);
    onClose();
  };

  const toolCount = entries.filter((e) => e.category === 'tool').length;
  const blogCount = entries.filter((e) => e.category === 'blog-post').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Dynamic XML Sitemap
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                  sitemaps.org 0.9
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Auto-generates indexed links for {toolCount} PDF tools and {blogCount} blog articles for Google & Bing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close sitemap modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Configuration Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Quick Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Total Indexed URLs: <strong className="text-slate-900 dark:text-white">{entries.length}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              Core: <strong className="text-indigo-600 dark:text-indigo-400">1</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Tools: <strong className="text-indigo-600 dark:text-indigo-400">{toolCount}</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Articles: <strong className="text-indigo-600 dark:text-indigo-400">{blogCount}</strong>
            </span>
          </div>

          {/* Actions: Mode switch, Copy, Download */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switch */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'visual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Visual URLs</span>
              </button>
              <button
                onClick={() => setViewMode('xml')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'xml'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw XML</span>
              </button>
            </div>

            <button
              onClick={handleCopyXml}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{copied ? 'XML Copied!' : 'Copy XML'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sitemap.xml</span>
            </button>
          </div>
        </div>

        {/* Base URL & Filter Row (in Visual view) */}
        {viewMode === 'visual' && (
          <div className="p-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search tools or articles in sitemap..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Pages' },
                { id: 'tools', label: `PDF Tools (${toolCount})` },
                { id: 'blog', label: `Articles (${blogCount})` },
                { id: 'core', label: 'Core / Home' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setCategoryFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    categoryFilter === pill.id
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {viewMode === 'visual' ? (
            <div className="space-y-2.5">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No sitemap URLs match your search filter.
                </div>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleEntryClick(entry)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            entry.category === 'core'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : entry.category === 'tool'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {entry.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {entry.title}
                        </h4>
                        {entry.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {entry.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                          {entry.loc}
                        </span>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                      <div className="text-right">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          Priority {entry.priority}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {entry.changefreq} · {entry.lastmod}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[60vh]">
                <code>{rawXml}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-100/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Search Engine Compliant: Googlebot, Bingbot, Yandex & DuckDuckGo compatible</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px]">GET /sitemap.xml</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[10px]">GET /robots.txt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
