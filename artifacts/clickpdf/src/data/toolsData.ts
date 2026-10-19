import { PDFTool, ToolCategory } from '../types';
import { getPluginToolsAsPdfTools } from '../tools/plugins/pluginLoader';

export const BASE_PDF_TOOLS: PDFTool[] = [
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one unified document in your preferred order.',
    extendedDescription: 'Merge unlimited PDF documents together in exact sequence with drag-and-drop page sorting, instant client-side preview, and lightning-fast local generation.',
    category: 'organize',
    iconName: 'Layers',
    badge: 'Popular',
    accentColor: 'from-blue-600 to-indigo-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Separate pages or extract specific page ranges into standalone PDF files.',
    extendedDescription: 'Select custom page ranges (e.g., 1-5, 8, 11-14) or extract every page into separate PDF files directly in your browser without data uploads.',
    category: 'organize',
    iconName: 'Scissors',
    badge: 'Essential',
    accentColor: 'from-amber-500 to-orange-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Optimize and reduce PDF file size directly in your browser with no quality loss.',
    extendedDescription: 'Reduce document file sizes drastically for emailing and web sharing while maintaining crystal-clear text and image fidelity.',
    category: 'optimize',
    iconName: 'Minimize2',
    badge: 'Fast',
    accentColor: 'from-emerald-500 to-teal-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'jpg-to-pdf',
    title: 'Image to PDF',
    description: 'Convert multiple image files (JPG, PNG, WebP) into a single, clean, downloadable PDF file entirely in your browser.',
    extendedDescription: 'Transform photos, scanned receipts, and graphic files (JPG, PNG, WebP) into a standardized, high-resolution multi-page PDF document.',
    category: 'convert',
    iconName: 'Image',
    badge: 'Popular',
    accentColor: 'from-cyan-500 to-blue-600',
    acceptedFileTypes: 'image/*,.jpg,.jpeg,.png,.webp',
    multiFile: true
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    description: 'Rotate individual pages or the entire document clockwise and counter-clockwise directly in your browser.',
    extendedDescription: 'Fix upside-down or sideways pages in bulk or page-by-page (90°, 180°, or 270°) with immediate real-time canvas preview.',
    category: 'organize',
    iconName: 'RotateCw',
    badge: 'Popular',
    accentColor: 'from-indigo-500 to-purple-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'watermark',
    title: 'Watermark PDF',
    description: 'Stamp custom text or confidential marks with custom angle, size, and opacity.',
    extendedDescription: 'Protect copyright and draft documents by overlaying customizable watermark text (e.g., DRAFT, CONFIDENTIAL) with adjustable opacity, angle, and font size.',
    category: 'edit',
    iconName: 'Stamp',
    badge: 'New',
    accentColor: 'from-purple-500 to-pink-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    description: 'Insert dynamic page numbering (e.g. Page 1 of N) with customizable placement.',
    extendedDescription: 'Add professional page numbering to headers or footers with customizable format (Page X of Y, X/Y), custom starting numbers, and alignment options.',
    category: 'edit',
    iconName: 'Hash',
    badge: 'Essential',
    accentColor: 'from-violet-600 to-indigo-800',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'organize',
    title: 'Organize Pages',
    description: 'Visually sort, reorder, swap, or delete unwanted pages in any PDF file.',
    extendedDescription: 'Visual grid editor enabling quick reordering, rotating, and deleting of unwanted pages with high-performance client-side rendering.',
    category: 'organize',
    iconName: 'LayoutGrid',
    badge: 'Popular',
    accentColor: 'from-teal-500 to-emerald-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'edit-metadata',
    title: 'Edit PDF Metadata',
    description: 'View and modify Author, Title, Subject, Keywords, Creator, and Producer properties in your browser.',
    extendedDescription: 'Direct in-browser PDF metadata editor: inspect, update, or completely wipe Author, Title, Creator, and Producer properties for privacy or branding.',
    category: 'security',
    iconName: 'Edit3',
    accentColor: 'from-indigo-600 to-cyan-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'metadata',
    title: 'PDF Analysis, OCR & Page Counter',
    description: 'Count pages, inspect document dimensions, and extract text from scanned PDF images using in-browser Tesseract.js OCR.',
    extendedDescription: 'Comprehensive document analyzer: extracts page count, dimensions, creator metadata, and runs client-side Tesseract.js OCR to transcribe scanned images into searchable text.',
    category: 'security',
    iconName: 'FileSearch',
    badge: 'OCR & Counter',
    accentColor: 'from-cyan-600 to-indigo-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Password-protect and encrypt PDF files using browser-based Web Crypto AES-256-GCM.',
    extendedDescription: 'Encrypt your confidential documents with military-grade AES-256-GCM via browser Web Crypto APIs. Safe against unauthorized opening.',
    category: 'security',
    iconName: 'Lock',
    badge: 'Web Crypto',
    accentColor: 'from-rose-500 to-red-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Decrypt and unlock Web Crypto password-protected PDF documents entirely in-browser.',
    extendedDescription: 'Safely enter password credentials to decrypt and restore full read/print access to protected files locally without sending keys over the internet.',
    category: 'security',
    iconName: 'Unlock',
    accentColor: 'from-slate-600 to-zinc-800',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'pdf-to-text',
    title: 'PDF to Text / Markdown',
    description: 'Extract raw text, structure, and readable content from your PDF documents.',
    extendedDescription: 'Extract formatted textual content, paragraphs, headings, and document structure into clean plain text (.txt) or markdown ready for AI or copy-pasting.',
    category: 'convert',
    iconName: 'FileText',
    badge: 'New',
    accentColor: 'from-sky-500 to-blue-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word (Docx)',
    description: 'Convert PDF documents to editable Microsoft Word files with actual text extraction.',
    extendedDescription: 'Extract formatted headings, paragraphs, bullet lists, and layout from PDF into genuine editable Microsoft Word (.docx) files without uploading to a server.',
    category: 'convert',
    iconName: 'FileType',
    badge: 'Editable .docx',
    accentColor: 'from-blue-600 to-indigo-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel (Xlsx)',
    description: 'Extract structured data rows, financial figures, and table grids into Excel (.xlsx).',
    extendedDescription: 'Convert PDF financial statements, receipts, invoices, and data sheets into clean Microsoft Excel (.xlsx) workbooks with automatic cell and column gap detection.',
    category: 'convert',
    iconName: 'FileSpreadsheet',
    badge: 'Tables & Data',
    accentColor: 'from-emerald-600 to-teal-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'pdf-to-powerpoint',
    title: 'PDF to PowerPoint (Pptx)',
    description: 'Transform PDF slides, reports, and visual pages into editable PowerPoint (.pptx).',
    extendedDescription: 'Turn PDF pages into modern 16:9 widescreen presentation slides (.pptx) with slide titles, bullet points, and editable content cards.',
    category: 'convert',
    iconName: 'Presentation',
    badge: 'Slides .pptx',
    accentColor: 'from-orange-500 to-amber-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Word documents (.docx) into readable, high-resolution PDF files.',
    extendedDescription: 'Convert Microsoft Word (.docx) documents into high-resolution A4 PDF pages with readable headings, paragraphs, lists, tables, and embedded images.',
    category: 'convert',
    iconName: 'FileText',
    badge: 'DOCX to PDF',
    accentColor: 'from-blue-700 to-sky-600',
    acceptedFileTypes: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    multiFile: true
  },
  {
    id: 'word-to-excel',
    title: 'Word to Excel',
    description: 'Move Word tables and document text into an Excel workbook.',
    extendedDescription: 'Extract each table from a Word (.docx) document into its own Excel worksheet and preserve document paragraphs and lists in a separate Text worksheet.',
    category: 'convert',
    iconName: 'FileSpreadsheet',
    badge: 'DOCX to XLSX',
    accentColor: 'from-emerald-600 to-teal-700',
    acceptedFileTypes: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    multiFile: true
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Convert spreadsheets (.xlsx, .xls, .csv) into paginated, styled PDF tables.',
    extendedDescription: 'Convert Excel workbooks into professional landscape PDF reports with headers, borders, zebra-striping, and auto-fit column formatting.',
    category: 'convert',
    iconName: 'FileSpreadsheet',
    badge: 'XLSX to PDF',
    accentColor: 'from-teal-600 to-emerald-700',
    acceptedFileTypes: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv',
    multiFile: true
  },
  {
    id: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations (.pptx, .ppt) into crisp 16:9 PDF slides.',
    extendedDescription: 'Transform OpenXML PowerPoint (.pptx) slides into vector-crisp widescreen PDF pages with slide titles, bullet points, and clean presentation formatting.',
    category: 'convert',
    iconName: 'Presentation',
    badge: 'PPTX to PDF',
    accentColor: 'from-amber-600 to-orange-700',
    acceptedFileTypes: '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint',
    multiFile: true
  },
  {
    id: 'sign',
    title: 'Sign PDF',
    description: 'Draw or stamp your digital signature onto legal agreements and forms.',
    extendedDescription: 'Sign digital contracts and agreements by drawing your handwritten signature on canvas or typing your name with smooth vector stamp placement.',
    category: 'edit',
    iconName: 'PenTool',
    badge: 'Popular',
    accentColor: 'from-blue-600 to-violet-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'crop',
    title: 'Crop & Trim Margins',
    description: 'Adjust document margins and trim excess white space for printing or reading.',
    extendedDescription: 'Eliminate distracting borders and unwanted white margins from scanned documents, presentation slides, or book pages for optimal reading.',
    category: 'edit',
    iconName: 'Crop',
    accentColor: 'from-fuchsia-600 to-rose-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Format your document into ISO-standardized archival format for long-term storage.',
    extendedDescription: 'Prepare documents for long-term legal archival adhering to international ISO 19005 PDF/A standards for permanent preservation.',
    category: 'security',
    iconName: 'Archive',
    accentColor: 'from-slate-700 to-slate-900',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'repair',
    title: 'Repair PDF',
    description: 'Recover data from corrupted or damaged PDF files and restore viewable pages.',
    extendedDescription: 'Diagnose syntax discrepancies, rebuild cross-reference tables, and reconstruct damaged PDF streams to restore corrupt files.',
    category: 'optimize',
    iconName: 'Wrench',
    accentColor: 'from-lime-600 to-emerald-700',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  },
  {
    id: 'compare',
    title: 'Compare PDF',
    description: 'Inspect two versions of a document side-by-side to highlight page alterations.',
    extendedDescription: 'Compare two PDF revisions side-by-side with synchronised scrolling to spot differences, clause changes, and visual alterations instantly.',
    category: 'edit',
    iconName: 'Columns',
    badge: 'New',
    accentColor: 'from-indigo-600 to-cyan-600',
    acceptedFileTypes: '.pdf,application/pdf',
    multiFile: true
  }
];

export const PDF_TOOLS: PDFTool[] = [
  ...BASE_PDF_TOOLS,
  ...getPluginToolsAsPdfTools()
];

export function getAllTools(): PDFTool[] {
  return PDF_TOOLS;
}

export const CATEGORIES: { id: ToolCategory; label: string; count: number }[] = [
  { id: 'all', label: 'All Tools', count: PDF_TOOLS.length },
  { id: 'organize', label: 'Organize PDF', count: PDF_TOOLS.filter(t => t.category === 'organize').length },
  { id: 'optimize', label: 'Optimize PDF', count: PDF_TOOLS.filter(t => t.category === 'optimize').length },
  { id: 'convert', label: 'Convert PDF', count: PDF_TOOLS.filter(t => t.category === 'convert').length },
  { id: 'edit', label: 'Edit & Sign', count: PDF_TOOLS.filter(t => t.category === 'edit').length },
  { id: 'security', label: 'PDF Security', count: PDF_TOOLS.filter(t => t.category === 'security').length },
];

