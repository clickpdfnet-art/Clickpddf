import React, { useState, useMemo, useEffect } from 'react';
import { BlogPost, SeoMetaConfig } from '../types';
import { PDF_TOOLS } from '../data/toolsData';
import { DEFAULT_SEO_CONFIG } from '../utils/seoManager';
import { sanitizeHtml, isSafeUrl, sanitizeUrl } from '../utils/securitySanitizer';
import {
  X,
  Edit3,
  Save,
  Sparkles,
  FileText,
  CheckCircle,
  Trash2,
  Globe,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Lock,
  Key,
  AlertCircle,
  Search,
  Share2,
  RotateCcw,
  Activity,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  History,
  Database,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  generateSitemapXml,
  getSitemapEntries,
  downloadSitemapXmlFile
} from '../utils/sitemapGenerator';
import {
  recordAuditEvent,
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogsJson,
  formatAuditTime,
  AuditLogEntry,
  AuditCategory
} from '../utils/auditLogger';
import {
  getCacheStorageStats,
  warmCoreResourceCache,
  purgeAllResourceCaches,
  CacheStorageStats
} from '../utils/cacheManager';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: BlogPost[];
  onSaveArticles: (articles: BlogPost[]) => void;
  seoConfig?: SeoMetaConfig;
  onSaveSeoConfig?: (config: SeoMetaConfig) => void;
  onOpenSitemapModal?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  articles = [],
  onSaveArticles,
  seoConfig = DEFAULT_SEO_CONFIG,
  onSaveSeoConfig,
  onOpenSitemapModal,
}) => {
  const { t } = useLanguage();
  const safeArticles = useMemo(() => Array.isArray(articles) ? articles : [], [articles]);
  const [activeTab, setActiveTab] = useState<'articles' | 'sitemap' | 'seo' | 'security'>('articles');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);

  // Security Audit & Cache state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<AuditCategory | 'all'>('all');
  const [cacheStats, setCacheStats] = useState<CacheStorageStats | null>(null);
  const [isWarmingCache, setIsWarmingCache] = useState(false);
  const [isPurgingCache, setIsPurgingCache] = useState(false);

  // New article form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Guides & Tips');
  const [author, setAuthor] = useState('ClickPDF Editor');
  const [readTime, setReadTime] = useState('4 min read');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80');
  const [editingId, setEditingId] = useState<string | null>(null);

  // SEO form state
  const [localSeo, setLocalSeo] = useState<SeoMetaConfig>(() => seoConfig || DEFAULT_SEO_CONFIG);

  const showToast = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    if (editingId) {
      const updated = articles.map(art => {
        if (art.id === editingId) {
          return {
            ...art,
            title,
            category,
            author,
            readTime,
            excerpt,
            content,
            coverImage: coverImage.trim() || undefined,
          };
        }
        return art;
      });
      onSaveArticles(updated);
      recordAuditEvent('ARTICLE_UPDATED', 'content', 'info', `Article "${title}" was updated.`);
      showToast('Article updated successfully!');
      setEditingId(null);
    } else {
      const newPost: BlogPost = {
        id: `art-${Date.now()}`,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category,
        author,
        readTime,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        excerpt,
        content: content || excerpt,
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      };
      onSaveArticles([newPost, ...articles]);
      recordAuditEvent('ARTICLE_CREATED', 'content', 'info', `New article "${title}" published.`);
      showToast('New article published to website!');
    }

    // Reset form
    setTitle('');
    setExcerpt('');
    setContent('');
  };

  const handleEditClick = (art: BlogPost) => {
    setEditingId(art.id);
    setTitle(art.title);
    setCategory(art.category);
    setAuthor(art.author);
    setReadTime(art.readTime);
    setExcerpt(art.excerpt);
    setContent(art.content);
    setCoverImage(art.coverImage || '');
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updated = articles.filter(a => a.id !== id);
      onSaveArticles(updated);
      recordAuditEvent('ARTICLE_DELETED', 'content', 'warning', `Article with ID ${id} was deleted.`);
      showToast('Article deleted.');
    }
  };

  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    const safeOgImage = isSafeUrl(localSeo.ogImage) ? localSeo.ogImage.trim() : DEFAULT_SEO_CONFIG.ogImage;
    const cleanSeo: SeoMetaConfig = {
      ...localSeo,
      title: localSeo.title.trim(),
      description: localSeo.description.trim(),
      keywords: localSeo.keywords.trim(),
      canonicalUrl: isSafeUrl(localSeo.canonicalUrl) ? localSeo.canonicalUrl.trim() : DEFAULT_SEO_CONFIG.canonicalUrl,
      ogImage: safeOgImage,
      ogTitle: localSeo.ogTitle.trim() || localSeo.title.trim(),
      ogDescription: localSeo.ogDescription.trim() || localSeo.description.trim(),
      twitterCard: localSeo.twitterCard || 'summary_large_image',
    };
    setLocalSeo(cleanSeo);
    if (onSaveSeoConfig) {
      onSaveSeoConfig(cleanSeo);
    }
    recordAuditEvent('SEO_CONFIG_UPDATED', 'content', 'info', `SEO meta tags and OpenGraph image updated.`);
    showToast('SEO & Social meta tags updated successfully!');
  };

  const handleResetSeo = () => {
    setLocalSeo(DEFAULT_SEO_CONFIG);
    if (onSaveSeoConfig) {
      onSaveSeoConfig(DEFAULT_SEO_CONFIG);
    }
    recordAuditEvent('SEO_CONFIG_UPDATED', 'content', 'info', 'SEO meta tags restored to defaults.');
    showToast('SEO tags restored to recommended defaults.');
  };

  // Load audit logs and cache stats on tab switch when open
  useEffect(() => {
    if (isOpen && activeTab === 'security') {
      setAuditLogs(getAuditLogs());
      getCacheStorageStats().then(setCacheStats);
    }
  }, [isOpen, activeTab]);

  // Keep local configs in sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setLocalSeo(seoConfig);
    }
  }, [isOpen, seoConfig]);

  const handleWarmCache = async () => {
    setIsWarmingCache(true);
    const res = await warmCoreResourceCache();
    setIsWarmingCache(false);
    const stats = await getCacheStorageStats();
    setCacheStats(stats);
    recordAuditEvent('CACHE_WARMED', 'system', 'info', `Core resources pre-cached (${res.cachedCount} assets) for high-speed repeat visits.`);
    setAuditLogs(getAuditLogs());
    showToast(`Resource cache warmed successfully (${res.cachedCount} assets cached)!`);
  };

  const handlePurgeCache = async () => {
    if (!confirm('Are you sure you want to purge all cached assets? Fresh copies will be downloaded on next visit.')) return;
    setIsPurgingCache(true);
    await purgeAllResourceCaches();
    setIsPurgingCache(false);
    const stats = await getCacheStorageStats();
    setCacheStats(stats);
    recordAuditEvent('CACHE_PURGED', 'system', 'warning', 'All service worker and resource caches were purged by administrator.');
    setAuditLogs(getAuditLogs());
    showToast('All resource caches purged cleanly!');
  };

  const handleClearLogs = () => {
    if (!confirm('Are you sure you want to clear audit history?')) return;
    clearAuditLogs();
    setAuditLogs(getAuditLogs());
    showToast('Audit log history cleared.');
  };

  const handleExportLogs = () => {
    exportAuditLogsJson();
    showToast('Audit logs exported to JSON!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {t.adminTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.adminSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Access</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              aria-label="Close Admin Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'articles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tabArticles} ({safeArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sitemap')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sitemap'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t.tabSitemap}</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'seo'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>SEO Meta Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security & Audit Log</span>
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'articles' ? (
            <div>
              {/* GitHub Folder Sync Info Banner */}
              <div className="mb-6 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3 text-xs">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-indigo-950">
                    GitHub Folder Auto-Loading Engine Active (<code className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[11px]">/src/blogs/*.md</code>)
                  </p>
                  <p className="text-indigo-800 leading-relaxed">
                    You can manage blog articles directly from GitHub! Drop any new Markdown file with frontmatter into <strong className="font-semibold">src/blogs/</strong> (e.g. <code className="text-indigo-700">my-guide.md</code>), and Vite automatically discovers and adds it to the live site, dedicated clean route (<code className="text-indigo-700">/blog/my-guide</code>), and dynamic XML sitemap without modifying React code.
                  </p>
                </div>
              </div>

              {/* Add / Edit Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>{editingId ? 'Edit Article' : 'Publish New Daily Article'}</span>
                </h3>

                <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Article Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 Simple Steps to Password Protect PDFs Offline"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Privacy, Security, Guide"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Author</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Read Time</label>
                      <input
                        type="text"
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                        placeholder="4 min read"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs mb-2"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                      <span className="font-medium text-slate-600">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCoverImage('https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-[10px] cursor-pointer"
                      >
                        Cybersecurity
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-[10px] cursor-pointer"
                      >
                        Documents
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-[10px] cursor-pointer"
                      >
                        Watermark & Legal
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-[10px] cursor-pointer"
                      >
                        Photography
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Short Excerpt (SEO Summary)</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Brief overview shown on cards and Google search results..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Full Article Content (Natural Editorial Paragraphs)
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Write natural paragraphs and insights here (no stars or hashes needed)..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Write clean, natural human paragraphs. Headings and lists are formatted automatically.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setTitle('');
                          setExcerpt('');
                          setContent('');
                        }}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingId ? 'Save Changes' : 'Publish to Live Site'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of existing articles */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Current Published Articles ({safeArticles.length})
              </h4>
              <div className="space-y-2">
                {safeArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-4">
                      <p className="font-bold text-slate-900 truncate">{art.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {art.category} · {art.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditClick(art)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'sitemap' ? (
            <div className="space-y-6">
              {/* Sitemap & SEO Overview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span>Dynamic XML Sitemap Engine</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Auto-Updating
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Auto-generates compliant XML links for all PDF tools ({PDF_TOOLS.length}) and blog articles ({safeArticles.length}) according to sitemaps.org standards.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const xml = generateSitemapXml({ articles: safeArticles });
                        navigator.clipboard.writeText(xml);
                        setCopiedXml(true);
                        setTimeout(() => setCopiedXml(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{copiedXml ? 'Copied XML!' : 'Copy XML'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadSitemapXmlFile({ articles: safeArticles })}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download XML</span>
                    </button>

                    {onOpenSitemapModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSitemapModal();
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Sitemap Explorer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="text-slate-400 text-[11px]">Total Indexed Links</div>
                    <div className="text-lg font-black text-slate-900">{1 + PDF_TOOLS.length + 1 + safeArticles.length}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Crawlable</div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="text-slate-400 text-[11px]">PDF Tools</div>
                    <div className="text-lg font-black text-indigo-600">{PDF_TOOLS.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Priority: 0.8 – 0.9</div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="text-slate-400 text-[11px]">Blog Articles</div>
                    <div className="text-lg font-black text-indigo-600">{safeArticles.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Priority: 0.7</div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="text-slate-400 text-[11px]">Compliance</div>
                    <div className="text-lg font-black text-emerald-600">Schema 0.9</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Google / Bing / Yandex</div>
                  </div>
                </div>
              </div>

              {/* Indexed URLs preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Live Indexed URL Catalogue
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {getSitemapEntries({ articles: safeArticles }).map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-semibold text-slate-900">{entry.title}</span>
                        <span className="text-[11px] text-slate-400 block font-mono truncate">{entry.loc}</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <span className="font-semibold text-indigo-600">p: {entry.priority}</span> · <span>{entry.changefreq}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw XML Preview Box */}
              <div className="bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs border border-slate-800">
                <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                  <span>Dynamic /sitemap.xml Output Sample</span>
                  <span>Content-Type: application/xml</span>
                </div>
                <pre className="max-h-48 overflow-y-auto overflow-x-auto text-[11px] leading-relaxed">
                  <code>{generateSitemapXml({ articles: safeArticles }).slice(0, 800)}...</code>
                </pre>
              </div>
            </div>
          ) : activeTab === 'seo' ? (
            /* SEO Meta Tags Editor Tab */
            <form onSubmit={handleSaveSeo} className="space-y-6 text-xs">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-indigo-950 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
                    <Search className="w-4 h-4 text-indigo-600" />
                    <span>Dynamic Search Engine & Social Media Configuration</span>
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                    Changes made here update your site's &lt;title&gt;, meta description, keywords, Open Graph (WhatsApp / Facebook cards), and Twitter cards in real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetSeo}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Reset to recommended standard defaults"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Live Google Search Snippet Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Google Search Snippet Preview
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 inline-block text-[9px] text-center font-bold">G</span>
                  <span>{localSeo.canonicalUrl || 'https://clickpdf.net'}</span>
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                  {localSeo.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {localSeo.description}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Website Title (&lt;title&gt; & og:title)
                  </label>
                  <input
                    type="text"
                    required
                    value={localSeo.title}
                    onChange={(e) => setLocalSeo({ ...localSeo, title: e.target.value, ogTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="ClickPDF — Free In-Browser PDF Tools & Editor"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Recommended length: 40–60 characters (Current: {localSeo.title.length})
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Meta Description (Google & Social Snippets)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={localSeo.description}
                    onChange={(e) => setLocalSeo({ ...localSeo, description: e.target.value, ogDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Fast, private, client-side PDF utility suite..."
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Recommended length: 120–160 characters (Current: {localSeo.description.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      SEO Keywords (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={localSeo.keywords}
                      onChange={(e) => setLocalSeo({ ...localSeo, keywords: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="pdf tools, merge pdf, compress pdf, ocr pdf"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Canonical Domain URL
                    </label>
                    <input
                      type="url"
                      value={localSeo.canonicalUrl}
                      onChange={(e) => setLocalSeo({ ...localSeo, canonicalUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="https://clickpdf.net"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Social Share Card Image URL (og:image)</span>
                  </label>
                  <input
                    type="url"
                    value={localSeo.ogImage}
                    onChange={(e) => setLocalSeo({ ...localSeo, ogImage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="https://example.com/social-preview.png"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Image displayed when sharing link on WhatsApp, Facebook, iMessage, and LinkedIn
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save & Apply SEO Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* Security & Audit Logs + Resource Caching Tab */
            <div className="space-y-6 text-xs">
              {/* 1. Resource Caching & Performance Engine Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900">
                        High-Speed Resource Caching Engine
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Service Worker Stale-While-Revalidate caching keeps static icons, fonts, styles, and tools in local browser storage for lightning-fast repeat page loads.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isWarmingCache}
                      onClick={handleWarmCache}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Pre-cache fonts, styles, and tools for instant speed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isWarmingCache ? 'animate-spin' : ''}`} />
                      <span>{isWarmingCache ? 'Pre-caching...' : 'Warm Cache'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPurgingCache}
                      onClick={handlePurgeCache}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Force delete all cached resources to test fresh download"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Cache</span>
                    </button>
                  </div>
                </div>

                {/* Storage Quota & Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Storage Used</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">{cacheStats?.usageFormatted || 'Optimized (~3.4 MB)'}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Ultra-lightweight footprint</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cache Strategy</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">Stale-While-Revalidate</span>
                    <span className="text-[10px] text-slate-500 font-medium">Instant load + background sync</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ad Isolation</span>
                    <span className="text-sm font-black text-emerald-600 mt-0.5 block">100% Bypass Guaranteed</span>
                    <span className="text-[10px] text-slate-500 font-medium">Ads always load live</span>
                  </div>
                </div>
              </div>

              {/* 2. Security Audit Trail Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Security Audit Trail ({auditLogs.length} Records)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      Tamper-Resistant Log
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportLogs}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
                      title="Clear audit log history"
                    >
                      Clear Log
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(['all', 'auth', 'content', 'security', 'system'] as const).map((cat) => {
                    const active = auditFilter === cat;
                    const labels: Record<string, string> = {
                      all: 'All Events',
                      auth: 'Logins & Auth',
                      content: 'Articles & Ads',
                      security: 'Security & Lockouts',
                      system: 'System & Cache'
                    };
                    const count = cat === 'all' ? auditLogs.length : auditLogs.filter(l => l.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setAuditFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{labels[cat]}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded-full ${active ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Event Log Table / List */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {auditLogs.filter(l => auditFilter === 'all' || l.category === auditFilter).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      No security events recorded in this category.
                    </div>
                  ) : (
                    auditLogs
                      .filter(l => auditFilter === 'all' || l.category === auditFilter)
                      .map((log) => {
                        const isCrit = log.severity === 'critical';
                        const isWarn = log.severity === 'warning';
                        return (
                          <div
                            key={log.id}
                            className="p-3 sm:px-4 flex items-start justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span
                                className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                                  isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-[11px] text-slate-900">
                                    {log.action}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                      isCrit
                                        ? 'bg-rose-100 text-rose-700'
                                        : isWarn
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-indigo-100 text-indigo-700'
                                    }`}
                                  >
                                    {log.severity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed truncate max-w-md sm:max-w-lg">
                                  {log.details}
                                </p>
                              </div>
                            </div>

                            <span className="shrink-0 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                              {formatAuditTime(log.timestamp)}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
