import { PRIVACY_UI_COPY } from './uiTranslations';

export type Language = 
  | 'en' // English (United Kingdom / US)
  | 'ur' // Urdu (Pakistan 🇵🇰)
  | 'hi' // Hindi (India / Bharat 🇮🇳)
  | 'ar' // Arabic (Saudi Arabia / UAE 🇸🇦)
  | 'zh' // Chinese Simplified (China 🇨🇳)
  | 'ja' // Japanese (Japan 🇯🇵)
  | 'tl' // Filipino / Tagalog (Philippines 🇵🇭)
  | 'de' // German (Germany 🇩🇪)
  | 'fr' // French (France 🇫🇷)
  | 'es' // Spanish (Spain 🇪🇸)
  | 'it' // Italian (Italy 🇮🇹)
  | 'no' // Norwegian (Norway 🇳🇴)
  | 'pt' // Portuguese (Portugal / Brazil 🇵🇹)
  | 'ru' // Russian (Russia 🇷🇺)
  | 'ko' // Korean (South Korea 🇰🇷)
  | 'tr' // Turkish (Turkey 🇹🇷)
  | 'nl' // Dutch (Netherlands 🇳🇱)
  | 'pl' // Polish (Poland 🇵🇱)
  | 'sv' // Swedish (Sweden 🇸🇪)
  | 'id' // Indonesian (Indonesia 🇮🇩)
  | 'vi'; // Vietnamese (Vietnam 🇻🇳)

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  country: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', country: 'United Kingdom / Global', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', country: 'Pakistan', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', country: 'India', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', country: 'Saudi Arabia', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', country: 'France', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', country: 'Germany', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳', country: 'China', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', country: 'Japan', dir: 'ltr' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', country: 'Philippines', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', country: 'Spain', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', country: 'Italy', dir: 'ltr' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', country: 'Norway', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', country: 'Russia', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', country: 'Portugal / Brazil', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', country: 'South Korea', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', country: 'Turkey', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', country: 'Netherlands', dir: 'ltr' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', country: 'Poland', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', country: 'Sweden', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', country: 'Indonesia', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', country: 'Vietnam', dir: 'ltr' },
];

export interface TranslationDict {
  // Brand & Header
  brandTitle: string;
  allPdfTools: string;
  mergeAndSplit: string;
  compress: string;
  convert: string;
  security: string;
  articles: string;
  faqNav: string;
  inBrowserBadge: string;
  adminBlog: string;
  toggleLang: string;

  // Banner Ad
  sponsored: string;
  adTitle: string;
  adSubtitle: string;
  claimOffer: string;
  editAd: string;

  // Hero
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;

  // Categories
  catAll: string;
  catOrganize: string;
  catOptimize: string;
  catConvert: string;
  catEdit: string;
  catSecurity: string;

  // Tool Grid
  inBrowserTool: string;
  openTool: string;
  noToolsFound: string;
  resetFilter: string;

  // Workspace
  backToTools: string;
  clientProcessingBadge: string;
  dropZoneTitleMulti: string;
  dropZoneTitleSingle: string;
  dropZoneSubtitlePdf: string;
  dropZoneSubtitleImg: string;
  selectFilesBtn: string;
  selectedFiles: string;
  readyVerification: string;
  showPreview: string;
  hidePreview: string;
  quickInlinePreview: string;
  expandFullscreen: string;
  addMoreFiles: string;
  clickToVerify: string;
  previewBtn: string;
  previewThisFile: string;
  previewProcessedFile: string;
  removeBtn: string;
  optionsAndSettings: string;
  processBtn: string;
  processingBtn: string;
  cancelMergeBtn: string;
  mergeCancelledMessage: string;
  mergePdfNoFilesError: string;
  mergePdfUnreadableFileError: string;
  mergePdfInputMemoryError: string;
  mergePdfUnsupportedFormError: string;
  mergePdfXfaError: string;
  mergePdfSignatureError: string;
  mergePdfSaveMemoryError: string;
  mergePdfSaveError: string;
  mergePdfGenericError: string;
  docReady: string;
  downloadBtn: string;
  previewOutputBtn: string;
  processAnotherBtn: string;

  // Tool-specific settings
  watermarkTextLabel: string;
  watermarkOpacityLabel: string;
  watermarkSizeLabel: string;
  watermarkAngleLabel: string;
  pageNumberPositionLabel: string;
  pageNumberPositionTopLeft: string;
  pageNumberPositionTopCenter: string;
  pageNumberPositionTopRight: string;
  pageNumberPositionBottomLeft: string;
  pageNumberPositionBottomCenter: string;
  pageNumberPositionBottomRight: string;
  pageNumberHeaderZone: string;
  pageNumberFooterZone: string;
  pageNumberThicknessLabel: string;
  pageNumberRegular: string;
  pageNumberBold: string;
  pageNumberMarginLabel: string;
  pageNumberDemoTitle: string;
  pageNumberClickHint: string;
  pageNumberFormatLabel: string;
  pageNumberStartLabel: string;
  pageNumberColorLabel: string;
  pageNumberSizeLabel: string;
  pageNumberCustomSize: string;
  pageNumberFontLabel: string;
  pageNumberSkipCoverLabel: string;
  pagesToExtractLabel: string;
  rotationAngleLabel: string;
  orientationLabel: string;
  marginLabel: string;
  previewOriginalBtn: string;
  replaceFileBtn: string;
  // Organize Pages Tool
  organizeTotalPages: string;
  organizeKeptPages: string;
  organizeDeletedPages: string;
  organizeMoveLeft: string;
  organizeMoveRight: string;
  organizeMoveFirst: string;
  organizeMoveLast: string;
  organizeRotateCw: string;
  organizeRotateCcw: string;
  organizeDeletePage: string;
  organizeRestorePage: string;
  organizeDuplicatePage: string;
  organizeInspectPage: string;
  organizeSelectAll: string;
  organizeDeselectAll: string;
  organizeInvertSelection: string;
  organizeDeleteSelected: string;
  organizeRotateSelected: string;
  organizeReverseOrder: string;
  organizeSortOriginal: string;
  organizeResetAll: string;
  organizeSaveBtn: string;
  organizeDragHint: string;
  organizePageBadge: string;
  organizeOriginalBadge: string;
  organizeRemovedPagesDrawer: string;
  organizeRestoreAll: string;
  organizeUndoDelete: string;

  // Preview Modal
  verifiedLocal: string;
  previewSandboxNote: string;
  closeBtn: string;
  looksGoodBtn: string;
  previewNotSupported: string;

  // Features Section
  privacyTag: string;
  workYourWayTitle: string;
  workYourWaySubtitle: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  trustTitle: string;
  trustSubtitle: string;
  trust1: string;
  trust1Sub: string;
  trust2: string;
  trust2Sub: string;
  trust3: string;
  trust3Sub: string;
  trust4: string;
  trust4Sub: string;

  // Blog Section
  blogTag: string;
  blogTitle: string;
  blogSubtitle: string;
  publishArticleBtn: string;
  readBtn: string;
  doneReadingBtn: string;
  publishedBy: string;
  browserBasedFileProcessing: string;
  recommendedFreeTool: string;
  relatedToolNotice: string;
  relatedPdfToolLabel: string;
  readingProgressLabel: string;
  readingProgressAriaLabel: string;
  closeArticleLabel: string;

  // Drawer & Footer
  drawerTitle: string;
  drawerSubtitle: string;
  articlesAndSeo: string;
  adminPost: string;
  footerAbout: string;
  zeroServerGuarantee: string;
  copyrightText: string;

  // Footer & Legal
  companyAndLegal: string;
  resourcesAndTools: string;
  aboutUs: string;
  contactUs: string;
  cookiesPolicy: string;
  privacyPolicy: string;
  termsOfService: string;
  disclaimer: string;
  batchQueueEngine: string;
  blogs: string;
  faqAndAnswers: string;
  installAppToDesktop: string;
  adminDashboard: string;
  shareClickPdf: string;
  shareLabel: string;
  shortcutsLabel: string;
  shortcutsOr: string;
  shortcutsCheatsheet: string;
  shortcutsHintAriaLabel: string;
  shortcutsHintTitle: string;
  dismissShortcutsHint: string;
  clientStorageEnabled: string;
  zeroServerUploads: string;
  isoStandards: string;

  // Workspace actions & buttons
  batchProcessEachFile: string;
  encryptProtectPdf: string;
  decryptUnlockPdf: string;
  encryptingStatus: string;
  decryptingStatus: string;

  // Admin Modal
  adminTitle: string;
  adminSubtitle: string;
  tabArticles: string;
  tabAd: string;
  tabSitemap: string;
  xmlSitemap: string;
}

const en: TranslationDict = {
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Cancel merge',
  mergeCancelledMessage: 'Merge cancelled. Your selected PDFs and their order are unchanged. You can try again.',
  mergePdfNoFilesError: 'Select at least one PDF file before merging.',
  mergePdfUnreadableFileError: 'File "{fileName}" could not be read as a usable PDF. It may be damaged, incomplete, empty, or password-protected. Remove it or choose a valid, unlocked copy and retry.',
  mergePdfInputMemoryError: 'File "{fileName}" could not be processed because available browser memory is insufficient. Try fewer or smaller PDFs, or close other tabs, then retry.',
  mergePdfUnsupportedFormError: 'File "{fileName}" contains interactive form data that cannot be safely preserved. No merged output was created. Use a compatible PDF export and retry.',
  mergePdfXfaError: 'File "{fileName}" contains a dynamic XFA form that Merge PDF cannot safely preserve. Export a static PDF copy and retry.',
  mergePdfSignatureError: 'File "{fileName}" contains a digital signature. Merging changes the signed bytes, so the signature cannot remain valid. Use an unsigned copy.',
  mergePdfSaveMemoryError: 'The merged PDF could not be saved because available browser memory is insufficient. Try fewer or smaller PDFs, then retry.',
  mergePdfSaveError: 'The combined PDF could not be saved. Your selected files are still available; try again or use fewer PDFs.',
  mergePdfGenericError: 'Merge PDF could not complete. Your selected files are still available; check that each PDF is readable and try again.',
  allPdfTools: 'All PDF Tools',
  mergeAndSplit: 'Merge & Split',
  compress: 'Compress',
  convert: 'Convert',
  security: 'Security',
  articles: 'Guides & Articles',
  faqNav: 'FAQ & Architecture',
  inBrowserBadge: '100% In-Browser Privacy',
  adminBlog: 'Manage Articles',
  toggleLang: 'Language',

  sponsored: 'Sponsored Partner',
  adTitle: 'Pro Document Intelligence Suite',
  adSubtitle: 'Automate contracts and extract structured tables with zero friction.',
  claimOffer: 'Claim Offer',
  editAd: 'Edit Ad Banner (Admin)',

  heroBadge: 'Zero Server Uploads · 100% Client-Side Privacy',
  heroTitle: 'Complete PDF Suite in Your Browser',
  heroSubtitle: 'Merge, split, compress, watermark, protect, and reorganize PDF documents locally in browser RAM with zero server retention.',
  searchPlaceholder: 'Search all PDF tools...',

  catAll: 'All Tools',
  catOrganize: 'Organize',
  catOptimize: 'Optimize',
  catConvert: 'Convert',
  catEdit: 'Edit & Sign',
  catSecurity: 'Security',

  inBrowserTool: 'In-Browser Execution',
  openTool: 'Open Tool',
  noToolsFound: 'No tools found matching',
  resetFilter: 'Reset Filters',

  backToTools: 'Back to Tools Catalog',
  clientProcessingBadge: '100% Client-Side Memory',
  dropZoneTitleMulti: 'Drop your files here or click to browse',
  dropZoneTitleSingle: 'Drop your file here or click to browse',
  dropZoneSubtitlePdf: 'Files are processed exclusively in local RAM',
  dropZoneSubtitleImg: 'Accepts JPG, PNG, WebP image formats',
  selectFilesBtn: 'Select Files from Device',
  selectedFiles: 'Staged Files',
  readyVerification: 'Verified In-Browser',
  showPreview: 'Show Quick Preview',
  hidePreview: 'Hide Preview',
  quickInlinePreview: 'Live Document Preview',
  expandFullscreen: 'Fullscreen Preview',
  addMoreFiles: 'Add More Files',
  clickToVerify: 'Inspect document content',
  previewBtn: 'Preview',
  previewThisFile: 'Preview this file',
  previewProcessedFile: 'Preview processed file',
  removeBtn: 'Remove',
  optionsAndSettings: 'Configuration & Parameters',
  processBtn: 'Process Document',
  processingBtn: 'Processing in local RAM...',
  docReady: 'Ready for Download!',
  downloadBtn: 'Download Processed File',
  previewOutputBtn: 'Preview Generated File',
  processAnotherBtn: 'Process Another File',

  watermarkTextLabel: 'Watermark Text',
  watermarkOpacityLabel: 'Opacity',
  watermarkSizeLabel: 'Font Size',
  watermarkAngleLabel: 'Angle (Degrees)',
  pageNumberPositionLabel: 'Position',
  pageNumberPositionTopLeft: 'Top Left',
  pageNumberPositionTopCenter: 'Top Center',
  pageNumberPositionTopRight: 'Top Right',
  pageNumberPositionBottomLeft: 'Bottom Left',
  pageNumberPositionBottomCenter: 'Bottom Center',
  pageNumberPositionBottomRight: 'Bottom Right',
  pageNumberHeaderZone: 'Header (Top)',
  pageNumberFooterZone: 'Footer (Bottom)',
  pageNumberThicknessLabel: 'Font Thickness & Weight',
  pageNumberRegular: 'Regular / Normal',
  pageNumberBold: 'Bold / Thick',
  pageNumberMarginLabel: 'Edge Margin Distance',
  pageNumberDemoTitle: 'Interactive Page Preview (A4 Sheet)',
  pageNumberClickHint: 'Click on any position button or page zone to place page numbers',
  pageNumberFormatLabel: 'Format',
  pageNumberStartLabel: 'Starting Page',
  pageNumberColorLabel: 'Color',
  pageNumberSizeLabel: 'Font Size',
  pageNumberCustomSize: 'Custom Size',
  pageNumberFontLabel: 'Font Style',
  pageNumberSkipCoverLabel: 'Skip First Page (Cover)',
  pagesToExtractLabel: 'Pages to Extract (e.g. 1-3, 5, 8)',
  rotationAngleLabel: 'Rotation Angle',
  orientationLabel: 'Page Orientation',
  marginLabel: 'Margin',
  previewOriginalBtn: 'Preview Original',
  replaceFileBtn: 'Replace File',
  // Organize Pages Tool
  organizeTotalPages: 'Total Pages',
  organizeKeptPages: 'Kept',
  organizeDeletedPages: 'Removed',
  organizeMoveLeft: 'Move Left / Up',
  organizeMoveRight: 'Move Right / Down',
  organizeMoveFirst: 'Move to First',
  organizeMoveLast: 'Move to Last',
  organizeRotateCw: 'Rotate +90°',
  organizeRotateCcw: 'Rotate -90°',
  organizeDeletePage: 'Delete Page',
  organizeRestorePage: 'Restore Page',
  organizeDuplicatePage: 'Duplicate Page',
  organizeInspectPage: 'Enlarge / Preview Page',
  organizeSelectAll: 'Select All',
  organizeDeselectAll: 'Deselect All',
  organizeInvertSelection: 'Invert Selection',
  organizeDeleteSelected: 'Delete Selected',
  organizeRotateSelected: 'Rotate Selected (+90°)',
  organizeReverseOrder: 'Reverse Order',
  organizeSortOriginal: 'Original Order',
  organizeResetAll: 'Reset All Changes',
  organizeSaveBtn: 'Save Reorganized PDF',
  organizeDragHint: 'Drag cards to reorder pages or use arrow buttons',
  organizePageBadge: 'Page',
  organizeOriginalBadge: 'Original',
  organizeRemovedPagesDrawer: 'Removed Pages',
  organizeRestoreAll: 'Restore All Removed Pages',
  organizeUndoDelete: 'Undo',

  verifiedLocal: 'Verified Local',
  previewSandboxNote: 'Verified in browser sandbox before processing',
  closeBtn: 'Close',
  looksGoodBtn: 'Looks Good, Process Now',
  previewNotSupported: 'Preview not natively supported for this format',

  privacyTag: 'PRIVACY FIRST ARCHITECTURE',
  workYourWayTitle: 'Work safely — without server uploads',
  workYourWaySubtitle: 'Process any document without signing up, without data transfer, and without bandwidth caps.',
  feature1Title: 'Work 100% In-Browser',
  feature1Desc: 'Batch edit and manage sensitive documents locally. Zero bytes sent to remote clouds.',
  feature2Title: 'Optimized for Mobile & Desktop',
  feature2Desc: 'Touch-friendly file picking and drag-and-drop reordering designed for all screen sizes.',
  feature3Title: 'Built for Strict Privacy',
  feature3Desc: 'Ideal for legal teams, accountants, and healthcare professionals requiring strict compliance.',
  trustTitle: 'Trusted by Privacy-Conscious Teams Worldwide',
  trustSubtitle: 'ClickPDF gives you peace of mind with verifiable client-side execution standards.',
  trust1: 'Zero Uploads',
  trust1Sub: '100% Client Isolation',
  trust2: 'No Data Logs',
  trust2Sub: 'Memory Cleared On Close',
  trust3: 'WASM & JS Engine',
  trust3Sub: 'Zero Waiting Queues',
  trust4: 'ISO 32000 Ready',
  trust4Sub: 'Universal PDF Standard',

  blogTag: 'KNOWLEDGE HUB & ARTICLES',
  blogTitle: 'Latest Guides & PDF Insights',
  blogSubtitle: 'Expert articles on client-side security, document workflows, and standards.',
  publishArticleBtn: 'Publish Article (Admin)',
  readBtn: 'Read Article',
  doneReadingBtn: 'Done Reading',
  publishedBy: 'Published by ClickPDF Research',
  browserBasedFileProcessing: 'Browser-based file processing',
  recommendedFreeTool: 'Recommended free tool',
  relatedToolNotice: 'Open the related tool in your browser. Processing happens on your device where supported; the page may still load website resources or enabled third-party services.',
  relatedPdfToolLabel: 'Related PDF tool',
  readingProgressLabel: '{percent}% read',
  readingProgressAriaLabel: 'Reading progress',
  closeArticleLabel: 'Close article',

  drawerTitle: 'ClickPDF Tools Hub',
  drawerSubtitle: '100% Client-Side In-Browser Suite',
  articlesAndSeo: 'Blogs',
  adminPost: 'Admin Post',
  footerAbout: 'ClickPDF.net provides 100% in-browser, client-side PDF utilities developed by Click Digital Services.',
  zeroServerGuarantee: 'Zero Server Transmission Guarantee',
  copyrightText: '© 2026 ClickPDF.net — A Product by Click Digital Services',

  // Footer & Legal
  companyAndLegal: 'Company & Legal',
  resourcesAndTools: 'Resources & Tools',
  aboutUs: 'About Us',
  contactUs: 'Contact Us',
  cookiesPolicy: 'Cookies Policy',
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  disclaimer: 'Disclaimer',
  batchQueueEngine: 'Batch Queue Engine',
  blogs: 'Blogs',
  faqAndAnswers: 'FAQs',
  installAppToDesktop: 'Install App to Desktop',
  adminDashboard: 'Admin Dashboard',
  shareClickPdf: 'Share ClickPDF',
  shareLabel: 'Share',
  shortcutsLabel: 'Shortcuts:',
  shortcutsOr: 'or',
  shortcutsCheatsheet: 'Cheatsheet',
  shortcutsHintAriaLabel: 'Keyboard shortcuts',
  shortcutsHintTitle: 'Press Ctrl+K or / anytime',
  dismissShortcutsHint: 'Dismiss shortcut hint',
  clientStorageEnabled: 'Client-Side Local Storage Enabled',
  zeroServerUploads: 'Zero Server Uploads',
  isoStandards: 'ISO 32000 PDF Standards',

  // Workspace actions & buttons
  batchProcessEachFile: 'Batch Process Each File',
  encryptProtectPdf: 'Encrypt & Protect PDF',
  decryptUnlockPdf: 'Decrypt & Unlock PDF',
  encryptingStatus: 'Encrypting with Web Crypto...',
  decryptingStatus: 'Decrypting Document...',

  adminTitle: 'ClickPDF Admin Dashboard',
  adminSubtitle: 'Manage daily blog articles, dynamic XML sitemaps & SEO configurations',
  tabArticles: 'Manage Daily Articles',
  tabAd: 'Top Banner Settings',
  tabSitemap: 'Dynamic XML Sitemap & SEO',
  xmlSitemap: 'XML Sitemap',
};

const ur: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'مرج منسوخ کریں',
  mergeCancelledMessage: 'پی ڈی ایف مرج منسوخ کر دیا گیا ہے۔ منتخب فائلیں اور ان کی ترتیب برقرار ہے۔ آپ دوبارہ کوشش کر سکتے ہیں۔',
  allPdfTools: 'تمام PDF ٹولز',
  mergeAndSplit: 'مرج اور تقسیم کریں',
  compress: 'کمپریس کریں',
  convert: 'کنورٹ کریں',
  security: 'سیکیورٹی اور پاس ورڈ',
  articles: 'بلاگز اور رہنمائی',
  faqNav: 'عام سوالات و سیکیورٹی',
  inBrowserBadge: '100% براؤزر پرائیویسی',
  adminBlog: 'مضامین سنبھالیں',
  toggleLang: 'زبان',

  sponsored: 'سپانسرڈ اشتہار',
  adTitle: 'پیشہ ورانہ دستاویز سویٹ',
  adSubtitle: 'دستاویزات کو تیز ترین رفتار سے براؤزر میں پروسیس کریں۔',
  claimOffer: 'پیشکش دیکھیں',
  editAd: 'اشتہار تبدیل کریں',

  heroBadge: 'زیرو سرور اپلوڈ · 100% کلائنٹ سائڈ پرائیویسی',
  heroTitle: 'آپ کے براؤزر میں مکمل PDF سویٹ',
  heroSubtitle: 'اپنے براؤزر کی لوکل ریم میموری میں PDF فائلز کو مرج، کمپریس، تقسیم، روٹیٹ اور واٹر مارک کریں — فائلیں کسی بھی سرور پر اپلوڈ نہیں ہوتیں۔',
  searchPlaceholder: 'پی ڈی ایف ٹولز تلاش کریں...',

  catAll: 'تمام ٹولز',
  catOrganize: 'ترتیب دیں',
  catOptimize: 'کمپریس و بہتر بنائیں',
  catConvert: 'فائل کنورژن',
  catEdit: 'ایڈٹ و واٹر مارک',
  catSecurity: 'سیکیورٹی و پروٹیکٹ',

  inBrowserTool: 'براؤزر میں تیز ترین عمل',
  openTool: 'ٹول کھولیں',
  noToolsFound: 'کوئی ٹول نہیں ملا',
  resetFilter: 'فلٹر ری سیٹ کریں',

  backToTools: 'تمام ٹولز کی طرف واپس',
  clientProcessingBadge: '100% کلائنٹ سائڈ ریم',
  dropZoneTitleMulti: 'اپنی فائلیں یہاں ڈراپ کریں یا منتخب کریں',
  dropZoneTitleSingle: 'اپنی فائل یہاں ڈراپ کریں یا منتخب کریں',
  dropZoneSubtitlePdf: 'فائلیں خصوصی طور پر آپ کے ڈیوائس پر پروسیس ہوتی ہیں',
  dropZoneSubtitleImg: 'JPG, PNG, WebP فارمیٹس قبول کیے جاتے ہیں',
  selectFilesBtn: 'ڈیوائس سے فائل منتخب کریں',
  selectedFiles: 'منتخب کردہ فائلیں',
  readyVerification: 'براؤزر میں تصدیق شدہ',
  showPreview: 'پیش نظارہ دیکھیں',
  hidePreview: 'پیش نظارہ چھپائیں',
  quickInlinePreview: 'لائیو پیش نظارہ',
  expandFullscreen: 'بڑی اسکرین پر دیکھیں',
  addMoreFiles: 'مزید فائلیں شامل کریں',
  clickToVerify: 'دستاویز کا معائنہ کریں',
  previewBtn: 'پیش نظارہ',
  removeBtn: 'حذف کریں',
  optionsAndSettings: 'ٹول کی ترتیبات',
  processBtn: 'دستاویز پروسیس کریں',
  processingBtn: 'لوکل ریم میں پروسیسنگ ہو رہی ہے...',
  docReady: 'ڈاؤن لوڈ کے لیے تیار ہے!',
  downloadBtn: 'پروسیس شدہ فائل ڈاؤن لوڈ کریں',
  previewOutputBtn: 'آؤٹ پٹ فائل دیکھیں',
  processAnotherBtn: 'دوسری فائل پروسیس کریں',

  watermarkTextLabel: 'واٹر مارک کا متن',
  watermarkOpacityLabel: 'شفافیت (Opacity)',
  watermarkSizeLabel: 'فونٹ سائز',
  watermarkAngleLabel: 'زاویہ (Angle)',
  pageNumberPositionLabel: 'صفحہ نمبر کا مقام (Position)',
  pageNumberPositionTopLeft: 'اوپر بائیں',
  pageNumberPositionTopCenter: 'اوپر درمیان',
  pageNumberPositionTopRight: 'اوپر دائیں',
  pageNumberPositionBottomLeft: 'نیچے بائیں',
  pageNumberPositionBottomCenter: 'نیچے درمیان',
  pageNumberPositionBottomRight: 'نیچے دائیں',
  pageNumberHeaderZone: 'اوپر (ہیڈر)',
  pageNumberFooterZone: 'نیچے (فوٹر)',
  pageNumberThicknessLabel: 'فونٹ کی موٹائی اور وزن',
  pageNumberRegular: 'نارمل / باریک',
  pageNumberBold: 'بولڈ / موٹا',
  pageNumberMarginLabel: 'کنارے سے فاصلہ',
  pageNumberDemoTitle: 'انٹرایکٹو پیج ڈیمو (A4 شیٹ)',
  pageNumberClickHint: 'صفحہ نمبر لگانے کے لیے پوزیشن منتخب کریں',
  pageNumberFormatLabel: 'فارمیٹ',
  pageNumberStartLabel: 'شروع کا صفحہ',
  pageNumberColorLabel: 'فونٹ کا رنگ',
  pageNumberSizeLabel: 'فونٹ سائز',
  pageNumberCustomSize: 'کسٹم سائز',
  pageNumberFontLabel: 'فونٹ اسٹائل',
  pageNumberSkipCoverLabel: 'پہلا صفحہ چھوڑیں (کور پیج)',
  pagesToExtractLabel: 'صفحات نکالیں (مثلاً 1-3, 5)',
  rotationAngleLabel: 'گھمانے کا زاویہ',
  orientationLabel: 'صفحہ کی سمت',
  marginLabel: 'مارجن',
  previewOriginalBtn: 'اصل فائل دیکھیں',
  replaceFileBtn: 'فائل تبدیل کریں',
  // Organize Pages Tool
  organizeTotalPages: 'کل صفحات',
  organizeKeptPages: 'برقرار',
  organizeDeletedPages: 'حذف شدہ',
  organizeMoveLeft: 'بائیں / اوپر کریں',
  organizeMoveRight: 'دائیں / نیچے کریں',
  organizeMoveFirst: 'پہلے نمبر پر لائیں',
  organizeMoveLast: 'آخر میں لے جائیں',
  organizeRotateCw: 'گھمائیں +90°',
  organizeRotateCcw: 'گھمائیں -90°',
  organizeDeletePage: 'صفحہ ڈیلیٹ کریں',
  organizeRestorePage: 'صفحہ بحال کریں',
  organizeDuplicatePage: 'ڈپلیکیٹ صفحہ',
  organizeInspectPage: 'بڑا کر کے دیکھیں',
  organizeSelectAll: 'سب منتخب کریں',
  organizeDeselectAll: 'انتخاب ختم کریں',
  organizeInvertSelection: 'انتخاب الٹ دیں',
  organizeDeleteSelected: 'منتخب کردہ ڈیلیٹ کریں',
  organizeRotateSelected: 'منتخب کردہ گھمائیں (+90°)',
  organizeReverseOrder: 'ترتیب الٹ دیں',
  organizeSortOriginal: 'اصل ترتیب',
  organizeResetAll: 'تمام تبدیلیاں بحال کریں',
  organizeSaveBtn: 'ترتیب شدہ PDF محفوظ کریں',
  organizeDragHint: 'صفحات کو آگے پیچھے کرنے کے لیے ڈریگ کریں یا تیر کے نشانات استعمال کریں',
  organizePageBadge: 'صفحہ',
  organizeOriginalBadge: 'اصل صفحہ',
  organizeRemovedPagesDrawer: 'حذف شدہ صفحات',
  organizeRestoreAll: 'تمام حذف شدہ صفحات بحال کریں',
  organizeUndoDelete: 'واپس لائیں',

  verifiedLocal: 'مقامی تصدیق شدہ',
  previewSandboxNote: 'پروسیسنگ سے قبل براؤزر سینڈ باکس میں تصدیق شدہ',
  closeBtn: 'بند کریں',
  looksGoodBtn: 'ٹھیک ہے، ابھی پروسیس کریں',
  previewNotSupported: 'اس فارمیٹ کے لیے پیش نظارہ دستیاب نہیں',

  privacyTag: 'پرائیویسی سب سے پہلے',
  workYourWayTitle: 'بغیر سرور اپلوڈ کے محفوظ کام کریں',
  workYourWaySubtitle: 'بغیر رجسٹریشن، بغیر ڈیٹا ٹرانسفر اور بغیر کسی حد کے دستاویزات پروسیس کریں۔',
  feature1Title: '100% براؤزر کے اندر کام',
  feature1Desc: 'حساس دستاویزات کو مقامی طور پر پروسیس کریں۔ کلاؤڈ پر کوئی ڈیٹا نہیں بھیجا جاتا۔',
  feature2Title: 'موبائل اور کمپیوٹر دونوں کے لیے بہترین',
  feature2Desc: 'ٹچ دوستانہ اور ہر سکرین سائز کے لیے آسان ڈیزائن۔',
  feature3Title: 'سخت پرائیویسی کے مطابق تیار کردہ',
  feature3Desc: 'وکلاء، ڈاکٹرز، اور مالیاتی ماہرین کی سخت رازداری ضروریات کے مطابق۔',
  trustTitle: 'دنیا بھر کے پیشہ ور افراد کا قابل اعتماد ٹول',
  trustSubtitle: 'ClickPDF کلائنٹ سائیڈ عملداری کی مکمل گارنٹی دیتا ہے۔',
  trust1: 'زیرو اپلوڈز',
  trust1Sub: '100% کلائنٹ پرائیویسی',
  trust2: 'کوئی ڈیٹا لاگ نہیں',
  trust2Sub: 'صفحہ بند ہوتے ہی میموری صاف',
  trust3: 'تیز ترین رفتار',
  trust3Sub: 'کوئی انتظار کی قطار نہیں',
  trust4: 'ISO سٹینڈرڈ',
  trust4Sub: 'معیاری PDF فارمیٹ',

  blogTag: 'رہنمائی اور مضامین',
  blogTitle: 'تازہ ترین بلاگ اور تجاویز',
  blogSubtitle: 'PDF ٹولز اور سیکیورٹی پر تفصیلی مضامین۔',
  publishArticleBtn: 'مضمون شائع کریں',
  readBtn: 'مضمون پڑھیں',
  doneReadingBtn: 'پڑھ لیا',
  publishedBy: 'ClickPDF کی طرف سے شائع کردہ',

  drawerTitle: 'ClickPDF مینو',
  drawerSubtitle: '100% کلائنٹ سائڈ براؤزر سویٹ',
  articlesAndSeo: 'بلاگز',
  adminPost: 'ایڈمن پوسٹ',
  footerAbout: 'دنیا کا سب سے محفوظ ان براؤزر PDF سویٹ۔ اپنی دستاویزات کو کسی سرور پر بھیجے بغیر مرج، کمپریس اور محفوظ بنائیں۔',
  zeroServerGuarantee: 'زیرو سرور ٹرانسمیشن گارنٹی',
  copyrightText: 'ClickPDF · تمام حقوق محفوظ ہیں · پرائیویسی اور تیز رفتار',

  // Footer & Legal
  companyAndLegal: 'کمپنی اور قانونی پالیسیاں',
  resourcesAndTools: 'وسائل اور ٹولز',
  aboutUs: 'ہمارے متعلق (About Us)',
  contactUs: 'ہم سے رابطہ کریں (Contact Us)',
  cookiesPolicy: 'کوکیز پالیسی (Cookies Policy)',
  privacyPolicy: 'پرائیویسی پالیسی (Privacy Policy)',
  termsOfService: 'شرائط و ضوابط (Terms of Service)',
  batchQueueEngine: 'بیچ پروسیسنگ انجن',
  blogs: 'بلاگز اور مضامین',
  faqAndAnswers: 'ایف کیوز (FAQs)',
  adminDashboard: 'ایڈمن ڈیش بورڈ',
  shareClickPdf: 'کلک پی ڈی ایف شیئر کریں',
  clientStorageEnabled: 'کلائنٹ سائیڈ لوکل اسٹوریج فعال ہے',
  zeroServerUploads: 'زیرو سرور اپ لوڈز · 100% پرائیویسی',
  isoStandards: 'ISO 32000 پی ڈی ایف معیارات',

  // Workspace actions & buttons
  batchProcessEachFile: 'تمام فائلوں کو بیک وقت بیچ پروسیس کریں',
  encryptProtectPdf: 'محفوظ کریں اور پاس ورڈ لگائیں',
  decryptUnlockPdf: 'پاس ورڈ کھولیں اور ڈیکرپٹ کریں',
  encryptingStatus: 'ویب کرپٹو کے ذریعے انکرپٹ ہو رہا ہے...',
  decryptingStatus: 'دستاویز کو ان لاک کیا جا رہا ہے...',

  adminTitle: 'ایڈمن ڈیش بورڈ',
  adminSubtitle: 'بلاگ مضامین، سائٹ میپ اور ایس ای او ترتیبات سنبھالیں',
  tabArticles: 'روزانہ کے مضامین',
  tabAd: 'بینر کی ترتیبات',
  tabSitemap: 'سائٹ میپ اور ایس ای او',
  xmlSitemap: 'ایکس ایم ایل سائٹ میپ',
};

const ar: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'إلغاء الدمج',
  mergeCancelledMessage: 'تم إلغاء دمج ملفات PDF. لم تتغير الملفات المحددة أو ترتيبها. يمكنك المحاولة مرة أخرى.',
  allPdfTools: 'جميع أدوات PDF',
  mergeAndSplit: 'دمج وتقسيم',
  compress: 'ضغط الملفات',
  convert: 'تحويل المستندات',
  security: 'الأمان وكلمات المرور',
  articles: 'المقالات والأدلة',
  faqNav: 'الأسئلة الشائعة والأمان',
  inBrowserBadge: 'خصوصية 100% في المتصفح',
  heroBadge: 'صفر رفع إلى الخوادم · خصوصية تامة محلياً',
  heroTitle: 'حزمة أدوات PDF متكاملة في متصفحك',
  heroSubtitle: 'ادمج واضغط وقسّم ودوّر واحمِ ملفات PDF في ذاكرة جهازك مباشرة دون إرسال أي بايت إلى خوادم خارجية.',
  searchPlaceholder: 'ابحث عن أدوات PDF...',
  catAll: 'جميع الأدوات',
  catOrganize: 'تنظيم',
  catOptimize: 'ضغط وتحسين',
  catConvert: 'تحويل',
  catEdit: 'تعديل وتوقيع',
  catSecurity: 'الأمان والحماية',
  openTool: 'افتح الأداة',
  selectFilesBtn: 'اختر ملفات من جهازك',
  processBtn: 'معالجة المستند',
  processingBtn: 'تتم المعالجة محلياً...',
  downloadBtn: 'تحميل الملف',
  docReady: 'الملف جاهز للتحميل!',
  closeBtn: 'إغلاق',
};

const tl: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Kanselahin ang pagsasama',
  mergeCancelledMessage: 'Kinansela ang pagsasama ng mga PDF. Hindi nagbago ang mga napiling file at ang pagkakasunod-sunod ng mga ito. Maaari kang sumubok muli.',
  allPdfTools: 'Lahat ng PDF Tools',
  mergeAndSplit: 'Pagsamahin at Hatiin',
  compress: 'I-compress',
  convert: 'I-convert',
  security: 'Seguridad at Password',
  articles: 'Mga Gabay at Artikulo',
  faqNav: 'Mga Madalas Itanong',
  inBrowserBadge: '100% Pribado sa Browser',
  heroBadge: 'Walang Server Uploads · 100% Lokal na Pagproseso',
  heroTitle: 'Kumpletong PDF Suite sa Iyong Browser',
  heroSubtitle: 'Pagsamahin, hatiin, i-compress, at protektahan ang mga PDF nang direkta sa memorya ng iyong device.',
  searchPlaceholder: 'Maghanap ng PDF tools...',
  catAll: 'Lahat ng Tools',
  catOrganize: 'Ayusin',
  catOptimize: 'I-compress',
  catConvert: 'I-convert',
  catEdit: 'I-edit at Pirmahan',
  catSecurity: 'Seguridad',
  openTool: 'Buksan ang Tool',
  selectFilesBtn: 'Pumili ng mga File',
  processBtn: 'Iproseso ang Dokumento',
  processingBtn: 'Pinoproseso sa lokal na memorya...',
  downloadBtn: 'I-download ang File',
  docReady: 'Handa na ang Dokumento!',
  closeBtn: 'Isara',
};

const no: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Avbryt sammenslåing',
  mergeCancelledMessage: 'Sammenslåingen av PDF-filer ble avbrutt. De valgte filene og rekkefølgen er uendret. Du kan prøve igjen.',
  allPdfTools: 'Alle PDF-verktøy',
  mergeAndSplit: 'Slå sammen og del opp',
  compress: 'Komprimer',
  convert: 'Konverter',
  security: 'Sikkerhet og passord',
  articles: 'Guider og artikler',
  faqNav: 'Ofte stilte spørsmål',
  inBrowserBadge: '100% personvern i nettleseren',
  heroBadge: 'Ingen serveropplasting · 100% lokalt i nettleseren',
  heroTitle: 'Komplett PDF-verktøysett i nettleseren din',
  heroSubtitle: 'Slå sammen, del opp, komprimer og beskytt PDF-dokumenter lokalt i enhetens minne uten skylagring.',
  searchPlaceholder: 'Søk etter PDF-verktøy...',
  catAll: 'Alle verktøy',
  catOrganize: 'Organiser',
  catOptimize: 'Optimaliser',
  catConvert: 'Konverter',
  catEdit: 'Rediger og signer',
  catSecurity: 'Sikkerhet',
  openTool: 'Åpne verktøy',
  selectFilesBtn: 'Velg filer fra enheten',
  processBtn: 'Behandle dokument',
  processingBtn: 'Behandles lokalt...',
  downloadBtn: 'Last ned fil',
  docReady: 'Dokumentet er klart!',
  closeBtn: 'Lukk',
};

const nl: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Samenvoegen annuleren',
  mergeCancelledMessage: 'Het samenvoegen van de PDF-bestanden is geannuleerd. De geselecteerde bestanden en hun volgorde zijn ongewijzigd. Je kunt het opnieuw proberen.',
  allPdfTools: 'Alle PDF-tools',
  mergeAndSplit: 'Samenvoegen & Splitsen',
  compress: 'Comprimeren',
  convert: 'Converteren',
  security: 'Beveiliging',
  articles: 'Handleidingen & Artikelen',
  openTool: 'Open tool',
  selectFilesBtn: 'Selecteer bestanden',
  processBtn: 'Document verwerken',
  downloadBtn: 'Download bestand',
  docReady: 'Document gereed!',
  closeBtn: 'Sluiten',
};

const pl: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Anuluj łączenie',
  mergeCancelledMessage: 'Łączenie plików PDF zostało anulowane. Wybrane pliki i ich kolejność pozostały bez zmian. Możesz spróbować ponownie.',
  allPdfTools: 'Wszystkie narzędzia PDF',
  mergeAndSplit: 'Połącz i podziel',
  compress: 'Kompresuj',
  convert: 'Konwertuj',
  security: 'Bezpieczeństwo',
  openTool: 'Otwórz narzędzie',
  selectFilesBtn: 'Wybierz pliki',
  processBtn: 'Przetwórz dokument',
  downloadBtn: 'Pobierz plik',
  docReady: 'Dokument gotowy!',
  closeBtn: 'Zamknij',
};

const sv: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Avbryt sammanslagning',
  mergeCancelledMessage: 'PDF-sammanslagningen avbröts. De valda filerna och deras ordning är oförändrade. Du kan försöka igen.',
  allPdfTools: 'Alla PDF-verktyg',
  mergeAndSplit: 'Sammanfoga & Dela',
  compress: 'Komprimera',
  convert: 'Konvertera',
  security: 'Säkerhet',
  openTool: 'Öppna verktyg',
  selectFilesBtn: 'Välj filer',
  processBtn: 'Bearbeta dokument',
  downloadBtn: 'Ladda ner fil',
  docReady: 'Dokumentet är klart!',
  closeBtn: 'Stäng',
};

const id: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Batalkan penggabungan',
  mergeCancelledMessage: 'Penggabungan PDF dibatalkan. File yang dipilih dan urutannya tetap sama. Anda dapat mencoba lagi.',
  allPdfTools: 'Semua Alat PDF',
  mergeAndSplit: 'Gabung & Pisah',
  compress: 'Kompres',
  convert: 'Konversi',
  security: 'Keamanan',
  openTool: 'Buka Alat',
  selectFilesBtn: 'Pilih Berkas',
  processBtn: 'Proses Dokumen',
  downloadBtn: 'Unduh Berkas',
  docReady: 'Dokumen Siap!',
  closeBtn: 'Tutup',
};

const vi: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Hủy ghép PDF',
  mergeCancelledMessage: 'Đã hủy ghép PDF. Các tệp đã chọn và thứ tự của chúng vẫn được giữ nguyên. Bạn có thể thử lại.',
  allPdfTools: 'Tất cả công cụ PDF',
  mergeAndSplit: 'Gộp và Tách PDF',
  compress: 'Nén PDF',
  convert: 'Chuyển đổi',
  security: 'Bảo mật & Mật khẩu',
  openTool: 'Mở công cụ',
  selectFilesBtn: 'Chọn tệp từ thiết bị',
  processBtn: 'Xử lý tài liệu',
  downloadBtn: 'Tải xuống tệp',
  docReady: 'Tài liệu đã sẵn sàng!',
  closeBtn: 'Đóng',
};

const hi: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'मर्ज रद्द करें',
  mergeCancelledMessage: 'PDF मर्ज रद्द कर दिया गया है। चुनी हुई फ़ाइलें और उनका क्रम जस का तस है। आप फिर से कोशिश कर सकते हैं।',
  allPdfTools: 'सभी टूल्स',
  mergeAndSplit: 'मर्ज और स्प्लिट',
  compress: 'कंप्रेस करें',
  convert: 'कन्वर्ट करें',
  security: 'सुरक्षा',
  articles: 'गाइड्स और आर्टिकल्स',
  faqNav: 'सामान्य प्रश्न व सुरक्षा',
  inBrowserBadge: '100% ब्राउज़र प्राइवेसी',
  heroBadge: 'जीरो सर्वर अपलोड · 100% क्लाइंट-साइड सुरक्षा',
  heroTitle: 'ब्राउज़र में संपूर्ण PDF टूल्स सूट',
  heroSubtitle: 'फाइलों को बिना किसी रिमोट सर्वर पर अपलोड किए अपने ब्राउज़र मेमोरी में सुरक्षित रूप से प्रोसेस करें।',
  searchPlaceholder: 'PDF टूल्स खोजें...',
  catAll: 'सभी टूल्स',
  catOrganize: 'व्यवस्थित करें',
  catOptimize: 'कंप्रेस व ऑप्टिमाइज़',
  catConvert: 'कन्वर्ट',
  catEdit: 'एडिट व साइन',
  catSecurity: 'सुरक्षा व लॉक',
  openTool: 'टूल खोलें',
  selectFilesBtn: 'डिवाइस से फाइलें चुनें',
  processBtn: 'प्रोसेस करें',
  processingBtn: 'प्रोसेसिंग हो रही है...',
  downloadBtn: 'डाउनलोड करें',
  docReady: 'दस्तावेज़ तैयार है!',
  closeBtn: 'बंद करें',
};


const zh: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: '取消合并',
  mergeCancelledMessage: 'PDF 合并已取消。所选 PDF 文件及其顺序均未更改。您可以重试。',
  allPdfTools: '所有 PDF 工具',
  mergeAndSplit: '合并与拆分',
  compress: '压缩',
  convert: '转换',
  security: '安全性与密码',
  articles: '指南与文章',
  faqNav: '常见问题与安全',
  inBrowserBadge: '100% 浏览器本地隐私',
  heroBadge: '零云端上传 · 100% 客户端本地执行',
  heroTitle: '全功能浏览器端 PDF 工具箱',
  heroSubtitle: '直接在浏览器内存中合并、拆分、压缩、旋转和加水印，完全无需上传文件至远程服务器。',
  searchPlaceholder: '搜索 PDF 工具...',
  catAll: '所有工具',
  catOrganize: '组织页面',
  catOptimize: '压缩与优化',
  catConvert: '文件转换',
  catEdit: '编辑与签名',
  catSecurity: '安全保护',
  openTool: '打开工具',
  selectFilesBtn: '从设备选择文件',
  processBtn: '立即处理',
  processingBtn: '正在本地处理...',
  downloadBtn: '下载文件',
  docReady: '处理完成！',
  closeBtn: '关闭',
};

const ru: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Отменить объединение',
  mergeCancelledMessage: 'Объединение PDF отменено. Выбранные файлы и их порядок не изменились. Вы можете попробовать ещё раз.',
  allPdfTools: 'Все инструменты PDF',
  mergeAndSplit: 'Объединить и разделить',
  compress: 'Сжать',
  convert: 'Конвертировать',
  security: 'Безопасность',
  articles: 'Статьи и инструкции',
  faqNav: 'Вопросы и безопасность',
  inBrowserBadge: '100% локальная конфиденциальность',
  heroBadge: 'Без загрузки на сервер · 100% защита в браузере',
  heroTitle: 'Полный набор инструментов PDF в браузере',
  heroSubtitle: 'Объединяйте, разделяйте, сжимайте и защищайте PDF прямо в памяти браузера без передачи файлов в облако.',
  searchPlaceholder: 'Поиск инструментов PDF...',
  catAll: 'Все инструменты',
  catOrganize: 'Организация',
  catOptimize: 'Оптимизация',
  catConvert: 'Конвертация',
  catEdit: 'Редактирование',
  catSecurity: 'Безопасность',
  openTool: 'Открыть',
  selectFilesBtn: 'Выбрать файлы с устройства',
  processBtn: 'Обработать',
  processingBtn: 'Обработка в памяти...',
  downloadBtn: 'Скачать файл',
  docReady: 'Файл готов к загрузке!',
  closeBtn: 'Закрыть',
};

const de: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Zusammenführen abbrechen',
  mergeCancelledMessage: 'Das Zusammenführen wurde abgebrochen. Die ausgewählten PDFs und ihre Reihenfolge bleiben unverändert. Sie können es erneut versuchen.',
  allPdfTools: 'Alle PDF-Tools',
  mergeAndSplit: 'Zusammenfügen & Teilen',
  compress: 'Komprimieren',
  convert: 'Konvertieren',
  security: 'Sicherheit',
  articles: 'Artikel & Leitfäden',
  faqNav: 'FAQ & Sicherheit',
  inBrowserBadge: '100% Browser-Datenschutz',
  heroBadge: 'Kein Server-Upload · 100% Client-seitige Privatsphäre',
  heroTitle: 'Komplette PDF-Suite direkt im Browser',
  heroSubtitle: 'PDF-Dateien sicher im lokalen Arbeitsspeicher zusammenfügen, teilen, komprimieren und schützen.',
  searchPlaceholder: 'PDF-Tools suchen...',
  catAll: 'Alle Tools',
  catOrganize: 'Organisieren',
  catOptimize: 'Optimieren',
  catConvert: 'Konvertieren',
  catEdit: 'Bearbeiten & Signieren',
  catSecurity: 'Sicherheit',
  openTool: 'Tool öffnen',
  selectFilesBtn: 'Dateien auswählen',
  processBtn: 'Verarbeiten',
  processingBtn: 'Wird lokal verarbeitet...',
  downloadBtn: 'Herunterladen',
  docReady: 'Datei bereit zum Download!',
  closeBtn: 'Schließen',
};

const fr: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Annuler la fusion',
  mergeCancelledMessage: 'La fusion des PDF a été annulée. Les fichiers sélectionnés et leur ordre n’ont pas changé. Vous pouvez réessayer.',
  allPdfTools: 'Tous les outils PDF',
  mergeAndSplit: 'Fusionner et diviser',
  compress: 'Compresser',
  convert: 'Convertir',
  security: 'Sécurité',
  articles: 'Guides et articles',
  faqNav: 'FAQ et sécurité',
  inBrowserBadge: 'Confidentialité 100% dans le navigateur',
  heroBadge: 'Zéro transfert serveur · Confidentialité absolue',
  heroTitle: 'Suite PDF complète directement dans votre navigateur',
  heroSubtitle: 'Fusionnez, divisez, compressez et protégez vos documents PDF localement en mémoire RAM sans aucun envoi vers le cloud.',
  searchPlaceholder: 'Rechercher un outil PDF...',
  catAll: 'Tous les outils',
  catOrganize: 'Organiser',
  catOptimize: 'Optimiser',
  catConvert: 'Convertir',
  catEdit: 'Éditer et signer',
  catSecurity: 'Sécurité',
  openTool: 'Ouvrir l’outil',
  selectFilesBtn: 'Sélectionner des fichiers',
  processBtn: 'Traiter le document',
  processingBtn: 'Traitement local en cours...',
  downloadBtn: 'Télécharger',
  docReady: 'Document prêt !',
  closeBtn: 'Fermer',
};

const es: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Cancelar la unión',
  mergeCancelledMessage: 'Se canceló la unión de los PDF. Los archivos seleccionados y su orden no han cambiado. Puedes intentarlo de nuevo.',
  allPdfTools: 'Todas las herramientas',
  mergeAndSplit: 'Unir y dividir',
  compress: 'Comprimir',
  convert: 'Convertir',
  security: 'Seguridad',
  articles: 'Guías y artículos',
  faqNav: 'Preguntas y seguridad',
  inBrowserBadge: '100% privacidad en el navegador',
  heroBadge: 'Cero cargas a servidores · Privacidad local total',
  heroTitle: 'Suite completa de PDF en tu navegador',
  heroSubtitle: 'Une, divide, comprime y protege documentos PDF directamente en la memoria local de tu dispositivo.',
  searchPlaceholder: 'Buscar herramientas PDF...',
  catAll: 'Todas las herramientas',
  catOrganize: 'Organizar',
  catOptimize: 'Optimizar',
  catConvert: 'Convertir',
  catEdit: 'Editar y firmar',
  catSecurity: 'Seguridad',
  openTool: 'Abrir herramienta',
  selectFilesBtn: 'Seleccionar archivos',
  processBtn: 'Procesar documento',
  processingBtn: 'Procesando en memoria...',
  downloadBtn: 'Descargar archivo',
  docReady: '¡Archivo listo!',
  closeBtn: 'Cerrar',
};

const ja: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: '結合をキャンセル',
  mergeCancelledMessage: 'PDFの結合をキャンセルしました。選択したファイルと順序はそのままです。もう一度お試しいただけます。',
  allPdfTools: 'すべてのPDFツール',
  mergeAndSplit: '結合と分割',
  compress: '圧縮',
  convert: '変換',
  security: 'セキュリティと暗号化',
  articles: 'ガイドと記事',
  faqNav: 'よくある質問とセキュリティ',
  inBrowserBadge: '100% ブラウザ内プライバシー',
  heroBadge: 'サーバー送信ゼロ · 完全クライアントサイド実行',
  heroTitle: 'ブラウザで完結する高機能PDFツールスイート',
  heroSubtitle: 'PDFの結合、分割、圧縮、パスワード設定を外部サーバーに送信することなく、ブラウザのRAM内で安全に処理します。',
  searchPlaceholder: 'PDFツールを検索...',
  catAll: 'すべてのツール',
  catOrganize: '整理・並び替え',
  catOptimize: '圧縮・最適化',
  catConvert: '変換',
  catEdit: '編集・署名',
  catSecurity: 'セキュリティ',
  openTool: 'ツールを開く',
  selectFilesBtn: 'ファイルを選択',
  processBtn: '処理を実行',
  processingBtn: 'ローカルで処理中...',
  downloadBtn: 'ダウンロード',
  docReady: '完了しました！',
  closeBtn: '閉じる',
};

const ko: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: '병합 취소',
  mergeCancelledMessage: 'PDF 병합이 취소되었습니다. 선택한 파일과 순서는 그대로 유지됩니다. 다시 시도할 수 있습니다.',
  allPdfTools: '모든 PDF 도구',
  mergeAndSplit: '병합 및 분할',
  compress: '압축',
  convert: '변환',
  security: '보안 및 암호화',
  articles: '가이드 및 아티클',
  faqNav: '자주 묻는 질문과 보안',
  inBrowserBadge: '100% 브라우저 내 프라이버시',
  heroBadge: '서버 업로드 0% · 100% 클라이언트 로컬 실행',
  heroTitle: '브라우저에서 바로 사용하는 완성형 PDF 스위트',
  heroSubtitle: '외부 서버로 문서를 전송하지 않고 기기 로컬 메모리에서 직접 안전하게 PDF를 병합, 분할, 압축 및 편집합니다.',
  searchPlaceholder: 'PDF 도구 검색...',
  catAll: '모든 도구',
  catOrganize: '페이지 정리',
  catOptimize: '압축 및 최적화',
  catConvert: '변환',
  catEdit: '편집 및 서명',
  catSecurity: '보안',
  openTool: '도구 열기',
  selectFilesBtn: '기기에서 파일 선택',
  processBtn: '문서 처리하기',
  processingBtn: '로컬에서 처리 중...',
  downloadBtn: '파일 다운로드',
  docReady: '준비 완료!',
  closeBtn: '닫기',
};

const tr: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Birleştirmeyi iptal et',
  mergeCancelledMessage: 'PDF birleştirme iptal edildi. Seçilen dosyalar ve sıraları değişmedi. Yeniden deneyebilirsiniz.',
  allPdfTools: 'Tüm PDF Araçları',
  mergeAndSplit: 'Birleştir ve Böl',
  compress: 'Sıkıştır',
  convert: 'Dönüştür',
  security: 'Güvenlik',
  articles: 'Rehberler ve Makaleler',
  faqNav: 'SSS ve Güvenlik',
  inBrowserBadge: '%100 Tarayıcı İçi Gizlilik',
  heroBadge: 'Sıfır Sunucu Yüklemesi · %100 Yerel Güvenlik',
  heroTitle: 'Tarayıcınızda Eksiksiz PDF Araç Seti',
  heroSubtitle: 'PDF dosyalarınızı uzak sunuculara göndermeden, tarayıcınızın yerel belleğinde güvenle birleştirin, bölün, sıkıştırın ve düzenleyin.',
  searchPlaceholder: 'PDF araçlarını ara...',
  catAll: 'Tüm Araçlar',
  catOrganize: 'Düzenle',
  catOptimize: 'Sıkıştır ve İyileştir',
  catConvert: 'Dönüştür',
  catEdit: 'Düzenle ve İmzala',
  catSecurity: 'Güvenlik',
  openTool: 'Aracı Aç',
  selectFilesBtn: 'Cihazdan Dosya Seç',
  processBtn: 'İşlemi Başlat',
  processingBtn: 'Yerel bellekte işleniyor...',
  downloadBtn: 'İndir',
  docReady: 'Belge hazır!',
  closeBtn: 'Kapat',
};

const pt: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Cancelar junção',
  mergeCancelledMessage: 'A junção dos PDFs foi cancelada. Os ficheiros selecionados e a respetiva ordem não foram alterados. Pode tentar novamente.',
  allPdfTools: 'Todas as Ferramentas',
  mergeAndSplit: 'Juntar e Dividir',
  compress: 'Comprimir',
  convert: 'Converter',
  security: 'Segurança',
  articles: 'Guias e Artigos',
  faqNav: 'Perguntas Frequentes',
  inBrowserBadge: '100% Privacidade no Navegador',
  heroBadge: 'Zero Uploads para Servidores · Totalmente Local',
  heroTitle: 'Conjunto Completo de PDF no seu Navegador',
  heroSubtitle: 'Junte, divida, comprima e proteja documentos PDF localmente na memória RAM sem enviar nenhum dado para a nuvem.',
  searchPlaceholder: 'Buscar ferramentas PDF...',
  catAll: 'Todas as Ferramentas',
  catOrganize: 'Organizar',
  catOptimize: 'Otimizar',
  catConvert: 'Converter',
  catEdit: 'Editar e Assinar',
  catSecurity: 'Segurança',
  openTool: 'Abrir Ferramenta',
  selectFilesBtn: 'Selecionar Arquivos',
  processBtn: 'Processar Documento',
  processingBtn: 'Processando localmente...',
  downloadBtn: 'Baixar Arquivo',
  docReady: 'Arquivo pronto!',
  closeBtn: 'Fechar',
};

const it: TranslationDict = {
  ...en,
  brandTitle: 'ClickPDF',
  cancelMergeBtn: 'Annulla unione',
  mergeCancelledMessage: 'Unione dei PDF annullata. I file selezionati e il loro ordine non sono cambiati. Puoi riprovare.',
  allPdfTools: 'Tutti gli strumenti PDF',
  mergeAndSplit: 'Unisci e dividi',
  compress: 'Comprimi',
  convert: 'Converti',
  security: 'Sicurezza',
  articles: 'Guide e articoli',
  faqNav: 'FAQ e sicurezza',
  inBrowserBadge: '100% privacy nel browser',
  heroBadge: 'Nessun caricamento su server · Elaborazione locale',
  heroTitle: 'Suite PDF completa nel tuo browser',
  heroSubtitle: 'Unisci, dividi, comprimi e proteggi file PDF localmente nella memoria del dispositivo senza trasferire dati su server cloud.',
  searchPlaceholder: 'Cerca strumenti PDF...',
  catAll: 'Tutti gli strumenti',
  catOrganize: 'Organizza',
  catOptimize: 'Ottimizza',
  catConvert: 'Converti',
  catEdit: 'Modifica e firma',
  catSecurity: 'Sicurezza',
  openTool: 'Apri strumento',
  selectFilesBtn: 'Seleziona file dal dispositivo',
  processBtn: 'Elabora documento',
  processingBtn: 'Elaborazione locale in corso...',
  downloadBtn: 'Scarica file',
  docReady: 'Documento pronto!',
  closeBtn: 'Chiudi',
};

const rawTranslations: Record<Language, TranslationDict> = {
  en,
  ur,
  hi,
  ar,
  zh,
  ja,
  tl,
  de,
  fr,
  es,
  it,
  no,
  ru,
  pt,
  ko,
  tr,
  nl,
  pl,
  sv,
  id,
  vi,
};

const MERGE_PDF_UI_COPY: Record<Language, Pick<TranslationDict,
  | 'previewBtn'
  | 'previewThisFile'
  | 'previewProcessedFile'
  | 'mergePdfNoFilesError'
  | 'mergePdfUnreadableFileError'
  | 'mergePdfInputMemoryError'
  | 'mergePdfUnsupportedFormError'
  | 'mergePdfXfaError'
  | 'mergePdfSignatureError'
  | 'mergePdfSaveMemoryError'
  | 'mergePdfSaveError'
  | 'mergePdfGenericError'
>> = {
  en: {
    previewBtn: 'Preview',
    previewThisFile: 'Preview this file',
    previewProcessedFile: 'Preview processed file',
    mergePdfNoFilesError: 'Select at least one PDF file before merging.',
    mergePdfUnreadableFileError: 'File "{fileName}" could not be read as a usable PDF. It may be damaged, incomplete, empty, or password-protected. Remove it or choose a valid, unlocked copy and retry.',
    mergePdfInputMemoryError: 'File "{fileName}" could not be processed because available browser memory is insufficient. Try fewer or smaller PDFs, or close other tabs, then retry.',
    mergePdfUnsupportedFormError: 'File "{fileName}" contains interactive form data that cannot be safely preserved. No merged output was created. Use a compatible PDF export and retry.',
    mergePdfXfaError: 'File "{fileName}" contains a dynamic XFA form that Merge PDF cannot safely preserve. Export a static PDF copy and retry.',
    mergePdfSignatureError: 'File "{fileName}" contains a digital signature. Merging changes the signed bytes, so the signature cannot remain valid. Use an unsigned copy.',
    mergePdfSaveMemoryError: 'The merged PDF could not be saved because available browser memory is insufficient. Try fewer or smaller PDFs, then retry.',
    mergePdfSaveError: 'The combined PDF could not be saved. Your selected files are still available; try again or use fewer PDFs.',
    mergePdfGenericError: 'Merge PDF could not complete. Your selected files are still available; check that each PDF is readable and try again.',
  },
  ja: {
    previewBtn: 'プレビュー',
    previewThisFile: 'このファイルをプレビュー',
    previewProcessedFile: '処理済みファイルをプレビュー',
    mergePdfNoFilesError: '結合するPDFファイルを1つ以上選択してください。',
    mergePdfUnreadableFileError: 'ファイル「{fileName}」を有効なPDFとして読み込めませんでした。破損、不完全、空、またはパスワード保護の可能性があります。ファイルを削除するか、有効でロックされていないコピーを選んで再試行してください。',
    mergePdfInputMemoryError: 'ファイル「{fileName}」は、現在のブラウザーのメモリでは処理できません。PDFの数やサイズを減らすか、他のタブを閉じて再試行してください。',
    mergePdfUnsupportedFormError: 'ファイル「{fileName}」には安全に保持できないインタラクティブフォームデータが含まれています。結合結果は作成されませんでした。互換性のあるPDFとして書き出して再試行してください。',
    mergePdfXfaError: 'ファイル「{fileName}」には安全に保持できない動的XFAフォームが含まれています。静的PDFとして書き出して再試行してください。',
    mergePdfSignatureError: 'ファイル「{fileName}」には電子署名が含まれています。結合すると署名対象のデータが変わり、署名は無効になります。署名のないコピーを使用してください。',
    mergePdfSaveMemoryError: 'ブラウザーのメモリが不足しているため、結合PDFを保存できませんでした。PDFの数やサイズを減らして再試行してください。',
    mergePdfSaveError: '結合PDFを保存できませんでした。選択したファイルはそのまま残っています。再試行するか、PDFの数を減らしてください。',
    mergePdfGenericError: 'PDFを結合できませんでした。選択したファイルはそのまま残っています。各PDFが読み取れることを確認して再試行してください。',
  },
  ur: {
    previewBtn: 'پیش نظارہ',
    previewThisFile: 'اس فائل کا پیش نظارہ',
    previewProcessedFile: 'پروسیس شدہ فائل کا پیش نظارہ',
    mergePdfNoFilesError: 'مرج کرنے کے لیے کم از کم ایک PDF فائل منتخب کریں۔',
    mergePdfUnreadableFileError: 'فائل "{fileName}" کو قابلِ استعمال PDF کے طور پر نہیں پڑھا جا سکا۔ یہ خراب، نامکمل، خالی یا پاس ورڈ سے محفوظ ہو سکتی ہے۔ اسے ہٹا دیں یا درست، غیر مقفل نقل منتخب کر کے دوبارہ کوشش کریں۔',
    mergePdfInputMemoryError: 'فائل "{fileName}" کو براؤزر کی دستیاب میموری میں پروسیس نہیں کیا جا سکا۔ کم یا چھوٹی PDFs منتخب کریں، یا دوسرے ٹیب بند کر کے دوبارہ کوشش کریں۔',
    mergePdfUnsupportedFormError: 'فائل "{fileName}" میں ایسا interactive form data ہے جسے محفوظ طور پر برقرار نہیں رکھا جا سکتا۔ مرج شدہ فائل نہیں بنائی گئی۔ مطابقت رکھنے والی PDF نقل برآمد کر کے دوبارہ کوشش کریں۔',
    mergePdfXfaError: 'فائل "{fileName}" میں dynamic XFA form ہے جسے Merge PDF محفوظ طور پر برقرار نہیں رکھ سکتا۔ Static PDF نقل برآمد کر کے دوبارہ کوشش کریں۔',
    mergePdfSignatureError: 'فائل "{fileName}" میں digital signature ہے۔ مرج کرنے سے دستخط شدہ bytes بدل جائیں گے، اس لیے دستخط درست نہیں رہیں گے۔ بغیر دستخط والی نقل استعمال کریں۔',
    mergePdfSaveMemoryError: 'براؤزر کی دستیاب میموری کم ہونے کی وجہ سے مرج شدہ PDF محفوظ نہیں ہو سکی۔ کم یا چھوٹی PDFs منتخب کر کے دوبارہ کوشش کریں۔',
    mergePdfSaveError: 'مرج شدہ PDF محفوظ نہیں ہو سکی۔ منتخب فائلیں برقرار ہیں؛ دوبارہ کوشش کریں یا کم PDFs منتخب کریں۔',
    mergePdfGenericError: 'PDF مرج مکمل نہیں ہو سکا۔ منتخب فائلیں برقرار ہیں؛ ہر PDF کے قابلِ مطالعہ ہونے کی تصدیق کر کے دوبارہ کوشش کریں۔',
  },
  de: {
    previewBtn: 'Vorschau',
    previewThisFile: 'Diese Datei in der Vorschau anzeigen',
    previewProcessedFile: 'Verarbeitete Datei in der Vorschau anzeigen',
    mergePdfNoFilesError: 'Wählen Sie mindestens eine PDF-Datei zum Zusammenführen aus.',
    mergePdfUnreadableFileError: 'Die Datei „{fileName}“ konnte nicht als verwendbare PDF gelesen werden. Sie ist möglicherweise beschädigt, unvollständig, leer oder passwortgeschützt. Entfernen Sie sie oder wählen Sie eine gültige, ungeschützte Kopie und versuchen Sie es erneut.',
    mergePdfInputMemoryError: 'Die Datei „{fileName}“ kann mit dem verfügbaren Browserspeicher nicht verarbeitet werden. Verwenden Sie weniger oder kleinere PDFs oder schließen Sie andere Tabs und versuchen Sie es erneut.',
    mergePdfUnsupportedFormError: 'Die Datei „{fileName}“ enthält interaktive Formulardaten, die nicht sicher erhalten werden können. Es wurde keine zusammengeführte Datei erstellt. Exportieren Sie eine kompatible PDF-Kopie und versuchen Sie es erneut.',
    mergePdfXfaError: 'Die Datei „{fileName}“ enthält ein dynamisches XFA-Formular, das Merge PDF nicht sicher erhalten kann. Exportieren Sie eine statische PDF-Kopie und versuchen Sie es erneut.',
    mergePdfSignatureError: 'Die Datei „{fileName}“ enthält eine digitale Signatur. Beim Zusammenführen ändern sich die signierten Daten, sodass die Signatur nicht gültig bleiben kann. Verwenden Sie eine unsignierte Kopie.',
    mergePdfSaveMemoryError: 'Die zusammengeführte PDF konnte wegen unzureichenden Browserspeichers nicht gespeichert werden. Verwenden Sie weniger oder kleinere PDFs und versuchen Sie es erneut.',
    mergePdfSaveError: 'Die zusammengeführte PDF konnte nicht gespeichert werden. Ihre ausgewählten Dateien sind weiterhin verfügbar. Versuchen Sie es erneut oder verwenden Sie weniger PDFs.',
    mergePdfGenericError: 'Merge PDF konnte nicht abgeschlossen werden. Ihre ausgewählten Dateien sind weiterhin verfügbar. Prüfen Sie, ob alle PDFs lesbar sind, und versuchen Sie es erneut.',
  },
  hi: {
    previewBtn: 'पूर्वावलोकन',
    previewThisFile: 'इस फ़ाइल का पूर्वावलोकन करें',
    previewProcessedFile: 'प्रोसेस की गई फ़ाइल का पूर्वावलोकन करें',
    mergePdfNoFilesError: 'मर्ज करने से पहले कम से कम एक PDF फ़ाइल चुनें।',
    mergePdfUnreadableFileError: 'फ़ाइल "{fileName}" को उपयोग योग्य PDF के रूप में पढ़ा नहीं जा सका। यह क्षतिग्रस्त, अधूरी, खाली या पासवर्ड-सुरक्षित हो सकती है। इसे हटाएँ या मान्य, अनलॉक की गई प्रति चुनकर फिर कोशिश करें।',
    mergePdfInputMemoryError: 'ब्राउज़र की उपलब्ध मेमोरी में फ़ाइल "{fileName}" प्रोसेस नहीं हो सकी। कम या छोटी PDFs चुनें, या दूसरे टैब बंद करके फिर कोशिश करें।',
    mergePdfUnsupportedFormError: 'फ़ाइल "{fileName}" में इंटरैक्टिव फ़ॉर्म डेटा है जिसे सुरक्षित रूप से बनाए रखना संभव नहीं है। मर्ज की गई फ़ाइल नहीं बनाई गई। संगत PDF प्रति निर्यात करके फिर कोशिश करें।',
    mergePdfXfaError: 'फ़ाइल "{fileName}" में डायनेमिक XFA फ़ॉर्म है जिसे Merge PDF सुरक्षित रूप से बनाए नहीं रख सकता। स्थिर PDF प्रति निर्यात करके फिर कोशिश करें।',
    mergePdfSignatureError: 'फ़ाइल "{fileName}" में डिजिटल हस्ताक्षर है। मर्ज करने से हस्ताक्षरित डेटा बदलता है, इसलिए हस्ताक्षर मान्य नहीं रह सकता। बिना हस्ताक्षर वाली प्रति इस्तेमाल करें।',
    mergePdfSaveMemoryError: 'ब्राउज़र की उपलब्ध मेमोरी कम होने के कारण मर्ज की गई PDF सहेजी नहीं जा सकी। कम या छोटी PDFs चुनकर फिर कोशिश करें।',
    mergePdfSaveError: 'मर्ज की गई PDF सहेजी नहीं जा सकी। चुनी हुई फ़ाइलें उपलब्ध हैं; फिर कोशिश करें या कम PDFs चुनें।',
    mergePdfGenericError: 'Merge PDF पूरा नहीं हो सका। चुनी हुई फ़ाइलें उपलब्ध हैं; हर PDF के पढ़े जा सकने की जाँच करके फिर कोशिश करें।',
  },
  ar: {
    previewBtn: 'معاينة',
    previewThisFile: 'معاينة هذا الملف',
    previewProcessedFile: 'معاينة الملف الذي تمت معالجته',
    mergePdfNoFilesError: 'اختر ملف PDF واحدًا على الأقل للدمج.',
    mergePdfUnreadableFileError: 'تعذرت قراءة الملف "{fileName}" كملف PDF صالح للاستخدام. قد يكون تالفًا أو غير مكتمل أو فارغًا أو محميًا بكلمة مرور. أزله أو اختر نسخة صالحة وغير مقفلة ثم أعد المحاولة.',
    mergePdfInputMemoryError: 'تعذرت معالجة الملف "{fileName}" بسبب محدودية ذاكرة المتصفح المتاحة. جرّب ملفات PDF أقل أو أصغر، أو أغلق علامات تبويب أخرى ثم أعد المحاولة.',
    mergePdfUnsupportedFormError: 'يحتوي الملف "{fileName}" على بيانات نموذج تفاعلي لا يمكن الحفاظ عليها بأمان. لم يتم إنشاء ملف مدمج. صدّر نسخة PDF متوافقة ثم أعد المحاولة.',
    mergePdfXfaError: 'يحتوي الملف "{fileName}" على نموذج XFA ديناميكي لا يمكن لـ Merge PDF الحفاظ عليه بأمان. صدّر نسخة PDF ثابتة ثم أعد المحاولة.',
    mergePdfSignatureError: 'يحتوي الملف "{fileName}" على توقيع رقمي. يؤدي الدمج إلى تغيير البيانات الموقعة، لذلك لن يبقى التوقيع صالحًا. استخدم نسخة غير موقعة.',
    mergePdfSaveMemoryError: 'تعذر حفظ ملف PDF المدمج بسبب نقص ذاكرة المتصفح المتاحة. جرّب ملفات PDF أقل أو أصغر ثم أعد المحاولة.',
    mergePdfSaveError: 'تعذر حفظ ملف PDF المدمج. ما زالت الملفات المحددة متاحة؛ أعد المحاولة أو استخدم ملفات PDF أقل.',
    mergePdfGenericError: 'تعذر إكمال دمج PDF. ما زالت الملفات المحددة متاحة؛ تحقق من إمكانية قراءة كل ملف ثم أعد المحاولة.',
  },
  zh: {
    previewBtn: '预览',
    previewThisFile: '预览此文件',
    previewProcessedFile: '预览已处理的文件',
    mergePdfNoFilesError: '请至少选择一个 PDF 文件再进行合并。',
    mergePdfUnreadableFileError: '无法将文件“{fileName}”读取为可用的 PDF。文件可能已损坏、不完整、为空或受密码保护。请移除该文件，或选择有效且未锁定的副本后重试。',
    mergePdfInputMemoryError: '浏览器可用内存不足，无法处理文件“{fileName}”。请减少 PDF 数量或文件大小，或关闭其他标签页后重试。',
    mergePdfUnsupportedFormError: '文件“{fileName}”包含无法安全保留的交互式表单数据。未创建合并文件。请导出兼容的 PDF 副本后重试。',
    mergePdfXfaError: '文件“{fileName}”包含 Merge PDF 无法安全保留的动态 XFA 表单。请导出静态 PDF 副本后重试。',
    mergePdfSignatureError: '文件“{fileName}”包含数字签名。合并会更改已签名的数据，因此签名将无法继续有效。请使用未签名的副本。',
    mergePdfSaveMemoryError: '浏览器可用内存不足，无法保存合并后的 PDF。请减少 PDF 数量或文件大小后重试。',
    mergePdfSaveError: '无法保存合并后的 PDF。所选文件仍可使用；请重试或减少 PDF 数量。',
    mergePdfGenericError: 'Merge PDF 未能完成。所选文件仍可使用；请确认每个 PDF 都可读取后重试。',
  },
  tl: {
    previewBtn: 'I-preview',
    previewThisFile: 'I-preview ang file na ito',
    previewProcessedFile: 'I-preview ang naprosesong file',
    mergePdfNoFilesError: 'Pumili ng kahit isang PDF file bago pagsamahin.',
    mergePdfUnreadableFileError: 'Hindi mabasa ang file na "{fileName}" bilang PDF na magagamit. Maaaring sira, hindi kumpleto, walang laman, o protektado ng password. Alisin ito o pumili ng valid at hindi naka-lock na kopya, saka subukan muli.',
    mergePdfInputMemoryError: 'Hindi maiproseso ang file na "{fileName}" dahil kulang ang memoryang magagamit ng browser. Gumamit ng mas kaunti o mas maliliit na PDF, o isara ang ibang tab at subukan muli.',
    mergePdfUnsupportedFormError: 'May interactive form data ang file na "{fileName}" na hindi ligtas na mapapanatili. Walang nabuong pinagsamang file. Mag-export ng katugmang PDF copy at subukan muli.',
    mergePdfXfaError: 'May dynamic XFA form ang file na "{fileName}" na hindi ligtas na mapapanatili ng Merge PDF. Mag-export ng static PDF copy at subukan muli.',
    mergePdfSignatureError: 'May digital signature ang file na "{fileName}". Binabago ng pagsasama ang nilagdaang data kaya hindi mananatiling valid ang lagda. Gumamit ng kopyang walang lagda.',
    mergePdfSaveMemoryError: 'Hindi na-save ang pinagsamang PDF dahil kulang ang memoryang magagamit ng browser. Gumamit ng mas kaunti o mas maliliit na PDF at subukan muli.',
    mergePdfSaveError: 'Hindi na-save ang pinagsamang PDF. Nananatiling available ang mga pinili mong file; subukan muli o gumamit ng mas kaunting PDF.',
    mergePdfGenericError: 'Hindi nakumpleto ang Merge PDF. Nananatiling available ang mga pinili mong file; tiyaking nababasa ang bawat PDF at subukan muli.',
  },
  es: {
    previewBtn: 'Vista previa',
    previewThisFile: 'Vista previa de este archivo',
    previewProcessedFile: 'Vista previa del archivo procesado',
    mergePdfNoFilesError: 'Selecciona al menos un archivo PDF para unirlo.',
    mergePdfUnreadableFileError: 'No se pudo leer el archivo "{fileName}" como un PDF válido. Puede estar dañado, incompleto, vacío o protegido con contraseña. Elimínalo o elige una copia válida y desbloqueada, y vuelve a intentarlo.',
    mergePdfInputMemoryError: 'No se pudo procesar el archivo "{fileName}" porque la memoria disponible del navegador es insuficiente. Prueba con menos archivos o más pequeños, o cierra otras pestañas y vuelve a intentarlo.',
    mergePdfUnsupportedFormError: 'El archivo "{fileName}" contiene datos de formularios interactivos que no se pueden conservar de forma segura. No se creó ningún archivo unido. Exporta una copia PDF compatible y vuelve a intentarlo.',
    mergePdfXfaError: 'El archivo "{fileName}" contiene un formulario XFA dinámico que Merge PDF no puede conservar de forma segura. Exporta una copia PDF estática y vuelve a intentarlo.',
    mergePdfSignatureError: 'El archivo "{fileName}" contiene una firma digital. La unión modifica los datos firmados, por lo que la firma dejará de ser válida. Usa una copia sin firmar.',
    mergePdfSaveMemoryError: 'No se pudo guardar el PDF unido porque la memoria disponible del navegador es insuficiente. Prueba con menos archivos o más pequeños y vuelve a intentarlo.',
    mergePdfSaveError: 'No se pudo guardar el PDF unido. Los archivos seleccionados siguen disponibles; vuelve a intentarlo o usa menos PDF.',
    mergePdfGenericError: 'No se pudo completar la unión de PDF. Los archivos seleccionados siguen disponibles; comprueba que todos se puedan leer y vuelve a intentarlo.',
  },
  fr: {
    previewBtn: 'Aperçu',
    previewThisFile: 'Aperçu de ce fichier',
    previewProcessedFile: 'Aperçu du fichier traité',
    mergePdfNoFilesError: 'Sélectionnez au moins un fichier PDF à fusionner.',
    mergePdfUnreadableFileError: 'Le fichier « {fileName} » n’a pas pu être lu comme un PDF utilisable. Il est peut-être endommagé, incomplet, vide ou protégé par un mot de passe. Supprimez-le ou choisissez une copie valide et déverrouillée, puis réessayez.',
    mergePdfInputMemoryError: 'Le fichier « {fileName} » ne peut pas être traité avec la mémoire disponible dans le navigateur. Essayez avec moins de PDF ou des fichiers plus petits, ou fermez d’autres onglets puis réessayez.',
    mergePdfUnsupportedFormError: 'Le fichier « {fileName} » contient des données de formulaire interactif qui ne peuvent pas être conservées en toute sécurité. Aucun fichier fusionné n’a été créé. Exportez une copie PDF compatible, puis réessayez.',
    mergePdfXfaError: 'Le fichier « {fileName} » contient un formulaire XFA dynamique que Merge PDF ne peut pas conserver en toute sécurité. Exportez une copie PDF statique, puis réessayez.',
    mergePdfSignatureError: 'Le fichier « {fileName} » contient une signature numérique. La fusion modifie les données signées, la signature ne peut donc pas rester valide. Utilisez une copie non signée.',
    mergePdfSaveMemoryError: 'Le PDF fusionné n’a pas pu être enregistré faute de mémoire disponible dans le navigateur. Essayez avec moins de PDF ou des fichiers plus petits, puis réessayez.',
    mergePdfSaveError: 'Le PDF fusionné n’a pas pu être enregistré. Vos fichiers sélectionnés sont toujours disponibles ; réessayez ou utilisez moins de PDF.',
    mergePdfGenericError: 'La fusion PDF n’a pas abouti. Vos fichiers sélectionnés sont toujours disponibles ; vérifiez que chaque PDF est lisible, puis réessayez.',
  },
  it: {
    previewBtn: 'Anteprima',
    previewThisFile: 'Anteprima di questo file',
    previewProcessedFile: 'Anteprima del file elaborato',
    mergePdfNoFilesError: 'Seleziona almeno un file PDF da unire.',
    mergePdfUnreadableFileError: 'Impossibile leggere il file "{fileName}" come PDF utilizzabile. Potrebbe essere danneggiato, incompleto, vuoto o protetto da password. Rimuovilo oppure scegli una copia valida e sbloccata, quindi riprova.',
    mergePdfInputMemoryError: 'Impossibile elaborare il file "{fileName}" con la memoria disponibile nel browser. Prova con meno PDF o file più piccoli, oppure chiudi altre schede e riprova.',
    mergePdfUnsupportedFormError: 'Il file "{fileName}" contiene dati di moduli interattivi che non possono essere conservati in sicurezza. Non è stato creato alcun file unito. Esporta una copia PDF compatibile e riprova.',
    mergePdfXfaError: 'Il file "{fileName}" contiene un modulo XFA dinamico che Merge PDF non può conservare in sicurezza. Esporta una copia PDF statica e riprova.',
    mergePdfSignatureError: 'Il file "{fileName}" contiene una firma digitale. L’unione modifica i dati firmati, quindi la firma non può rimanere valida. Usa una copia senza firma.',
    mergePdfSaveMemoryError: 'Impossibile salvare il PDF unito perché la memoria disponibile nel browser è insufficiente. Prova con meno PDF o file più piccoli e riprova.',
    mergePdfSaveError: 'Impossibile salvare il PDF unito. I file selezionati sono ancora disponibili; riprova o usa meno PDF.',
    mergePdfGenericError: 'Impossibile completare l’unione dei PDF. I file selezionati sono ancora disponibili; verifica che ogni PDF sia leggibile e riprova.',
  },
  no: {
    previewBtn: 'Forhåndsvisning',
    previewThisFile: 'Forhåndsvis denne filen',
    previewProcessedFile: 'Forhåndsvis den behandlede filen',
    mergePdfNoFilesError: 'Velg minst én PDF-fil før du slår sammen.',
    mergePdfUnreadableFileError: 'Filen «{fileName}» kunne ikke leses som en brukbar PDF. Den kan være skadet, ufullstendig, tom eller passordbeskyttet. Fjern den eller velg en gyldig, ulåst kopi, og prøv igjen.',
    mergePdfInputMemoryError: 'Filen «{fileName}» kan ikke behandles med tilgjengelig nettleserminne. Prøv færre eller mindre PDF-filer, eller lukk andre faner og prøv igjen.',
    mergePdfUnsupportedFormError: 'Filen «{fileName}» inneholder interaktive skjemadata som ikke kan bevares trygt. Ingen sammenslått fil ble opprettet. Eksporter en kompatibel PDF-kopi og prøv igjen.',
    mergePdfXfaError: 'Filen «{fileName}» inneholder et dynamisk XFA-skjema som Merge PDF ikke kan bevare trygt. Eksporter en statisk PDF-kopi og prøv igjen.',
    mergePdfSignatureError: 'Filen «{fileName}» inneholder en digital signatur. Sammenslåing endrer de signerte dataene, så signaturen kan ikke forbli gyldig. Bruk en usignert kopi.',
    mergePdfSaveMemoryError: 'Den sammenslåtte PDF-filen kunne ikke lagres fordi nettleserminnet er utilstrekkelig. Prøv færre eller mindre PDF-filer, og prøv igjen.',
    mergePdfSaveError: 'Den sammenslåtte PDF-filen kunne ikke lagres. De valgte filene er fortsatt tilgjengelige; prøv igjen eller bruk færre PDF-filer.',
    mergePdfGenericError: 'Merge PDF kunne ikke fullføres. De valgte filene er fortsatt tilgjengelige; kontroller at hver PDF kan leses, og prøv igjen.',
  },
  pt: {
    previewBtn: 'Pré-visualizar',
    previewThisFile: 'Pré-visualizar este ficheiro',
    previewProcessedFile: 'Pré-visualizar o ficheiro processado',
    mergePdfNoFilesError: 'Selecione pelo menos um ficheiro PDF para juntar.',
    mergePdfUnreadableFileError: 'Não foi possível ler o ficheiro "{fileName}" como um PDF utilizável. Pode estar danificado, incompleto, vazio ou protegido por palavra-passe. Remova-o ou escolha uma cópia válida e desbloqueada e tente novamente.',
    mergePdfInputMemoryError: 'Não foi possível processar o ficheiro "{fileName}" com a memória disponível no navegador. Experimente menos PDFs ou ficheiros menores, ou feche outros separadores e tente novamente.',
    mergePdfUnsupportedFormError: 'O ficheiro "{fileName}" contém dados de formulário interativo que não podem ser preservados com segurança. Não foi criado um ficheiro unido. Exporte uma cópia PDF compatível e tente novamente.',
    mergePdfXfaError: 'O ficheiro "{fileName}" contém um formulário XFA dinâmico que o Merge PDF não consegue preservar com segurança. Exporte uma cópia PDF estática e tente novamente.',
    mergePdfSignatureError: 'O ficheiro "{fileName}" contém uma assinatura digital. A junção altera os dados assinados, pelo que a assinatura deixa de ser válida. Utilize uma cópia sem assinatura.',
    mergePdfSaveMemoryError: 'Não foi possível guardar o PDF unido devido à falta de memória disponível no navegador. Experimente menos PDFs ou ficheiros menores e tente novamente.',
    mergePdfSaveError: 'Não foi possível guardar o PDF unido. Os ficheiros selecionados continuam disponíveis; tente novamente ou utilize menos PDFs.',
    mergePdfGenericError: 'Não foi possível concluir a junção dos PDFs. Os ficheiros selecionados continuam disponíveis; confirme que cada PDF pode ser lido e tente novamente.',
  },
  ru: {
    previewBtn: 'Предпросмотр',
    previewThisFile: 'Предпросмотр этого файла',
    previewProcessedFile: 'Предпросмотр обработанного файла',
    mergePdfNoFilesError: 'Выберите хотя бы один PDF-файл для объединения.',
    mergePdfUnreadableFileError: 'Не удалось прочитать файл «{fileName}» как пригодный PDF. Возможно, он повреждён, неполон, пуст или защищён паролем. Удалите его либо выберите действительную незаблокированную копию и повторите попытку.',
    mergePdfInputMemoryError: 'Не удалось обработать файл «{fileName}»: браузеру не хватает доступной памяти. Выберите меньше PDF-файлов или файлы меньшего размера, либо закройте другие вкладки и повторите попытку.',
    mergePdfUnsupportedFormError: 'Файл «{fileName}» содержит интерактивные данные формы, которые нельзя безопасно сохранить. Объединённый файл не создан. Экспортируйте совместимую копию PDF и повторите попытку.',
    mergePdfXfaError: 'Файл «{fileName}» содержит динамическую форму XFA, которую Merge PDF не может безопасно сохранить. Экспортируйте статическую копию PDF и повторите попытку.',
    mergePdfSignatureError: 'Файл «{fileName}» содержит цифровую подпись. При объединении подписанные данные изменяются, поэтому подпись не останется действительной. Используйте копию без подписи.',
    mergePdfSaveMemoryError: 'Не удалось сохранить объединённый PDF из-за нехватки памяти браузера. Выберите меньше PDF-файлов или файлы меньшего размера и повторите попытку.',
    mergePdfSaveError: 'Не удалось сохранить объединённый PDF. Выбранные файлы остались доступны; повторите попытку или выберите меньше PDF-файлов.',
    mergePdfGenericError: 'Не удалось завершить объединение PDF. Выбранные файлы остались доступны; проверьте, что каждый PDF читается, и повторите попытку.',
  },
  ko: {
    previewBtn: '미리보기',
    previewThisFile: '이 파일 미리보기',
    previewProcessedFile: '처리된 파일 미리보기',
    mergePdfNoFilesError: '병합할 PDF 파일을 하나 이상 선택하세요.',
    mergePdfUnreadableFileError: '파일 "{fileName}"을(를) 사용할 수 있는 PDF로 읽지 못했습니다. 파일이 손상되었거나 불완전하거나 비어 있거나 암호로 보호되었을 수 있습니다. 제거하거나 유효하고 잠금 해제된 사본을 선택한 뒤 다시 시도하세요.',
    mergePdfInputMemoryError: '브라우저 메모리가 부족해 파일 "{fileName}"을(를) 처리할 수 없습니다. PDF 수나 크기를 줄이거나 다른 탭을 닫은 뒤 다시 시도하세요.',
    mergePdfUnsupportedFormError: '파일 "{fileName}"에는 안전하게 보존할 수 없는 대화형 양식 데이터가 있습니다. 병합된 파일은 생성되지 않았습니다. 호환되는 PDF 사본을 내보낸 뒤 다시 시도하세요.',
    mergePdfXfaError: '파일 "{fileName}"에는 Merge PDF가 안전하게 보존할 수 없는 동적 XFA 양식이 있습니다. 정적 PDF 사본을 내보낸 뒤 다시 시도하세요.',
    mergePdfSignatureError: '파일 "{fileName}"에는 디지털 서명이 있습니다. 병합하면 서명된 데이터가 바뀌므로 서명이 유효하게 유지되지 않습니다. 서명되지 않은 사본을 사용하세요.',
    mergePdfSaveMemoryError: '브라우저 메모리가 부족해 병합된 PDF를 저장하지 못했습니다. PDF 수나 크기를 줄인 뒤 다시 시도하세요.',
    mergePdfSaveError: '병합된 PDF를 저장하지 못했습니다. 선택한 파일은 계속 사용할 수 있습니다. 다시 시도하거나 PDF 수를 줄이세요.',
    mergePdfGenericError: 'PDF 병합을 완료하지 못했습니다. 선택한 파일은 계속 사용할 수 있습니다. 각 PDF를 읽을 수 있는지 확인한 뒤 다시 시도하세요.',
  },
  tr: {
    previewBtn: 'Önizleme',
    previewThisFile: 'Bu dosyayı önizle',
    previewProcessedFile: 'İşlenen dosyayı önizle',
    mergePdfNoFilesError: 'Birleştirmeden önce en az bir PDF dosyası seçin.',
    mergePdfUnreadableFileError: '"{fileName}" dosyası kullanılabilir bir PDF olarak okunamadı. Dosya bozuk, eksik, boş veya parola korumalı olabilir. Dosyayı kaldırın ya da geçerli ve kilidi açılmış bir kopya seçip yeniden deneyin.',
    mergePdfInputMemoryError: '"{fileName}" dosyası, tarayıcıdaki kullanılabilir bellek yetersiz olduğu için işlenemedi. Daha az veya daha küçük PDF seçin ya da diğer sekmeleri kapatıp yeniden deneyin.',
    mergePdfUnsupportedFormError: '"{fileName}" dosyasında güvenli biçimde korunamayan etkileşimli form verileri var. Birleştirilmiş dosya oluşturulmadı. Uyumlu bir PDF kopyası dışa aktarıp yeniden deneyin.',
    mergePdfXfaError: '"{fileName}" dosyasında Merge PDF tarafından güvenli biçimde korunamayan dinamik bir XFA formu var. Statik bir PDF kopyası dışa aktarıp yeniden deneyin.',
    mergePdfSignatureError: '"{fileName}" dosyasında dijital imza var. Birleştirme imzalanmış verileri değiştirdiği için imza geçerliliğini koruyamaz. İmzasız bir kopya kullanın.',
    mergePdfSaveMemoryError: 'Kullanılabilir tarayıcı belleği yetersiz olduğu için birleştirilmiş PDF kaydedilemedi. Daha az veya daha küçük PDF seçip yeniden deneyin.',
    mergePdfSaveError: 'Birleştirilmiş PDF kaydedilemedi. Seçtiğiniz dosyalar hâlâ kullanılabilir; yeniden deneyin veya daha az PDF kullanın.',
    mergePdfGenericError: 'PDF birleştirme tamamlanamadı. Seçtiğiniz dosyalar hâlâ kullanılabilir; her PDF’nin okunabildiğini kontrol edip yeniden deneyin.',
  },
  nl: {
    previewBtn: 'Voorbeeld',
    previewThisFile: 'Dit bestand bekijken',
    previewProcessedFile: 'Verwerkt bestand bekijken',
    mergePdfNoFilesError: 'Selecteer minstens één PDF-bestand om samen te voegen.',
    mergePdfUnreadableFileError: 'Bestand "{fileName}" kon niet als bruikbare PDF worden gelezen. Het kan beschadigd, onvolledig, leeg of met een wachtwoord beveiligd zijn. Verwijder het of kies een geldige, ontgrendelde kopie en probeer het opnieuw.',
    mergePdfInputMemoryError: 'Bestand "{fileName}" kon niet worden verwerkt omdat er onvoldoende browsergeheugen beschikbaar is. Gebruik minder of kleinere PDF’s, of sluit andere tabbladen en probeer het opnieuw.',
    mergePdfUnsupportedFormError: 'Bestand "{fileName}" bevat interactieve formuliergegevens die niet veilig kunnen worden behouden. Er is geen samengevoegd bestand gemaakt. Exporteer een compatibele PDF-kopie en probeer het opnieuw.',
    mergePdfXfaError: 'Bestand "{fileName}" bevat een dynamisch XFA-formulier dat Merge PDF niet veilig kan behouden. Exporteer een statische PDF-kopie en probeer het opnieuw.',
    mergePdfSignatureError: 'Bestand "{fileName}" bevat een digitale handtekening. Samenvoegen verandert de ondertekende gegevens, waardoor de handtekening niet geldig kan blijven. Gebruik een niet-ondertekende kopie.',
    mergePdfSaveMemoryError: 'De samengevoegde PDF kon niet worden opgeslagen omdat er onvoldoende browsergeheugen beschikbaar is. Gebruik minder of kleinere PDF’s en probeer het opnieuw.',
    mergePdfSaveError: 'De samengevoegde PDF kon niet worden opgeslagen. Je geselecteerde bestanden zijn nog beschikbaar; probeer het opnieuw of gebruik minder PDF’s.',
    mergePdfGenericError: 'PDF samenvoegen is niet gelukt. Je geselecteerde bestanden zijn nog beschikbaar; controleer of elke PDF leesbaar is en probeer het opnieuw.',
  },
  pl: {
    previewBtn: 'Podgląd',
    previewThisFile: 'Podgląd tego pliku',
    previewProcessedFile: 'Podgląd przetworzonego pliku',
    mergePdfNoFilesError: 'Wybierz co najmniej jeden plik PDF do połączenia.',
    mergePdfUnreadableFileError: 'Nie można odczytać pliku „{fileName}” jako użytecznego PDF. Plik może być uszkodzony, niekompletny, pusty lub zabezpieczony hasłem. Usuń go albo wybierz prawidłową, odblokowaną kopię i spróbuj ponownie.',
    mergePdfInputMemoryError: 'Nie można przetworzyć pliku „{fileName}” z powodu niewystarczającej pamięci przeglądarki. Wybierz mniej lub mniejsze pliki PDF albo zamknij inne karty i spróbuj ponownie.',
    mergePdfUnsupportedFormError: 'Plik „{fileName}” zawiera interaktywne dane formularza, których nie można bezpiecznie zachować. Nie utworzono połączonego pliku. Wyeksportuj zgodną kopię PDF i spróbuj ponownie.',
    mergePdfXfaError: 'Plik „{fileName}” zawiera dynamiczny formularz XFA, którego Merge PDF nie może bezpiecznie zachować. Wyeksportuj statyczną kopię PDF i spróbuj ponownie.',
    mergePdfSignatureError: 'Plik „{fileName}” zawiera podpis cyfrowy. Łączenie zmienia podpisane dane, więc podpis nie może pozostać ważny. Użyj kopii bez podpisu.',
    mergePdfSaveMemoryError: 'Nie można zapisać połączonego PDF z powodu niewystarczającej pamięci przeglądarki. Wybierz mniej lub mniejsze pliki PDF i spróbuj ponownie.',
    mergePdfSaveError: 'Nie można zapisać połączonego PDF. Wybrane pliki są nadal dostępne; spróbuj ponownie lub użyj mniejszej liczby plików PDF.',
    mergePdfGenericError: 'Nie udało się ukończyć łączenia PDF. Wybrane pliki są nadal dostępne; sprawdź, czy każdy PDF można odczytać, i spróbuj ponownie.',
  },
  sv: {
    previewBtn: 'Förhandsgranska',
    previewThisFile: 'Förhandsgranska den här filen',
    previewProcessedFile: 'Förhandsgranska den bearbetade filen',
    mergePdfNoFilesError: 'Välj minst en PDF-fil innan du slår ihop filer.',
    mergePdfUnreadableFileError: 'Filen ”{fileName}” kunde inte läsas som en användbar PDF. Den kan vara skadad, ofullständig, tom eller lösenordsskyddad. Ta bort den eller välj en giltig, olåst kopia och försök igen.',
    mergePdfInputMemoryError: 'Filen ”{fileName}” kunde inte bearbetas eftersom webbläsarens tillgängliga minne inte räcker till. Prova med färre eller mindre PDF-filer, eller stäng andra flikar och försök igen.',
    mergePdfUnsupportedFormError: 'Filen ”{fileName}” innehåller interaktiva formulärdata som inte kan bevaras på ett säkert sätt. Ingen sammanslagen fil skapades. Exportera en kompatibel PDF-kopia och försök igen.',
    mergePdfXfaError: 'Filen ”{fileName}” innehåller ett dynamiskt XFA-formulär som Merge PDF inte kan bevara säkert. Exportera en statisk PDF-kopia och försök igen.',
    mergePdfSignatureError: 'Filen ”{fileName}” innehåller en digital signatur. Sammanslagning ändrar de signerade uppgifterna, så signaturen kan inte förbli giltig. Använd en osignerad kopia.',
    mergePdfSaveMemoryError: 'Den sammanslagna PDF-filen kunde inte sparas eftersom webbläsarens minne inte räcker till. Prova med färre eller mindre PDF-filer och försök igen.',
    mergePdfSaveError: 'Den sammanslagna PDF-filen kunde inte sparas. De valda filerna finns kvar; försök igen eller använd färre PDF-filer.',
    mergePdfGenericError: 'PDF-sammanslagningen kunde inte slutföras. De valda filerna finns kvar; kontrollera att varje PDF går att läsa och försök igen.',
  },
  id: {
    previewBtn: 'Pratinjau',
    previewThisFile: 'Pratinjau file ini',
    previewProcessedFile: 'Pratinjau file yang diproses',
    mergePdfNoFilesError: 'Pilih setidaknya satu file PDF sebelum menggabungkan.',
    mergePdfUnreadableFileError: 'File "{fileName}" tidak dapat dibaca sebagai PDF yang dapat digunakan. File mungkin rusak, tidak lengkap, kosong, atau dilindungi kata sandi. Hapus file tersebut atau pilih salinan valid yang tidak terkunci, lalu coba lagi.',
    mergePdfInputMemoryError: 'File "{fileName}" tidak dapat diproses karena memori browser yang tersedia tidak mencukupi. Coba gunakan lebih sedikit atau PDF yang lebih kecil, atau tutup tab lain lalu coba lagi.',
    mergePdfUnsupportedFormError: 'File "{fileName}" berisi data formulir interaktif yang tidak dapat dipertahankan dengan aman. File gabungan tidak dibuat. Ekspor salinan PDF yang kompatibel lalu coba lagi.',
    mergePdfXfaError: 'File "{fileName}" berisi formulir XFA dinamis yang tidak dapat dipertahankan dengan aman oleh Merge PDF. Ekspor salinan PDF statis lalu coba lagi.',
    mergePdfSignatureError: 'File "{fileName}" berisi tanda tangan digital. Penggabungan mengubah data yang ditandatangani sehingga tanda tangan tidak lagi valid. Gunakan salinan tanpa tanda tangan.',
    mergePdfSaveMemoryError: 'PDF gabungan tidak dapat disimpan karena memori browser yang tersedia tidak mencukupi. Coba gunakan lebih sedikit atau PDF yang lebih kecil.',
    mergePdfSaveError: 'PDF gabungan tidak dapat disimpan. File yang dipilih tetap tersedia; coba lagi atau gunakan lebih sedikit PDF.',
    mergePdfGenericError: 'Penggabungan PDF tidak dapat diselesaikan. File yang dipilih tetap tersedia; pastikan setiap PDF dapat dibaca lalu coba lagi.',
  },
  vi: {
    previewBtn: 'Xem trước',
    previewThisFile: 'Xem trước tệp này',
    previewProcessedFile: 'Xem trước tệp đã xử lý',
    mergePdfNoFilesError: 'Hãy chọn ít nhất một tệp PDF trước khi gộp.',
    mergePdfUnreadableFileError: 'Không thể đọc tệp "{fileName}" dưới dạng PDF có thể sử dụng. Tệp có thể bị hỏng, chưa hoàn chỉnh, rỗng hoặc được bảo vệ bằng mật khẩu. Hãy xóa tệp hoặc chọn bản sao hợp lệ, đã mở khóa rồi thử lại.',
    mergePdfInputMemoryError: 'Không thể xử lý tệp "{fileName}" vì bộ nhớ trình duyệt hiện có không đủ. Hãy thử ít tệp PDF hơn hoặc tệp nhỏ hơn, hoặc đóng các tab khác rồi thử lại.',
    mergePdfUnsupportedFormError: 'Tệp "{fileName}" chứa dữ liệu biểu mẫu tương tác không thể được bảo toàn an toàn. Không có tệp đã gộp nào được tạo. Hãy xuất bản sao PDF tương thích rồi thử lại.',
    mergePdfXfaError: 'Tệp "{fileName}" chứa biểu mẫu XFA động mà Merge PDF không thể bảo toàn an toàn. Hãy xuất bản sao PDF tĩnh rồi thử lại.',
    mergePdfSignatureError: 'Tệp "{fileName}" có chữ ký số. Việc gộp làm thay đổi dữ liệu đã ký nên chữ ký không thể còn hợp lệ. Hãy dùng bản sao không có chữ ký.',
    mergePdfSaveMemoryError: 'Không thể lưu PDF đã gộp vì bộ nhớ trình duyệt hiện có không đủ. Hãy thử ít tệp PDF hơn hoặc tệp nhỏ hơn rồi thử lại.',
    mergePdfSaveError: 'Không thể lưu PDF đã gộp. Các tệp đã chọn vẫn còn; hãy thử lại hoặc dùng ít tệp PDF hơn.',
    mergePdfGenericError: 'Không thể hoàn tất việc gộp PDF. Các tệp đã chọn vẫn còn; hãy kiểm tra từng PDF có thể đọc được rồi thử lại.',
  },
};

export const translations: Record<Language, TranslationDict> = Object.fromEntries(
  (Object.keys(rawTranslations) as Language[]).map((language) => {
    const privacyCopy = PRIVACY_UI_COPY[language];
    return [
      language,
      {
        ...rawTranslations[language],
        ...MERGE_PDF_UI_COPY[language],
        inBrowserBadge: privacyCopy.homePrivacyBadge,
        trustSubtitle: privacyCopy.footerAbout,
        trust1: privacyCopy.inBrowserShort,
        trust1Sub: privacyCopy.homePrivacyBadge,
        trust2: privacyCopy.browserMemoryLabel,
        trust2Sub: privacyCopy.memoryHandlingNote,
        drawerSubtitle: privacyCopy.inBrowserShort,
        footerAbout: privacyCopy.footerAbout,
        zeroServerGuarantee: privacyCopy.homePrivacyBadge,
        zeroServerUploads: privacyCopy.inBrowserShort,
      },
    ];
  }),
) as Record<Language, TranslationDict>;

// Multilingual catalog titles & descriptions
export const TOOL_TRANSLATIONS: Record<string, Partial<Record<Language, { title: string; description: string; seoTitle?: string }>>> = {
  merge: {
    en: { title: 'Merge PDF', description: 'Process one or more PDFs. Create a separate copy from one PDF, or combine multiple PDFs in your chosen file order.' },
    ur: { title: 'PDF مرج کریں (جوڑیں)', description: 'ایک یا زیادہ PDFs پراسیس کریں۔ ایک PDF سے الگ نقل بنائیں یا متعدد PDFs کو اپنی منتخب کردہ فائل ترتیب میں جوڑیں۔' },
    hi: { title: 'PDF मर्ज करें', description: 'एक या अधिक PDF प्रोसेस करें। एक PDF से अलग कॉपी बनाएं या कई PDF को चुने हुए फ़ाइल क्रम में जोड़ें।' },
    ar: { title: 'دمج PDF', description: 'عالج ملف PDF واحدًا أو أكثر. أنشئ نسخة منفصلة من ملف واحد، أو ادمج عدة ملفات PDF وفق ترتيب الملفات الذي تختاره.' },
    zh: { title: '合并 PDF', description: '处理一个或多个 PDF 文件。单个 PDF 会生成单独副本；多个 PDF 可按你选择的文件顺序合并。' },
    ja: { title: 'PDF結合', description: '1つ以上のPDFを処理できます。1つのPDFからは別のコピーを作成し、複数のPDFは選択したファイル順で結合します。' },
    tl: { title: 'Pagsamahin ang PDF', description: 'Magproseso ng isa o higit pang PDF. Gumawa ng hiwalay na kopya mula sa isang PDF, o pagsamahin ang maraming PDF ayon sa pinili mong pagkakasunod-sunod ng mga file.' },
    de: { title: 'PDF zusammenfügen', description: 'Verarbeiten Sie eine oder mehrere PDFs. Erstellen Sie aus einer PDF eine separate Kopie oder fügen Sie mehrere PDFs in der gewählten Dateireihenfolge zusammen.' },
    fr: { title: 'Fusionner PDF', description: 'Traitez un ou plusieurs PDF. Créez une copie distincte à partir d’un PDF ou réunissez plusieurs PDF dans l’ordre de fichiers choisi.' },
    es: { title: 'Unir PDF', description: 'Procesa uno o varios PDF. Crea una copia independiente a partir de un PDF o combina varios PDF en el orden de archivos que elijas.' },
    it: { title: 'Unisci PDF', description: 'Elabora uno o più PDF. Crea una copia separata da un PDF oppure unisci più PDF nell’ordine di file scelto.' },
    no: { title: 'Slå sammen PDF', description: 'Behandle én eller flere PDF-filer. Opprett en separat kopi fra én PDF, eller slå sammen flere PDF-filer i ønsket filrekkefølge.' },
    ru: { title: 'Объединить PDF', description: 'Обрабатывайте один или несколько PDF-файлов. Создайте отдельную копию из одного PDF или объедините несколько PDF-файлов в выбранном порядке файлов.' },
    pt: { title: 'Juntar PDF', description: 'Processe um ou mais PDFs. Crie uma cópia separada a partir de um PDF ou combine vários PDFs na ordem de arquivos escolhida.' },
    ko: { title: 'PDF 병합', description: 'PDF 파일을 한 개 이상 처리하세요. PDF 한 개는 별도 사본으로 만들고, 여러 PDF는 원하는 파일 순서로 병합할 수 있습니다.' },
    tr: { title: 'PDF Birleştir', description: 'Bir veya daha fazla PDF dosyasını işleyin. Tek bir dosyadan ayrı bir kopya oluşturun veya birden fazla PDF dosyasını seçtiğiniz dosya sırasıyla birleştirin.' },
    nl: { title: 'PDF Samenvoegen', description: 'Verwerk één of meer PDF-bestanden. Maak een aparte kopie van één PDF of voeg meerdere PDF’s samen in de gewenste bestandsvolgorde.' },
    pl: { title: 'Połącz PDF', description: 'Przetwarzaj jeden lub więcej plików PDF. Utwórz osobną kopię z jednego pliku albo połącz kilka plików PDF w wybranej kolejności.' },
    sv: { title: 'Slå ihop PDF', description: 'Behandla en eller flera PDF-filer. Skapa en separat kopia från en PDF eller slå ihop flera PDF-filer i vald filordning.' },
    id: { title: 'Gabungkan PDF', description: 'Proses satu atau beberapa PDF. Buat salinan terpisah dari satu PDF, atau gabungkan beberapa PDF sesuai urutan file yang Anda pilih.' },
    vi: { title: 'Gộp PDF', description: 'Xử lý một hoặc nhiều tệp PDF. Tạo bản sao riêng từ một tệp PDF hoặc gộp nhiều tệp PDF theo thứ tự tệp bạn chọn.' },
  },
  split: {
    en: { title: 'Split PDF', description: 'Separate pages or extract specific page ranges into standalone PDF files.' },
    ur: { title: 'PDF تقسیم کریں (علیحدہ کریں)', description: 'مخصوص صفحات کو الگ کریں یا صفحات کی رینج نکال کر نئی فائل بنائیں۔' },
    hi: { title: 'PDF विभाजित करें', description: 'विशिष्ट पृष्ठों को अलग करें या रेंज निकाल कर नई PDF बनाएं।' },
    ar: { title: 'تقسيم PDF', description: 'فصل الصفحات أو استخراج نطاقات صفحات محددة في ملفات PDF مستقلة.' },
    zh: { title: '拆分 PDF', description: '分离页面或提取指定页码范围以生成独立的 PDF 文件。' },
    ja: { title: 'PDF分割', description: '特定のページ範囲を抽出して新しい個別PDFファイルを生成します。' },
    tl: { title: 'Hatiin ang PDF', description: 'Ihiwalay ang mga pahina o kumuha ng partikular na saklaw ng pahina.' },
    de: { title: 'PDF teilen', description: 'Trennen Sie einzelne Seiten oder Bereiche in separate PDFs.' },
    fr: { title: 'Diviser PDF', description: 'Extrayez des pages ou des plages de pages en fichiers indépendants.' },
    es: { title: 'Dividir PDF', seoTitle: 'Dividir PDF por páginas y rangos', description: 'Separa páginas o extrae rangos específicos en archivos PDF independientes.' },
    it: { title: 'Dividi PDF', description: 'Estrai pagine singole o intervalli specifici in file PDF separati.' },
    no: { title: 'Del opp PDF', description: 'Skill sider eller trekk ut bestemte sideområder til egne filer.' },
    ru: { title: 'Разделить PDF', description: 'Извлекайте отдельные страницы или диапазоны в новые файлы PDF.' },
    pt: { title: 'Dividir PDF', seoTitle: 'Dividir PDF por páginas ou intervalos', description: 'Extraia páginas ou intervalos específicos em novos arquivos PDF.' },
    ko: { title: 'PDF 분할', description: '원하는 페이지 범위만 추출하여 별도의 독립된 PDF로 나눕니다.' },
    tr: { title: 'PDF Böl', description: 'Sayfaları ayırın veya belirli sayfa aralıklarını bağımsız dosyalara çıkarın.' },
    nl: { title: 'PDF Splitsen', description: 'Splits PDF-pagina’s of haal specifieke paginabereiken op naar aparte bestanden.' },
    pl: { title: 'Podziel PDF', description: 'Wyodrębnij wybrane strony lub zakresy do osobnych plików PDF.' },
    sv: { title: 'Dela upp PDF', description: 'Separera sidor eller extrahera specifika sidintervall till fristående filer.' },
    id: { title: 'Pisahkan PDF', description: 'Pisahkan halaman atau ekstrak rentang halaman tertentu ke file mandiri.' },
    vi: { title: 'Tách PDF', description: 'Tách các trang hoặc trích xuất phạm vi trang cụ thể thành các tệp riêng biệt.' },
  },
  compress: {
    en: { title: 'Compress PDF', description: 'Reduce PDF file size in your browser with adjustable compression and visual quality.' },
    ur: { title: 'PDF سائز کم کریں (کمپریس)', description: 'PDF کا سائز کم کریں؛ کمی اصل فائل اور منتخب سیٹنگ پر منحصر ہے۔ محفوظ کرنے سے پہلے متن اور تصاویر کی وضاحت چیک کریں۔' },
    hi: { title: 'PDF कंप्रेस करें', description: 'ब्राउज़र में PDF का आकार कम करें; परिणाम मूल फ़ाइल और चुनी गई सेटिंग पर निर्भर करता है।' },
    ar: { title: 'ضغط PDF', description: 'قلّل حجم PDF في المتصفح؛ تعتمد النتيجة والجودة على الملف الأصلي والإعدادات المختارة.' },
    zh: { title: '压缩 PDF', description: '在浏览器中压缩 PDF；缩减效果和图像质量取决于原文件与所选设置，处理后请检查结果。' },
    ja: { title: 'PDF圧縮', description: 'ブラウザーでPDFのサイズを圧縮します。削減量や画質は元ファイルと設定によって異なるため、保存前に結果を確認してください。' },
    tl: { title: 'I-compress ang PDF', description: 'Bawasan ang laki ng PDF sa browser; nakadepende ang resulta at kalidad ng larawan sa orihinal na file at napiling setting.' },
    de: { title: 'PDF komprimieren', description: 'Reduzieren Sie die PDF-Dateigröße im Browser. Ergebnis und Bildqualität hängen von der Quelldatei und der Einstellung ab.' },
    fr: { title: 'Compresser PDF', description: 'Réduisez la taille du PDF dans le navigateur ; le résultat et la qualité dépendent du fichier d’origine et des réglages choisis.' },
    es: { title: 'Comprimir PDF', seoTitle: 'Comprimir PDF para reducir el tamaño', description: 'Reduce el tamaño del PDF en el navegador; el resultado y la calidad dependen del archivo original y de las opciones elegidas.' },
    it: { title: 'Comprimi PDF', description: 'Riduci le dimensioni del PDF nel browser; il risultato e la qualità dipendono dal file originale e dalle impostazioni scelte.' },
    no: { title: 'Komprimer PDF', description: 'Reduser PDF-filstørrelsen i nettleseren; resultat og bildekvalitet avhenger av originalfilen og innstillingen.' },
    ru: { title: 'Сжать PDF', description: 'Уменьшайте размер PDF в браузере; результат и качество изображений зависят от исходного файла и выбранной настройки.' },
    pt: { title: 'Comprimir PDF', seoTitle: 'Comprimir PDF para reduzir o tamanho', description: 'Reduza o tamanho do PDF no navegador; o resultado e a qualidade dependem do arquivo original e das opções escolhidas.' },
    ko: { title: 'PDF 압축', description: '브라우저에서 PDF 용량을 줄이세요. 결과와 이미지 품질은 원본 파일 및 설정에 따라 달라지므로 처리 후 확인하세요.' },
    tr: { title: 'PDF Sıkıştır', description: 'PDF boyutunu tarayıcıda azaltın; sonuç ve görsel kalitesi kaynak dosyaya ve seçilen ayara bağlıdır.' },
    nl: { title: 'PDF Comprimeren', description: 'Verklein de PDF-bestandsgrootte in uw browser; resultaat en beeldkwaliteit hangen af van het bronbestand en de gekozen instellingen.' },
    pl: { title: 'Kompresuj PDF', description: 'Zmniejsz rozmiar pliku PDF w przeglądarce; wynik i jakość obrazu zależą od pliku źródłowego i wybranych ustawień.' },
    sv: { title: 'Komprimera PDF', description: 'Minska PDF-filstorleken i webbläsaren; resultat och bildkvalitet beror på källfilen och valda inställningar.' },
    id: { title: 'Kompres PDF', description: 'Kurangi ukuran file PDF di browser; hasil dan kualitas gambar bergantung pada file sumber dan pengaturan yang dipilih.' },
    vi: { title: 'Nén PDF', description: 'Giảm kích thước PDF trong trình duyệt; kết quả và chất lượng hình ảnh phụ thuộc vào tệp nguồn và cài đặt được chọn.' },
  },
  'jpg-to-pdf': {
    en: { title: 'Image to PDF', description: 'Convert multiple image files (JPG, PNG, WebP) into a single clean PDF.' },
    ur: { title: 'تصاویر سے PDF بنائیں', description: 'JPG، PNG یا WebP تصاویر کو ترتیب دے کر PDF صفحات بنائیں؛ محفوظ کرنے سے پہلے صفحے کا رخ، مارجن اور فٹ چیک کریں۔' },
    hi: { title: 'इमेज से PDF', description: 'JPG, PNG और WebP छवियों को एक स्वच्छ PDF फ़ाइल में बदलें।' },
    ar: { title: 'تحويل الصور إلى PDF', description: 'تحويل صور متعددة (JPG, PNG, WebP) إلى ملف PDF نظيف وموحد.' },
    zh: { title: '图片转 PDF', description: '将多张 JPG、PNG、WebP 图片转换为一份干净的高清 PDF。' },
    ja: { title: '画像をPDFに変換', description: 'JPG、PNG、WebP画像をPDFページにまとめます。保存前に画像の順序、ページの向き、余白、配置を確認してください。' },
    tl: { title: 'Larawan patungong PDF', description: 'I-convert ang mga larawan (JPG, PNG, WebP) sa isang malinis na PDF file.' },
    de: { title: 'Bilder in PDF umwandeln', description: 'Wandeln Sie JPG-, PNG- oder WebP-Bilder in PDF-Seiten um. Prüfen Sie Reihenfolge, Ausrichtung, Ränder und Bildausschnitt.' },
    fr: { title: 'Images en PDF', description: 'Convertissez des images JPG, PNG et WebP en un document PDF unique.' },
    es: { title: 'Imagen a PDF', description: 'Convierte múltiples imágenes JPG, PNG y WebP en un archivo PDF estructurado.' },
    it: { title: 'Immagini in PDF', description: 'Converti più immagini JPG, PNG e WebP in un unico file PDF ordinato.' },
    no: { title: 'Bilder til PDF', description: 'Konverter flere bildefiler (JPG, PNG, WebP) til én ren PDF-fil.' },
    ru: { title: 'Изображения в PDF', description: 'Преобразуйте изображения JPG, PNG и WebP в единый PDF-документ.' },
    pt: { title: 'Imagem para PDF', description: 'Converta fotos JPG, PNG e WebP em um documento PDF unificado.' },
    ko: { title: '이미지를 PDF로 변환', description: 'JPG, PNG, WebP 등 여러 이미지 파일을 깔끔한 단일 PDF로 변환합니다.' },
    tr: { title: 'Görseli PDF Yap', description: 'JPG, PNG ve WebP görsellerini tek bir PDF belgesine dönüştürün.' },
    nl: { title: 'Afbeeldingen naar PDF', description: 'Converteer meerdere afbeeldingen (JPG, PNG, WebP) naar één PDF-bestand.' },
    pl: { title: 'Obrazy do PDF', description: 'Konwertuj obrazy (JPG, PNG, WebP) w jeden przejrzysty plik PDF.' },
    sv: { title: 'Bilder till PDF', description: 'Konvertera flera bildfiler (JPG, PNG, WebP) till en enhetlig PDF-fil.' },
    id: { title: 'Gambar ke PDF', description: 'Konversi beberapa file gambar (JPG, PNG, WebP) menjadi satu file PDF yang rapi.' },
    vi: { title: 'Hình ảnh sang PDF', description: 'Chuyển đổi nhiều tệp hình ảnh (JPG, PNG, WebP) thành một tệp PDF duy nhất.' },
  },
  rotate: {
    en: { title: 'Rotate PDF', description: 'Rotate individual pages or the entire document clockwise and counter-clockwise.' },
    ur: { title: 'PDF گھمائیں (روٹیٹ)', description: 'صفحات یا پوری دستاویز کو گھڑی کے رخ یا الٹے رخ 90°، 180° یا 270° گھمائیں۔' },
    hi: { title: 'PDF घुमाएँ (Rotate)', description: 'व्यक्तिगत पृष्ठों या पूरे दस्तावेज़ को 90°, 180° या 270° पर घुमाएँ।' },
    ar: { title: 'تدوير PDF', description: 'تدوير الصفحات الفردية أو المستند بالكامل في اتجاه أو عكس عقارب الساعة.' },
    zh: { title: '旋转 PDF', description: '顺时针或逆时针旋转单页或整份文档（90°、180°、270°）。' },
    ja: { title: 'PDF回転', description: '指定ページまたはドキュメント全体を90度単位で回転させます。' },
    tl: { title: 'Paikutin ang PDF', description: 'Paikutin ang mga indibidwal na pahina o ang buong dokumento.' },
    de: { title: 'PDF drehen', description: 'Drehen Sie einzelne Seiten oder das gesamte Dokument um 90°, 180° oder 270°.' },
    fr: { title: 'Faire pivoter PDF', description: 'Pivotez des pages individuelles ou le document entier de 90°, 180° ou 270°.' },
    es: { title: 'Rotar PDF', description: 'Gira páginas individuales o el documento completo en 90°, 180° o 270°.' },
    it: { title: 'Ruota PDF', description: 'Ruota le singole pagine o l’intero documento in senso orario o antiorario.' },
    no: { title: 'Roter PDF', description: 'Roter enkeltsider eller hele dokumentet med eller mot klokken.' },
    ru: { title: 'Повернуть PDF', description: 'Поворачивайте отдельные страницы или весь документ на 90°, 180° или 270°.' },
    pt: { title: 'Girar PDF', description: 'Gire páginas individuais ou todo o documento em 90°, 180° ou 270°.' },
    ko: { title: 'PDF 회전', description: '개별 페이지 또는 전체 문서를 시계/반시계 방향으로 90°, 180° 회전합니다.' },
    tr: { title: 'PDF Döndür', description: 'Tek tek sayfaları veya tüm belgeyi saat yönünde veya tersine döndürün.' },
    nl: { title: 'PDF Draaien', description: 'Roteer afzonderlijke PDF-pagina’s of het volledige PDF-document.' },
    pl: { title: 'Obróć PDF', description: 'Obracaj pojedyncze strony lub cały dokument zgodnie lub przeciwnie do ruchu wskazówek zegara.' },
    sv: { title: 'Rotera PDF', description: 'Rotera enskilda sidor eller hela dokumentet medurs eller moturs.' },
    id: { title: 'Putar PDF', description: 'Putar halaman individual atau seluruh dokumen searah atau berlawanan arah jarum jam.' },
    vi: { title: 'Xoay PDF', description: 'Xoay từng trang hoặc toàn bộ tài liệu theo chiều kim đồng hồ hoặc ngược lại.' },
  },
  watermark: {
    en: { title: 'Watermark PDF', description: 'Stamp custom text or confidential marks with custom angle, size, and opacity.' },
    ur: { title: 'واٹر مارک لگائیں', description: 'اپنی دستاویز پر کسٹم متن یا لوگو، زاویہ، سائز اور شفافیت کے ساتھ واٹر مارک لگائیں۔' },
    hi: { title: 'वाटरमार्क जोड़ें', description: 'कस्टम टेक्स्ट, गोपनीयता चिह्न, पारदर्शिता और कोण के साथ वाटरमार्क जोड़ें।' },
    ar: { title: 'إضافة علامة مائية', description: 'إضافة نص أو ختم سري بزاوية وحجم وشفافية قابلة للتخصيص.' },
    zh: { title: '添加水印', description: '在 PDF 上盖上自定义文本或机密水印，支持角度、透明度调节。' },
    ja: { title: '透かし追加', description: '任意のテキスト、透過度、角度を設定して機密透かしをスタンプします。' },
    tl: { title: 'Watermark ng PDF', description: 'Maglagay ng pasadyang teksto o kumpidensyal na tatak na may anggulo at laki.' },
    de: { title: 'PDF Wasserzeichen', description: 'Fügen Sie Wasserzeichen mit Deckkraft, Schriftgröße und Winkel hinzu.' },
    fr: { title: 'Filigrane PDF', description: 'Ajoutez un filigrane personnalisé avec angle, taille et opacité réglables.' },
    es: { title: 'Marca de agua', description: 'Agrega texto personalizado o marcas confidenciales con ángulo y opacidad.' },
    it: { title: 'Filigrana PDF', description: 'Aggiungi testo o timbri riservati con angolazione e trasparenza regolabili.' },
    no: { title: 'Vannmerke PDF', description: 'Legg til tilpasset tekst eller stempel med vinkel, størrelse og gjennomsiktighet.' },
    ru: { title: 'Водяной знак PDF', description: 'Добавляйте текст, угол наклона и прозрачность водяных знаков.' },
    pt: { title: 'Marca d’água', description: 'Estampe texto confidencial com ângulo, tamanho e opacidade personalizados.' },
    ko: { title: '워터마크 추가', description: '각도, 크기, 투명도를 조절하여 원하는 텍스트 워터마크를 각인합니다.' },
    tr: { title: 'Filigran Ekle', description: 'Özel açı, boyut ve şeffaflık ile metin veya gizlilik filigranı ekleyin.' },
    nl: { title: 'Watermerk toevoegen', description: 'Voeg aangepaste tekst of stempel toe met instelbare hoek, grootte en dekking.' },
    pl: { title: 'Znak wodny PDF', description: 'Dodaj własny tekst lub poufny znak z regulowanym kątem, rozmiarem i kryciem.' },
    sv: { title: 'Vattenmärk PDF', description: 'Stämpla anpassad text med justerbar vinkel, storlek och opacitet.' },
    id: { title: 'Watermark PDF', description: 'Tambahkan teks khusus atau tanda rahasia dengan sudut, ukuran, dan transparansi.' },
    vi: { title: 'Đóng dấu Watermark', description: 'Thêm văn bản tùy chỉnh hoặc con dấu bảo mật với góc nghiêng, kích thước và độ mờ.' },
  },
  'page-numbers': {
    en: { title: 'Page Numbers', description: 'Insert dynamic page numbering (e.g. Page 1 of N) with customizable placement.' },
    ur: { title: 'صفحہ نمبر شامل کریں', description: 'دستاویز کے ہر صفحے پر خوبصورت اور خودکار صفحہ نمبر (Page 1 of N) لگائیں۔' },
    hi: { title: 'पृष्ठ संख्या जोड़ें', description: 'कस्टमाइज़ेबल प्लेसमेंट के साथ गतिशील पृष्ठ संख्या (Page 1 of N) डालें।' },
    ar: { title: 'أرقام الصفحات', description: 'إدراج ترقيم ديناميكي للصفحات (الصفحة 1 من N) مع موضع قابل للتخصيص.' },
    zh: { title: '添加页码', description: '在页眉或页脚插入动态页码（如 Page 1 of N），支持自定义对齐。' },
    ja: { title: 'ページ番号挿入', description: 'ヘッダーやフッターに動的なページ番号（Page 1 of N）を追加します。' },
    tl: { title: 'Numero ng Pahina', description: 'Maglagay ng dynamic na numero ng pahina (Pahina 1 ng N).' },
    de: { title: 'Seitenzahlen', description: 'Fügen Sie dynamische Seitennummerierungen mit anpassbarer Position ein.' },
    fr: { title: 'Numéros de page', description: 'Insérez une numérotation dynamique avec alignement personnalisable.' },
    es: { title: 'Números de página', description: 'Inserta paginación dinámica (ej. Página 1 de N) con posición ajustable.' },
    it: { title: 'Numeri di pagina', description: 'Inserisci la numerazione dinamica delle pagine con posizione a scelta.' },
    no: { title: 'Sidetall', description: 'Sett inn dynamisk sidenummerering (Side 1 av N) med egendefinert plassering.' },
    ru: { title: 'Номера страниц', description: 'Вставляйте динамическую нумерацию (Страница 1 из N) с выбором позиции.' },
    pt: { title: 'Números de Página', description: 'Insira numeração dinâmica de páginas com posicionamento flexível.' },
    ko: { title: '페이지 번호 추가', description: '원하는 위치(상단/하단)에 동적 페이지 번호(Page 1 of N)를 삽입합니다.' },
    tr: { title: 'Sayfa Numaraları', description: 'Özel hizalama seçenekleriyle dinamik sayfa numaralandırması ekleyin.' },
    nl: { title: 'Paginanummers', description: 'Voeg dynamische paginanummering (Pagina 1 van N) toe met aanpasbare positie.' },
    pl: { title: 'Numeracja stron', description: 'Wstaw dynamiczną numerację stron (Strona 1 z N) w wybranym miejscu.' },
    sv: { title: 'Sidnummer', description: 'Infoga dynamisk sidnumrering (Sida 1 av N) med anpassningsbar placering.' },
    id: { title: 'Nomor Halaman', description: 'Sisipkan penomoran halaman dinamis (Halaman 1 dari N) dengan posisi pilihan.' },
    vi: { title: 'Đánh số trang', description: 'Chèn số trang động (Trang 1 / N) với vị trí tùy chỉnh theo ý bạn.' },
  },
  organize: {
    en: { title: 'Organize Pages', description: 'Visually sort, reorder, swap, or delete unwanted pages in any PDF file.' },
    ur: { title: 'صفحات ترتیب دیں (آرگنائز)', description: 'صفحات کی ترتیب تبدیل کریں، آگے پیچھے کریں یا غیر ضروری صفحات کو ڈیلیٹ کریں۔' },
    hi: { title: 'पृष्ठ व्यवस्थित करें', description: 'PDF के पन्नों को क्रमबद्ध करें, आगे-पीछे करें या अवांछित पन्ने हटाएं।' },
    ar: { title: 'تنظيم الصفحات', description: 'ترتيب الصفحات بصرياً، تغيير موضعها أو حذف الصفحات غير المرغوبة.' },
    zh: { title: '组织页面', description: '以可视化网格重新排序、调换或删除 PDF 中不需要的页面。' },
    ja: { title: 'ページ整理・並替', description: 'ドラッグ＆ドロップでページの並び替え、削除、回転を視覚的に行います。' },
    tl: { title: 'Ayusin ang mga Pahina', description: 'Ayusin, ilipat, o tanggalin ang mga hindi gustong pahina sa anumang PDF.' },
    de: { title: 'Seiten organisieren', description: 'Seiten visuell neu ordnen, vertauschen oder unerwünschte löschen.' },
    fr: { title: 'Organiser les pages', description: 'Triez, réorganisez, échangez ou supprimez visuellement des pages.' },
    es: { title: 'Organizar páginas', description: 'Ordena, reorganiza, intercambia o elimina páginas no deseadas visualmente.' },
    it: { title: 'Organizza pagine', description: 'Riordina visivamente, scambia o elimina le pagine indesiderate del PDF.' },
    no: { title: 'Organiser sider', description: 'Sorter, omorganiser eller slett uønskede sider i PDF-dokumentet.' },
    ru: { title: 'Организация страниц', description: 'Визуально меняйте порядок, вращайте или удаляйте лишние страницы PDF.' },
    pt: { title: 'Organizar Páginas', description: 'Ordene, reposicione, troque ou exclua páginas indesejadas visualmente.' },
    ko: { title: '페이지 정렬 및 관리', description: '그리드 화면에서 마우스로 순서를 바꾸고 불필요한 페이지를 손쉽게 삭제합니다.' },
    tr: { title: 'Sayfaları Düzenle', description: 'Sayfaları görsel olarak sıralayın, yeniden düzenleyin veya silin.' },
    nl: { title: 'Pagina’s Organiseren', description: 'Sorteer, herschik of verwijder ongewenste PDF-pagina’s.' },
    pl: { title: 'Organizuj strony', description: 'Wizualnie sortuj, zmieniaj kolejność lub usuwaj niepotrzebne strony.' },
    sv: { title: 'Organisera sidor', description: 'Sortera, arrangera om eller ta bort oönskade sidor i PDF-filen.' },
    id: { title: 'Atur Halaman', description: 'Urutkan ulang, pindahkan, atau hapus halaman yang tidak diinginkan secara visual.' },
    vi: { title: 'Sắp xếp trang', description: 'Sắp xếp, thay đổi thứ tự hoặc xóa các trang không mong muốn một cách trực quan.' },
  },
  'edit-metadata': {
    en: { title: 'Edit PDF Metadata', description: 'Inspect or update six supported PDF properties, or clear these fields from a saved copy.' },
    ur: { title: 'PDF میٹا ڈیٹا تبدیل کریں', description: 'دستاویز کے مصنف، عنوان، موضوع، کی ورڈز اور تخلیق کار کی تفصیلات تبدیل کریں۔' },
    hi: { title: 'PDF मेटाडेटा एडिट करें', description: 'ब्राउज़र में लेखक, शीर्षक, विषय, कीवर्ड और एप्लिकेशन विवरण बदलें।' },
    ar: { title: 'تعديل البيانات الوصفية', description: 'عرض وتعديل المؤلف والعنوان والموضوع والكلمات المفتاحية في المتصفح.' },
    zh: { title: '编辑 PDF 元数据', description: '在浏览器中查看和修改作者、标题、主题、关键词及创建程序等元属性。' },
    ja: { title: 'PDFメタデータ編集', description: '著者名、タイトル、件名、キーワード、作成元プログラムを直接編集します。' },
    tl: { title: 'I-edit ang Metadata ng PDF', description: 'Tingnan at baguhin ang May-akda, Pamagat, Paksa, at Mga Keyword.' },
    de: { title: 'PDF Metadaten bearbeiten', description: 'Autor, Titel, Thema, Schlüsselwörter und Ersteller im Browser anpassen.' },
    fr: { title: 'Modifier les métadonnées', description: 'Consultez et modifiez l’auteur, le titre, le sujet et les mots-clés du PDF.' },
    es: { title: 'Editar metadatos PDF', description: 'Visualiza y modifica autor, título, asunto, palabras clave y creador.' },
    it: { title: 'Modifica metadati PDF', description: 'Visualizza e modifica autore, titolo, oggetto, parole chiave e creatore.' },
    no: { title: 'Rediger metadata', description: 'Vis og endre forfatter, tittel, emne, nøkkelord og produsent.' },
    ru: { title: 'Редактор метаданных', description: 'Просматривайте и изменяйте автора, заголовок, тему, ключевые слова и софт.' },
    pt: { title: 'Editar Metadados PDF', description: 'Veja e modifique propriedades de Autor, Título, Assunto e Criador.' },
    ko: { title: 'PDF 메타데이터 편집', description: '브라우저에서 작성자, 제목, 주제, 키워드, 생성 프로그램 속성을 편집합니다.' },
    tr: { title: 'PDF Meta Verilerini Düzenle', description: 'Yazar, Başlık, Konu, Anahtar Kelimeler ve Oluşturucu özelliklerini değiştirin.' },
    nl: { title: 'Metadata Bewerken', description: 'Bekijk en wijzig auteur, titel, onderwerp en trefwoorden van het PDF-bestand.' },
    pl: { title: 'Edytuj metadane PDF', description: 'Przeglądaj i modyfikuj autora, tytuł, temat, słowa kluczowe i twórcę.' },
    sv: { title: 'Redigera metadata', description: 'Visa och ändra författare, titel, ämne och nyckelord i webbläsaren.' },
    id: { title: 'Edit Metadata PDF', description: 'Lihat dan ubah Penulis, Judul, Subjek, Kata Kunci, dan Pembuat dokumen.' },
    vi: { title: 'Sửa siêu dữ liệu PDF', description: 'Xem và sửa đổi Tác giả, Tiêu đề, Chủ đề và Từ khóa của tài liệu.' },
  },
  metadata: {
    en: { title: 'PDF Analysis & Page Counter', description: 'Count pages, inspect dimensions, and transcribe text using in-browser OCR.' },
    ur: { title: 'PDF تجزیہ اور پیج کاؤنٹر', description: 'کل صفحات گنیں، ڈائمینشنز معلوم کریں اور OCR کے ذریعے متن نکالیں۔' },
    hi: { title: 'PDF विश्लेषण और पेज काउंटर', description: 'पृष्ठों की गिनती करें, आयाम जांचें और इन-ब्राउज़र OCR से टेक्स्ट निकालें।' },
    ar: { title: 'تحليل PDF وعداد الصفحات', description: 'عد الصفحات وفحص الأبعاد واستخراج النصوص باستخدام OCR المحلي.' },
    zh: { title: 'PDF 深度分析与计数', description: '统计页数、检查页面尺寸并利用本地 OCR 引擎提取文字。' },
    ja: { title: 'PDF詳細解析・ページ数', description: '総ページ数や用紙サイズを解析し、OCRで文字を抽出します。' },
    tl: { title: 'Pagsusuri ng PDF at Counter', description: 'Bilangin ang mga pahina, suriin ang dimensyon at mag-extract ng teksto via OCR.' },
    de: { title: 'PDF Analyse & Seitenzähler', description: 'Seiten zählen, Abmessungen prüfen und OCR-Texterkennung nutzen.' },
    fr: { title: 'Analyse et compteur PDF', description: 'Comptez les pages, inspectez les dimensions et extrayez le texte via OCR.' },
    es: { title: 'Análisis y contador de páginas', description: 'Cuenta páginas, analiza dimensiones y extrae texto con OCR en el navegador.' },
    it: { title: 'Analisi PDF e conteggio pagine', description: 'Conta le pagine, controlla le dimensioni ed estrai il testo con OCR locale.' },
    no: { title: 'PDF-analyse og sideteller', description: 'Tell sider, kontroller dimensjoner og trekk ut tekst med lokal OCR.' },
    ru: { title: 'Анализ и счетчик страниц', description: 'Подсчет страниц, проверка размеров и распознавание текста через OCR.' },
    pt: { title: 'Análise e Contador de Páginas', description: 'Conte páginas, inspecione dimensões e extraia texto via OCR no navegador.' },
    ko: { title: 'PDF 문서 분석 및 카운터', description: '페이지 수 산출, 치수 검사 및 브라우저 OCR을 통한 텍스트 추출.' },
    tr: { title: 'PDF Analizi ve Sayfa Sayacı', description: 'Sayfaları sayın, boyutları inceleyin ve tarayıcı içi OCR ile metin çıkarın.' },
    nl: { title: 'PDF Analyse & Paginateller', description: 'Tel PDF-pagina’s, inspecteer afmetingen en extraheer tekst met OCR in de browser.' },
    pl: { title: 'Analiza PDF i licznik stron', description: 'Licz strony, sprawdzaj wymiary i wyodrębniaj tekst za pomocą OCR.' },
    sv: { title: 'PDF-analys & sidräknare', description: 'Räkna sidor, inspektera mått och extrahera text med inbyggd OCR.' },
    id: { title: 'Analisis PDF & Penghitung Halaman', description: 'Hitung halaman, periksa dimensi, dan ekstrak teks menggunakan OCR.' },
    vi: { title: 'Phân tích PDF & Đếm trang', description: 'Đếm số trang, kiểm tra kích thước và trích xuất văn bản bằng OCR.' },
  },
  protect: {
    en: { title: 'Protect PDF', description: 'Password-protect and encrypt PDF files using browser-based Web Crypto AES-256-GCM.' },
    ur: { title: 'ClickPDF فارمیٹ میں PDF محفوظ کریں', description: 'PDF کو ClickPDF کے مخصوص AES-256-GCM فارمیٹ میں محفوظ کریں؛ کھولنے کے لیے ClickPDF Unlock اور مقررہ password درکار ہے۔' },
    hi: { title: 'PDF पासवर्ड सुरक्षा', description: 'Web Crypto AES-256-GCM का उपयोग करके पासवर्ड से PDF सुरक्षित करें।' },
    ar: { title: 'حماية PDF بكلمة مرور', description: 'حماية وتشفير ملفات PDF باستخدام Web Crypto AES-256-GCM القوي.' },
    zh: { title: '密码保护 PDF', description: '使用浏览器内置 Web Crypto AES-256-GCM 加密文档。' },
    ja: { title: 'ClickPDF形式でPDFを保護', description: 'PDFをClickPDF独自のAES-256-GCM形式で保護します。開くにはClickPDF Unlockと設定したパスワードが必要です。' },
    tl: { title: 'Protektahan ang PDF', description: 'I-encrypt at lagyan ng password ang PDF gamit ang Web Crypto AES-256-GCM.' },
    de: { title: 'PDF im ClickPDF-Format schützen', description: 'Schützen Sie PDFs im ClickPDF-eigenen AES-256-GCM-Format. Zum Öffnen benötigen Sie ClickPDF Unlock und das festgelegte Passwort.' },
    fr: { title: 'Protéger PDF', description: 'Protégez par mot de passe avec le chiffrement Web Crypto AES-256-GCM.' },
    es: { title: 'Proteger PDF', seoTitle: 'Proteger PDF con contraseña', description: 'Protege con contraseña y cifra archivos PDF usando Web Crypto AES-256-GCM.' },
    it: { title: 'Proteggi PDF', description: 'Proteggi con password e crittografa i PDF con Web Crypto AES-256-GCM.' },
    no: { title: 'Beskytt PDF med passord', description: 'Krypter PDF-filer sikkert med nettleserbasert Web Crypto AES-256-GCM.' },
    ru: { title: 'Защитить паролем', description: 'Шифруйте документы алгоритмом AES-256-GCM через Web Crypto API.' },
    pt: { title: 'Proteger PDF', seoTitle: 'Proteger PDF com senha', description: 'Proteja com senha usando criptografia Web Crypto AES-256-GCM no navegador.' },
    ko: { title: 'PDF 암호화 및 보호', description: 'Web Crypto AES-256-GCM 알고리즘으로 안전한 비밀번호 보안을 적용합니다.' },
    tr: { title: 'PDF Şifrele', description: 'Tarayıcı tabanlı Web Crypto AES-256-GCM ile PDF dosyalarını şifreleyin.' },
    nl: { title: 'PDF Beveiligen met Wachtwoord', description: 'Versleutel PDF-inhoud in het ClickPDF-formaat met AES-256-GCM; open het resultaat met ClickPDF Unlock en het juiste wachtwoord.' },
    pl: { title: 'Chroń PDF hasłem', description: 'Szyfruj PDF w formacie ClickPDF AES-256-GCM; wynik otworzysz w ClickPDF Unlock za pomocą prawidłowego hasła.' },
    sv: { title: 'Skydda PDF med lösenord', description: 'Kryptera PDF-innehåll i ClickPDF-format med AES-256-GCM; öppna resultatet med ClickPDF Unlock och rätt lösenord.' },
    id: { title: 'Lindungi PDF dengan Sandi', description: 'Kunci dan enkripsi dokumen PDF menggunakan Web Crypto AES-256-GCM.' },
    vi: { title: 'Bảo vệ PDF bằng mật khẩu', description: 'Mã hóa và bảo vệ tài liệu PDF bằng Web Crypto AES-256-GCM.' },
  },
  unlock: {
    en: { title: 'Unlock PDF', description: 'Decrypt and unlock Web Crypto password-protected PDF documents entirely in-browser.' },
    ur: { title: 'ClickPDF محفوظ فائل ان لاک کریں', description: 'ClickPDF Protect سے بنی فائل درست password سے کھولیں؛ عام password-protected PDFs کو یہ unlock نہیں کرتا۔' },
    hi: { title: 'PDF अनलॉक करें', description: 'ब्राउज़र में Web Crypto सुरक्षित PDF दस्तावेज़ों को डिक्रिप्ट करें।' },
    ar: { title: 'فتح قفل PDF', description: 'فك تشفير وفتح مستندات PDF المحمية بكلمة مرور مباشرة في المتصفح.' },
    zh: { title: '解密 PDF', description: '完全在本地浏览器中解密并解锁受 Web Crypto 保护的 PDF 文档。' },
    ja: { title: 'ClickPDF保護ファイルを開く', description: 'ClickPDF Protectで作成したファイルを正しいパスワードで開きます。一般的なPDFのパスワード解除には対応しません。' },
    tl: { title: 'I-unlock ang PDF', description: 'I-decrypt at buksan ang mga protektadong PDF file nang direkta sa browser.' },
    de: { title: 'ClickPDF-Datei entsperren', description: 'Öffnen Sie Dateien aus ClickPDF Protect mit dem richtigen Passwort. Beliebige passwortgeschützte Standard-PDFs werden nicht entsperrt.' },
    fr: { title: 'Déverrouiller PDF', description: 'Déchiffrez et déverrouillez les documents PDF protégés localement.' },
    es: { title: 'Desbloquear PDF', seoTitle: 'Desbloquear PDF protegido con contraseña', description: 'Descifra y desbloquea documentos protegidos enteramente en el navegador.' },
    it: { title: 'Sblocca PDF', description: 'Decrittografa e sblocca i documenti protetti da password direttamente nel browser.' },
    no: { title: 'Lås opp PDF', description: 'Dekrypter og lås opp passordbeskyttede PDF-filer direkte i nettleseren.' },
    ru: { title: 'Разблокировать PDF', description: 'Расшифровывайте и открывайте защищенные паролем документы в браузере.' },
    pt: { title: 'Desbloquear PDF', seoTitle: 'Desbloquear PDF protegido por senha', description: 'Descriptografe documentos PDF protegidos inteiramente no navegador.' },
    ko: { title: 'PDF 암호 해제', description: '암호화된 PDF 문서를 브라우저 로컬에서 복호화하여 바로 열람합니다.' },
    tr: { title: 'PDF Kilidini Aç', description: 'Şifreli PDF belgelerinin şifresini tamamen tarayıcıda çözün.' },
    nl: { title: 'PDF Ontgrendelen', description: 'Ontsleutel met een wachtwoord beveiligde PDF-documenten direct in de browser.' },
    pl: { title: 'Odblokuj PDF', description: 'Odszyfruj i odblokuj pliki PDF chronione hasłem bezpośrednio w przeglądarce.' },
    sv: { title: 'Lås upp PDF', description: 'Dekryptera och lås upp lösenordsskyddade PDF-dokument direkt i webbläsaren.' },
    id: { title: 'Buka Kunci PDF', description: 'Dekripsi dan buka dokumen PDF yang dilindungi kata sandi langsung di browser.' },
    vi: { title: 'Mở khóa PDF', description: 'Giải mã và mở khóa tài liệu PDF được bảo vệ bằng mật khẩu trực tiếp trong trình duyệt.' },
  },
  'pdf-to-text': {
    en: { title: 'PDF to Text / Markdown', description: 'Extract raw text, structure, and readable content from your PDF documents.' },
    ur: { title: 'PDF سے ٹیکسٹ حاصل کریں', description: 'منتخب PDF متن کو TXT یا Markdown میں نکالیں؛ scanned تصاویر کے لیے پہلے OCR درکار ہے۔' },
    hi: { title: 'PDF से टेक्स्ट / मार्कडाउन', description: 'अपने PDF दस्तावेज़ों से कच्चा टेक्स्ट और पठनीय सामग्री निकालें।' },
    ar: { title: 'تحويل PDF إلى نص', description: 'استخراج النصوص الصافية والمحتوى القابل للقراءة من مستندات PDF.' },
    zh: { title: 'PDF 转纯文本 / Markdown', description: '从 PDF 文档中提取格式化文本结构和段落内容。' },
    ja: { title: 'PDFテキスト抽出', description: '選択可能なPDFテキストをTXTまたはMarkdownで抽出します。画像だけのスキャンにはOCRが必要です。' },
    tl: { title: 'PDF patungong Teksto', description: 'Mag-extract ng teksto at nababasang nilalaman mula sa iyong mga PDF.' },
    de: { title: 'PDF zu Text / Markdown', description: 'Extrahieren Sie auswählbaren PDF-Text als TXT oder Markdown; Scans benötigen OCR, komplexe Layouts sollten geprüft werden.' },
    fr: { title: 'PDF en Texte / Markdown', description: 'Extrayez le texte brut et le contenu structuré de vos fichiers PDF.' },
    es: { title: 'PDF a Texto / Markdown', description: 'Extrae texto sin formato y estructura legible de tus documentos PDF.' },
    it: { title: 'PDF in Testo / Markdown', description: 'Estrai testo formattato e contenuti leggibili dai tuoi documenti PDF.' },
    no: { title: 'PDF til tekst / Markdown', description: 'Trekk ut råtekst og lesbart innhold fra PDF-dokumentene dine.' },
    ru: { title: 'PDF в Текст / Markdown', description: 'Извлекайте форматированный текст и структуру из документов PDF.' },
    pt: { title: 'PDF para Texto / Markdown', description: 'Extraia texto e estrutura legível dos seus documentos PDF.' },
    ko: { title: 'PDF 텍스트/마크다운 추출', description: 'PDF 문서 내 텍스트와 문단 구조를 깨끗한 텍스트 파일로 추출합니다.' },
    tr: { title: 'PDF Metne Dönüştür', description: 'PDF belgelerinizden ham metin ve okunabilir içerik çıkarın.' },
    nl: { title: 'PDF naar Tekst / Markdown', description: 'Haal platte tekst en gestructureerde inhoud uit uw PDF-documenten.' },
    pl: { title: 'PDF do tekstu / Markdown', description: 'Wyodrębnij surowy tekst i czytelną zawartość ze swoich dokumentów PDF.' },
    sv: { title: 'PDF till text / Markdown', description: 'Extrahera råtext och läsbart innehåll från dina PDF-dokument.' },
    id: { title: 'PDF ke Teks / Markdown', description: 'Ekstrak teks mentah dan konten terstruktur dari dokumen PDF Anda.' },
    vi: { title: 'PDF sang Văn bản', description: 'Trích xuất văn bản thuần và nội dung có thể đọc từ tài liệu PDF của bạn.' },
  },
  'pdf-to-word': {
    hi: { title: 'PDF को Word (DOCX) में बदलें', description: 'PDF पाठ को संपादन योग्य DOCX में बदलें; लेआउट बदल सकता है, Word में परिणाम जाँचें।' },
    ar: { title: 'تحويل PDF إلى Word (DOCX)', description: 'حوّل نص PDF إلى DOCX قابل للتحرير؛ قد يتغير التخطيط، فراجع النتيجة في Word.' },
    fr: { title: 'Convertir un PDF en Word (DOCX)', description: 'Convertissez le texte PDF en DOCX modifiable ; la mise en page peut changer, vérifiez le résultat dans Word.' },
    de: { title: 'PDF in Word umwandeln', description: 'Konvertieren Sie PDF-Text in eine bearbeitbare DOCX-Datei. Das Layout kann sich ändern; prüfen Sie die Ausgabe in Word.' },
    ja: { title: 'PDFをWord（DOCX）に変換', description: 'PDFテキストを編集可能なDOCXに変換します。レイアウトが変わる場合があるため、Wordで出力を確認してください。' },
    ur: { title: 'PDF کو Word (DOCX) میں تبدیل کریں', description: 'PDF متن کو قابلِ تدوین DOCX میں بدلیں؛ layout بدل سکتا ہے، اس لیے Word میں نتیجہ چیک کریں۔' },
    id: { title: 'PDF ke Word (DOCX)', description: 'Ubah teks PDF menjadi DOCX yang dapat diedit; tata letak dapat berubah dan hasilnya perlu diperiksa.' },
    vi: { title: 'PDF sang Word (DOCX)', description: 'Chuyển văn bản PDF thành DOCX có thể chỉnh sửa; bố cục có thể thay đổi, hãy kiểm tra kết quả.' },
    it: { title: 'PDF in Word (DOCX)', description: 'Converti il testo PDF in DOCX modificabile; il layout può cambiare e le scansioni possono richiedere OCR.' },
    no: { title: 'PDF til Word (DOCX)', description: 'Konverter PDF-tekst til redigerbar DOCX; oppsettet kan endres, og skanninger kan trenge OCR.' },
    pt: { title: 'PDF para Word (DOCX)', description: 'Converta texto do PDF em DOCX editável; o layout pode mudar e digitalizações podem precisar de OCR.' },
    ru: { title: 'PDF в Word (DOCX)', description: 'Преобразуйте текст PDF в редактируемый DOCX; проверьте результат, поскольку макет может измениться.' },
    ko: { title: 'PDF를 Word(DOCX)로 변환', description: 'PDF 텍스트를 편집 가능한 DOCX로 변환하세요. 레이아웃이 달라질 수 있으니 결과를 확인하세요.' },
    tr: { title: 'PDF’yi Word (DOCX) biçimine dönüştür', description: 'PDF metnini düzenlenebilir DOCX dosyasına dönüştürün; düzen değişebileceğinden sonucu kontrol edin.' },
    zh: { title: 'PDF 转 Word (DOCX)', description: '将可选中的 PDF 文本转换为可编辑 DOCX；版式可能变化，扫描页面可能需要 OCR。' },
    tl: { title: 'PDF sa Word (DOCX)', description: 'I-convert ang napipiling teksto ng PDF sa editable na DOCX; maaaring magbago ang layout at mangailangan ng OCR ang mga scan.' },
    es: { title: 'PDF a Word (DOCX)', description: 'Convierte texto seleccionable del PDF en DOCX editable; el diseño puede cambiar y las páginas escaneadas pueden requerir OCR.' },
    nl: { title: 'PDF naar Word (DOCX)', description: 'Zet selecteerbare PDF-tekst om naar bewerkbare DOCX; de opmaak kan veranderen en scans kunnen OCR vereisen.' },
    pl: { title: 'PDF do Word (DOCX)', description: 'Konwertuj zaznaczalny tekst PDF do edytowalnego DOCX; układ może się zmienić, a skany mogą wymagać OCR.' },
    sv: { title: 'PDF till Word (DOCX)', description: 'Konvertera markerbar PDF-text till redigerbar DOCX; layouten kan ändras och skannade sidor kan kräva OCR.' },
  },
  'pdf-to-excel': {
    ja: { title: 'PDFをExcel（XLSX）に変換', description: 'PDFの表をXLSXに抽出します。スキャンや複雑なレイアウトではセルや合計を確認してください。' },
    ur: { title: 'PDF کو Excel (XLSX) میں تبدیل کریں', description: 'PDF tables کو XLSX میں نکالیں؛ scanned یا پیچیدہ layout میں cells اور totals چیک کریں۔' },
    de: { title: 'PDF in Excel (XLSX) umwandeln', description: 'Extrahieren Sie PDF-Tabellen nach XLSX; prüfen Sie Zellen und Summen bei Scans oder komplexen Layouts.' },
    hi: { title: 'PDF को Excel (XLSX) में बदलें', description: 'PDF तालिकाओं को XLSX में निकालें; स्कैन या जटिल लेआउट में सेल और योग जाँचें।' },
    ar: { title: 'تحويل PDF إلى Excel (XLSX)', description: 'استخرج الجداول إلى XLSX، ثم تحقق من القيم والمجاميع لأن التخطيطات المعقدة أو الممسوحة قد تتغير.' },
    fr: { title: 'Convertir un PDF en Excel (XLSX)', description: 'Extrayez les tableaux d’un PDF dans un classeur XLSX. Les scans et mises en page complexes peuvent nécessiter des corrections.' },
    id: { title: 'PDF ke Excel (XLSX)', description: 'Ekstrak tabel PDF ke workbook XLSX; periksa sel dari hasil pindai atau tata letak kompleks.' },
    vi: { title: 'PDF sang Excel (XLSX)', description: 'Trích xuất bảng PDF thành workbook XLSX; kiểm tra ô khi tài liệu quét hoặc bố cục phức tạp.' },
    it: { title: 'PDF in Excel (XLSX)', description: 'Estrai tabelle PDF in un foglio XLSX; controlla scansioni e layout complessi dopo la conversione.' },
    no: { title: 'PDF til Excel (XLSX)', description: 'Hent PDF-tabeller til en XLSX-arbeidsbok; kontroller skanninger og komplekse oppsett.' },
    pt: { title: 'PDF para Excel (XLSX)', description: 'Extraia tabelas do PDF para XLSX; confira digitalizações e layouts complexos após converter.' },
    ru: { title: 'PDF в Excel (XLSX)', description: 'Извлекайте таблицы PDF в книгу XLSX; проверяйте сканы и сложную структуру.' },
    ko: { title: 'PDF를 Excel(XLSX)로 변환', description: 'PDF 표를 XLSX 통합 문서로 추출하세요. 스캔 및 복잡한 레이아웃은 확인해야 합니다.' },
    tr: { title: 'PDF’yi Excel (XLSX) biçimine dönüştür', description: 'PDF tablolarını XLSX çalışma kitabına aktarın; taramaları ve karmaşık düzenleri kontrol edin.' },
    zh: { title: 'PDF 转 Excel (XLSX)', description: '将 PDF 表格提取到 XLSX 工作簿；扫描件或复杂版式的单元格需要检查。' },
    tl: { title: 'PDF sa Excel (XLSX)', description: 'I-extract ang mga PDF table papunta sa XLSX workbook; suriin ang mga scan at komplikadong layout.' },
    es: { title: 'PDF a Excel (XLSX)', description: 'Extrae tablas del PDF a un libro XLSX; revisa las celdas de escaneos y diseños complejos.' },
    nl: { title: 'PDF naar Excel (XLSX)', description: 'Haal PDF-tabellen op naar een XLSX-werkmap; controleer scans en complexe indelingen.' },
    pl: { title: 'PDF do Excel (XLSX)', description: 'Wyodrębnij tabele PDF do skoroszytu XLSX; sprawdź skany i złożone układy.' },
    sv: { title: 'PDF till Excel (XLSX)', description: 'Extrahera PDF-tabeller till en XLSX-arbetsbok; kontrollera skanningar och komplexa layouter.' },
  },
  'pdf-to-powerpoint': {
    ja: { title: 'PDFをPowerPoint（PPTX）に変換', description: 'PDFページをPPTXスライドに変換します。元のプレゼン構造やアニメーションは復元されないため、結果を確認してください。' },
    ur: { title: 'PDF کو PowerPoint (PPTX) میں تبدیل کریں', description: 'PDF pages کو PPTX slides میں بدلیں؛ اصل presentation structure اور animations واپس نہیں آتے، نتیجہ چیک کریں۔' },
    de: { title: 'PDF in PowerPoint (PPTX) umwandeln', description: 'Wandeln Sie PDF-Seiten in PPTX-Folien um. Die ursprüngliche Präsentationsstruktur und Animationen werden nicht wiederhergestellt.' },
    hi: { title: 'PDF को PowerPoint (PPTX) में बदलें', description: 'PDF पृष्ठों से PPTX स्लाइड बनाएं। मूल प्रस्तुति की संरचना या एनिमेशन वापस नहीं आते; लेआउट जाँचें।' },
    ar: { title: 'تحويل PDF إلى PowerPoint (PPTX)', description: 'حوّل صفحات PDF إلى شرائح PPTX؛ لا تُستعاد بنية العرض الأصلي أو حركاته، لذا راجع التخطيط.' },
    fr: { title: 'Convertir un PDF en PowerPoint (PPTX)', description: 'Convertissez les pages en diapositives PPTX. La structure et les animations d’origine ne sont pas récupérées ; vérifiez le résultat.' },
    id: { title: 'PDF ke PowerPoint (PPTX)', description: 'Ubah halaman PDF menjadi slide PPTX; struktur dan animasi presentasi asli tidak dipulihkan.' },
    vi: { title: 'PDF sang PowerPoint (PPTX)', description: 'Chuyển trang PDF thành slide PPTX; cấu trúc và hoạt ảnh của bản trình chiếu gốc không được khôi phục.' },
    it: { title: 'PDF in PowerPoint (PPTX)', description: 'Converti le pagine PDF in slide PPTX; struttura e animazioni originali non vengono ripristinate.' },
    no: { title: 'PDF til PowerPoint (PPTX)', description: 'Konverter PDF-sider til PPTX-lysbilder; den opprinnelige strukturen og animasjonene gjenopprettes ikke.' },
    pt: { title: 'PDF para PowerPoint (PPTX)', description: 'Converta páginas do PDF em slides PPTX; a estrutura e as animações originais não são restauradas.' },
    ru: { title: 'PDF в PowerPoint (PPTX)', description: 'Преобразуйте страницы PDF в слайды PPTX; исходная структура и анимация не восстанавливаются.' },
    ko: { title: 'PDF를 PowerPoint(PPTX)로 변환', description: 'PDF 페이지를 PPTX 슬라이드로 변환합니다. 원본 구조와 애니메이션은 복구되지 않습니다.' },
    tr: { title: 'PDF’yi PowerPoint (PPTX) biçimine dönüştür', description: 'PDF sayfalarını PPTX slaytlarına dönüştürün; özgün yapı ve animasyonlar geri yüklenmez.' },
    zh: { title: 'PDF 转 PowerPoint (PPTX)', description: '将 PDF 页面转换为 PPTX 幻灯片；原演示结构和动画不会恢复，请检查版式。' },
    tl: { title: 'PDF sa PowerPoint (PPTX)', description: 'Gawing PPTX slide ang mga PDF page; hindi naibabalik ang orihinal na istruktura o animation.' },
    es: { title: 'PDF a PowerPoint (PPTX)', description: 'Convierte páginas PDF en diapositivas PPTX; no se recuperan la estructura ni las animaciones originales.' },
    nl: { title: 'PDF naar PowerPoint (PPTX)', description: 'Zet PDF-pagina’s om in PPTX-dia’s; de oorspronkelijke structuur en animaties worden niet hersteld.' },
    pl: { title: 'PDF do PowerPoint (PPTX)', description: 'Zamień strony PDF na slajdy PPTX; oryginalna struktura i animacje nie są odtwarzane.' },
    sv: { title: 'PDF till PowerPoint (PPTX)', description: 'Konvertera PDF-sidor till PPTX-bilder; den ursprungliga strukturen och animationerna återskapas inte.' },
  },
  'pdf-to-image': {
    ja: { title: 'PDFページをPNG画像に変換', description: 'PDFページをPNGで書き出します。画像の文字は選択できず、長いファイルではメモリーが多く必要になる場合があります。' },
    ur: { title: 'PDF صفحات کو PNG تصاویر میں تبدیل کریں', description: 'PDF pages کو PNG میں export کریں؛ تصاویر میں selectable متن نہیں ہوتا اور بڑی فائلیں زیادہ memory لے سکتی ہیں۔' },
    de: { title: 'PDF-Seiten in PNG-Bilder umwandeln', description: 'Exportieren Sie PDF-Seiten als PNG. Bilder enthalten keinen auswählbaren Text; lange Dateien benötigen möglicherweise mehr Speicher.' },
    hi: { title: 'PDF पृष्ठों को PNG छवियों में बदलें', description: 'PDF पृष्ठों को PNG के रूप में निर्यात करें। चित्रों में चुना जा सकने वाला पाठ नहीं होता; लंबी फ़ाइलें अधिक मेमोरी ले सकती हैं।' },
    ar: { title: 'تحويل صفحات PDF إلى صور PNG', description: 'صدّر صفحات PDF بصيغة PNG. لا تحتوي الصور على نص قابل للتحديد، وقد تستهلك الملفات الطويلة ذاكرة أكبر.' },
    fr: { title: 'Convertir des pages PDF en images PNG', description: 'Exportez les pages PDF en PNG. Les images ne contiennent pas de texte sélectionnable et les longs fichiers peuvent demander plus de mémoire.' },
    it: { title: 'Esportare pagine PDF come immagini PNG', description: 'Esporta le pagine PDF in PNG. Le immagini non contengono testo selezionabile e i file lunghi possono richiedere più memoria.' },
    no: { title: 'Eksporter PDF-sider som PNG-bilder', description: 'Eksporter PDF-sider som PNG. Bilder inneholder ikke markerbar tekst, og lange filer kan kreve mer minne.' },
    pt: { title: 'Exportar páginas PDF como imagens PNG', description: 'Exporte páginas PDF como PNG. As imagens não contêm texto selecionável, e arquivos longos podem exigir mais memória.' },
    zh: { title: '将 PDF 页面导出为 PNG 图片', description: '将 PDF 页面导出为 PNG。图像不含可选择文本，较长文件可能占用更多内存。' },
    tl: { title: 'I-export ang PDF page bilang PNG image', description: 'I-export ang PDF page bilang PNG. Walang selectable na teksto ang mga larawan, at maaaring mangailangan ng mas maraming memory ang mahahabang file.' },
    es: { title: 'Exporta páginas PDF como imágenes PNG', description: 'Exporta páginas PDF como PNG. Las imágenes no contienen texto seleccionable y los archivos largos pueden requerir más memoria.' },
    ru: { title: 'Экспорт страниц PDF в изображения PNG', description: 'Экспортируйте страницы PDF в PNG. Изображения не содержат выделяемого текста, а длинные файлы могут требовать больше памяти.' },
    ko: { title: 'PDF 페이지를 PNG 이미지로 내보내기', description: 'PDF 페이지를 PNG로 내보냅니다. 이미지에는 선택 가능한 텍스트가 없으며 긴 파일은 더 많은 메모리를 사용할 수 있습니다.' },
    tr: { title: 'PDF sayfalarını PNG görseli olarak dışa aktar', description: 'PDF sayfalarını PNG olarak dışa aktarın. Görsellerde seçilebilir metin bulunmaz ve uzun dosyalar daha fazla bellek kullanabilir.' },
    nl: { title: 'PDF-pagina’s exporteren als PNG-afbeeldingen', description: 'Exporteer PDF-pagina’s als PNG. Afbeeldingen bevatten geen selecteerbare tekst en lange bestanden kunnen meer geheugen vragen.' },
    pl: { title: 'Eksportuj strony PDF jako obrazy PNG', description: 'Eksportuj strony PDF do PNG. Obrazy nie zawierają zaznaczanego tekstu, a długie pliki mogą wymagać więcej pamięci.' },
    sv: { title: 'Exportera PDF-sidor som PNG-bilder', description: 'Exportera PDF-sidor som PNG. Bilderna innehåller ingen markerbar text och långa filer kan kräva mer minne.' },
    id: { title: 'Ekspor halaman PDF sebagai gambar PNG', description: 'Ekspor halaman PDF sebagai PNG. Gambar tidak berisi teks yang dapat dipilih, dan dokumen panjang mungkin memerlukan lebih banyak memori.' },
    vi: { title: 'Xuất các trang PDF thành ảnh PNG', description: 'Xuất trang PDF dưới dạng PNG. Ảnh không có văn bản có thể chọn; tài liệu dài có thể cần thêm bộ nhớ.' },
  },
  'excel-to-pdf': {
    ja: { title: 'ExcelをPDFに変換', description: 'XLSX、XLS、CSVをページ分割PDFに変換します。列幅、改ページ、印刷レイアウトを確認してください。' },
    ur: { title: 'Excel کو PDF میں تبدیل کریں', description: 'XLSX، XLS یا CSV کو صفحات والے PDF tables میں بدلیں؛ column widths اور page breaks چیک کریں۔' },
    de: { title: 'Excel in PDF umwandeln', description: 'Wandeln Sie XLSX, XLS oder CSV in ein PDF mit Tabellen um; prüfen Sie Spaltenbreiten und Seitenumbrüche.' },
    hi: { title: 'Excel से PDF में बदलें', description: 'XLSX, XLS और CSV स्प्रेडशीट को पृष्ठों वाली PDF तालिकाओं में बदलें; कॉलम चौड़ाई और पेज ब्रेक जाँचें।' },
    ar: { title: 'تحويل Excel إلى PDF', description: 'حوّل ملفات XLSX وXLS وCSV إلى جداول PDF مقسّمة إلى صفحات؛ راجع عرض الأعمدة وفواصل الصفحات.' },
    fr: { title: 'Convertir Excel en PDF', description: 'Convertissez les fichiers XLSX, XLS et CSV en tableaux PDF paginés ; vérifiez les colonnes et les sauts de page.' },
    id: { title: 'Excel ke PDF', description: 'Ubah XLSX, XLS, dan CSV menjadi tabel PDF berhalaman; periksa lebar kolom dan pemisah halaman.' },
    vi: { title: 'Excel sang PDF', description: 'Chuyển XLSX, XLS và CSV thành bảng PDF có phân trang; kiểm tra độ rộng cột và ngắt trang.' },
    it: { title: 'Excel in PDF', description: 'Converti fogli XLSX, XLS e CSV in PDF paginati; controlla larghezza delle colonne e interruzioni di pagina.' },
    no: { title: 'Excel til PDF', description: 'Konverter XLSX, XLS og CSV til PDF-tabeller med sider; kontroller kolonnebredder og sideskift.' },
    pt: { title: 'Excel para PDF', description: 'Converta XLSX, XLS e CSV em tabelas PDF paginadas; confira colunas e quebras de página.' },
    ru: { title: 'Excel в PDF', description: 'Преобразуйте XLSX, XLS и CSV в PDF с таблицами; проверьте ширину столбцов и разрывы страниц.' },
    ko: { title: 'Excel을 PDF로 변환', description: 'XLSX, XLS, CSV를 페이지가 나뉜 PDF 표로 변환하세요. 열 너비와 페이지 나눔을 확인하세요.' },
    tr: { title: 'Excel’i PDF’ye dönüştür', description: 'XLSX, XLS ve CSV dosyalarını sayfalı PDF tablolarına dönüştürün; sütun genişliklerini ve sayfa sonlarını kontrol edin.' },
    zh: { title: 'Excel 转 PDF', description: '将 XLSX、XLS 或 CSV 电子表格转换为分页 PDF 表格；请检查列宽和分页。' },
    tl: { title: 'Excel papuntang PDF', description: 'I-convert ang XLSX, XLS o CSV sa may-pahinang PDF na mga talahanayan; suriin ang lapad ng column at page break.' },
    es: { title: 'Convertir Excel a PDF', description: 'Convierte archivos XLSX, XLS o CSV en tablas PDF paginadas; revisa el ancho de columnas y los saltos de página.' },
    nl: { title: 'Excel naar PDF omzetten', description: 'Zet XLSX, XLS of CSV om naar PDF-tabellen met pagina’s; controleer kolombreedtes en pagina-einden.' },
    pl: { title: 'Konwertuj Excel do PDF', description: 'Konwertuj pliki XLSX, XLS lub CSV na stronicowane tabele PDF; sprawdź szerokość kolumn i podziały stron.' },
    sv: { title: 'Konvertera Excel till PDF', description: 'Konvertera XLSX, XLS eller CSV till PDF-tabeller med sidindelning; kontrollera kolumnbredder och sidbrytningar.' },
  },
  'word-to-pdf': {
    ja: { title: 'Word DOCXをPDFに変換', description: 'DOCXをPDFに変換します。古いDOC形式は非対応で、出力ページは画像として描画されます。' },
    ur: { title: 'Word DOCX کو PDF میں تبدیل کریں', description: 'DOCX کو PDF میں بدلیں؛ پرانی DOC فائلیں supported نہیں اور output pages تصاویر ہوتی ہیں۔' },
    de: { title: 'Word-DOCX in PDF umwandeln', description: 'Wandeln Sie DOCX in PDF um; ältere DOC-Dateien werden nicht unterstützt und Ausgabeseiten sind Bilder.' },
    hi: { title: 'Word DOCX को PDF में बदलें', description: 'DOCX फ़ाइल को PDF में बदलें; पुराने DOC समर्थित नहीं हैं और आउटपुट पृष्ठ चित्र होते हैं।' },
    ar: { title: 'تحويل Word DOCX إلى PDF', description: 'حوّل ملف DOCX إلى PDF؛ لا تُقبل ملفات DOC القديمة وتُعرض صفحات الناتج كصور.' },
    fr: { title: 'Convertir un document Word DOCX en PDF', description: 'Convertissez un fichier DOCX en PDF ; les anciens fichiers DOC ne sont pas acceptés et les pages de sortie sont des images.' },
    id: { title: 'Word DOCX ke PDF', description: 'Ubah DOCX menjadi PDF; file DOC lama tidak didukung dan halaman hasil berupa gambar.' },
    vi: { title: 'Chuyển Word DOCX sang PDF', description: 'Chuyển DOCX thành PDF; tệp DOC cũ không được hỗ trợ và các trang đầu ra là hình ảnh.' },
    it: { title: 'Word DOCX in PDF', description: 'Converti DOCX in PDF; i file DOC precedenti non sono supportati e le pagine risultanti sono immagini.' },
    no: { title: 'Word DOCX til PDF', description: 'Konverter DOCX til PDF; eldre DOC-filer støttes ikke, og resultatsidene er bilder.' },
    pt: { title: 'Word DOCX para PDF', description: 'Converta DOCX em PDF; arquivos DOC antigos não são aceitos e as páginas de saída são imagens.' },
    ru: { title: 'Word DOCX в PDF', description: 'Преобразуйте DOCX в PDF; старые файлы DOC не поддерживаются, а страницы результата являются изображениями.' },
    ko: { title: 'Word DOCX를 PDF로 변환', description: 'DOCX를 PDF로 변환합니다. 이전 DOC 형식은 지원하지 않으며 출력 페이지는 이미지입니다.' },
    tr: { title: 'Word DOCX’i PDF’ye dönüştür', description: 'DOCX’i PDF’ye dönüştürün; eski DOC dosyaları desteklenmez ve çıktı sayfaları görüntüdür.' },
    zh: { title: 'Word DOCX 转 PDF', description: '将 DOCX 转换为 PDF；不支持旧版 DOC，输出页面为图像而非可选择文本。' },
    tl: { title: 'Word DOCX sa PDF', description: 'I-convert ang DOCX sa PDF; hindi suportado ang lumang DOC at larawan ang mga output page.' },
    es: { title: 'Word DOCX a PDF', description: 'Convierte DOCX en PDF; no se admiten archivos DOC antiguos y las páginas resultantes son imágenes.' },
    nl: { title: 'Word DOCX naar PDF', description: 'Zet DOCX om naar PDF; oudere DOC-bestanden worden niet ondersteund en uitvoerpagina’s zijn afbeeldingen.' },
    pl: { title: 'Word DOCX do PDF', description: 'Konwertuj DOCX do PDF; starszy format DOC nie jest obsługiwany, a strony wynikowe są obrazami.' },
    sv: { title: 'Word DOCX till PDF', description: 'Konvertera DOCX till PDF; äldre DOC-filer stöds inte och resultatsidorna är bilder.' },
  },
  sign: {
    en: { title: 'Sign PDF', description: 'Draw, type, or upload a visual signature mark onto PDF pages in your browser.' },
    ur: { title: 'PDF پر دستخط کریں', description: 'PDF پر دستخط کا نظر آنے والا نشان بنائیں، لکھیں یا PNG لگائیں؛ یہ شناخت کی تصدیق نہیں کرتا۔' },
    hi: { title: 'PDF पर हस्ताक्षर करें', description: 'PDF पर हाथ से बनाया, टाइप किया या PNG दृश्य हस्ताक्षर-चिह्न जोड़ें; यह पहचान की पुष्टि नहीं करता।' },
    ar: { title: 'توقيع PDF', description: 'أضف علامة توقيع مرئية إلى PDF بالرسم أو الكتابة أو رفع PNG؛ لا تتحقق الأداة من الهوية.' },
    zh: { title: '签署 PDF', description: '在合同和表单上手绘签名或输入数字图章。' },
    ja: { title: 'PDFに署名マークを追加', description: 'PDFに手書き・入力・PNG画像の署名マークを追加します。本人確認や証明書付き署名ではありません。' },
    tl: { title: 'Lagdaan ang PDF', description: 'Gumuhit o maglagay ng iyong digital na lagda sa mga kasunduan at form.' },
    de: { title: 'PDF unterschreiben', description: 'Fügen Sie PDF-Seiten eine sichtbare Signatur per Zeichnung, Texteingabe oder PNG hinzu; keine Identitätsprüfung.' },
    fr: { title: 'Signer PDF', seoTitle: 'Signer un PDF avec une signature visuelle', description: 'Ajoutez une marque de signature visible au PDF par dessin, saisie ou image PNG ; aucune vérification d’identité.' },
    es: { title: 'Firmar PDF', description: 'Dibuja o estampa tu firma digital en acuerdos y formularios.' },
    it: { title: 'Firma PDF', description: 'Disegna o applica la tua firma digitale su moduli e contratti legali.' },
    no: { title: 'Signer PDF', seoTitle: 'Signer PDF med en synlig signatur', description: 'Tegn eller stempl din digitale signatur på juridiske avtaler og skjemaer.' },
    ru: { title: 'Подписать PDF', description: 'Рисуйте или ставьте свою цифровую подпись на договорах и бланках.' },
    pt: { title: 'Assinar PDF', description: 'Desenhe ou estampe sua assinatura digital em contratos e formulários.' },
    ko: { title: 'PDF 서명', description: '전자 계약서 및 양식 위에 터치나 마우스로 직접 서명을 날인합니다.' },
    tr: { title: 'PDF İmzala', description: 'Sözleşmelere ve formlara dijital imzanızı çizin veya ekleyin.' },
    nl: { title: 'PDF Ondertekenen', description: 'Teken of stempel uw digitale handtekening op overeenkomsten en formulieren.' },
    pl: { title: 'Podpisz PDF', description: 'Narysuj lub umieść swój podpis cyfrowy na umowach i formularzach.' },
    sv: { title: 'Signera PDF', description: 'Rita eller stämpla din digitala signatur på avtal och blanketter.' },
    id: { title: 'Tandatangani PDF', description: 'Gambar atau bubuhkan tanda tangan digital pada formulir dan dokumen.' },
    vi: { title: 'Ký tên PDF', description: 'Vẽ hoặc đóng dấu chữ ký điện tử của bạn lên các tài liệu và hợp đồng.' },
  },
  crop: {
    en: { title: 'Crop & Trim Margins', description: 'Adjust document margins and trim excess white space for printing or reading.' },
    ur: { title: 'کراپ اور مارجن ایڈجسٹ کریں', description: 'صفحے کے فالتو سفید حصے اور بارڈرز کو کاٹ کر پرفیکٹ بنائیں۔' },
    hi: { title: 'PDF क्रॉप व मार्जिन', description: 'दस्तावेज़ मार्जिन समायोजित करें और अतिरिक्त सफेद स्थान काटें।' },
    ar: { title: 'قص وهوامش PDF', description: 'تعديل هوامش المستند وقص المساحات البيضاء الزائدة للقراءة أو الطباعة.' },
    zh: { title: '裁剪边缘与留白', description: '调整文档页边距并去除扫描件或幻灯片周围多余空白。' },
    ja: { title: '余白トリミング・クロップ', description: 'スキャン文書の不要な余白や枠線を切り詰めて見やすく整えます。' },
    tl: { title: 'I-crop ang PDF', description: 'I-adjust ang mga margin at tanggalin ang labis na puting espasyo.' },
    de: { title: 'Ränder beschneiden', description: 'Passen Sie Seitenränder an und entfernen Sie überflüssigen Leerraum.' },
    fr: { title: 'Rogner et marges PDF', description: 'Ajustez les marges du document et éliminez les espaces blancs superflus.' },
    es: { title: 'Recortar márgenes', description: 'Ajusta los márgenes del documento y recorta el espacio en blanco sobrante.' },
    it: { title: 'Ritaglia margini PDF', description: 'Regola i margini ed elimina lo spazio bianco in eccesso per la lettura.' },
    no: { title: 'Beskjær marger', description: 'Juster dokumentmarger og beskjær overflødig hvitrom for optimal lesing.' },
    ru: { title: 'Обрезать поля PDF', description: 'Настраивайте поля документа и убирайте лишнее белое пространство.' },
    pt: { title: 'Cortar Margens', description: 'Ajuste margens e elimine espaços em branco para melhor impressão.' },
    ko: { title: '여백 자르기 및 트림', description: '스캔 문서나 슬라이드의 불필요한 테두리 여백을 깔끔하게 잘라냅니다.' },
    tr: { title: 'Kenar Boşluklarını Kırp', description: 'Belge kenar boşluklarını ayarlayın ve fazla beyaz alanı kırpın.' },
    nl: { title: 'Marges Bijsnijden', description: 'Pas documentmarges aan en snijd overtollige witruimte weg.' },
    pl: { title: 'Przytnij marginesy', description: 'Dostosuj marginesy dokumentu i przytnij niepotrzebne białe odstępy.' },
    sv: { title: 'Beskär marginaler', description: 'Justera dokumentmarginaler och trimma bort onödigt vitt utrymme.' },
    id: { title: 'Pangkas Margin', description: 'Sesuaikan margin dokumen dan pangkas ruang putih berlebih.' },
    vi: { title: 'Cắt lề tài liệu', description: 'Điều chỉnh lề tài liệu và cắt bỏ khoảng trắng dư thừa để in ấn.' },
  },
  'pdf-to-pdfa': {
    en: { title: 'PDF to PDF/A', description: 'Format your document into ISO-standardized archival format for long-term storage.' },
    ur: { title: 'PDF سے PDF/A میں تبدیلی', description: 'دیرپا قانونی اور آرکائیول اسٹوریج کے لیے بین الاقوامی ISO فارمیٹ میں کنورٹ کریں۔' },
    hi: { title: 'PDF से PDF/A', description: 'दीर्घकालिक कानूनी भंडारण के लिए ISO-मानकीकृत प्रारूप में बदलें।' },
    ar: { title: 'تحويل إلى PDF/A', description: 'تنسيق المستند إلى صيغة أرشيفية متوافقة مع معايير ISO للحفظ طويل الأجل.' },
    zh: { title: '转为 PDF/A 归档', description: '将文档转换为国际 ISO 19005 标准化法律归档格式，确保长久可读。' },
    ja: { title: 'PDF/A長期保存形式', description: '国際ISO規格に準拠した長期電子保存用PDF/Aフォーマットに変換します。' },
    tl: { title: 'PDF patungong PDF/A', description: 'I-format ang dokumento para sa pangmatagalang imbakan ayon sa ISO.' },
    de: { title: 'PDF zu PDF/A', description: 'Formatieren Sie Dokumente für die langfristige rechtliche Archivierung.' },
    fr: { title: 'PDF en PDF/A', description: 'Convertissez au format d’archivage légal ISO pour la conservation à long terme.' },
    es: { title: 'PDF a PDF/A', description: 'Formatea tu documento en el estándar ISO para archivo legal a largo plazo.' },
    it: { title: 'PDF in PDF/A', description: 'Converti nel formato di archiviazione standard ISO per la conservazione legale.' },
    no: { title: 'PDF til PDF/A', description: 'Formater dokumentet til ISO-standardisert arkivformat for langtidslagring.' },
    ru: { title: 'PDF в PDF/A', description: 'Преобразуйте документ в стандартный архивный формат ISO для длительного хранения.' },
    pt: { title: 'PDF para PDF/A', description: 'Converta seu documento no padrão internacional ISO para arquivamento.' },
    ko: { title: 'PDF/A 장기 보관용 변환', description: '국제 표준 ISO 규격의 영구 보존용 아카이빙 PDF/A 형식으로 변환합니다.' },
    tr: { title: 'PDF’den PDF/A’ya', description: 'Uzun süreli saklama için ISO standartlarında arşiv biçimine dönüştürün.' },
    nl: { title: 'PDF naar PDF/A', description: 'Converteer naar ISO-standaard archiefformaat voor langdurige opslag.' },
    pl: { title: 'PDF do PDF/A', description: 'Formatuj dokument do standardu ISO dla długoterminowej archiwizacji.' },
    sv: { title: 'PDF till PDF/A', description: 'Formatera dokumentet till ISO-standardiserat arkivformat för långtidsförvaring.' },
    id: { title: 'PDF ke PDF/A', description: 'Format dokumen ke standar ISO untuk penyimpanan arsip jangka panjang.' },
    vi: { title: 'PDF sang PDF/A', description: 'Định dạng tài liệu theo chuẩn lưu trữ ISO dài hạn.' },
  },
  repair: {
    en: { title: 'Repair PDF', description: 'Try a best-effort parser rebuild of readable PDFs; recovery is not guaranteed, and missing or truncated content cannot be restored.' },
    ur: { title: 'خراب PDF کی مرمت (ریپیئر)', description: 'قابلِ مطالعہ PDF کا parser-based نیا copy بنانے کی کوشش کریں؛ بحالی کی ضمانت نہیں، اور غائب یا truncated مواد واپس نہیں آ سکتا۔' },
    hi: { title: 'PDF की मरम्मत करें', description: 'पार्सर से पढ़ी जा सकने वाली PDF की संरचना को फिर से बनाने की कोशिश करें; सफलता की गारंटी नहीं, और गायब या कटा हुआ कंटेंट वापस नहीं बनाया जा सकता।' },
    ar: { title: 'إصلاح PDF التالف', description: 'جرّب إعادة بناء PDF يستطيع المحلل قراءته؛ لا يوجد ضمان للاستعادة، ولا يمكن إعادة المحتوى المفقود أو المبتور.' },
    zh: { title: '修复受损 PDF', description: '尝试重建解析器仍可读取的 PDF；不保证修复成功，也无法恢复缺失或被截断的内容。' },
    ja: { title: '破損PDF修復', description: 'パーサーが読み取れるPDFの再構築を試みます。復旧は保証されず、欠落・切断した内容は復元できません。' },
    tl: { title: 'Kumpunihin ang PDF', description: 'Subukang buuing muli ang PDF na nababasa pa ng parser; walang garantiya ang pag-recover at hindi maibabalik ang nawawala o naputol na nilalaman.' },
    de: { title: 'PDF reparieren', description: 'Versucht, eine vom Parser lesbare PDF neu aufzubauen; eine Wiederherstellung ist nicht garantiert, fehlende oder abgeschnittene Inhalte lassen sich nicht zurückholen.' },
    fr: { title: 'Réparer PDF', description: 'Tente de reconstruire un PDF encore lisible par l’analyseur ; la récupération n’est pas garantie et le contenu manquant ou tronqué ne peut pas être restauré.' },
    es: { title: 'Reparar PDF', seoTitle: 'Intentar reparar un PDF dañado', description: 'Intenta reconstruir un PDF que el analizador aún puede leer; no se garantiza la recuperación y no se restaura el contenido ausente o truncado.' },
    it: { title: 'Ripara PDF', description: 'Tenta di ricostruire un PDF ancora leggibile dal parser; il recupero non è garantito e i contenuti mancanti o troncati non possono essere ripristinati.' },
    no: { title: 'Reparer skadet PDF', description: 'Prøver å bygge opp en PDF som fortsatt kan leses av parseren; gjenoppretting er ikke garantert, og manglende eller avkortet innhold kan ikke gjenskapes.' },
    ru: { title: 'Восстановить PDF', description: 'Пытается перестроить PDF, который ещё может прочитать парсер; восстановление не гарантируется, а отсутствующее или усечённое содержимое вернуть нельзя.' },
    pt: { title: 'Reparar PDF', seoTitle: 'Tentar reparar um PDF danificado', description: 'Tenta reconstruir um PDF que o analisador ainda consegue ler; a recuperação não é garantida e o conteúdo ausente ou truncado não pode ser restaurado.' },
    ko: { title: '손상된 PDF 복구', description: '파서가 읽을 수 있는 PDF를 새로 구성해 봅니다. 복구를 보장하지 않으며, 없거나 잘린 내용은 복원할 수 없습니다.' },
    tr: { title: 'PDF Onar', description: 'Ayrıştırıcının hâlâ okuyabildiği PDF’yi yeniden oluşturmayı dener; kurtarma garanti edilmez ve eksik ya da kesilmiş içerik geri getirilemez.' },
    nl: { title: 'PDF Repareren', description: 'Probeert een PDF die de parser nog kan lezen opnieuw op te bouwen; herstel is niet gegarandeerd en ontbrekende of afgekorte inhoud kan niet worden teruggezet.' },
    pl: { title: 'Napraw uszkodzony PDF', description: 'Próbuje odbudować PDF, który parser nadal potrafi odczytać; odzyskanie nie jest gwarantowane, a brakującej lub uciętej treści nie da się przywrócić.' },
    sv: { title: 'Reparera PDF', description: 'Försöker bygga om en PDF som fortfarande kan läsas av parsern; återställning garanteras inte och saknat eller avklippt innehåll kan inte återskapas.' },
    id: { title: 'Perbaiki PDF Rusak', description: 'Mencoba menyusun ulang PDF yang masih dapat dibaca parser; pemulihan tidak dijamin, dan konten yang hilang atau terpotong tidak dapat dipulihkan.' },
    vi: { title: 'Sửa lỗi PDF hỏng', description: 'Thử dựng lại PDF mà bộ phân tích vẫn đọc được; không đảm bảo khôi phục và không thể phục hồi nội dung bị thiếu hoặc bị cắt.' },
  },
  compare: {
    en: { title: 'Compare PDF', description: 'Inspect two versions of a document side-by-side to highlight page alterations.' },
    ur: { title: 'دو دستاویزات کا موازنہ کریں', description: 'دو ورژن کو برابر میں رکھ کر تبدیلیوں اور فرق کا فوری جائزہ لیں۔' },
    hi: { title: 'PDF तुलना करें', description: 'परिवर्तनों को उजागर करने के लिए दो संस्करणों की साथ-साथ तुलना करें।' },
    ar: { title: 'مقارنة مستندين', description: 'فحص نسختين جنباً إلى جنب لتسليط الضوء على التعديلات والاختلافات.' },
    zh: { title: '双文档对比', description: '并排比对两份 PDF 文档版本，即时发现条款更改与页面差异。' },
    ja: { title: 'PDF比較', description: '2つの文書を左右に並べて同期スクロールし、変更箇所を照合します。' },
    tl: { title: 'Ihambing ang mga PDF', description: 'Suriin ang dalawang bersyon nang magkatabi upang makita ang mga pagbabago.' },
    de: { title: 'PDF vergleichen', description: 'Vergleichen Sie zwei Versionen nebeneinander, um Änderungen zu sehen.' },
    fr: { title: 'Comparer PDF', description: 'Examinez deux versions côte à côte pour détecter les modifications.' },
    es: { title: 'Comparar PDF', seoTitle: 'Comparar el texto de dos archivos PDF', description: 'Compara dos versiones lado a lado para detectar modificaciones.' },
    it: { title: 'Confronta PDF', description: 'Esamina due versioni affiancate per individuare le modifiche al testo.' },
    no: { title: 'Sammenlign PDF', description: 'Undersøk to versjoner side ved side for å fremheve endringer.' },
    ru: { title: 'Сравнить PDF', description: 'Сравнивайте две версии документов бок о бок для выявления изменений.' },
    pt: { title: 'Comparar PDF', seoTitle: 'Comparar o texto de dois arquivos PDF', description: 'Inspecione duas versões lado a lado para destacar alterações.' },
    ko: { title: 'PDF 문서 비교', description: '두 버전의 문서를 양옆에 나란히 놓고 동기화 스크롤로 차이점을 검토합니다.' },
    tr: { title: 'PDF Karşılaştır', description: 'Değişiklikleri görmek için iki belge sürümünü yan yana inceleyin.' },
    nl: { title: 'PDF\'s Vergelijken', description: 'Vergelijk twee versies naast elkaar om wijzigingen direct te zien.' },
    pl: { title: 'Porównaj PDF', description: 'Sprawdź dwie wersje obok siebie, aby szybko wyróżnić zmiany.' },
    sv: { title: 'Jämför PDF', description: 'Granska två versioner sida vid sida för att upptäcka ändringar.' },
    id: { title: 'Bandingkan PDF', description: 'Periksa dua versi dokumen berdampingan untuk melihat perubahan.' },
    vi: { title: 'So sánh tài liệu PDF', description: 'Xem hai phiên bản song song để làm nổi bật các thay đổi trên trang.' },
  },
  'word-to-excel': {
    zh: { title: 'Word 转 Excel', description: '将 Word 表格和文档文本导入 Excel 工作簿。' },
    ja: { title: 'WordからExcel', description: 'Wordの表と文書のテキストをExcelワークブックに移します。' },
    tl: { title: 'Word sa Excel', description: 'Ilipat ang mga talahanayan at teksto ng Word sa Excel workbook.' },
    ur: { title: 'Word سے Excel', description: 'Word کی tables اور دستاویز کا متن Excel workbook میں منتقل کریں۔' },
    de: { title: 'Word zu Excel', description: 'Übertragen Sie Word-Tabellen und Dokumenttext in eine Excel-Arbeitsmappe.' },
    hi: { title: 'Word से Excel', description: 'Word तालिकाओं और दस्तावेज़ के पाठ को Excel वर्कबुक में ले जाएँ।' },
    ar: { title: 'Word إلى Excel', description: 'انقل جداول Word ونص المستند إلى مصنف Excel.' },
    fr: { title: 'Word en Excel', description: 'Transférez les tableaux Word et le texte du document dans un classeur Excel.' },
    es: { title: 'Word a Excel', description: 'Pasa tablas y texto de Word a un libro de Excel.' },
    id: { title: 'Word ke Excel', description: 'Pindahkan tabel Word ke worksheet terpisah dan kumpulkan paragraf serta daftar di worksheet Teks.' },
    vi: { title: 'Word sang Excel', description: 'Đưa từng bảng Word vào một trang tính riêng; đoạn văn và danh sách được gom vào trang tính Văn bản.' },
    it: { title: 'Word in Excel', description: 'Metti ogni tabella Word in un foglio separato e raccogli paragrafi ed elenchi in un foglio Testo.' },
    no: { title: 'Word til Excel', description: 'Legg hver Word-tabell i et eget ark, og samle avsnitt og lister i et Tekst-ark.' },
    pt: { title: 'Word para Excel', description: 'Coloque cada tabela do Word em uma planilha própria e reúna parágrafos e listas em uma planilha de texto.' },
    ru: { title: 'Word в Excel', description: 'Поместите каждую таблицу Word на отдельный лист, а абзацы и списки соберите на листе «Текст».' },
    ko: { title: 'Word를 Excel로 변환', description: '각 Word 표를 별도 시트에 넣고 문단과 목록은 텍스트 시트에 모읍니다.' },
    tr: { title: 'Word’den Excel’e', description: 'Her Word tablosunu ayrı bir sayfaya aktarın; paragraflar ve listeler Metin sayfasında toplanır.' },
    nl: { title: 'Word naar Excel', description: 'Zet elke Word-tabel op een eigen werkblad; verzamel alinea’s en lijsten op een apart tekstblad.' },
    pl: { title: 'Word do Excela', description: 'Umieść każdą tabelę Worda w osobnym arkuszu, a akapity i listy w arkuszu tekstowym.' },
    sv: { title: 'Word till Excel', description: 'Placera varje Word-tabell på ett eget kalkylblad och samla stycken och listor på ett separat textblad.' },
  },
};
