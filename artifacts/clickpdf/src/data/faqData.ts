import { FaqItem } from '../types';

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'privacy-zero-uploads',
    question: 'Are my PDF files ever uploaded to a remote server or saved in the cloud?',
    answer:
      'Supported tools process selected files in your browser instead of sending their contents to ClickPDF’s document-processing servers. The page may still request scripts, fonts, workers, images, advertising, and enabled third-party services. Browser memory is managed by the browser, so closing or refreshing a tab is not a secure-erase guarantee.',
    category: 'security',
    categoryLabel: 'Privacy & Security',
    highlights: [
      'Selected files are processed locally in supported tools',
      'File contents are not sent to ClickPDF processing servers',
      'Page resources and third-party requests may still occur'
    ]
  },
  {
    id: 'how-it-works-technology',
    question: 'How do PDF tools work entirely inside the browser without a backend?',
    answer:
      'Modern web browsers are capable of running near-native compiled binary instructions using WebAssembly (WASM) and high-speed JavaScript runtimes. ClickPDF executes battle-tested PDF parsing libraries (such as pdf-lib and PDF.js) and Web Workers directly on your local CPU. Your device does the computations instead of relying on a slow, remote server queue.',
    category: 'technology',
    categoryLabel: 'How It Works',
    highlights: [
      'Powered by WebAssembly (WASM) & PDF-lib',
      'Uses local CPU and Web Workers',
      'No latency from uploading large files over slow internet'
    ]
  },
  {
    id: 'compliance-gdpr-hipaa',
    question: 'Is ClickPDF safe for sensitive legal, financial, and healthcare documents?',
    answer:
      'Supported tools process selected files in your browser instead of sending their contents to ClickPDF document-processing servers. This can reduce exposure to an external file processor, but does not guarantee device security or regulatory compliance. The page may still request resources, ads, and enabled third-party services; confirm your organization’s controls before handling regulated documents.',
    category: 'compliance',
    categoryLabel: 'Compliance & Safety',
    highlights: [
      'Eliminates third-party data processor liability',
      'Check organizational requirements for regulated data',
      'Browser-based file processing'
    ]
  },
  {
    id: 'ocr-browser-scanned-pdf',
    question: 'How does client-side OCR extract text from scanned PDFs without cloud AI APIs?',
    answer:
      'Our OCR analysis tool uses Tesseract.js compiled into WebAssembly. When you analyze a scanned PDF, the browser renders the pages to an in-memory high-resolution canvas, feeds the pixel data to a local WebAssembly neural worker, and recognizes alphanumeric text patterns entirely on your machine. No scanned images or text snippets are transmitted to external AI endpoints.',
    category: 'features',
    categoryLabel: 'Features & OCR',
    highlights: [
      'Embedded Tesseract.js WebAssembly engine',
      'Runs locally in browser Web Workers',
      'No image or text telemetry sent to cloud APIs'
    ]
  },
  {
    id: 'file-size-limits',
    question: 'Are there any hidden file size limits or daily document restrictions?',
    answer:
      'ClickPDF imposes no arbitrary cloud upload caps, no daily quotas, and no tiered paywalls. You can merge, split, rotate, or compress as many documents as you need. The only practical limitation is your device’s available hardware memory (RAM), which easily handles typical documents up to hundreds of pages.',
    category: 'performance',
    categoryLabel: 'Limits & Performance',
    highlights: [
      'No daily document quotas or usage caps',
      'No subscription paywalls or premium tiers',
      'Handles multi-page documents quickly'
    ]
  },
  {
    id: 'offline-availability',
    question: 'How does ClickPDF run fast in the browser without server uploads?',
    answer:
      'Supported tools process selected files in your browser rather than sending their contents to ClickPDF document-processing servers. The page may still request scripts, fonts, workers, images, ads, and enabled third-party services. Whether a tool can run offline depends on the tool, browser, and resources already loaded.',
    category: 'performance',
    categoryLabel: 'Speed & Privacy',
    highlights: [
      'Selected files are processed in supported browser tools',
      'Local WebAssembly computation',
      'Page and third-party network requests may still occur',
      'Offline availability depends on the tool and loaded resources'
    ]
  },
  {
    id: 'pdf-standard-quality',
    question: 'Will modified PDFs maintain high quality and work in Adobe Acrobat?',
    answer:
      'Absolutely. ClickPDF strictly complies with the international standard ISO 32000 for PDF documents. Vector shapes, embedded fonts, image resolutions, bookmarks, and form structures remain crisp and fully compatible with Adobe Acrobat Reader, macOS Preview, mobile PDF viewers, and commercial print drivers.',
    category: 'features',
    categoryLabel: 'Standard & Quality',
    highlights: [
      'Strict ISO 32000 PDF standard compliance',
      'Preserves vector fonts and high-resolution images',
      '100% compatible with Adobe Acrobat and all standard PDF readers'
    ]
  },
  {
    id: 'client-side-encryption',
    question: 'How does client-side PDF encryption and password protection work?',
    answer:
      'When applying password protection, ClickPDF employs standard PDF cryptographic ciphers using your browser’s built-in Web Crypto API. The encryption keys are generated and applied ephemerally in your device’s memory, meaning neither ClickPDF nor any intermediary has any master key, backdoor, or recovery access.',
    category: 'security',
    categoryLabel: 'Privacy & Security',
    highlights: [
      'Standard cryptographic cipher generation',
      'Zero backdoors or external key repositories',
      'Password applied locally before file generation'
    ]
  },
  {
    id: 'supported-platforms-devices',
    question: 'Which devices and web browsers are fully supported by ClickPDF?',
    answer:
      'ClickPDF works seamlessly across all modern web browsers including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, Brave, and Opera. It is optimized for desktop computers, laptops, iPads, tablets, and smartphones, enabling fast, private document editing on Windows, macOS, Linux, Android, and iOS with no software installation required.',
    category: 'technology',
    categoryLabel: 'Compatibility & Devices',
    highlights: [
      'Compatible with Chrome, Safari, Firefox, Edge & Brave',
      'Fully responsive on Desktop, Tablet, and Mobile',
      'Runs on Windows, macOS, Linux, iOS & Android'
    ]
  }
];
