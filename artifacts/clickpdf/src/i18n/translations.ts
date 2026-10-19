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
  removeBtn: string;
  optionsAndSettings: string;
  processBtn: string;
  processingBtn: string;
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
  batchQueueEngine: string;
  blogs: string;
  faqAndAnswers: string;
  adminDashboard: string;
  shareClickPdf: string;
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
  dropZoneTitleMulti: 'Drop your PDF files here or click to browse',
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
  batchQueueEngine: 'Batch Queue Engine',
  blogs: 'Blogs',
  faqAndAnswers: 'FAQs',
  adminDashboard: 'Admin Dashboard',
  shareClickPdf: 'Share ClickPDF',
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
  dropZoneTitleMulti: 'اپنی PDF فائلیں یہاں ڈراپ کریں یا منتخب کریں',
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

export const translations: Record<Language, TranslationDict> = {
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

// Multilingual catalog titles & descriptions
export const TOOL_TRANSLATIONS: Record<string, Partial<Record<Language, { title: string; description: string }>>> = {
  merge: {
    en: { title: 'Merge PDF', description: 'Combine multiple PDFs into one unified document in your preferred order.' },
    ur: { title: 'PDF مرج کریں (جوڑیں)', description: 'متعدد PDF فائلوں کو اپنی مرضی کی ترتیب میں ایک دستاویز میں ضم کریں۔' },
    hi: { title: 'PDF मर्ज करें', description: 'कई PDF फाइलों को अपनी पसंद के क्रम में एक दस्तावेज़ में जोड़ें।' },
    ar: { title: 'دمج PDF', description: 'دمج عدة ملفات PDF في مستند واحد بالترتيب الذي تفضله.' },
    zh: { title: '合并 PDF', description: '按指定顺序将多个 PDF 文件合并为一个标准文档。' },
    ja: { title: 'PDF結合', description: '複数のPDFファイルをドラッグ＆ドロップで任意の順序で1つに結合します。' },
    tl: { title: 'Pagsamahin ang PDF', description: 'Pagsamahin ang maraming PDF sa isang dokumento sa nais mong ayos.' },
    de: { title: 'PDF zusammenfügen', description: 'Kombinieren Sie mehrere PDFs in Ihrer Wunschreihenfolge.' },
    fr: { title: 'Fusionner PDF', description: 'Combinez plusieurs fichiers PDF en un seul document dans l’ordre de votre choix.' },
    es: { title: 'Unir PDF', description: 'Une múltiples archivos PDF en un solo documento en el orden deseado.' },
    it: { title: 'Unisci PDF', description: 'Combina più file PDF in un unico documento nell’ordine desiderato.' },
    no: { title: 'Slå sammen PDF', description: 'Kombiner flere PDF-filer til ett dokument i ønsket rekkefølge.' },
    ru: { title: 'Объединить PDF', description: 'Объединяйте несколько документов PDF в один в нужном порядке.' },
    pt: { title: 'Juntar PDF', description: 'Combine vários documentos PDF em um só na ordem desejada.' },
    ko: { title: 'PDF 병합', description: '여러 PDF 문서를 원하는 순서대로 하나의 파일로 깔끔하게 합칩니다.' },
    tr: { title: 'PDF Birleştir', description: 'Birden çok PDF dosyasını istediğiniz sırayla tek bir belgede birleştirin.' },
    nl: { title: 'PDF Samenvoegen', description: 'Voeg meerdere PDF-bestanden samen in de gewenste volgorde.' },
    pl: { title: 'Połącz PDF', description: 'Połącz wiele plików PDF w jeden dokument w wybranej kolejności.' },
    sv: { title: 'Slå ihop PDF', description: 'Kombinera flera PDF-filer till ett dokument i önskad ordning.' },
    id: { title: 'Gabungkan PDF', description: 'Gabungkan beberapa file PDF menjadi satu dokumen dengan urutan pilihan Anda.' },
    vi: { title: 'Gộp PDF', description: 'Kết hợp nhiều tệp PDF thành một tài liệu theo thứ tự mong muốn.' },
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
    es: { title: 'Dividir PDF', description: 'Separa páginas o extrae rangos específicos en archivos PDF independientes.' },
    it: { title: 'Dividi PDF', description: 'Estrai pagine singole o intervalli specifici in file PDF separati.' },
    no: { title: 'Del opp PDF', description: 'Skill sider eller trekk ut bestemte sideområder til egne filer.' },
    ru: { title: 'Разделить PDF', description: 'Извлекайте отдельные страницы или диапазоны в новые файлы PDF.' },
    pt: { title: 'Dividir PDF', description: 'Extraia páginas ou intervalos específicos em novos arquivos PDF.' },
    ko: { title: 'PDF 분할', description: '원하는 페이지 범위만 추출하여 별도의 독립된 PDF로 나눕니다.' },
    tr: { title: 'PDF Böl', description: 'Sayfaları ayırın veya belirli sayfa aralıklarını bağımsız dosyalara çıkarın.' },
    nl: { title: 'PDF Splitsen', description: 'Splits pagina\'s of haal specifieke paginabereiken naar aparte bestanden.' },
    pl: { title: 'Podziel PDF', description: 'Wyodrębnij wybrane strony lub zakresy do osobnych plików PDF.' },
    sv: { title: 'Dela upp PDF', description: 'Separera sidor eller extrahera specifika sidintervall till fristående filer.' },
    id: { title: 'Pisahkan PDF', description: 'Pisahkan halaman atau ekstrak rentang halaman tertentu ke file mandiri.' },
    vi: { title: 'Tách PDF', description: 'Tách các trang hoặc trích xuất phạm vi trang cụ thể thành các tệp riêng biệt.' },
  },
  compress: {
    en: { title: 'Compress PDF', description: 'Optimize and reduce PDF file size directly in your browser with no quality loss.' },
    ur: { title: 'PDF سائز کم کریں (کمپریس)', description: 'کوالٹی برقرار رکھتے ہوئے براؤزر میں براہ راست PDF فائل کا سائز کم کریں۔' },
    hi: { title: 'PDF कंप्रेस करें', description: 'गुणवत्ता खोए बिना ब्राउज़र में सीधे PDF फ़ाइल का आकार कम करें।' },
    ar: { title: 'ضغط PDF', description: 'تقليل حجم ملف PDF مباشرة في المتصفح دون فقدان الجودة.' },
    zh: { title: '压缩 PDF', description: '在浏览器中直接优化并大幅减小 PDF 文件大小，保持清晰度。' },
    ja: { title: 'PDF圧縮', description: '画質を落とさずにブラウザ内で直接PDFファイルサイズを軽量化します。' },
    tl: { title: 'I-compress ang PDF', description: 'Bawasan ang laki ng PDF file sa browser nang walang pagkawala ng kalidad.' },
    de: { title: 'PDF komprimieren', description: 'Verringern Sie die Dateigröße verlustfrei direkt im Browser.' },
    fr: { title: 'Compresser PDF', description: 'Réduisez la taille de vos fichiers PDF directement dans le navigateur sans perte.' },
    es: { title: 'Comprimir PDF', description: 'Optimiza y reduce el tamaño de tus archivos PDF en el navegador sin perder calidad.' },
    it: { title: 'Comprimi PDF', description: 'Ottimizza e riduci le dimensioni del file PDF direttamente nel browser senza perdite.' },
    no: { title: 'Komprimer PDF', description: 'Reduser PDF-filstørrelsen direkte i nettleseren uten tap av kvalitet.' },
    ru: { title: 'Сжать PDF', description: 'Оптимизируйте и уменьшайте размер файлов PDF прямо в браузере без потери качества.' },
    pt: { title: 'Comprimir PDF', description: 'Reduza o tamanho do seu PDF diretamente no navegador mantendo a nitidez.' },
    ko: { title: 'PDF 압축', description: '화질 손실 없이 브라우저에서 직접 PDF 파일 용량을 최적화하고 줄입니다.' },
    tr: { title: 'PDF Sıkıştır', description: 'Kaliteden ödün vermeden tarayıcınızda PDF dosya boyutunu küçültün.' },
    nl: { title: 'PDF Comprimeren', description: 'Verklein de PDF-bestandsgrootte direct in uw browser met behoud van kwaliteit.' },
    pl: { title: 'Kompresuj PDF', description: 'Zmniejsz rozmiar pliku PDF bezpośrednio w przeglądarce bez utraty jakości.' },
    sv: { title: 'Komprimera PDF', description: 'Minska PDF-filstorleken direkt i webbläsaren utan kvalitetsförlust.' },
    id: { title: 'Kompres PDF', description: 'Kurangi ukuran file PDF langsung di browser tanpa penurunan kualitas.' },
    vi: { title: 'Nén PDF', description: 'Giảm kích thước tệp PDF trực tiếp trong trình duyệt mà không làm giảm chất lượng.' },
  },
  'jpg-to-pdf': {
    en: { title: 'Image to PDF', description: 'Convert multiple image files (JPG, PNG, WebP) into a single clean PDF.' },
    ur: { title: 'تصاویر سے PDF بنائیں', description: 'تصاویر (JPG, PNG, WebP) کو فوری طور پر ایک معیاری PDF فائل میں تبدیل کریں۔' },
    hi: { title: 'इमेज से PDF', description: 'JPG, PNG और WebP छवियों को एक स्वच्छ PDF फ़ाइल में बदलें।' },
    ar: { title: 'تحويل الصور إلى PDF', description: 'تحويل صور متعددة (JPG, PNG, WebP) إلى ملف PDF نظيف وموحد.' },
    zh: { title: '图片转 PDF', description: '将多张 JPG、PNG、WebP 图片转换为一份干净的高清 PDF。' },
    ja: { title: '画像からPDF変換', description: 'JPG、PNG、WebPなどの複数の画像ファイルを標準PDFにまとめます。' },
    tl: { title: 'Larawan patungong PDF', description: 'I-convert ang mga larawan (JPG, PNG, WebP) sa isang malinis na PDF file.' },
    de: { title: 'Bild zu PDF', description: 'Konvertieren Sie JPG, PNG und WebP Bilder in ein einheitliches PDF.' },
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
    nl: { title: 'PDF Draaien', description: 'Roteer individuele pagina\'s of het hele document met de klok mee of tegen de klok in.' },
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
    nl: { title: 'Pagina\'s Organiseren', description: 'Sorteer, herschik of verwijder ongewenste pagina\'s in elk PDF-bestand.' },
    pl: { title: 'Organizuj strony', description: 'Wizualnie sortuj, zmieniaj kolejność lub usuwaj niepotrzebne strony.' },
    sv: { title: 'Organisera sidor', description: 'Sortera, arrangera om eller ta bort oönskade sidor i PDF-filen.' },
    id: { title: 'Atur Halaman', description: 'Urutkan ulang, pindahkan, atau hapus halaman yang tidak diinginkan secara visual.' },
    vi: { title: 'Sắp xếp trang', description: 'Sắp xếp, thay đổi thứ tự hoặc xóa các trang không mong muốn một cách trực quan.' },
  },
  'edit-metadata': {
    en: { title: 'Edit PDF Metadata', description: 'View and modify Author, Title, Subject, Keywords, Creator, and Producer properties.' },
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
    nl: { title: 'PDF Analyse & Paginateller', description: 'Tel pagina\'s, inspecteer afmetingen en extraheer tekst met OCR in de browser.' },
    pl: { title: 'Analiza PDF i licznik stron', description: 'Licz strony, sprawdzaj wymiary i wyodrębniaj tekst za pomocą OCR.' },
    sv: { title: 'PDF-analys & sidräknare', description: 'Räkna sidor, inspektera mått och extrahera text med inbyggd OCR.' },
    id: { title: 'Analisis PDF & Penghitung Halaman', description: 'Hitung halaman, periksa dimensi, dan ekstrak teks menggunakan OCR.' },
    vi: { title: 'Phân tích PDF & Đếm trang', description: 'Đếm số trang, kiểm tra kích thước và trích xuất văn bản bằng OCR.' },
  },
  protect: {
    en: { title: 'Protect PDF', description: 'Password-protect and encrypt PDF files using browser-based Web Crypto AES-256-GCM.' },
    ur: { title: 'PDF پاس ورڈ پروٹیکشن', description: 'براؤزر ویب کرپٹو AES-256-GCM الگورتھم کے ذریعے PDF کو خفیہ پاس ورڈ سے محفوظ کریں۔' },
    hi: { title: 'PDF पासवर्ड सुरक्षा', description: 'Web Crypto AES-256-GCM का उपयोग करके पासवर्ड से PDF सुरक्षित करें।' },
    ar: { title: 'حماية PDF بكلمة مرور', description: 'حماية وتشفير ملفات PDF باستخدام Web Crypto AES-256-GCM القوي.' },
    zh: { title: '密码保护 PDF', description: '使用浏览器内置 Web Crypto AES-256-GCM 军工级算法加密文档。' },
    ja: { title: 'PDF暗号化・パスワード保護', description: 'Web Crypto APIのAES-256-GCM軍事用グレード暗号化でPDFを保護します。' },
    tl: { title: 'Protektahan ang PDF', description: 'I-encrypt at lagyan ng password ang PDF gamit ang Web Crypto AES-256-GCM.' },
    de: { title: 'PDF schützen', description: 'Passwortschutz und Verschlüsselung mit browserbasiertem AES-256-GCM.' },
    fr: { title: 'Protéger PDF', description: 'Protégez par mot de passe avec le chiffrement Web Crypto AES-256-GCM.' },
    es: { title: 'Proteger PDF', description: 'Protege con contraseña y cifra archivos PDF usando Web Crypto AES-256-GCM.' },
    it: { title: 'Proteggi PDF', description: 'Proteggi con password e crittografa i PDF con Web Crypto AES-256-GCM.' },
    no: { title: 'Beskytt PDF med passord', description: 'Krypter PDF-filer sikkert med nettleserbasert Web Crypto AES-256-GCM.' },
    ru: { title: 'Защитить паролем', description: 'Шифруйте документы алгоритмом AES-256-GCM через Web Crypto API.' },
    pt: { title: 'Proteger PDF', description: 'Proteja com senha usando criptografia Web Crypto AES-256-GCM no navegador.' },
    ko: { title: 'PDF 암호화 및 보호', description: 'Web Crypto AES-256-GCM 알고리즘으로 안전한 비밀번호 보안을 적용합니다.' },
    tr: { title: 'PDF Şifrele', description: 'Tarayıcı tabanlı Web Crypto AES-256-GCM ile PDF dosyalarını şifreleyin.' },
    nl: { title: 'PDF Beveiligen met Wachtwoord', description: 'Beveilig en versleutel PDF\'s met browser-gebaseerde Web Crypto AES-256-GCM.' },
    pl: { title: 'Chroń PDF hasłem', description: 'Zabezpiecz i zaszyfruj pliki PDF za pomocą Web Crypto AES-256-GCM.' },
    sv: { title: 'Skydda PDF med lösenord', description: 'Lösenordsskydda och kryptera PDF-filer med Web Crypto AES-256-GCM.' },
    id: { title: 'Lindungi PDF dengan Sandi', description: 'Kunci dan enkripsi dokumen PDF menggunakan Web Crypto AES-256-GCM.' },
    vi: { title: 'Bảo vệ PDF bằng mật khẩu', description: 'Mã hóa và bảo vệ tài liệu PDF bằng Web Crypto AES-256-GCM.' },
  },
  unlock: {
    en: { title: 'Unlock PDF', description: 'Decrypt and unlock Web Crypto password-protected PDF documents entirely in-browser.' },
    ur: { title: 'PDF ان لاک کریں', description: 'پاس ورڈ درج کر کے محفوظ شدہ PDF دستاویزات کو فوری طور پر کھولیں۔' },
    hi: { title: 'PDF अनलॉक करें', description: 'ब्राउज़र में Web Crypto सुरक्षित PDF दस्तावेज़ों को डिक्रिप्ट करें।' },
    ar: { title: 'فتح قفل PDF', description: 'فك تشفير وفتح مستندات PDF المحمية بكلمة مرور مباشرة في المتصفح.' },
    zh: { title: '解密 PDF', description: '完全在本地浏览器中解密并解锁受 Web Crypto 保护的 PDF 文档。' },
    ja: { title: 'PDFロック解除', description: 'パスワード認証を行い、保護されたPDFを安全にブラウザ内で復号します。' },
    tl: { title: 'I-unlock ang PDF', description: 'I-decrypt at buksan ang mga protektadong PDF file nang direkta sa browser.' },
    de: { title: 'PDF entsperren', description: 'Entschlüsseln Sie geschützte PDF-Dokumente vollständig im Browser.' },
    fr: { title: 'Déverrouiller PDF', description: 'Déchiffrez et déverrouillez les documents PDF protégés localement.' },
    es: { title: 'Desbloquear PDF', description: 'Descifra y desbloquea documentos protegidos enteramente en el navegador.' },
    it: { title: 'Sblocca PDF', description: 'Decrittografa e sblocca i documenti protetti da password direttamente nel browser.' },
    no: { title: 'Lås opp PDF', description: 'Dekrypter og lås opp passordbeskyttede PDF-filer direkte i nettleseren.' },
    ru: { title: 'Разблокировать PDF', description: 'Расшифровывайте и открывайте защищенные паролем документы в браузере.' },
    pt: { title: 'Desbloquear PDF', description: 'Descriptografe documentos PDF protegidos inteiramente no navegador.' },
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
    ur: { title: 'PDF سے ٹیکسٹ حاصل کریں', description: 'دستاویز سے خالص متن، پیراگراف اور ساخت نکال کر کاپی کریں۔' },
    hi: { title: 'PDF से टेक्स्ट / मार्कडाउन', description: 'अपने PDF दस्तावेज़ों से कच्चा टेक्स्ट और पठनीय सामग्री निकालें।' },
    ar: { title: 'تحويل PDF إلى نص', description: 'استخراج النصوص الصافية والمحتوى القابل للقراءة من مستندات PDF.' },
    zh: { title: 'PDF 转纯文本 / Markdown', description: '从 PDF 文档中提取格式化文本结构和段落内容。' },
    ja: { title: 'PDFテキスト抽出', description: 'PDFドキュメントからプレーンテキストやMarkdown形式で文章を抽出します。' },
    tl: { title: 'PDF patungong Teksto', description: 'Mag-extract ng teksto at nababasang nilalaman mula sa iyong mga PDF.' },
    de: { title: 'PDF zu Text / Markdown', description: 'Extrahieren Sie formatierten Text und lesbare Inhalte aus Ihren PDFs.' },
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
  sign: {
    en: { title: 'Sign PDF', description: 'Draw or stamp your digital signature onto legal agreements and forms.' },
    ur: { title: 'PDF پر دستخط کریں', description: 'قانونی معاہدوں اور فارمز پر ڈیجیٹل دستخط کھینچیں یا مہر لگائیں۔' },
    hi: { title: 'PDF पर हस्ताक्षर करें', description: 'दस्तावेजों और फॉर्म पर अपना डिजिटल हस्ताक्षर बनाएं या जोड़ें।' },
    ar: { title: 'توقيع PDF', description: 'رسم أو وضع توقيعك الرقمي على الاتفاقيات القانونية والنماذج.' },
    zh: { title: '签署 PDF', description: '在合同和表单上手绘签名或输入数字图章。' },
    ja: { title: 'PDF電子署名', description: 'マウスやタッチ操作で手書きサインを作成し、契約書に捺印します。' },
    tl: { title: 'Lagdaan ang PDF', description: 'Gumuhit o maglagay ng iyong digital na lagda sa mga kasunduan at form.' },
    de: { title: 'PDF unterschreiben', description: 'Zeichnen oder stempeln Sie Ihre digitale Unterschrift auf Verträge.' },
    fr: { title: 'Signer PDF', description: 'Dessinez ou appliquez votre signature numérique sur vos contrats.' },
    es: { title: 'Firmar PDF', description: 'Dibuja o estampa tu firma digital en acuerdos y formularios.' },
    it: { title: 'Firma PDF', description: 'Disegna o applica la tua firma digitale su moduli e contratti legali.' },
    no: { title: 'Signer PDF', description: 'Tegn eller stempl din digitale signatur på juridiske avtaler og skjemaer.' },
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
    en: { title: 'Repair PDF', description: 'Recover data from corrupted or damaged PDF files and restore viewable pages.' },
    ur: { title: 'خراب PDF کی مرمت (ریپیئر)', description: 'خراب یا کرپٹ فائلوں کا ڈیٹا بحال کریں اور پڑھنے کے قابل بنائیں۔' },
    hi: { title: 'PDF की मरम्मत करें', description: 'क्षतिग्रस्त PDF फाइलों से डेटा पुनर्प्राप्त करें और पृष्ठ पुनर्स्थापित करें।' },
    ar: { title: 'إصلاح PDF التالف', description: 'استعادة البيانات من ملفات PDF التالفة واستعادة الصفحات القابلة للقراءة.' },
    zh: { title: '修复受损 PDF', description: '重建交叉引用表并修复受损 PDF 流，尽可能恢复可读页面。' },
    ja: { title: '破損PDF修復', description: 'データ破損や構文エラーのあるPDFファイルを解析し修復を試みます。' },
    tl: { title: 'Kumpunihin ang PDF', description: 'I-recover ang data mula sa sirang PDF file at ibalik ang mga pahina.' },
    de: { title: 'PDF reparieren', description: 'Stellen Sie Daten aus beschädigten PDF-Dateien wieder her.' },
    fr: { title: 'Réparer PDF', description: 'Restaurez les données de fichiers PDF corrompus ou endommagés.' },
    es: { title: 'Reparar PDF', description: 'Recupera datos de archivos PDF dañados o corruptos y restaura páginas.' },
    it: { title: 'Ripara PDF', description: 'Recupera dati da file PDF danneggiati e ripristina le pagine visualizzabili.' },
    no: { title: 'Reparer skadet PDF', description: 'Gjenopprett data fra ødelagte PDF-filer og gjenopprett lesbare sider.' },
    ru: { title: 'Восстановить PDF', description: 'Восстанавливайте поврежденные файлы PDF и возвращайте читаемые страницы.' },
    pt: { title: 'Reparar PDF', description: 'Recupere dados de arquivos corrompidos e restaure páginas visualizáveis.' },
    ko: { title: '손상된 PDF 복구', description: '손상되거나 열리지 않는 PDF 파일의 구조를 재구성하여 복구를 시도합니다.' },
    tr: { title: 'PDF Onar', description: 'Bozuk veya hasarlı PDF dosyalarından verileri kurtarın ve sayfaları onarın.' },
    nl: { title: 'PDF Repareren', description: 'Herstel gegevens van beschadigde PDF-bestanden en herstel pagina\'s.' },
    pl: { title: 'Napraw uszkodzony PDF', description: 'Odzyskuj dane z uszkodzonych plików PDF i przywracaj strony.' },
    sv: { title: 'Reparera PDF', description: 'Återskapa data från skadade PDF-filer och återställ visningsbara sidor.' },
    id: { title: 'Perbaiki PDF Rusak', description: 'Pulihkan data dari file PDF yang rusak dan pulihkan halaman yang dapat dilihat.' },
    vi: { title: 'Sửa lỗi PDF hỏng', description: 'Khôi phục dữ liệu từ các tệp PDF bị lỗi hoặc hỏng để đọc lại.' },
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
    es: { title: 'Comparar PDF', description: 'Compara dos versiones lado a lado para detectar modificaciones.' },
    it: { title: 'Confronta PDF', description: 'Esamina due versioni affiancate per individuare le modifiche al testo.' },
    no: { title: 'Sammenlign PDF', description: 'Undersøk to versjoner side ved side for å fremheve endringer.' },
    ru: { title: 'Сравнить PDF', description: 'Сравнивайте две версии документов бок о бок для выявления изменений.' },
    pt: { title: 'Comparar PDF', description: 'Inspecione duas versões lado a lado para destacar alterações.' },
    ko: { title: 'PDF 문서 비교', description: '두 버전의 문서를 양옆에 나란히 놓고 동기화 스크롤로 차이점을 검토합니다.' },
    tr: { title: 'PDF Karşılaştır', description: 'Değişiklikleri görmek için iki belge sürümünü yan yana inceleyin.' },
    nl: { title: 'PDF\'s Vergelijken', description: 'Vergelijk twee versies naast elkaar om wijzigingen direct te zien.' },
    pl: { title: 'Porównaj PDF', description: 'Sprawdź dwie wersje obok siebie, aby szybko wyróżnić zmiany.' },
    sv: { title: 'Jämför PDF', description: 'Granska två versioner sida vid sida för att upptäcka ändringar.' },
    id: { title: 'Bandingkan PDF', description: 'Periksa dua versi dokumen berdampingan untuk melihat perubahan.' },
    vi: { title: 'So sánh tài liệu PDF', description: 'Xem hai phiên bản song song để làm nổi bật các thay đổi trên trang.' },
  },
};
