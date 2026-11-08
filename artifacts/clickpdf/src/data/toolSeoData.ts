import { getPluginSeoInfo } from '../tools/plugins/pluginLoader';
import { TOOL_PAGE_CONTENT } from './toolPageContent';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolHowToStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolBenefit {
  title: string;
  desc: string;
  iconName: string;
}

export interface ToolSeoInfo {
  slug: string;
  toolId: string;
  aliases: string[];
  h1Title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  targetKeywords: string[];
  badge: string;
  overviewHeading: string;
  overview: string;
  secondaryOverview: string;
  privacyHighlight: string;
  stepsHeading: string;
  steps: ToolHowToStep[];
  faqs: ToolFaq[];
  benefits: ToolBenefit[];
  relatedToolIds: string[];
}

function withToolPageContent(info: ToolSeoInfo): ToolSeoInfo {
  const content = TOOL_PAGE_CONTENT[info.toolId];
  return content ? { ...info, ...content } : info;
}

export const TOOL_SEO_REGISTRY: Record<string, ToolSeoInfo> = {
  merge: {
    slug: 'merge-pdf',
    toolId: 'merge',
    aliases: ['merge', 'combine-pdf', 'join-pdf', 'merge-pdf-files'],
    h1Title: 'Merge PDF Online — Combine Files in Your Browser',
    metaTitle: 'Merge PDF Online Free: Combine PDF Files | ClickPDF',
    metaDescription: 'Process one or more PDFs in your browser. Create a separate copy from one file or combine multiple files in your chosen order; review the output.',
    keywords: 'merge PDF online, combine PDF files, join PDF online, merge PDF files free',
    targetKeywords: ['merge PDF online', 'merge PDF online free', 'combine PDF files', 'merge PDF without sign up'],
    badge: 'Browser-Based Processing',
    overviewHeading: 'Merge PDFs into One File',
    overview: 'Add selected PDFs, put them in the required order, and export one combined file. Review links, forms, bookmarks, and annotations in the output because interactive features can vary between source documents.',
    secondaryOverview: 'File contents are processed in your browser; page resources and enabled third-party services may still make network requests. Processing time depends on the files and device.',
    privacyHighlight: 'Browser-Based Processing: Supported files are handled in your browser rather than sent to ClickPDF document-processing servers. The page may still request resources and enabled third-party services; browser memory is not a secure-erase guarantee.',
    stepsHeading: 'How to Combine Multiple PDFs in 3 Simple Steps',
    steps: [
      {
        step: 1,
        title: 'Upload or Drop PDF Files',
        description: 'Select one or more PDF documents from your device or drag them directly into the designated drop zone.'
      },
      {
        step: 2,
        title: 'Reorder Document Sequence',
        description: 'Reorder whole PDF files with drag and drop or the available sorting controls. Pages remain in their existing order within each source PDF; use Organize Pages on a source PDF first if you need to change page order.'
      },
      {
        step: 3,
        title: 'Generate & Download',
        description: 'Create and download the merged PDF in your browser. Processing time depends on your files and device, so review the output before sharing.'
      }
    ],
    faqs: [
      {
        question: 'Is there a limit on how many PDF files I can merge at once?',
        answer: 'There is no fixed file-size or page-count cap in the reviewed implementation, but available browser and device memory is a practical limit. Processing success depends on the files and device; try fewer or smaller PDFs if it fails.'
      },
      {
        question: 'Are my private documents uploaded to any remote server?',
        answer: 'Supported PDF files are processed in your browser and are not sent to ClickPDF’s document-processing servers. The webpage may still request resources, advertisements, and other enabled third-party services.'
      },
      {
        question: 'Will merging PDFs degrade visual quality or break hyperlinks?',
        answer: 'The merge operation works with PDF pages rather than flattening them into images. Interactive forms, links, annotations, and other features can vary by document, so review the downloaded result.'
      },
      {
        question: 'Can I reorder individual pages within the merged files?',
        answer: 'Merge PDF reorders whole source files, not individual pages or pages across documents. To change page order, use Organize Pages on a source PDF before adding it to Merge PDF.'
      }
    ],
    benefits: [
      { title: 'Browser-Based File Processing', desc: 'Selected files are processed in your browser; page resources and enabled third-party services may still make requests.', iconName: 'ShieldCheck' },
      { title: 'PDF Page Content', desc: 'Pages are merged as PDF content rather than flattened images; check forms, links, and other interactive features in the result.', iconName: 'Sparkles' },
      { title: 'Browser Processing', desc: 'Processing time depends on the number of files, page count, and available device memory.', iconName: 'Zap' },
      { title: 'Local PDF Processing', desc: 'File processing runs in your browser after required resources load; online features and page resources may still need a connection.', iconName: 'WifiOff' }
    ],
    relatedToolIds: ['split', 'organize', 'compress', 'rotate']
  },

  split: {
    slug: 'split-pdf',
    toolId: 'split',
    aliases: ['split', 'separate-pdf', 'extract-pdf-pages'],
    h1Title: 'Split PDF Online — Extract Pages or Page Ranges',
    metaTitle: 'Split PDF Online: Extract Pages & Ranges | ClickPDF',
    metaDescription: 'Split a PDF online by page range or export separate pages. Review the results; processing time depends on the file and device.',
    keywords: 'split PDF online, split PDF by page range, extract PDF pages, separate PDF pages',
    targetKeywords: ['split PDF online', 'split PDF by page range', 'extract PDF pages', 'separate PDF pages'],
    badge: 'Instant Page Extraction',
    overviewHeading: 'Split PDF Pages or Page Ranges',
    overview: 'Enter page numbers or ranges to extract, or use the available per-page output option. Review the resulting PDFs before sharing and confirm that the selected pages are correct.',
    secondaryOverview: 'Selected file contents are processed in your browser; the page may still request site resources and enabled services. Processing time and practical file size depend on the document and available device memory.',
    privacyHighlight: 'Zero Cloud Storage: The original file remains in your device’s local memory. The newly created extract files are packaged directly as standard PDFs ready for immediate download.',
    stepsHeading: 'How to Split and Extract PDF Pages',
    steps: [
      {
        step: 1,
        title: 'Choose Your PDF Document',
        description: 'Drop your multi-page PDF into the workspace or browse your local file system.'
      },
      {
        step: 2,
        title: 'Specify Page Ranges or Extraction Mode',
        description: 'Type specific page numbers (e.g. 1-4, 7) or choose "Split Every Page" to generate individual single-page documents.'
      },
      {
        step: 3,
        title: 'Download Extracted Files',
        description: 'Click "Split PDF" to generate and download your extracted files individually or as a clean ZIP package.'
      }
    ],
    faqs: [
      {
        question: 'Can I extract multiple non-consecutive page ranges at once?',
        answer: 'Yes! Simply comma-separate your ranges, such as "1-3, 7, 10-15". ClickPDF will extract precisely those pages in your exact requested order.'
      },
      {
        question: 'What happens if I enter an invalid page number?',
        answer: 'ClickPDF validates your page inputs against the document total before generating, ensuring no broken or missing pages occur.'
      },
      {
        question: 'Can I split password-protected PDFs?',
        answer: 'If the document is protected with Web Crypto, use our Unlock PDF tool first to decrypt it, then split pages freely.'
      }
    ],
    benefits: [
      { title: 'Custom Range Syntax', desc: 'Easily define ranges like 1-5, 8, 12-20 with automatic validation.', iconName: 'Sliders' },
      { title: 'Page Range Selection', desc: 'Enter page numbers or ranges to choose the content to extract.', iconName: 'Gauge' },
      { title: 'ZIP Batch Download', desc: 'Multiple extracted pages can be bundled automatically into a single ZIP.', iconName: 'Archive' },
      { title: 'Browser File Processing', desc: 'Selected file contents are processed in your browser; page resources and enabled services may still make requests.', iconName: 'Lock' }
    ],
    relatedToolIds: ['merge', 'organize', 'compress', 'pdf-to-text']
  },

  compress: {
    slug: 'compress-pdf',
    toolId: 'compress',
    aliases: ['compress', 'reduce-pdf-size', 'shrink-pdf', 'optimize-pdf'],
    h1Title: 'Compress PDF Online — Choose Compression Settings',
    metaTitle: 'Compress PDF Online: Reduce File Size | ClickPDF',
    metaDescription: 'Compress PDF files online in your browser and compare the output with the original. Size reduction depends on each file and the selected settings.',
    keywords: 'compress PDF online, reduce PDF file size, compress PDF to 200 KB, PDF compression settings',
    targetKeywords: ['compress PDF online', 'reduce PDF file size online', 'compress PDF online free', 'compress PDF to 200 KB'],
    badge: 'Smart In-Browser Optimization',
    overviewHeading: 'Choose Compression Settings and Review the Result',
    overview: 'Use the available compression presets, quality, and rendering settings to reduce a PDF where possible. Some PDFs may not get smaller; compare the output with the original and inspect text and images before sharing.',
    secondaryOverview: 'The amount of compression depends on the source document and selected settings. Processing time and practical file size also depend on browser support and available device memory.',
    privacyHighlight: 'Browser-Based Compression: Supported files are compressed in your browser rather than sent to ClickPDF document-processing servers. The page may still make requests for resources and enabled third-party services.',
    stepsHeading: 'How to Compress a PDF Document',
    steps: [
      {
        step: 1,
        title: 'Select Your Oversized PDF',
        description: 'Drag and drop your file into the compressor interface.'
      },
      {
        step: 2,
        title: 'Choose Compression Level',
        description: 'Select Recommended Compression for balanced visual quality, or Maximum Compression for extreme file size reduction.'
      },
      {
        step: 3,
        title: 'Save Optimized PDF',
        description: 'Compare before-and-after file sizes in real time and download your lightweight PDF with one click.'
      }
    ],
    faqs: [
      {
        question: 'Will compressing my PDF make the text blurry or unreadable?',
        answer: 'No. Our compression engine optimizes redundant structural metadata and image streams while preserving vector font outlines, guaranteeing sharp readability on all screens and prints.'
      },
      {
        question: 'Can I batch compress multiple PDFs together?',
        answer: 'Yes! ClickPDF includes a dedicated Batch Queue Engine that allows you to process multiple documents concurrently directly inside your browser.'
      },
      {
        question: 'Why is client-side compression faster than cloud compressors?',
        answer: 'Cloud compressors require uploading multi-megabyte files over home internet, waiting in a server job queue, and downloading the result. ClickPDF eliminates network transfer entirely.'
      }
    ],
    benefits: [
      { title: 'Compare File Sizes', desc: 'Review the original and output sizes; some PDFs may not shrink with the selected settings.', iconName: 'Percent' },
      { title: 'Compression Presets', desc: 'Choose from the available compression settings and inspect the resulting file.', iconName: 'Zap' },
      { title: 'Reviewable Output', desc: 'Open the compressed PDF and check text, diagrams, and images before sharing.', iconName: 'Eye' },
      { title: 'Browser File Processing', desc: 'Selected file contents are processed in your browser; page resources and enabled services may still make requests.', iconName: 'Shield' }
    ],
    relatedToolIds: ['merge', 'split', 'organize', 'pdf-to-text']
  },

  'jpg-to-pdf': {
    slug: 'image-to-pdf',
    toolId: 'jpg-to-pdf',
    aliases: ['jpg-to-pdf', 'png-to-pdf', 'images-to-pdf', 'convert-jpg-to-pdf'],
    h1Title: 'JPG to PDF Online — Convert JPG, PNG & WebP',
    metaTitle: 'JPG to PDF Online Free: Convert Images to PDF | ClickPDF',
    metaDescription: 'Convert JPG, PNG, and WebP images to PDF online. Arrange images and choose page orientation and margins; page resources may still make requests.',
    keywords: 'JPG to PDF online, JPG to PDF online free, PNG to PDF online, WebP to PDF',
    targetKeywords: ['JPG to PDF online', 'JPG to PDF online free', 'PNG to PDF online', 'WebP to PDF'],
    badge: 'High-Res Vector Layout',
    overviewHeading: 'Convert JPG, PNG, or WebP Images to PDF',
    overview: 'Add one or more JPG, PNG, or WebP images, arrange their order, and choose page orientation and margins before creating a PDF. Check the exported pages for fit and order.',
    secondaryOverview: 'Selected image files are processed in your browser; page resources and enabled services may still make network requests. Large images can require more device memory.',
    privacyHighlight: 'Browser-Based Image Conversion: Selected images are processed in your browser rather than sent to ClickPDF document-processing servers. The page may still request resources, ads, or enabled third-party services.',
    stepsHeading: 'How to Convert Images to PDF in Seconds',
    steps: [
      {
        step: 1,
        title: 'Add One or Multiple Images',
        description: 'Drag and drop your JPG, PNG, or WebP images into the workspace.'
      },
      {
        step: 2,
        title: 'Arrange Order & Orientation',
        description: 'Reorder pictures into your preferred flow and choose portrait or landscape orientation.'
      },
      {
        step: 3,
        title: 'Generate PDF Document',
        description: 'Click "Convert to PDF" to compile your pictures into an organized, print-ready document.'
      }
    ],
    faqs: [
      {
        question: 'Can I combine multiple pictures into a single multi-page PDF?',
        answer: 'Yes! You can add as many images as you need, drag to rearrange the sequence, and ClickPDF will assemble them into a single clean PDF.'
      },
      {
        question: 'What image file formats are supported?',
        answer: 'We support JPG, JPEG, PNG, and modern WebP image formats.'
      },
      {
        question: 'Does the converter reduce photo resolution or compress colors?',
        answer: 'Original image dimensions and color depths are retained directly within the PDF media box, guaranteeing maximum visual fidelity for printing.'
      }
    ],
    benefits: [
      { title: 'Multi-Image Stitching', desc: 'Combine multiple snapshots into a single tidy PDF dossier.', iconName: 'Layers' },
      { title: 'Orientation Control', desc: 'Choose between Portrait and Landscape layout per document.', iconName: 'Maximize2' },
      { title: 'Browser-Based Conversion', desc: 'Selected images are converted in your browser; page resources and enabled services may still make requests.', iconName: 'Wifi' },
      { title: 'Page Layout Options', desc: 'Choose page orientation and margins before downloading the PDF.', iconName: 'Zap' }
    ],
    relatedToolIds: ['merge', 'organize', 'compress', 'watermark']
  },

  'pdf-to-image': {
    slug: 'pdf-to-image',
    toolId: 'pdf-to-image',
    aliases: ['pdf-to-png', 'convert-pdf-to-images'],
    h1Title: 'PDF to PNG Converter Online — Export Page Images',
    metaTitle: 'PDF to PNG Online: Convert PDF Pages to Images | ClickPDF',
    metaDescription: 'Convert PDF pages to PNG images online, reorder, rotate, duplicate, or remove pages, then download a ZIP. Batch size depends on available device memory.',
    keywords: 'PDF to PNG online, convert PDF pages to PNG, PDF pages to images, PDF to PNG converter',
    targetKeywords: ['PDF to PNG online', 'PDF to PNG online free', 'convert PDF pages to PNG', 'PDF pages to images'],
    badge: 'PNG Page Export',
    overviewHeading: 'Export PDF Pages as PNG Images',
    overview: 'Convert pages from one or more PDF documents into separate PNG images. Preview your pages, choose their order, rotate sideways scans, duplicate a page or remove unwanted pages before exporting. Each remaining page becomes an image in the downloaded ZIP.',
    secondaryOverview: 'The tool renders pages in your browser and packages the images in a ZIP. Processing time and practical batch size depend on page dimensions, output resolution, and available device memory.',
    privacyHighlight: 'Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. The page may still request resources, ads, or enabled third-party services.',
    stepsHeading: 'How to Convert PDF Pages to Images',
    steps: [
      {
        step: 1,
        title: 'Add One or Multiple PDFs',
        description: 'Choose your PDF files or drag them into the workspace. Use Add Files to include more documents.'
      },
      {
        step: 2,
        title: 'Arrange and Adjust Pages',
        description: 'Switch between documents to reorder, rotate, copy or delete pages. Each document keeps its own page edits.'
      },
      {
        step: 3,
        title: 'Export and Download PNG Images',
        description: 'Select Export all PDFs as PNG images, then download the ZIP. Each document has a separate folder of numbered PNG files.'
      }
    ],
    faqs: [
      {
        question: 'Can I convert several PDF files at the same time?',
        answer: 'Yes. Select multiple PDFs or add more files inside the workspace. Export processes the documents in sequence and packages their images into a single ZIP, with a separate folder for each document. Very large batches may exceed your browser’s available memory.'
      },
      {
        question: 'Which image format will I get?',
        answer: 'This tool currently exports PNG images. Each retained PDF page becomes a separate numbered PNG file; the tool does not currently offer JPG output.'
      },
      {
        question: 'Can I remove, copy or rotate pages before converting?',
        answer: 'Yes. Use the page controls to delete unwanted pages, duplicate pages, rotate scans and change the page order before exporting. When you switch between PDFs, the current document’s page edits are kept.'
      },
      {
        question: 'Are my PDF documents uploaded to a server?',
        answer: 'No. PDF rendering and image generation take place locally in your browser. Keep the page open until conversion and ZIP packaging finish.'
      },
      {
        question: 'Will the exported images contain editable PDF text?',
        answer: 'PNG files preserve the rendered appearance of each page, but do not retain selectable text, interactive forms or clickable PDF links. Keep your original PDF if you need those features.'
      }
    ],
    benefits: [
      { title: 'Multiple Documents', desc: 'Export PDFs into separate document folders within one ZIP.', iconName: 'Layers' },
      { title: 'Page Controls', desc: 'Reorder, rotate, duplicate or remove pages before conversion.', iconName: 'LayoutGrid' },
      { title: 'Browser-Based Conversion', desc: 'Render pages in your browser; page resources and enabled services may still make network requests.', iconName: 'Shield' }
    ],
    relatedToolIds: ['jpg-to-pdf', 'organize', 'rotate', 'compress']
  },

  rotate: {
    slug: 'rotate-pdf',
    toolId: 'rotate',
    aliases: ['rotate', 'turn-pdf', 'fix-pdf-orientation'],
    h1Title: 'Rotate PDF Pages Online — Preview and Save',
    metaTitle: 'Rotate PDF Pages Online: Fix Orientation | ClickPDF',
    metaDescription: 'Rotate individual PDF pages or the full document, preview the orientation, and download a corrected copy. Results can vary by file.',
    keywords: 'rotate PDF pages online, rotate PDF one page, fix PDF orientation, rotate PDF file online',
    targetKeywords: ['rotate PDF pages online', 'rotate PDF pages online one by one', 'rotate PDF file online', 'fix PDF orientation'],
    badge: 'Interactive Page Preview',
    overviewHeading: 'Rotate One or More PDF Pages',
    overview: 'Choose the pages to rotate, preview their orientation, and save a corrected PDF copy. Check the result in your preferred PDF reader before sharing or printing.',
    secondaryOverview: 'Rotation changes are written to the output PDF. Display can vary by viewer, so review the saved copy in the software you plan to use.',
    privacyHighlight: 'Local Canvas Rendering: Each page thumbnail is rendered locally in an offscreen HTML5 canvas using PDF.js. Your document content remains strictly private.',
    stepsHeading: 'How to Rotate PDF Pages Permanently',
    steps: [
      {
        step: 1,
        title: 'Open Your Document',
        description: 'Upload your PDF to load thumbnail previews of every page in real time.'
      },
      {
        step: 2,
        title: 'Rotate Page by Page or All at Once',
        description: 'Click the rotation buttons on individual pages or use the "Rotate All 90°" button.'
      },
      {
        step: 3,
        title: 'Download Corrected PDF',
        description: 'Save your permanently oriented PDF file ready for presentation or printing.'
      }
    ],
    faqs: [
      {
        question: 'Is this rotation permanent or just a temporary view zoom?',
        answer: 'The rotation is 100% permanent. ClickPDF modifies the internal ISO PDF page rotation matrices so the file appears correctly in any viewer or print output.'
      },
      {
        question: 'Can I rotate only page 2 and page 5 while leaving the rest untouched?',
        answer: 'Yes! Our visual grid allows you to rotate any individual page independently.'
      },
      {
        question: 'Will rotating pages alter text formatting or images?',
        answer: 'No. The visual contents, embedded fonts, and vector paths remain untouched; only the page viewing angle metadata is updated.'
      }
    ],
    benefits: [
      { title: 'Visual Thumbnail Grid', desc: 'Inspect live rendered thumbnails before applying permanent changes.', iconName: 'Grid' },
      { title: 'Individual or Bulk Rotate', desc: 'Rotate specific single pages or the entire document together.', iconName: 'RotateCw' },
      { title: 'Saved Page Rotation', desc: 'Rotation is written to the exported PDF; confirm display in the reader you use.', iconName: 'CheckCircle2' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; page resources and enabled third-party services may still make network requests.', iconName: 'Shield' }
    ],
    relatedToolIds: ['organize', 'split', 'merge', 'pdf-to-image']
  },

  organize: {
    slug: 'organize-pdf',
    toolId: 'organize',
    aliases: ['organize', 'reorder-pdf', 'rearrange-pdf-pages', 'delete-pdf-pages'],
    h1Title: 'Organize PDF Pages Online — Reorder and Delete',
    metaTitle: 'Organize PDF Pages Online: Reorder & Delete | ClickPDF',
    metaDescription: 'Reorder or delete PDF pages in your browser. Review the saved copy; deleting pages is not secure redaction and may not remove underlying content.',
    keywords: 'organize PDF pages online, reorder PDF pages, arrange PDF pages, delete PDF pages',
    targetKeywords: ['organize PDF pages online', 'rearrange PDF pages online', 'reorder PDF pages online', 'delete PDF pages'],
    badge: 'Drag & Drop Page Editor',
    overviewHeading: 'Reorder or Delete PDF Pages',
    overview: 'Arrange PDF pages in a new order or remove pages you do not need, then save a separate copy. Review the output before sharing; deleting a page is not secure redaction and may not remove information elsewhere in the document.',
    secondaryOverview: 'Selected file contents are processed in your browser; page resources and enabled third-party services may still make network requests. Processing limits depend on the file and device.',
    privacyHighlight: 'Private In-Browser Assembly: When you delete or reorder pages, the new document is assembled entirely in local browser memory without uploading any pages.',
    stepsHeading: 'How to Organize and Reorder PDF Pages',
    steps: [
      {
        step: 1,
        title: 'Upload Your PDF File',
        description: 'Drop your document into the organizer to view all pages in an interactive grid.'
      },
      {
        step: 2,
        title: 'Rearrange and Refine Pages',
        description: 'Drag pages into your desired sequence, click the trash icon on unwanted pages, or rotate individual sheets.'
      },
      {
        step: 3,
        title: 'Save Reorganized PDF',
        description: 'Click "Save Changes" to download your polished, re-sequenced document.'
      }
    ],
    faqs: [
      {
        question: 'Can I delete multiple pages at once?',
        answer: 'Yes! You can click the delete icon on any thumbnail, or use bulk selection to remove multiple pages swiftly.'
      },
      {
        question: 'Can I undo accidental page deletions or moves?',
        answer: 'Yes! The visual organizer maintains an undo history, and your original file on disk is never modified until you download the result.'
      },
      {
        question: 'Does organizing pages break document bookmarks?',
        answer: 'Pages and content streams are preserved cleanly according to PDF 1.7 standards.'
      }
    ],
    benefits: [
      { title: 'Intuitive Drag & Drop', desc: 'Reorder pages effortlessly with smooth visual feedback.', iconName: 'Move' },
      { title: 'One-Click Page Deletion', desc: 'Purge blank pages and confidential sheets with a click.', iconName: 'Trash2' },
      { title: 'Browser Page Preview', desc: 'Preview PDF pages in your browser before saving the organized copy.', iconName: 'Zap' },
      { title: 'Browser-Based Processing', desc: 'Selected files are processed in your browser, not sent to ClickPDF document-processing servers; the page may still make resource or third-party requests.', iconName: 'Lock' }
    ],
    relatedToolIds: ['merge', 'split', 'rotate', 'page-numbers']
  },

  watermark: {
    slug: 'watermark-pdf',
    toolId: 'watermark',
    aliases: ['watermark', 'stamp-pdf', 'add-watermark', 'pdf-watermark-online'],
    h1Title: 'Add a Text Watermark to PDF Online',
    metaTitle: 'Add Watermark to PDF Online: Text Marks | ClickPDF',
    metaDescription: 'Add a text watermark to PDF pages. Set its wording, color, angle, and opacity, then save a copy. A watermark does not encrypt or redact document content.',
    keywords: 'add watermark to PDF online, add text watermark to PDF, add confidential watermark to PDF',
    targetKeywords: ['add watermark to PDF online', 'add text watermark to PDF', 'add confidential watermark to PDF', 'watermark PDF online free'],
    badge: 'Custom Vector Stamps',
    overviewHeading: 'Add a Text Watermark to PDF Pages',
    overview: 'Enter the text for the watermark and adjust the available appearance settings, including color, angle, and opacity. Review the saved PDF to confirm placement and readability.',
    secondaryOverview: 'A watermark is a visible mark, not encryption or secure redaction. Selected file contents are processed in your browser; page resources and enabled services may still make network requests.',
    privacyHighlight: 'Local Vector Stamping: The watermark layer is merged into the PDF content stream using standard Type 1 fonts directly inside your web browser.',
    stepsHeading: 'How to Watermark a PDF Document',
    steps: [
      {
        step: 1,
        title: 'Upload Your PDF',
        description: 'Drop your document into the watermark workspace.'
      },
      {
        step: 2,
        title: 'Configure Watermark Settings',
        description: 'Type your custom watermark text, pick a color, set the angle and opacity, and select page targets.'
      },
      {
        step: 3,
        title: 'Download Watermarked PDF',
        description: 'Click "Apply Watermark" to generate your stamped file instantly.'
      }
    ],
    faqs: [
      {
        question: 'Can the watermark be easily erased by recipients?',
        answer: 'Our tool embeds the watermark into the document’s native content stream rather than a superficial HTML overlay, making it permanent across standard PDF viewers.'
      },
      {
        question: 'Can I watermark only specific pages?',
        answer: 'Yes! You can apply the stamp to all pages, odd pages, even pages, or custom page selections.'
      },
      {
        question: 'Can I customize the opacity so the text underneath remains readable?',
        answer: 'Yes! You can slide opacity down to 15% or 25% for subtle background stamps that keep primary text 100% legible.'
      }
    ],
    benefits: [
      { title: 'Full Opacity & Angle Tuning', desc: 'Dial in the exact transparency and diagonal slant desired.', iconName: 'Sliders' },
      { title: 'Vector-Sharp Typography', desc: 'Watermarks remain crisp at any zoom level or high-DPI print.', iconName: 'Type' },
      { title: 'Browser-Based Processing', desc: 'Supported files are handled in your browser; page resources and enabled third-party services may still make network requests.', iconName: 'Shield' },
      { title: 'Instant Live Preview', desc: 'Inspect how the watermark will look before saving.', iconName: 'Eye' }
    ],
    relatedToolIds: ['protect', 'page-numbers', 'sign', 'merge']
  },

  'page-numbers': {
    slug: 'page-numbers-pdf',
    toolId: 'page-numbers',
    aliases: ['page-numbers', 'add-page-numbers', 'number-pdf', 'paginate-pdf'],
    h1Title: 'Add Page Numbers to PDF Online — Set Format',
    metaTitle: 'Add Page Numbers to PDF Online Tool | ClickPDF',
    metaDescription: 'Add page numbers to a PDF online. Choose a position and numbering format, set the starting number or cover-page behavior, then review the saved copy.',
    keywords: 'add page numbers to PDF online, number PDF pages, PDF page numbering, PDF pagination',
    targetKeywords: ['add page numbers to PDF online', 'number PDF pages online', 'add PDF page numbers free', 'PDF pagination'],
    badge: 'Dynamic Header/Footer',
    overviewHeading: 'Choose a Page Number Format and Position',
    overview: 'Add page numbers to a PDF, choose a position and format, set a starting number, and optionally skip the cover page. Review the saved copy to confirm numbering and placement.',
    secondaryOverview: 'The tool adds page-number content to the output PDF. Selected file contents are processed in your browser; page resources and enabled services may still make network requests.',
    privacyHighlight: 'Private Local Rendering: Your documents are paginated in memory on your device, ensuring zero leaks of sensitive transcripts or manuscripts.',
    stepsHeading: 'How to Number PDF Pages in Seconds',
    steps: [
      {
        step: 1,
        title: 'Upload Your PDF Document',
        description: 'Drop your un-numbered PDF file into the pagination tool.'
      },
      {
        step: 2,
        title: 'Choose Position & Format',
        description: 'Select alignment (bottom-center, bottom-right, header, etc.), number format, font size, and optional cover skip.'
      },
      {
        step: 3,
        title: 'Generate & Save',
        description: 'Click "Apply Page Numbers" to download your numbered document immediately.'
      }
    ],
    faqs: [
      {
        question: 'Can I skip numbering on the cover page?',
        answer: 'Yes! Toggle the "Skip Cover Page" option to start numbering on page 2 while keeping the cover clean.'
      },
      {
        question: 'Can I start numbering at a custom number like page 25?',
        answer: 'Yes! You can specify any start number to match existing appendixes or book chapters.'
      },
      {
        question: 'Does this overwrite existing footer text?',
        answer: 'You can adjust margin offsets to place numbers precisely away from existing footer or header content.'
      }
    ],
    benefits: [
      { title: 'Flexible Positions', desc: 'Choose top or bottom, aligned left, center, or right.', iconName: 'Compass' },
      { title: 'Custom Formats', desc: 'Supports "Page X of Y", "X / Y", Roman numerals, or plain digits.', iconName: 'Hash' },
      { title: 'Cover Page Exclusion', desc: 'Keep title pages clean while numbering internal body sheets.', iconName: 'FileCheck' },
      { title: 'Client-Side Speed', desc: 'Paginates hundreds of pages in just fractions of a second.', iconName: 'Zap' }
    ],
    relatedToolIds: ['watermark', 'organize', 'merge', 'edit-metadata']
  },

  'edit-metadata': {
    slug: 'edit-pdf-metadata',
    toolId: 'edit-metadata',
    aliases: ['edit-metadata', 'change-pdf-author', 'pdf-properties', 'wipe-pdf-metadata'],
    h1Title: 'Edit PDF Metadata Online — Update Supported Fields',
    metaTitle: 'Edit PDF Metadata Online: Title & Author | ClickPDF',
    metaDescription: 'Edit PDF metadata online: update or clear Title, Author, Subject, Keywords, Creator, and Producer. Other metadata and visible page content may remain.',
    keywords: 'edit PDF metadata online, edit PDF properties online, change PDF author, edit PDF title metadata',
    targetKeywords: ['edit PDF metadata online', 'edit PDF properties online', 'change PDF author online', 'edit PDF title metadata'],
    badge: 'PDF Property Editor',
    overviewHeading: 'Inspect or Edit Supported PDF Properties',
    overview: 'PDF files can contain document properties such as a title, author, subject, keywords, creator, and producer. ClickPDF lets you inspect and update these six supported fields, or clear them from the saved copy.',
    secondaryOverview: 'Clearing supported properties does not guarantee that a PDF is anonymous. This tool does not remove names printed on PDF pages and is not a redaction tool. Creation or modification dates, XMP data, comments, annotations, and attachments are not guaranteed to be cleared; review them separately before sharing.',
    privacyHighlight: 'Browser-Based Processing: PDF processing runs in the browser in the current implementation. The website may still make requests for page resources or enabled services.',
    stepsHeading: 'How to Edit Supported PDF Properties',
    steps: [
      {
        step: 1,
        title: 'Open your PDF',
        description: 'Open your PDF to inspect the supported document properties.'
      },
      {
        step: 2,
        title: 'Edit or clear fields',
        description: 'Edit the fields you want to keep, or choose Clear Supported Metadata Fields.'
      },
      {
        step: 3,
        title: 'Save and review',
        description: 'Save the PDF, reopen it, and check the properties and visible pages before sharing.'
      }
    ],
    faqs: [
      {
        question: 'Which PDF properties can I edit?',
        answer: 'You can inspect or update Title, Author, Subject, Keywords, Creator, and Producer when those fields are present.'
      },
      {
        question: 'What does Clear Supported Metadata Fields remove?',
        answer: 'It clears the six supported properties listed above from the saved copy. Other metadata or document content may remain.'
      },
      {
        question: 'Will this make my PDF anonymous?',
        answer: 'No. It does not guarantee anonymity, remove names printed on pages, or replace a redaction workflow.'
      },
      {
        question: 'Does it remove dates, comments, attachments, or XMP data?',
        answer: 'Those items are not guaranteed to be removed by this cleanup. Check the saved PDF and the recipient’s requirements separately.'
      },
      {
        question: 'Is my PDF uploaded to ClickPDF for metadata processing?',
        answer: 'The current implementation processes the selected PDF in the browser. The page may still request site resources or enabled services; this is not a claim of zero network activity.'
      }
    ],
    benefits: [
      { title: 'Inspect Supported Properties', desc: 'View Title, Author, Subject, Keywords, Creator, and Producer when present.', iconName: 'Search' },
      { title: 'Edit PDF Properties', desc: 'Update the supported fields and save a revised PDF.', iconName: 'Tag' },
      { title: 'Clear Supported Fields', desc: 'Remove the six supported property values from the saved copy.', iconName: 'EyeOff' },
      { title: 'Browser-Based Processing', desc: 'PDF processing runs in the browser in the current implementation. The website may still make requests for page resources or enabled services.', iconName: 'Zap' }
    ],
    relatedToolIds: ['metadata', 'protect', 'unlock', 'organize']
  },

  metadata: {
    slug: 'ocr-pdf-analysis',
    toolId: 'metadata',
    aliases: ['metadata', 'pdf-ocr', 'ocr-pdf', 'page-counter', 'pdf-text-recognition'],
    h1Title: 'PDF OCR and Page Count Checker Online',
    metaTitle: 'PDF OCR and Page Count Checker | ClickPDF',
    metaDescription: 'Run OCR on scanned PDF pages and check page count, dimensions, and document details. OCR text is separate; the source PDF is not made searchable.',
    keywords: 'PDF OCR and page count checker, PDF page count checker, extract text from scanned PDF, PDF dimensions checker',
    targetKeywords: ['PDF OCR and page count checker', 'PDF page count checker', 'extract text from scanned PDF', 'PDF dimensions checker'],
    badge: 'Tesseract.js WebAssembly OCR',
    overviewHeading: 'Run OCR and Inspect PDF Page Details',
    overview: 'Use OCR to recognize text on scanned PDF pages and inspect page count, dimensions, and available document details. OCR results are presented separately; this tool does not rewrite the source PDF as a searchable PDF.',
    secondaryOverview: 'OCR recognition can vary with scan quality, language, and page layout. Review the extracted text and document details before relying on them.',
    privacyHighlight: 'Private Local Machine Learning: Tesseract.js runs inside your browser’s Web Worker. Your sensitive scanned checks, medical records, and contracts never reach third-party AI APIs.',
    stepsHeading: 'How to Run Client-Side OCR on Scanned PDFs',
    steps: [
      {
        step: 1,
        title: 'Upload Scanned PDF',
        description: 'Drop your scanned document into the analyzer interface.'
      },
      {
        step: 2,
        title: 'Run Neural OCR Analysis',
        description: 'Click "Extract Scanned Text (OCR)" to initiate the local WebAssembly recognition engine.'
      },
      {
        step: 3,
        title: 'Copy or Download Recognized Text',
        description: 'View the transcribed text, copy it with one click, or export it as a clean text file.'
      }
    ],
    faqs: [
      {
        question: 'Does this OCR send my images to cloud AI servers like OpenAI or Google?',
        answer: 'The OCR engine runs in your browser on your device. Supported file contents are not sent to ClickPDF document-processing servers, though the page may still request resources and enabled third-party services.'
      },
      {
        question: 'What scanning resolution produces the best OCR results?',
        answer: 'Documents scanned at 200–300 DPI produce the highest recognition accuracy for typed fonts.'
      },
      {
        question: 'Can I inspect page dimensions and PDF version details?',
        answer: 'Yes! The analysis panel displays exact width, height, aspect ratio, ISO version, and page totals.'
      }
    ],
    benefits: [
      { title: 'OCR Text Review', desc: 'Review recognized text separately from the original PDF; recognition varies with scan quality and language.', iconName: 'Coins' },
      { title: 'Local WebAssembly Engine', desc: 'Fast, secure neural text recognition right on your machine.', iconName: 'Cpu' },
      { title: 'Comprehensive Diagnostics', desc: 'Inspect page counts, security tags, dimensions, and fonts.', iconName: 'Activity' },
      { title: 'One-Click Text Copy', desc: 'Instantly paste extracted paragraphs into your word processor.', iconName: 'Clipboard' }
    ],
    relatedToolIds: ['pdf-to-text', 'edit-metadata', 'compress', 'split']
  },

  protect: {
    slug: 'protect-pdf-password',
    toolId: 'protect',
    aliases: ['protect', 'encrypt-pdf', 'lock-pdf', 'password-protect-pdf'],
    h1Title: 'Protect PDF Online — Use ClickPDF Encryption',
    metaTitle: 'Protect PDF Online: ClickPDF Format | ClickPDF',
    metaDescription: 'Encrypt PDF files in your browser with ClickPDF Protect. This custom wrapper is not standard PDF password protection; open it with ClickPDF Unlock.',
    keywords: 'protect PDF online, password protect PDF, ClickPDF encrypted PDF wrapper, encrypt PDF in browser',
    targetKeywords: ['protect PDF online', 'protect PDF with password online', 'encrypt PDF in browser', 'ClickPDF protected PDF'],
    badge: 'Hardware AES-256-GCM',
    overviewHeading: 'Create a ClickPDF-Protected PDF File',
    overview: 'This tool encrypts the selected PDF content in your browser and saves a ClickPDF-specific protected PDF wrapper. The output is not standard PDF password protection and must be opened with ClickPDF Unlock or the supplied compatible vault.',
    secondaryOverview: 'Use a password you can retain securely: ClickPDF cannot recover a forgotten password. Page resources and enabled services may still make network requests.',
    privacyHighlight: 'In-Browser Decryption: The tool handles the selected PDF and password in your browser rather than sending them to ClickPDF document-processing servers. This does not guarantee protection from device compromise; the page may still make resource and third-party requests.',
    stepsHeading: 'How to Encrypt a PDF Document Securely',
    steps: [
      {
        step: 1,
        title: 'Upload Confidential PDF',
        description: 'Drop your sensitive file into the encryption workspace.'
      },
      {
        step: 2,
        title: 'Set a Strong Password',
        description: 'Type your chosen password and optional hint. The real-time strength meter verifies password entropy.'
      },
      {
        step: 3,
        title: 'Download Encrypted File',
        description: 'Click "Encrypt & Protect" to download your AES-256-encrypted file.'
      }
    ],
    faqs: [
      {
        question: 'Does ClickPDF store or remember my password?',
        answer: 'The decryption calculation runs in your browser. The password and selected file are not sent to ClickPDF document-processing servers; browser memory and device security are managed by your browser and device.'
      },
      {
        question: 'What encryption cipher is used?',
        answer: 'We use industry-standard AES-256-GCM (Galois/Counter Mode) with PBKDF2 key derivation and random cryptographic salt.'
      },
      {
        question: 'How do I open the encrypted PDF later?',
        answer: 'Simply use our Unlock PDF tool in any modern browser, enter your password, and restore your original file.'
      }
    ],
    benefits: [
      { title: 'Zero-Knowledge Architecture', desc: 'No central database or third party holds decryption keys.', iconName: 'ShieldAlert' },
      { title: 'Browser Web Crypto', desc: 'Uses Web Crypto AES-GCM with PBKDF2-SHA-256 for the ClickPDF-specific protected format.', iconName: 'Cpu' },
      { title: 'Brute-Force Resistant', desc: 'Derived with high-iteration PBKDF2 key-stretching and unique salts.', iconName: 'Key' },
      { title: 'ClickPDF-Specific Format', desc: 'The protected output is not standard PDF password protection and requires a compatible ClickPDF unlock workflow.', iconName: 'Check' }
    ],
    relatedToolIds: ['unlock', 'watermark', 'edit-metadata', 'sign']
  },

  unlock: {
    slug: 'unlock-pdf-password',
    toolId: 'unlock',
    aliases: ['unlock', 'decrypt-pdf', 'remove-pdf-password', 'unlock-pdf-online'],
    h1Title: 'Unlock PDF Online — Open ClickPDF-Protected Files',
    metaTitle: 'Unlock PDF Online: ClickPDF-Protected Files | ClickPDF',
    metaDescription: 'Unlock files created by ClickPDF Protect with the correct password. This tool does not remove unknown passwords or unlock arbitrary standard PDF encryption.',
    keywords: 'unlock PDF online, unlock ClickPDF-protected PDF, decrypt ClickPDF PDF, remove PDF password',
    targetKeywords: ['unlock PDF online', 'unlock ClickPDF-protected PDF', 'decrypt ClickPDF PDF', 'remove PDF password'],
    badge: 'Private In-Browser Decrypt',
    overviewHeading: 'Unlock Files Created by ClickPDF Protect',
    overview: 'Use the correct password to decrypt a file created by ClickPDF Protect. This tool does not remove unknown passwords or unlock arbitrary standard PDF encryption.',
    secondaryOverview: 'The selected file and password are processed in your browser; page resources and enabled third-party services may still make network requests. A forgotten password cannot be recovered by ClickPDF.',
    privacyHighlight: 'Private Key Verification: All key derivation and authentication occurs locally in RAM. No failed attempt logs or credentials leave your computer.',
    stepsHeading: 'How to Decrypt and Unlock Your PDF',
    steps: [
      {
        step: 1,
        title: 'Open Encrypted File',
        description: 'Drop your protected PDF into the unlock workspace.'
      },
      {
        step: 2,
        title: 'Enter Password',
        description: 'Type the password used during document encryption.'
      },
      {
        step: 3,
        title: 'Download Decrypted Document',
        description: 'Click "Decrypt PDF" to restore and download your unrestricted file.'
      }
    ],
    faqs: [
      {
        question: 'Is my password sent to any remote server for verification?',
        answer: 'No. The Web Crypto cryptographic checks run strictly inside your browser tab.'
      },
      {
        question: 'What if I forgot my password?',
        answer: 'Because ClickPDF uses zero-knowledge AES-256 encryption, there are no master backdoors. You must know the correct password to unlock the file.'
      },
      {
        question: 'Can I unlock standard Adobe Acrobat encrypted PDFs?',
        answer: 'This tool is specifically designed for Web Crypto AES-256 files and standard user password PDFs.'
      }
    ],
    benefits: [
      { title: 'Browser-Based Decryption', desc: 'Supported files and keys are processed in the browser; page resources and enabled services may still make network requests.', iconName: 'Lock' },
      { title: 'Preserves File Integrity', desc: 'Restores the original binary file with pristine precision.', iconName: 'CheckCircle' },
      { title: 'Password Required', desc: 'The correct password is required to decrypt files created by ClickPDF Protect.', iconName: 'Zap' },
      { title: 'Cross-Device Compatible', desc: 'Works smoothly on Chrome, Safari, Firefox, Edge, and mobile browsers.', iconName: 'Laptop' }
    ],
    relatedToolIds: ['protect', 'split', 'merge', 'organize']
  },

  'pdf-to-text': {
    slug: 'pdf-to-text',
    toolId: 'pdf-to-text',
    aliases: ['extract-text', 'pdf2text', 'pdf-to-markdown', 'pdf-text-extractor'],
    h1Title: 'PDF to Text Online — Extract TXT or Markdown',
    metaTitle: 'PDF to Text Online: Extract TXT & Markdown | ClickPDF',
    metaDescription: 'Extract selectable PDF text as TXT or Markdown in your browser. Image-only scans need OCR first, and complex tables or reading order may require review.',
    keywords: 'PDF to text online, PDF to TXT online, PDF to Markdown online, extract text from PDF',
    targetKeywords: ['PDF to text online', 'PDF to TXT online', 'PDF to Markdown online', 'extract text from PDF'],
    badge: 'Structure-Aware Extraction',
    overviewHeading: 'Extract PDF Text as TXT or Markdown',
    overview: 'Extract selectable text from PDFs and save it as plain text or Markdown. Image-only pages need OCR first, and complex columns, tables, or reading order may require manual review.',
    secondaryOverview: 'Text extraction processes the selected document in your browser. Password-protected PDFs must be unlocked before the tool can read their contents.',
    privacyHighlight: 'Browser-Based Text Parsing: Selected document contents are processed in your browser; page resources and enabled third-party services may still make requests.',
    stepsHeading: 'How to Extract Text from PDF Documents',
    steps: [
      {
        step: 1,
        title: 'Upload Your PDF',
        description: 'Drop your document into the text extraction tool.'
      },
      {
        step: 2,
        title: 'Choose Text or Markdown Output',
        description: 'Choose an output format, process your selected PDFs, and inspect each extracted result.'
      },
      {
        step: 3,
        title: 'Copy or Download',
        description: 'Copy the text to your clipboard with one click or download as a .txt or .md file.'
      }
    ],
    faqs: [
      {
        question: 'Can this extract text from scanned paper documents?',
        answer: 'Image-only scans do not contain selectable text. This tool reports missing text rather than creating an empty successful output. Run OCR first, then extract the resulting text layer.'
      },
      {
        question: 'Does text extraction preserve paragraph breaks?',
        answer: 'The parser uses text positions and line gaps to identify basic paragraph breaks. Complex columns, tables, and unusual PDF reading order may need manual review.'
      },
      {
        question: 'Is there a limit on how many pages I can extract?',
        answer: 'There is no fixed page-count cap. Files and pages are processed sequentially; successful extraction depends on the document and available device memory.'
      }
    ],
    benefits: [
      { title: 'Clean Markdown Export', desc: 'Detects basic headings and lists for editing, note-taking, or AI workflows.', iconName: 'FileText' },
      { title: 'One-Click Clipboard Copy', desc: 'Instantly paste extracted paragraphs into any application.', iconName: 'Copy' },
      { title: 'Completely In-Browser', desc: 'No remote servers or cloud databases ever see your words.', iconName: 'Shield' },
      { title: 'Page-by-Page Progress', desc: 'Sequential extraction with visible progress and per-file error handling.', iconName: 'Zap' }
    ],
    relatedToolIds: ['metadata', 'split', 'compress', 'merge']
  },

  sign: {
    slug: 'sign-pdf-online',
    toolId: 'sign',
    aliases: ['sign', 'digital-signature', 'draw-signature', 'e-sign-pdf'],
    h1Title: 'Sign PDF Online — Add a Visual Signature',
    metaTitle: 'Sign PDF Online: Add a Visual Signature | ClickPDF',
    metaDescription: 'Draw, type, or upload a visual signature mark and place it on PDF pages. It is an image, not a certificate-backed digital signature or identity check.',
    keywords: 'sign PDF online, visual signature on PDF, draw signature on PDF, signature mark PDF',
    targetKeywords: ['sign PDF online', 'sign PDF online free no account', 'add visual signature to PDF', 'draw signature on PDF'],
    badge: 'Visual Signature Mark',
    overviewHeading: 'Add a Visual Signature Mark to a PDF',
    overview: 'ClickPDF lets you draw, type, or upload a signature mark and embed it on selected PDF pages in your browser. This tool adds a visible mark; it does not verify identity or create a certificate-backed digital signature.',
    secondaryOverview: 'Position and size the mark using the available controls, then review the saved PDF. This feature does not verify the signer’s identity or provide certificate-backed signing.',
    privacyHighlight: 'Private Signature Workspace: PDFs and signature images are processed locally in the active browser session and are not uploaded to a server.',
    stepsHeading: 'How to Sign a PDF Document Online',
    steps: [
      {
        step: 1,
        title: 'Open Document to Sign',
        description: 'Upload your agreement or form into the signature studio.'
      },
      {
        step: 2,
        title: 'Draw or Type Signature',
        description: 'Draw with a mouse, stylus, or finger, type your name in a bundled signature font, or upload a PNG image.'
      },
      {
        step: 3,
        title: 'Place & Download',
        description: 'Drag the signature to the exact signature line, resize if needed, and download your signed agreement.'
      }
    ],
    faqs: [
      {
        question: 'Does this create a verified or certificate-backed digital signature?',
        answer: 'No. ClickPDF embeds a visible signature mark in the PDF. It does not verify identity or create a cryptographic certificate-backed signature; legal acceptance depends on the applicable rules and recipient.'
      },
      {
        question: 'Can I use a touch screen or Apple Pencil to sign?',
        answer: 'Yes! Our signature pad fully supports touch devices, styluses, iPads, and smartphones.'
      },
      {
        question: 'Does ClickPDF store my signature image?',
        answer: 'The PDF and signature image are processed in your browser and are not uploaded. They remain available during the page session and are cleared when you leave or close the tool.'
      }
    ],
    benefits: [
      { title: 'Transparent Signature PNG', desc: 'Drawn, typed, or uploaded signatures are embedded as transparent PNG images.', iconName: 'PenTool' },
      { title: 'Local File Processing', desc: 'The selected PDF is handled in your browser rather than stored by ClickPDF document-processing servers; this is not a guarantee against device security risks.', iconName: 'Lock' },
      { title: 'Mobile & Stylus Ready', desc: 'Works smoothly with finger touch, stylus, and desktop mouse.', iconName: 'Tablet' },
      { title: 'Download the Updated PDF', desc: 'Save the PDF after adding and reviewing the visual signature mark.', iconName: 'Download' }
    ],
    relatedToolIds: ['watermark', 'protect', 'merge', 'page-numbers']
  },

  crop: {
    slug: 'crop-pdf-margins',
    toolId: 'crop',
    aliases: ['crop', 'trim-pdf', 'cut-pdf-borders', 'crop-pdf-online'],
    h1Title: 'Crop PDF Margins Online — Adjust the Visible Page Area',
    metaTitle: 'Crop PDF Margins Online – Adjust the PDF CropBox | ClickPDF',
    metaDescription: 'Adjust all PDF page CropBoxes by the same margin percentage in your browser. Cropping does not erase hidden content or redact information.',
    keywords: 'crop pdf, trim pdf margins, cut pdf borders online free, adjust pdf margins in browser, client side pdf crop',
    targetKeywords: ['crop pdf', 'trim pdf margins', 'crop pdf borders', 'pdf crop online free'],
    badge: 'PDF CropBox',
    overviewHeading: 'Adjust the Visible and Printable Page Area',
    overview: 'Set a uniform crop margin on each side of every selected PDF. The operation updates the PDF CropBox; it does not remove the original content outside that box.',
    secondaryOverview: 'Review the cropped copy in a PDF viewer. CropBox changes are not secure redaction and should not be used to conceal confidential information.',
    privacyHighlight: 'The selected files are processed in your browser; the website may still make standard resource and enabled third-party requests.',
    stepsHeading: 'How to Crop PDF Page Margins',
    steps: [
      {
        step: 1,
        title: 'Upload Document',
        description: 'Drop your document into the crop tool interface.'
      },
      {
        step: 2,
        title: 'Choose the crop percentage',
        description: 'Set one margin percentage from 0 to 25 for all four sides of every page.'
      },
      {
        step: 3,
        title: 'Save and review the copy',
        description: 'Download the PDF and check its visible page area. The CropBox does not erase hidden content.'
      }
    ],
    faqs: [
      {
        question: 'Does cropping erase the content outside the page area?',
        answer: 'No. This tool changes the PDF CropBox, which controls the visible or printable area. It does not securely remove the underlying content.'
      },
      {
        question: 'Can I apply one margin to every page?',
        answer: 'Yes. The selected percentage is applied uniformly to all four sides of every page in each selected PDF.'
      },
      {
        question: 'Can I use cropping to hide sensitive information?',
        answer: 'No. Content outside the CropBox can remain in the file. Use a verified redaction workflow to remove sensitive information.'
      }
    ],
    benefits: [
      { title: 'Uniform Margin Setting', desc: 'Apply one 0–25% crop margin to all four sides of every page.', iconName: 'Sliders' },
      { title: 'Adjust the Visible Page Area', desc: 'Change how page bounds appear in compatible PDF viewers.', iconName: 'BookOpen' },
      { title: 'Not Secure Redaction', desc: 'CropBox changes do not erase underlying page content.', iconName: 'AlertTriangle' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; page resources and enabled third-party services may still make network requests.', iconName: 'Shield' }
    ],
    relatedToolIds: ['rotate', 'organize', 'compress', 'split']
  },

  'pdf-to-pdfa': {
    slug: 'pdf-to-pdfa',
    toolId: 'pdf-to-pdfa',
    aliases: ['pdfa', 'pdf-to-pdfa', 'archival-pdf', 'iso-19005'],
    h1Title: 'Convert PDF to PDF/A Online — ISO Archival Standards Free',
    metaTitle: 'PDF to PDF/A Converter Free – ISO Archival Format in Browser | ClickPDF',
    metaDescription: 'Convert documents to ISO 19005 PDF/A archival format online for free with browser-based processing. Review the output for your archival requirements.',
    keywords: 'pdf to pdfa, convert pdf to pdf/a online free, iso 19005 pdf, legal archival pdf, client side pdfa converter',
    targetKeywords: ['pdf to pdfa', 'convert pdf to pdf/a', 'pdf/a converter free', 'archival pdf'],
    badge: 'ISO 19005 Compliance',
    overviewHeading: 'Ensure Long-Term Digital Preservation for Decades',
    overview: 'Legal mandates, government agencies, and corporate compliance departments require PDF/A format for official document archiving. PDF/A guarantees that documents can be accurately reproduced decades into the future by enforcing embedded fonts and color space profiles.',
    secondaryOverview: 'ClickPDF validates and formats your document to ISO 19005 specifications directly inside your web browser, ensuring compliance without transmitting confidential records to third-party services.',
    privacyHighlight: 'Browser-Based Archival: Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. This does not guarantee against device or account risks; page resources and enabled third-party services may still make requests.',
    stepsHeading: 'How to Convert to ISO PDF/A',
    steps: [
      {
        step: 1,
        title: 'Upload Document',
        description: 'Drop your standard PDF into the archival converter.'
      },
      {
        step: 2,
        title: 'Select Conformance Level',
        description: 'Choose PDF/A-1b or PDF/A-2b based on your institutional guidelines.'
      },
      {
        step: 3,
        title: 'Download PDF/A Archive',
        description: 'Save your standardized archival file ready for official submission.'
      }
    ],
    faqs: [
      {
        question: 'What is the main difference between standard PDF and PDF/A?',
        answer: 'PDF/A bans features that could prevent future reading, such as external font links, encryption, and audio/video, ensuring the document renders identically forever.'
      },
      {
        question: 'Will courts and government portals accept this PDF/A file?',
        answer: 'Yes! The generated file embeds standard PDF/A identification metadata matching ISO specifications.'
      },
      {
        question: 'Is the conversion performed on a remote server?',
        answer: 'No. The conversion executes entirely within your browser’s local JavaScript engine.'
      }
    ],
    benefits: [
      { title: 'ISO 19005 Standard', desc: 'Compliant with international digital preservation guidelines.', iconName: 'Award' },
      { title: 'Long-Term Reproducibility', desc: 'Guarantees font and layout rendering for decades to come.', iconName: 'Clock' },
      { title: 'No External Processing', desc: 'Zero data transfer to third-party processors or cloud queues.', iconName: 'Lock' },
      { title: 'Legal & Court Ready', desc: 'Approved for legal discovery and municipal records filing.', iconName: 'CheckCircle' }
    ],
    relatedToolIds: ['edit-metadata', 'protect', 'repair', 'compress']
  },

  repair: {
    slug: 'repair-corrupted-pdf',
    toolId: 'repair',
    aliases: ['repair', 'fix-pdf', 'recover-pdf', 'corrupted-pdf-repair'],
    h1Title: 'PDF Repair Online: Best-Effort Rebuild',
    metaTitle: 'PDF Repair & Rebuild Online – Best-Effort | ClickPDF',
    metaDescription: 'Try rebuilding a PDF that a parser can still partially read. Recovery is not guaranteed and cannot restore missing or truncated content.',
    keywords: 'repair pdf, fix corrupted pdf online free, recover damaged pdf, rebuild pdf cross reference table, client side pdf repair',
    targetKeywords: ['PDF repair', 'fix corrupted PDF', 'best-effort PDF rebuild', 'repair PDF online'],
    badge: 'Best-Effort Rebuild',
    overviewHeading: 'Attempt to Rebuild a Readable PDF Copy',
    overview: 'The tool asks the PDF parser to load a document in best-effort mode, saves a newly structured copy, and checks whether it can reopen with the same page count. It does not reconstruct arbitrary damaged streams.',
    secondaryOverview: 'Files that are truncated, encrypted, or missing page data may fail or remain incomplete. Keep the original and inspect the rebuilt copy before relying on it.',
    privacyHighlight: 'The selected files are processed in your browser; this does not guarantee device security or prevent ordinary page and enabled third-party requests.',
    stepsHeading: 'How to Try a Best-Effort PDF Rebuild',
    steps: [
      {
        step: 1,
        title: 'Choose the PDF',
        description: 'Select the file you want the parser to attempt to read and rebuild.'
      },
      {
        step: 2,
        title: 'Create a rebuilt copy',
        description: 'Run the parser and save a new PDF if the file can be loaded and verified.'
      },
      {
        step: 3,
        title: 'Open and inspect the result',
        description: 'Check the new file, page count, and important content. Recovery is not guaranteed.'
      }
    ],
    faqs: [
      {
        question: 'Can this tool repair every corrupted PDF?',
        answer: 'No. It only attempts a parser-based rebuild. Missing, truncated, encrypted, or severely damaged content may not be recoverable.'
      },
      {
        question: 'What does the tool verify after rebuilding?',
        answer: 'It checks whether the output can be reopened and retains the original page count. That check does not prove every page or object is intact.'
      },
      {
        question: 'Can the tool restore missing page content?',
        answer: 'No. Rebuilding file structure cannot recreate bytes that are absent from a damaged or truncated source.'
      }
    ],
    benefits: [
      { title: 'Best-Effort Parser Rebuild', desc: 'Attempts to save a fresh copy of a PDF the parser can still load.', iconName: 'Wrench' },
      { title: 'Output Reopen Check', desc: 'Checks whether the rebuilt PDF opens and retains the page count.', iconName: 'FileCheck' },
      { title: 'Recovery Not Guaranteed', desc: 'Cannot recreate missing or truncated page content.', iconName: 'AlertTriangle' },
      { title: 'Review Before Use', desc: 'Keep the original file and verify important pages and objects.', iconName: 'Eye' }
    ],
    relatedToolIds: ['compress', 'split', 'merge', 'metadata']
  },

  compare: {
    slug: 'compare-pdf-documents',
    toolId: 'compare',
    aliases: ['compare', 'diff-pdf', 'compare-pdf-versions', 'pdf-diff-tool'],
    h1Title: 'Compare Selectable Text in Two PDF Files',
    metaTitle: 'Compare PDF Text Online – Selectable Text Report | ClickPDF',
    metaDescription: 'Compare selectable text from two PDFs page by page and download a text report. Scanned text, images, and visual layout are not compared.',
    keywords: 'compare pdf documents, pdf diff online free, compare two pdf versions, side by side pdf comparison, client side pdf compare',
    targetKeywords: ['compare pdf', 'compare two pdf files', 'pdf diff online', 'pdf comparison free'],
    badge: 'Selectable Text Report',
    overviewHeading: 'Review Page-by-Page Selectable Text Changes',
    overview: 'Select the original PDF followed by the revised copy. ClickPDF extracts selectable text from both files and produces a downloadable report that labels matching or different page text.',
    secondaryOverview: 'This is not a visual comparison: it does not compare layout, formatting, graphics, handwriting, or scanned pages without OCR. Review both PDFs directly for visual changes.',
    privacyHighlight: 'The selected PDF text is extracted in your browser; the website may still make standard resource and enabled third-party requests.',
    stepsHeading: 'How to Compare Two PDF Documents',
    steps: [
      {
        step: 1,
        title: 'Select the original PDF',
        description: 'Add the original document first so its selectable text is the comparison baseline.'
      },
      {
        step: 2,
        title: 'Select the revised PDF',
        description: 'Add exactly one revised PDF as the second file.'
      },
      {
        step: 3,
        title: 'Download the text report',
        description: 'Review page labels and extracted text. Open the PDFs separately to check visual changes.'
      }
    ],
    faqs: [
      {
        question: 'What does this comparison check?',
        answer: 'It compares extracted selectable text page by page and marks matching or different text. It does not compare visual layout or graphics.'
      },
      {
        question: 'Can it compare scanned pages or handwritten text?',
        answer: 'No. Scanned images and handwriting are not read by this comparison. OCR is required before such text can be compared.'
      },
      {
        question: 'Does the report show layout, image, or font changes?',
        answer: 'No. It reports selectable text only. Open the original and revised PDFs in a viewer to inspect formatting, images, page geometry, and other visual differences.'
      }
    ],
    benefits: [
      { title: 'Selectable Text Report', desc: 'Compare extracted text page by page and download the result.', iconName: 'FileText' },
      { title: 'Exactly Two PDFs', desc: 'Choose an original PDF followed by one revised copy.', iconName: 'Files' },
      { title: 'Scanned Text Limitation', desc: 'Image-only pages require OCR and are not compared by this tool.', iconName: 'ScanText' },
      { title: 'Visual Changes Not Compared', desc: 'Review both PDFs separately for layout, image, and formatting differences.', iconName: 'Eye' }
    ],
    relatedToolIds: ['merge', 'split', 'sign', 'watermark']
  },

  'pdf-to-word': {
    slug: 'pdf-to-word',
    toolId: 'pdf-to-word',
    aliases: ['pdf-to-word', 'pdf-to-docx', 'convert-pdf-to-word', 'pdf-to-doc', 'pdf2word', 'pdf-to-word-converter', 'pdf-to-editable-word'],
    h1Title: 'PDF to Word Online — Create an Editable DOCX',
    metaTitle: 'PDF to Word Online: Convert to DOCX | ClickPDF',
    metaDescription: 'Convert PDF text to an editable DOCX in your browser. Layout can change; scanned pages may need OCR, and complex formatting should be reviewed in Word.',
    keywords: 'PDF to Word online, convert PDF to DOCX, editable PDF to Word, PDF to Word converter',
    targetKeywords: ['PDF to Word online', 'convert PDF to DOCX', 'PDF to editable Word', 'PDF to Word online free'],
    badge: 'Editable DOCX (Real Text)',
    overviewHeading: 'Convert PDF Text into an Editable DOCX',
    overview: 'The default output uses editable text in a DOCX file. Scanned pages may require OCR, and an optional page-image fallback can produce non-editable image pages; the tool identifies those pages in its quality report.',
    secondaryOverview: 'Fonts, spacing, tables, and complex page layouts can change during conversion. Review the generated DOCX in a Word-compatible editor before using it.',
    privacyHighlight: 'Browser-Based Processing: Supported files are processed locally rather than sent to ClickPDF document-processing servers. The page may still request scripts, fonts, and enabled third-party services.',
    stepsHeading: 'How to Convert PDF to Editable Word in 3 Steps',
    steps: [
      {
        step: 1,
        title: 'Choose or Drop PDF',
        description: 'Drag and drop your PDF file into the secure dropzone or browse from your device.'
      },
      {
        step: 2,
        title: 'In-Browser Text Extraction',
        description: 'Our client-side engine parses text lines, detects heading levels (H1/H2), and builds native Word paragraph styles.'
      },
      {
        step: 3,
        title: 'Download Editable .docx',
        description: 'Click "Convert to Editable Word (.docx)" to generate your clean Word document in seconds and download it directly.'
      }
    ],
    faqs: [
      {
        question: 'Does this tool extract real text or just image screenshots?',
        answer: 'It extracts genuine, selectable, and editable text! Unlike basic converters that take screenshots of your pages, ClickPDF extracts the real character glyphs, line heights, bold/italic weights, and headings into editable OpenXML docx runs.'
      },
      {
        question: 'Is my document uploaded to any remote server or AI cloud?',
        answer: 'Supported PDF-to-Word processing runs in your browser rather than on ClickPDF document-processing servers. The page may still make network requests for resources and enabled third-party services.'
      },
      {
        question: 'Can I open and edit the output in Microsoft Word and Google Docs?',
        answer: 'Yes! The converted file is a standard Microsoft Word OpenXML (.docx) format fully compatible with Microsoft Word 2007-2024, Office 365, Google Docs, Apple Pages, and LibreOffice Writer.'
      },
      {
        question: 'Can I convert multiple PDF documents to Word in bulk?',
        answer: 'Yes! ClickPDF supports batch processing. When multiple PDFs are selected, each file is converted locally in sequence and bundled into a single convenient ZIP file for 1-click download.'
      },
      {
        question: 'What happens if my PDF is a flat scanned image with no text?',
        answer: 'For PDFs created from document scanners without optical text, ClickPDF notifies you if no selectable text layers are detected, and you can also utilize our built-in OCR engine to recognize characters.'
      }
    ],
    benefits: [
      { title: 'Real Editable Text', desc: 'Extracts editable paragraphs, headings, and bullet points rather than rasterized images.', iconName: 'FileType' },
      { title: 'Browser-Based File Processing', desc: 'Supported files are processed in your browser; this does not guarantee device security or regulatory compliance.', iconName: 'Lock' },
      { title: 'Universal Compatibility', desc: 'Standard .docx format opens natively in Microsoft Word, Google Docs, and LibreOffice.', iconName: 'CheckCircle2' },
      { title: 'Batch Queue Processing', desc: 'Convert single documents or batch-process multiple files with zero subscription fees.', iconName: 'Zap' }
    ],
    relatedToolIds: ['word-to-pdf', 'pdf-to-excel', 'pdf-to-text', 'pdf-to-powerpoint']
  },

  'pdf-to-excel': {
    slug: 'pdf-to-excel',
    toolId: 'pdf-to-excel',
    aliases: ['pdf-to-excel', 'pdf-to-xlsx', 'convert-pdf-to-excel', 'pdf-to-spreadsheet', 'pdf2excel', 'extract-tables-from-pdf', 'pdf-table-extractor'],
    h1Title: 'PDF to Excel Online — Extract Tables to XLSX',
    metaTitle: 'PDF to Excel Online: Extract Tables | ClickPDF',
    metaDescription: 'Extract PDF tables into an XLSX workbook in your browser. Check rows and columns after conversion; scans or complex layouts may need correction.',
    keywords: 'PDF to Excel online, convert PDF to XLSX, extract tables from PDF, PDF table to spreadsheet',
    targetKeywords: ['PDF to Excel online', 'convert PDF to XLSX', 'extract tables from PDF', 'PDF table to spreadsheet'],
    badge: 'Tables & Active Cells',
    overviewHeading: 'Extract PDF Tables into an XLSX Workbook',
    overview: 'Convert detected tables in a PDF into spreadsheet rows and columns in an XLSX workbook. Review the output carefully because scanned pages and complex or irregular layouts can affect extraction.',
    secondaryOverview: 'Selected file contents are processed in your browser; page resources and enabled services may still make network requests. OCR may be needed for image-only documents.',
    privacyHighlight: 'Browser-Based Spreadsheet Conversion: Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. The page may still request resources and enabled third-party services.',
    stepsHeading: 'How to Extract Tables from PDF to Excel in 3 Steps',
    steps: [
      {
        step: 1,
        title: 'Select Your PDF Document',
        description: 'Drop your financial report, bank statement, or invoice table into the workspace.'
      },
      {
        step: 2,
        title: 'Coordinate Grid Clustering',
        description: 'The client-side engine calculates character bounding boxes, detects row baselines, and aligns columns.'
      },
      {
        step: 3,
        title: 'Download .xlsx Workbook',
        description: 'Click "Convert to Excel (.xlsx)" to instantly receive a structured workbook with numerical values and text cells.'
      }
    ],
    faqs: [
      {
        question: 'How does ClickPDF reconstruct tables from a PDF document?',
        answer: 'It reads the exact 2D transformation matrix of every text item on each page, clusters elements with similar vertical baselines into rows, and identifies horizontal whitespace gaps to assign discrete columns.'
      },
      {
        question: 'Are numerical figures converted to numbers or left as plain text?',
        answer: 'ClickPDF automatically detects integer and decimal numeric patterns, formatting them as native Excel numbers so you can run formulas like SUM and AVERAGE immediately.'
      },
      {
        question: 'Is my financial data uploaded to any server?',
        answer: 'SheetJS parsing and cell formatting run in your browser. Supported file contents are not sent to ClickPDF document-processing servers, though the page may still request resources and enabled third-party services.'
      },
      {
        question: 'Does it support multi-page PDF documents?',
        answer: 'Yes! All pages in the PDF document are processed, and multi-page tabular data is continuously structured across worksheet rows.'
      },
      {
        question: 'Can I open the generated .xlsx file in Google Sheets or Apple Numbers?',
        answer: 'Yes! The file adheres to standard OpenXML spreadsheet specifications and opens flawlessly in Microsoft Excel, Google Sheets, LibreOffice Calc, and Apple Numbers.'
      }
    ],
    benefits: [
      { title: 'Automatic Table Grid Detection', desc: 'Clustering algorithms align columns and rows accurately across pages.', iconName: 'FileSpreadsheet' },
      { title: 'Live Numeric Values', desc: 'Numbers and decimals are converted into functional cells ready for formulas.', iconName: 'Percent' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; follow your organization’s controls for sensitive records.', iconName: 'ShieldCheck' },
      { title: 'Batch ZIP Packaging', desc: 'Process multiple PDF statements simultaneously into cleanly organized Excel files.', iconName: 'Download' }
    ],
    relatedToolIds: ['excel-to-pdf', 'pdf-to-word', 'compress', 'split']
  },

  'pdf-to-powerpoint': {
    slug: 'pdf-to-powerpoint',
    toolId: 'pdf-to-powerpoint',
    aliases: ['pdf-to-powerpoint', 'pdf-to-pptx', 'convert-pdf-to-powerpoint', 'pdf-to-ppt', 'pdf2pptx', 'pdf-to-slides'],
    h1Title: 'PDF to PowerPoint Online — Create PPTX Slides',
    metaTitle: 'PDF to PowerPoint Online: Create PPTX | ClickPDF',
    metaDescription: 'Convert PDF pages into PPTX slides in your browser. Review text and layout after conversion; a PDF does not contain the original presentation structure.',
    keywords: 'PDF to PowerPoint online, convert PDF to PPTX, PDF to slides converter, PDF to PPTX',
    targetKeywords: ['PDF to PowerPoint online', 'convert PDF to PPTX', 'PDF to slides converter', 'PDF to PowerPoint online free'],
    badge: '16:9 Widescreen Slides',
    overviewHeading: 'Convert PDF Pages into PPTX Slides',
    overview: 'Create a PPTX slide for each PDF page. Some text and shapes can be edited, but conversion cannot restore the original presentation structure; review the slide layout and content before sharing.',
    secondaryOverview: 'The output uses a 16:9 slide layout. Spacing, fonts, and page composition can differ from the PDF, especially when the source uses complex layouts.',
    privacyHighlight: 'Browser-Based Presentation Conversion: Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. Page resources and enabled services may still make network requests.',
    stepsHeading: 'How to Convert PDF to PowerPoint Slides in 3 Steps',
    steps: [
      {
        step: 1,
        title: 'Drop Your PDF Presentation',
        description: 'Select your PDF slide deck or presentation document from your computer or phone.'
      },
      {
        step: 2,
        title: 'Slide Geometry Mapping',
        description: 'ClickPDF creates a 16:9 widescreen presentation deck and maps each page into slide cards, titles, and bullet lists.'
      },
      {
        step: 3,
        title: 'Download .pptx Presentation',
        description: 'Click "Convert to PowerPoint (.pptx)" to download the native presentation file ready to present or edit.'
      }
    ],
    faqs: [
      {
        question: 'Are the generated slides editable in Microsoft PowerPoint?',
        answer: 'Yes! Unlike tools that paste flat images onto blank slides, ClickPDF extracts text runs and creates native presentation shape cards with editable text, slide titles, and bullet lists.'
      },
      {
        question: 'What slide aspect ratio is used?',
        answer: 'Slides are generated in modern 16:9 widescreen format, which is the standard for contemporary monitors, TV displays, projectors, and video conferencing.'
      },
      {
        question: 'Can I open the .pptx file in Google Slides or Apple Keynote?',
        answer: 'Yes! The file is an OpenXML .pptx presentation fully supported by Microsoft PowerPoint, Google Slides, and Apple Keynote.'
      },
      {
        question: 'Are my company pitch decks uploaded to the cloud?',
        answer: 'Presentation generation runs in your browser. Supported file contents are not sent to ClickPDF document-processing servers; the page may still request resources and enabled third-party services.'
      },
      {
        question: 'Can I convert multiple presentation files at once?',
        answer: 'Yes, multi-file selection will convert each presentation in sequence and package them into an organized ZIP archive.'
      }
    ],
    benefits: [
      { title: '16:9 Widescreen Aspect', desc: 'Standard widescreen geometry matches modern presentation displays.', iconName: 'Presentation' },
      { title: 'Editable Shape Cards', desc: 'Allows you to tweak words, bullet points, and titles directly inside PowerPoint.', iconName: 'Type' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; page resources and enabled third-party services may still make network requests.', iconName: 'Lock' },
      { title: 'PPTX Export', desc: 'Download a PowerPoint file and review its text and slide layout before using it.', iconName: 'Zap' }
    ],
    relatedToolIds: ['pdf-to-word', 'pdf-to-excel', 'organize', 'compress']
  },

  'word-to-pdf': {
    slug: 'word-to-pdf',
    toolId: 'word-to-pdf',
    aliases: ['word-to-pdf', 'docx-to-pdf', 'convert-word-to-pdf', 'word2pdf'],
    h1Title: 'Word to PDF Online — Convert DOCX Files',
    metaTitle: 'Word to PDF Online: Convert DOCX | ClickPDF',
    metaDescription: 'Convert DOCX files to PDF in your browser. The output pages are rendered as images, so text may not be selectable; legacy DOC files are not supported.',
    keywords: 'Word to PDF online, DOCX to PDF online, convert Word DOCX to PDF, Word to PDF converter',
    targetKeywords: ['Word to PDF online', 'DOCX to PDF online', 'convert Word DOCX to PDF', 'Word to PDF online free'],
    badge: 'Standard A4 Vector PDF',
    overviewHeading: 'Convert DOCX Documents to PDF',
    overview: 'Upload a DOCX file to create a PDF copy in your browser. The output pages are rendered as images, so text may not remain selectable or searchable; legacy DOC files are not supported.',
    secondaryOverview: 'Check page breaks, text, tables, and images in the saved PDF. The webpage may still request site resources and enabled services.',
    privacyHighlight: 'Browser-Based Document Conversion: Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. Offline availability depends on loaded resources and the tool.',
    stepsHeading: 'How to Convert Word to PDF in 3 Steps',
    steps: [
      {
        step: 1,
        title: 'Select Your Word Document',
        description: 'Drag and drop a .docx file into the workspace.'
      },
      {
        step: 2,
        title: 'In-Browser Document Parsing',
        description: 'The browser lays out paragraphs, headings, lists, tables, and embedded images.'
      },
      {
        step: 3,
        title: 'Download High-Resolution PDF',
        description: 'Click "Convert Word to PDF" to generate clear A4 page images. Text is not selectable in this visual PDF.'
      }
    ],
    faqs: [
      {
        question: 'Does Word to PDF conversion require Microsoft Office installed?',
        answer: 'No! ClickPDF parses and renders OpenXML documents natively in your web browser using JavaScript. No Microsoft Office, Word 365, or third-party desktop software is needed.'
      },
      {
        question: 'What Word document formats are accepted?',
        answer: 'This converter supports Microsoft Word OpenXML (.docx) files. Save legacy .doc files as .docx before converting.'
      },
      {
        question: 'Will formatting and paragraphs be preserved?',
        answer: 'Headings, paragraphs, lists, tables, and embedded images are rendered for readability. Exact fonts, page breaks, and complex layouts may differ from Word.'
      },
      {
        question: 'Are my resumes and private contracts kept private?',
        answer: 'Supported files are processed in your browser rather than sent to ClickPDF document-processing servers. The page may still request resources, ads, or enabled third-party services.'
      },
      {
        question: 'Can I convert multiple Word files to PDF simultaneously?',
        answer: 'Yes! Simply select multiple Word files, and ClickPDF will convert each one and package them into a downloadable ZIP archive.'
      }
    ],
    benefits: [
      { title: 'Browser-Based Conversion', desc: 'Convert DOCX files in a supported browser; Microsoft Word does not need to be installed for conversion.', iconName: 'Laptop' },
      { title: 'High-Resolution Output', desc: 'Generates clear A4 pages with readable text and tables.', iconName: 'FileText' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; review your organization’s requirements and the page’s network activity for sensitive documents.', iconName: 'ShieldCheck' },
      { title: 'Batch Queue Ready', desc: 'Convert dozens of Word documents with automatic ZIP archiving.', iconName: 'Download' }
    ],
    relatedToolIds: ['pdf-to-word', 'compress', 'merge', 'protect']
  },

  'word-to-excel': {
    slug: 'word-to-excel',
    toolId: 'word-to-excel',
    aliases: ['word-to-excel', 'docx-to-xlsx', 'convert-word-tables-to-excel'],
    h1Title: 'Word to Excel Online — Extract DOCX Tables',
    metaTitle: 'Word to Excel Online: Convert DOCX Tables | ClickPDF',
    metaDescription: 'Extract DOCX tables into XLSX, with one worksheet per detected table. Paragraphs and lists are collected separately; review the workbook.',
    keywords: 'Word to Excel online, DOCX to XLSX online, extract tables from Word, convert Word tables to Excel',
    targetKeywords: ['Word to Excel online', 'DOCX to XLSX online', 'extract tables from Word', 'convert Word tables to Excel'],
    badge: 'DOCX to XLSX',
    overviewHeading: 'Extract DOCX Tables into an Excel Workbook',
    overview: 'ClickPDF reads a .docx document in your browser, places each detected table in its own Excel worksheet, and collects document paragraphs and lists in a separate Text worksheet.',
    secondaryOverview: 'The conversion uses document content stored in the DOCX file. Complex page styling and visual layout are not recreated as spreadsheet formatting; review the workbook before use.',
    privacyHighlight: 'Private in-browser conversion: your Word document is processed locally in the browser and is not uploaded to a document-processing server.',
    stepsHeading: 'How to Convert Word Documents to Excel',
    steps: [
      {
        step: 1,
        title: 'Choose a Word document',
        description: 'Select one or more .docx files from your device. Legacy .doc files must first be saved as .docx.'
      },
      {
        step: 2,
        title: 'Extract tables and text',
        description: 'ClickPDF places each detected table in a separate worksheet and puts document paragraphs and lists in a Text worksheet.'
      },
      {
        step: 3,
        title: 'Download the Excel workbook',
        description: 'Download the generated .xlsx workbook. When converting multiple documents, the results are packaged as a ZIP file.'
      }
    ],
    faqs: [
      {
        question: 'Which Word file formats can I convert?',
        answer: 'This tool accepts Microsoft Word OpenXML (.docx) files. Save older .doc files as .docx before uploading.'
      },
      {
        question: 'How are tables and paragraphs organized in Excel?',
        answer: 'Each detected table is placed in its own worksheet. Paragraphs and lists are collected in a separate Text worksheet.'
      },
      {
        question: 'Does the workbook preserve the original Word page layout?',
        answer: 'No. The tool extracts document tables and text into spreadsheet worksheets; it does not reproduce Word page styling or pagination.'
      },
      {
        question: 'Can I convert multiple Word documents?',
        answer: 'Yes. Select multiple .docx documents to convert them in sequence and download the resulting workbooks together as a ZIP archive.'
      }
    ],
    benefits: [
      { title: 'Separate Worksheets', desc: 'Each detected Word table is placed in its own worksheet.', iconName: 'FileSpreadsheet' },
      { title: 'Text Worksheet', desc: 'Document paragraphs and lists are collected in a separate worksheet.', iconName: 'FileText' },
      { title: 'Local Processing', desc: 'The conversion runs in your browser without uploading the document to a processing server.', iconName: 'ShieldCheck' },
      { title: 'Multiple Documents', desc: 'Convert a selection of DOCX files and package the workbooks in a ZIP.', iconName: 'Layers' }
    ],
    relatedToolIds: ['word-to-pdf', 'pdf-to-excel', 'excel-to-pdf']
  },

  'excel-to-pdf': {
    slug: 'excel-to-pdf',
    toolId: 'excel-to-pdf',
    aliases: ['excel-to-pdf', 'xlsx-to-pdf', 'xls-to-pdf', 'csv-to-pdf', 'convert-excel-to-pdf', 'spreadsheet-to-pdf'],
    h1Title: 'Excel to PDF Online — Convert Spreadsheets',
    metaTitle: 'Excel to PDF Online: Convert XLSX & CSV | ClickPDF',
    metaDescription: 'Convert XLSX, XLS, or CSV spreadsheets to paginated PDF tables in your browser. Check column widths, page breaks, and print layout before sharing.',
    keywords: 'Excel to PDF online, XLSX to PDF online, CSV to PDF online, spreadsheet to PDF converter',
    targetKeywords: ['Excel to PDF online', 'XLSX to PDF online', 'CSV to PDF online', 'spreadsheet to PDF converter'],
    badge: 'Landscape Paginated Tables',
    overviewHeading: 'Convert XLSX, XLS, or CSV Spreadsheets to PDF',
    overview: 'Create a paginated PDF from supported XLSX, XLS, or CSV spreadsheet files. Check column widths, page breaks, and printed layout in the output; large sheets may span several pages.',
    secondaryOverview: 'Selected spreadsheet contents are processed in your browser; page resources and enabled services may still make network requests. Review the PDF before sharing.',
    privacyHighlight: 'Browser-Based Spreadsheet Processing: Supported files are processed in your browser; the page may still request resources and enabled third-party services.',
    stepsHeading: 'How to Convert Excel Spreadsheets to PDF in 3 Steps',
    steps: [
      {
        step: 1,
        title: 'Drop Your Excel File',
        description: 'Select your .xlsx, .xls, or .csv spreadsheet file from your computer or phone.'
      },
      {
        step: 2,
        title: 'Landscape Table Layout Engine',
        description: 'ClickPDF auto-calculates optimal column widths, styles header rows, and sets alternating zebra lines.'
      },
      {
        step: 3,
        title: 'Download Landscape PDF',
        description: 'Click "Convert Excel to PDF" to generate a polished, paginated PDF report ready to print or email.'
      }
    ],
    faqs: [
      {
        question: 'How does ClickPDF handle wide spreadsheets with many columns?',
        answer: 'It automatically applies landscape orientation (842 x 595 pt) and scales column widths to maximize readability and prevent clipped numbers.'
      },
      {
        question: 'What happens if a table has hundreds of rows?',
        answer: 'ClickPDF automatically splits data across consecutive PDF pages, repeating the styled column headers at the top of each page so viewers always know what each column represents.'
      },
      {
        question: 'Which spreadsheet formats can I convert?',
        answer: 'You can convert Microsoft Excel workbooks (.xlsx), legacy spreadsheets (.xls), and comma-separated value files (.csv).'
      },
      {
        question: 'Are proprietary accounting numbers uploaded to the internet?',
        answer: 'SheetJS parsing and PDF table drawing run in your browser. Supported files are not sent to ClickPDF document-processing servers, though the page may still request resources and enabled third-party services.'
      },
      {
        question: 'Can I convert multiple spreadsheet files at the same time?',
        answer: 'Yes! Drag and drop multiple spreadsheets to batch-convert them into formatted PDFs, packaged in a single ZIP download.'
      }
    ],
    benefits: [
      { title: 'Professional Table Styling', desc: 'High-contrast indigo headers and zebra-striped rows make reports easy to read.', iconName: 'FileSpreadsheet' },
      { title: 'Automatic Multi-Page Overflow', desc: 'Headers repeat across new pages so large datasets stay organized.', iconName: 'Layers' },
      { title: 'Browser-Based Processing', desc: 'Review your organization’s security requirements before using sensitive budgets, payroll records, or financial statements.', iconName: 'ShieldCheck' },
      { title: 'Auto-Fit Column Widths', desc: 'Distributes horizontal space evenly to prevent truncated columns.', iconName: 'Maximize2' }
    ],
    relatedToolIds: ['pdf-to-excel', 'compress', 'merge', 'watermark']
  },

  'powerpoint-to-pdf': {
    slug: 'powerpoint-to-pdf',
    toolId: 'powerpoint-to-pdf',
    aliases: ['powerpoint-to-pdf', 'pptx-to-pdf', 'ppt-to-pdf', 'convert-powerpoint-to-pdf', 'slides-to-pdf'],
    h1Title: 'Convert Selectable PPTX Text to a Basic PDF',
    metaTitle: 'PowerPoint Text to Basic PDF – PPTX Converter | ClickPDF',
    metaDescription: 'Create basic 16:9 PDF pages from selectable text in .pptx files. Original slide artwork and layout are not preserved; legacy .ppt is unsupported.',
    keywords: 'pptx text to pdf, powerpoint to basic pdf, powerpoint text converter, pptx to pdf text, browser pptx text extraction',
    targetKeywords: ['PPTX text to PDF', 'PowerPoint text to basic PDF', 'convert PPTX text to PDF'],
    badge: 'Text-Only Reconstruction',
    overviewHeading: 'Create New PDF Pages from PowerPoint Text',
    overview: 'Extracts selectable text from .pptx slides and places it on new basic 16:9 PDF pages. It does not reproduce original slide positions, artwork, images, charts, themes, notes, or animations.',
    secondaryOverview: 'The built-in PDF font supports a limited character set. Conversion stops with an error if slide text contains unsupported characters. Review the result before use.',
    privacyHighlight: 'Selected presentation content is processed in your browser; page resources and enabled third-party features may still make standard network requests.',
    stepsHeading: 'How to Create a Basic PDF from PPTX Text',
    steps: [
      {
        step: 1,
        title: 'Select a .pptx file',
        description: 'Choose a PowerPoint Open XML presentation. Legacy .ppt files are not supported.'
      },
      {
        step: 2,
        title: 'Rebuild text-only pages',
        description: 'Selectable slide text is extracted and placed on new, basic 16:9 PDF pages.'
      },
      {
        step: 3,
        title: 'Review the output',
        description: 'Download the PDF and check text, sequence, and omitted slide objects before sharing.'
      }
    ],
    faqs: [
      {
        question: 'Will the PDF preserve the original PowerPoint design?',
        answer: 'No. This is a text-only reconstruction. Original positions, images, charts, colors, themes, speaker notes, and animations are not preserved.'
      },
      {
        question: 'Which PowerPoint formats can I select?',
        answer: 'Only .pptx files are supported. Save an older .ppt presentation as .pptx before using the converter.'
      },
      {
        question: 'Are all slide text and objects included?',
        answer: 'Selectable text is extracted, but only a limited amount is placed on each new page. Original images and other slide objects are omitted.'
      },
      {
        question: 'Are pitch decks or secret project slides uploaded anywhere?',
        answer: 'The conversion runs in your browser. Supported file contents are not sent to ClickPDF document-processing servers; page resources and enabled third-party services may still make network requests.'
      },
      {
        question: 'Can I convert multiple PowerPoint presentations at once?',
        answer: 'Yes! Multiple presentations are converted in sequence and delivered in a single organized ZIP archive.'
      }
    ],
    benefits: [
      { title: 'Basic 16:9 Pages', desc: 'Creates a new widescreen PDF page for each PPTX slide.', iconName: 'Presentation' },
      { title: 'Selectable Text Output', desc: 'Places extracted text into a new PDF layout; visual fidelity is not preserved.', iconName: 'FileText' },
      { title: 'Browser-Based Processing', desc: 'Supported files are processed in your browser; page resources and enabled third-party services may still make network requests.', iconName: 'Lock' },
      { title: 'Batch ZIP Download', desc: 'Convert multiple presentation files in one click with zero subscription fees.', iconName: 'Download' }
    ],
    relatedToolIds: ['pdf-to-powerpoint', 'compress', 'merge', 'page-numbers']
  }
};

export function getToolSeoInfo(toolIdOrSlug: string): ToolSeoInfo | undefined {
  if (!toolIdOrSlug) return undefined;
  const normalized = toolIdOrSlug.toLowerCase().trim();
  
  // Direct toolId lookup
  if (TOOL_SEO_REGISTRY[normalized]) {
    return withToolPageContent(TOOL_SEO_REGISTRY[normalized]);
  }

  // Slug or alias lookup
  for (const info of Object.values(TOOL_SEO_REGISTRY)) {
    if (info.slug === normalized) return withToolPageContent(info);
    if (info.aliases.includes(normalized)) return withToolPageContent(info);
  }

  // Check auto-discovered plugins in src/tools/plugins/*.tsx
  try {
    const pluginInfo = getPluginSeoInfo(normalized);
    if (pluginInfo) {
      return withToolPageContent(pluginInfo);
    }
  } catch {
    // fallback
  }

  return undefined;
}

export function getToolCanonicalPath(toolId: string): string {
  const info = getToolSeoInfo(toolId);
  return info ? `/tools/${info.slug}` : `/?tool=${encodeURIComponent(toolId)}`;
}

