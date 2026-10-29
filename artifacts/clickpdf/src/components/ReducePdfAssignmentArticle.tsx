import React, { useEffect, useMemo, useState } from 'react';
import type { BlogPost } from '../types';
import { BLOG_ARTICLE_DETAIL_TRANSLATIONS } from '../i18n/blogArticleDetailTranslations';
import { TOOL_TRANSLATIONS, type Language } from '../i18n/translations';
import { MISSING_TOOL_TRANSLATIONS, type NewToolId } from '../i18n/missingToolTranslations';
import {
  formatLocalizedByline,
  formatLocalizedDate,
  formatLocalizedReadTime,
} from '../utils/formatLocalizedDate';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  FileType2,
  Images,
  Layers3,
  ShieldCheck,
} from 'lucide-react';

interface ReducePdfAssignmentArticleProps {
  article: BlogPost;
  articles: BlogPost[];
  onBackToHome?: () => void;
  onCloseArticle?: () => void;
  onSelectTool?: (toolId: string) => void;
  onSelectArticle?: (article: BlogPost) => void;
}

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'list'; ordered: boolean; items: string[] };

type ArticleSection = { title: string; id: string; blocks: MarkdownBlock[] };

const inlineImageDimensions: Record<string, [number, number]> = {
  '/blog-assets/image-to-pdf/image-to-pdf-workflow.png': [1800, 840],
  '/blog-assets/image-to-pdf/image-to-pdf-file-processing.png': [1800, 974],
  '/blog-assets/merge-handwritten-assignment/page-order.webp': [1024, 576],
  '/blog-assets/merge-handwritten-assignment/scanning.webp': [1024, 576],
  '/blog-assets/merge-handwritten-assignment/submission.webp': [1024, 576],
  '/blog-assets/reduce-pdf-assignment/compression.jpg': [1600, 900],
  '/blog-assets/reduce-pdf-assignment/scanned-pages.jpg': [1600, 900],
  '/blog-assets/reduce-pdf-assignment/submission.jpg': [1600, 900],
  '/blog-assets/college-assignment/clickpdf-assignment-document-order-4x3.jpg': [1200, 900],
  '/blog-assets/college-assignment/clickpdf-assignment-final-review-4x3.jpg': [1200, 900],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseMarkdown = (content: string) => {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n');
  const intro: MarkdownBlock[] = [];
  const sections: ArticleSection[] = [];
  const idCounts = new Map<string, number>();
  let current: ArticleSection | null = null;
  let listItems: string[] = [];
  let listOrdered = false;

  const destination = () => (current ? current.blocks : intro);
  const flushList = () => {
    if (!listItems.length) return;
    destination().push({ type: 'list', ordered: listOrdered, items: listItems });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flushList();
      const title = heading[1].trim();
      if (/^frequently asked questions$/i.test(title)) {
        current = null;
        break;
      }
      const base = slugify(title) || 'section';
      const occurrence = idCounts.get(base) || 0;
      idCounts.set(base, occurrence + 1);
      const id = occurrence ? `${base}-${occurrence + 1}` : base;
      current = { title, id, blocks: [] };
      sections.push(current);
      continue;
    }
    if (/^#{1,6}\s/.test(line)) continue;

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushList();
      destination().push({
        type: 'image',
        alt: image[1],
        src: image[2],
      });
      continue;
    }

    const list = line.match(/^(\d+\.|-|\*)\s+(.+)$/);
    if (list) {
      const ordered = /^\d+\./.test(list[1]);
      if (listItems.length && ordered !== listOrdered) flushList();
      if (!listItems.length) listOrdered = ordered;
      listItems.push(list[2]);
      continue;
    }

    flushList();
    if (line) destination().push({ type: 'paragraph', text: line });
  }
  flushList();
  return { intro, sections };
};

const InlineText: React.FC<{ text: string; onSelectTool?: (toolId: string) => void }> = ({ text, onSelectTool }) => {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(pattern);
  const toolIdsByPath: Record<string, string> = {
    '/tools/compress-pdf/': 'compress',
    '/tools/image-to-pdf/': 'jpg-to-pdf',
    '/tools/merge-pdf': 'merge',
    '/tools/split-pdf': 'split',
    '/tools/organize-pdf': 'organize',
    '/tools/rotate-pdf': 'rotate',
    '/tools/pdf-to-word': 'pdf-to-word',
  };
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const isTool = href.startsWith('/tools/');
          const toolId = toolIdsByPath[href] || href.split('/').filter(Boolean).pop() || '';
          return (
            <a
              key={index}
              href={href}
              className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition-colors hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={isTool && onSelectTool ? (event) => {
                const id = toolId === 'compress-pdf' ? 'compress' : toolId;
                event.preventDefault();
                onSelectTool(id);
              } : undefined}
            >
              {label}
            </a>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
};

const tools = [
  { href: '/tools/compress-pdf/', id: 'compress', icon: FileText },
  { href: '/tools/pdf-to-word', id: 'pdf-to-word', icon: FileType2 },
  { href: '/tools/image-to-pdf/', id: 'jpg-to-pdf', icon: Images },
  { href: '/tools/merge-pdf', id: 'merge', icon: Layers3 },
];

const ReducePdfAssignmentArticle: React.FC<ReducePdfAssignmentArticleProps> = ({
  article,
  articles,
  onBackToHome,
  onCloseArticle,
  onSelectTool,
  onSelectArticle,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const articleLanguage = (article.locale || 'en') as Language;
  const copy = BLOG_ARTICLE_DETAIL_TRANSLATIONS[articleLanguage] || BLOG_ARTICLE_DETAIL_TRANSLATIONS.en;
  const parsed = useMemo(() => parseMarkdown(article.content), [article.content]);
  const isMobileAssignmentGuide = article.slug === 'merge-handwritten-assignment-photos-into-pdf';
  const primaryToolHref = article.targetToolUrl || '/tools/compress-pdf/';
  const primaryToolId = article.targetTool || (
    primaryToolHref === '/tools/image-to-pdf/' ? 'jpg-to-pdf' : 'compress'
  );
  const primaryToolCta = article.targetToolCta || (
    primaryToolHref === '/tools/image-to-pdf/' ? 'Convert Photos to PDF' : 'Compress PDF Now'
  );
  const primaryToolIsConverter = primaryToolHref === '/tools/image-to-pdf/';
  const breadcrumbTitle = article.breadcrumbs?.[article.breadcrumbs.length - 1]?.name || article.title;
  const relatedArticles = articles
    .filter((item) => item.slug !== article.slug && (!item.locale || item.locale === article.locale))
    .slice(0, 3);
  const pubDate = (() => {
    const parsedDate = new Date(article.date);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) return;

    let targetId = rawHash;
    try {
      targetId = decodeURIComponent(rawHash);
    } catch {
      // Leave a malformed hash unchanged; it simply will not find a target.
    }

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    });
  }, [article.slug]);

  const selectTool = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onSelectTool) return;
    event.preventDefault();
    onSelectTool(id);
  };
  const selectArticle = (event: React.MouseEvent<HTMLAnchorElement>, item: BlogPost) => {
    if (!onSelectArticle) return;
    event.preventDefault();
    onSelectArticle(item);
  };
  const breadcrumbHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onBackToHome) return;
    event.preventDefault();
    onBackToHome();
  };
  const renderBlock = (block: MarkdownBlock, index: number) => {
    if (block.type === 'image') {
      const [width, height] = inlineImageDimensions[block.src] || [1024, 576];
      return (
        <figure key={`image-${index}`} className="my-8 overflow-hidden rounded-2xl border border-[#dbe3ee] bg-[#f2f6fa]">
          <img src={block.src} alt={block.alt || 'PDF assignment workflow illustration'} width={width} height={height} loading="lazy" decoding="async" className="block h-auto max-h-[34rem] w-full object-contain" />
          {block.alt && <figcaption className="px-4 py-3 text-xs leading-relaxed text-slate-500">{block.alt}</figcaption>}
        </figure>
      );
    }
    if (block.type === 'list') {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={`list-${index}`} className={`${block.ordered ? 'list-decimal' : 'list-disc'} my-5 space-y-2.5 pl-6 marker:text-indigo-500`}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1 text-[15px] leading-7 text-slate-700"><InlineText text={item} onSelectTool={onSelectTool} /></li>
          ))}
        </ListTag>
      );
    }
    return <p key={`paragraph-${index}`} className="my-4 text-[15px] leading-[1.85] text-slate-700 sm:text-base"><InlineText text={block.text} onSelectTool={onSelectTool} /></p>;
  };

  return (
    <div className="min-h-[75vh] overflow-x-hidden bg-[#f7f9fc] text-[#172b4d]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <nav aria-label={copy.breadcrumbAriaLabel} className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 sm:text-sm">
          <a href="/" onClick={breadcrumbHomeClick} className="transition-colors hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">{copy.breadcrumbHome}</a>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <a href="/" onClick={breadcrumbHomeClick} className="transition-colors hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">{copy.breadcrumbPdfTools}</a>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span aria-current="page" className="max-w-full truncate text-slate-700">{breadcrumbTitle}</span>
        </nav>

        <header className="relative isolate overflow-hidden rounded-[1.65rem] border border-[#dce5f1] bg-[#eaf1fa] shadow-[0_14px_45px_-32px_rgba(23,43,77,0.35)]">
          <div className="grid md:grid-cols-[1.04fr_.96fr]">
            <div className="flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-indigo-700 shadow-sm"><BookOpen size={16} /></span>
                {article.category}
              </div>
              <h1 className="max-w-3xl text-[clamp(2rem,4.4vw,3.55rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#132847]">{article.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{article.excerpt}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#d4dfec] pt-5 text-xs font-medium text-slate-600 sm:text-sm">
                <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-indigo-600" /><time dateTime={pubDate}>{formatLocalizedDate(article.date, article.locale || 'en')}</time></span>
                <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-indigo-600" />{formatLocalizedReadTime(article.readTime, article.locale || 'en')}</span>
                <span className="text-slate-500">{formatLocalizedByline(article.author, article.locale || 'en')}</span>
              </div>
            </div>
            <div className="relative min-h-[230px] overflow-hidden md:min-h-[340px]">
              <img
                src={article.coverImage || '/blog-assets/reduce-pdf-assignment/hero.jpg'}
                alt={article.imageAlt || 'Student reviewing a PDF assignment on a laptop at a desk'}
                width={1024}
                height={576}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#eaf1fa]/55 via-transparent to-[#102642]/10 md:bg-gradient-to-l md:from-[#102642]/10 md:to-transparent" />
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#243c5c] shadow-sm backdrop-blur">
                <ShieldCheck size={15} className="text-cyan-700" />{copy.workflowLabel}
              </div>
            </div>
          </div>
        </header>

        <nav aria-label={copy.contentsAriaLabel} className="mt-8 rounded-2xl border border-[#dfe7f1] bg-white p-5 shadow-[0_8px_30px_-28px_rgba(23,43,77,0.4)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">{copy.onThisPage}</p>
              <h2 className="mt-1 text-lg font-bold text-[#172b4d]">{copy.contents}</h2>
            </div>
            <span className="rounded-full bg-[#eef3fa] px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">{copy.sectionsLabel.replace('{count}', String(parsed.sections.length))}</span>
          </div>
          <ol className="grid gap-1 sm:grid-cols-2">
            {parsed.sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs leading-5 text-slate-600 transition-colors hover:bg-[#f1f5fb] hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                  <span className="mt-px w-5 shrink-0 font-mono text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600">{String(index + 1).padStart(2, '0')}</span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
            {(article.faqItems?.length || 0) > 0 && (
              <li><a href="#frequently-asked-questions" className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs leading-5 text-slate-600 transition-colors hover:bg-[#f1f5fb] hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"><span className="mt-px w-5 shrink-0 font-mono text-[10px] font-semibold text-slate-400">FAQ</span><span>{copy.faqLinkLabel}</span></a></li>
            )}
          </ol>
        </nav>

        <div className="mt-8 grid min-w-0 gap-9 lg:grid-cols-[minmax(0,2.18fr)_minmax(260px,1fr)] lg:gap-10">
          <article className="min-w-0 rounded-2xl border border-[#e0e7f0] bg-white px-5 py-7 shadow-[0_8px_30px_-28px_rgba(23,43,77,0.4)] sm:px-8 sm:py-9 lg:px-10">
            <div className="mb-8 rounded-xl border-l-4 border-cyan-500 bg-[#eff8fb] px-5 py-4 text-[15px] leading-7 text-[#294563]">
              {parsed.intro.map(renderBlock)}
            </div>

            {parsed.sections.map((section, sectionIndex) => (
              <section key={`${section.id}-${sectionIndex}`} id={section.id} className="scroll-mt-24 border-b border-[#edf1f6] py-7 last:border-b-0">
                <div className="mb-3 flex items-start gap-3">
                  <span aria-hidden="true" className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#edf2fb] text-[11px] font-bold text-indigo-700">{String(sectionIndex + 1).padStart(2, '0')}</span>
                  <h2 className="text-xl font-bold leading-snug tracking-[-0.025em] text-[#172b4d] sm:text-[1.4rem]">{section.title}</h2>
                </div>
                <div className="min-w-0 break-words">{section.blocks.map(renderBlock)}</div>
              </section>
            ))}

              {!isMobileAssignmentGuide && <section id="frequently-asked-questions" className="scroll-mt-24 pt-8">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">{copy.quickAnswers}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#172b4d]">{copy.faqTitle}</h2>
              </div>
              <div className="divide-y divide-[#e6ebf2] border-y border-[#e6ebf2]">
                {(article.faqItems || []).map((faq, index) => {
                  const isOpen = openFaq === index;
                  const answerId = `${article.slug}-faq-answer-${index + 1}`;
                  return (
                    <div key={faq.question} className="py-1">
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={answerId}
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="flex w-full items-center justify-between gap-5 py-4 text-left text-sm font-semibold leading-6 text-[#1b3556] transition-colors hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-base"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </h3>
                      <div id={answerId} hidden={!isOpen} className="pb-4 pr-7 text-sm leading-7 text-slate-600">{faq.answer}</div>
                    </div>
                  );
                })}
              </div>
              </section>}

            <div className="mt-9 flex flex-col gap-4 rounded-2xl bg-[#eef5fb] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="font-semibold text-[#1d385b]">
                  {primaryToolIsConverter
                    ? copy.readyToConvert
                    : primaryToolId === 'merge'
                      ? copy.readyToMerge
                      : copy.readyToCompress}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {primaryToolIsConverter
                    ? copy.convertDescription
                    : primaryToolId === 'merge'
                      ? copy.mergeDescription
                      : copy.compressDescription}
                </p>
              </div>
              <a href={primaryToolHref} onClick={(event) => selectTool(event, primaryToolId)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
                {primaryToolCta} <ArrowRight size={16} />
              </a>
            </div>
          </article>

          <aside className={`min-w-0 space-y-5 lg:self-start ${isMobileAssignmentGuide ? '' : 'lg:sticky lg:top-6'}`}>
            {isMobileAssignmentGuide && (
              <>
                <section aria-labelledby="pdf-converter-heading" className="overflow-hidden rounded-2xl border border-[#d6e5f0] bg-[#eaf5fa] p-5 sm:p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-800 shadow-sm"><Images size={19} /></div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-cyan-800">PDF Converter</p>
                  <h2 id="pdf-converter-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#173653]">Turn Assignment Photos Into a PDF</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Arrange your handwritten pages and create one PDF for review and submission.</p>
                  <a href="/tools/image-to-pdf/" onClick={(event) => selectTool(event, 'jpg-to-pdf')} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a4f76] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#143f61] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4f76]">
                    Open Image to PDF <ArrowRight size={16} />
                  </a>
                </section>
                <section aria-labelledby="pdf-compressor-heading" className="overflow-hidden rounded-2xl border border-[#d6e5f0] bg-[#f3f4ff] p-5 sm:p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm"><FileText size={19} /></div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-indigo-700">PDF Compressor</p>
                  <h2 id="pdf-compressor-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#173653]">Check the Final File Size</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">If your portal has a size limit, compress a copy and inspect the handwriting before uploading it.</p>
                  <a href="/tools/compress-pdf/" onClick={(event) => selectTool(event, 'compress')} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
                    Open PDF Compressor <ArrowRight size={16} />
                  </a>
                </section>
              </>
            )}
            {!isMobileAssignmentGuide && <section aria-labelledby="compress-cta-heading" className="overflow-hidden rounded-2xl border border-[#d6e5f0] bg-[#eaf5fa] p-5 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-800 shadow-sm"><FileText size={19} /></div>
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-cyan-800">{copy.toolEyebrow}</p>
              <h2 id="compress-cta-heading" className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#173653]">{copy.compressorTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy.compressorDescription}</p>
              <a href="/tools/compress-pdf/" onClick={(event) => selectTool(event, 'compress')} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a4f76] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#143f61] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4f76]">
                {copy.compressorCta} <ArrowRight size={16} />
              </a>
              <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan-700" />{copy.privacyNote}</p>
            </section>}

            <section aria-labelledby="related-tools-heading" className="rounded-2xl border border-[#dfe7f1] bg-white p-5 shadow-[0_8px_30px_-28px_rgba(23,43,77,0.4)] sm:p-6">
              <h2 id="related-tools-heading" className="text-base font-bold text-[#172b4d]">{copy.relatedTools}</h2>
              <ul className="mt-3 divide-y divide-[#edf1f6]">
                {tools.map(({ href, id, icon: Icon }) => {
                  const localizedTool = TOOL_TRANSLATIONS[id]?.[articleLanguage]
                    || MISSING_TOOL_TRANSLATIONS[articleLanguage]?.[id as NewToolId];
                  const title = localizedTool?.title || id;
                  const note = localizedTool?.description || '';
                  return (
                  <li key={href}>
                    <a href={href} onClick={(event) => selectTool(event, id)} className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f0f4fa] text-indigo-700 transition-colors group-hover:bg-indigo-100"><Icon size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#263e5d] group-hover:text-indigo-700">{title}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{note}</span>
                      </span>
                      <ArrowRight size={15} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-700" />
                    </a>
                  </li>
                  );
                })}
              </ul>
            </section>

            {relatedArticles.length > 0 && (
              <section aria-labelledby="related-guides-heading" className="rounded-2xl border border-[#dfe7f1] bg-white p-5 shadow-[0_8px_30px_-28px_rgba(23,43,77,0.4)] sm:p-6">
                <h2 id="related-guides-heading" className="text-base font-bold text-[#172b4d]">{copy.moreGuides}</h2>
                <div className="mt-3 space-y-1">
                  {relatedArticles.map((item) => (
                    <a key={item.id} href={item.routePath || `/blog/${encodeURIComponent(item.slug)}`} onClick={(event) => selectArticle(event, item)} className="group flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[#f4f7fb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                      <span className="mt-0.5 text-cyan-700"><BookOpen size={16} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-5 text-[#29415f] group-hover:text-indigo-700">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{formatLocalizedReadTime(item.readTime, item.locale || article.locale || 'en')}</span>
                      </span>
                      <ArrowRight size={14} className="mt-1 shrink-0 text-slate-400 group-hover:text-indigo-700" />
                    </a>
                  ))}
                </div>
              </section>
            )}
            {isMobileAssignmentGuide && (article.faqItems?.length || 0) > 0 && (
              <section id="frequently-asked-questions" aria-labelledby="handwritten-faq-heading" className="scroll-mt-24 rounded-2xl border border-[#dfe7f1] bg-white p-5 shadow-[0_8px_30px_-28px_rgba(23,43,77,0.4)] sm:p-6">
                <h2 id="handwritten-faq-heading" className="text-base font-bold text-[#172b4d]">Frequently Asked Questions</h2>
                <div className="mt-3 divide-y divide-[#edf1f6] border-y border-[#edf1f6]">
                  {(article.faqItems || []).map((faq, index) => {
                    const isOpen = openFaq === index;
                    const answerId = `${article.slug}-sidebar-faq-answer-${index + 1}`;
                    return (
                      <div key={faq.question} className="py-1">
                        <h3>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={answerId}
                            onClick={() => setOpenFaq(isOpen ? null : index)}
                            className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm font-semibold leading-6 text-[#1b3556] transition-colors hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown size={17} aria-hidden="true" className={`shrink-0 text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </h3>
                        <div id={answerId} hidden={!isOpen} className="pb-3 pr-6 text-sm leading-6 text-slate-600">{faq.answer}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
        {(onCloseArticle || onBackToHome) && (
          <div className="mt-8 flex justify-start">
            <button type="button" onClick={onCloseArticle || onBackToHome} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
              <ArrowLeft size={16} />{copy.backToGuides}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReducePdfAssignmentArticle;
