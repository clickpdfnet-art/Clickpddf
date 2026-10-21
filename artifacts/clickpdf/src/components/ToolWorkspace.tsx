import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { OutputArchive } from '../utils/outputArchive';
import { LocalOutputStore } from '../utils/localOutputStore';
import { runPdfBackground } from '../utils/pdfBackground';
import { DocumentSelector } from './DocumentSelector';
import { startDownloadCountdown, DownloadRequestGate } from '../utils/downloadCountdown';
import { PDFTool } from '../types';
import {
  mergePdfFiles,
  splitPdfFile,
  rotatePdfFile,
  rotatePdfPages,
  PageRotationMap,
  addWatermarkToPdf,
  WatermarkOptions,
  addPageNumbersToPdf,
  PageNumberFont,
  imagesToPdf,
  compressPdfFile,
  CompressionPreset,
  CompressPdfOptions,
  downloadBlob,
  organizePdfPages,
  organizePdfPagesWithRotations,
  inspectPdf,
  extractPdfMetadata,
  updatePdfMetadata,
  sanitizePdfMetadata,
  countPdfPages
} from '../utils/pdfEngine';
import {
  encryptPdfWithWebCrypto,
  decryptPdfWithWebCrypto,
  inspectEncryptedPdf,
  generateStandaloneDecryptorHtml,
  checkPasswordStrength,
  ProtectPdfResult,
  DecryptPdfResult,
  EncryptionMetadata,
  EncryptedPackageMetadata
} from '../utils/cryptoEngine';
import {
  auditMemoryPressure,
  formatMemoryErrorMessage,
  isMemoryError,
  yieldToMainThread,
  MemoryAuditResult,
  executeConcurrentBatch,
  explicitMemoryCleanup
} from '../utils/memoryManager';
import {
  convertPdfToExcelXlsx,
  convertPdfToPowerPointPptx,
  convertPowerPointToPdf,
  convertWordToPdf,
  convertWordToExcelXlsx,
  convertExcelToPdf
} from '../utils/officeConverters';
import { validateFileBatch } from '../utils/securitySanitizer';
import { FilePreviewModal } from './FilePreviewModal';
import { MetadataInspector } from './MetadataInspector';
import { MetadataEditorPanel, MetadataFormValues } from './MetadataEditorPanel';
import { PdfTextWorkspace } from './PdfTextWorkspace';
import { PdfExcelWorkspace } from './PdfExcelWorkspace';
import { convertAdvancedPdfToWord } from '../utils/pdfWordConverter';
import { DEFAULT_PDF_WORD_OPTIONS, PdfWordOptions } from '../utils/pdfWordTypes';
import { PdfWordOptionsPanel } from './PdfWordOptionsPanel';
import { PdfWordQualityPanel, WordReportEntry } from './PdfWordQualityPanel';
import { PdfWordPreview } from './PdfWordPreview';
import { PdfTextSourcePreview } from './PdfTextSourcePreview';
import { RotatePdfPanel } from './RotatePdfPanel';
import { OrganizePdfPanel, OrganizePageCardItem, OrganizePageState } from './OrganizePdfPanel';
import { ImagePageEditor, ImagePageItem } from './ImagePageEditor';
import { exportPdfDocumentsAsImages } from '../utils/pdfImageExport';
import { WatermarkPanel } from './WatermarkPanel';
import { PageNumberPanel, PageNumberSettings } from './PageNumberPanel';
import { PdfThumbnailPreviewer } from './PdfThumbnailPreviewer';
import { SortableFileList, OrderedFile, ProcessedFileInfo } from './SortableFileList';
import { useLanguage } from '../context/LanguageContext';
import { getToolSeoInfo } from '../data/toolSeoData';
import { ToolSeoContentSection } from './ToolSeoContentSection';
import { getToolPlugin } from '../tools/plugins/pluginLoader';
import { PDF_TOOLS } from '../data/toolsData';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  MoveUp,
  MoveDown,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Plus,
  Eye,
  EyeOff,
  Maximize2,
  KeyRound,
  Shield,
  FileCode,
  Image as ImageIcon,
  Layers,
  Share2,
  SlidersHorizontal,
  Check,
  Gauge,
  Clock,
  Palette,
  Type,
  Hash,
  FileType,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';

interface ToolWorkspaceProps {
  tool: PDFTool;
  onBack: () => void;
  initialFiles?: File[];
  onFilesConsumed?: () => void;
  onOpenBatchQueue?: (files: File[]) => void;
  onOpenShare?: () => void;
  onSelectTool?: (tool: PDFTool) => void;
}

const getDownloadMimeType = (fileName: string): string => {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.zip')) return 'application/zip';
  if (lowerName.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lowerName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lowerName.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lowerName.endsWith('.json')) return 'application/json';
  if (lowerName.endsWith('.txt')) return 'text/plain';
  return 'application/pdf';
};

const createImagePageItem = (file: File, originalIndex: number): ImagePageItem => ({
  id: `image-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  originalIndex,
  rotationDelta: 0,
});

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  tool,
  onBack,
  initialFiles,
  onFilesConsumed,
  onOpenBatchQueue,
  onOpenShare,
  onSelectTool
}) => {
  const { t, language, getToolTitle, getToolDescription } = useLanguage();
  const seoInfo = useMemo(() => getToolSeoInfo(tool.id), [tool.id]);
  const [fileItems, setFileItems] = useState<OrderedFile[]>([]);
  const files = useMemo(() => fileItems.map(item => item.file), [fileItems]);
  const [isProcessing, setIsProcessing] = useState(false);
  const wordAbortControllerRef = useRef<AbortController | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [inlinePreviewUrl, setInlinePreviewUrl] = useState<string | null>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    data: Uint8Array;
    fileName: string;
    details?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Three-Stage Visibility for External SEO Sections:
  // Stage 1 ('empty'): Initial Empty State (before file selection) -> show all external SEO sections
  // Stage 2 ('active'): Active File State (when file is selected/dropped) -> keep all internal tool UI intact, hide external SEO text sections
  // Stage 3 ('completed'): Completed / Download State (when processing finishes & Download button appears) -> hide long SEO sections, show ONLY 'Related Tools'
  const currentStage: 'empty' | 'active' | 'completed' = useMemo(() => {
    if (successResult) return 'completed';
    if (files.length > 0) return 'active';
    return 'empty';
  }, [successResult, files.length]);

  // Manage inline preview object URL memory
  useEffect(() => {
    if (files.length > 0 && showInlinePreview) {
      const url = URL.createObjectURL(files[0]);
      setInlinePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setInlinePreviewUrl(null);
    }
    return undefined;
  }, [files, showInlinePreview]);

  // Tool-specific options
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    type: 'text',
    text: 'CONFIDENTIAL',
    opacity: 0.25,
    size: 48,
    angle: 45,
    colorHex: '#EF4444',
    xPercent: 50,
    yPercent: 50,
    fontFamily: 'Helvetica-Bold',
    pageRange: 'all'
  });

  const [pageNumberSettings, setPageNumberSettings] = useState<PageNumberSettings>({
    position: 'bottom-center',
    format: 'Page {n} of {total}',
    startAt: 1,
    fontSize: 12,
    colorHex: '#334155',
    fontFamily: 'Helvetica',
    isBold: false,
    skipCoverPage: false,
    margin: 25,
  });

  const [rotateDeg, setRotateDeg] = useState(90);
  const [pdfOcrLanguage, setPdfOcrLanguage] = useState('eng');
  const [pdfWordOptions, setPdfWordOptions] = useState<PdfWordOptions>(DEFAULT_PDF_WORD_OPTIONS);
  const [wordReports, setWordReports] = useState<Record<string, WordReportEntry>>({});
  const [wordPreview, setWordPreview] = useState<{ source: File; output?: Uint8Array | Blob } | null>(null);
  useEffect(() => {
    if (tool.id === 'pdf-to-word' && !files.length) { setWordReports({}); setWordPreview(null); }
  }, [tool.id, files.length]);
  const [organizeSelectedFile, setOrganizeSelectedFile] = useState<File | null>(null);
  const [organizePageStates, setOrganizePageStates] = useState<Map<File, OrganizePageState>>(() => new Map());
  const [imagePages, setImagePages] = useState<ImagePageItem[]>([]);
  const [deletedImagePages, setDeletedImagePages] = useState<ImagePageItem[]>([]);
  const [splitRange, setSplitRange] = useState('1');
  const [imageOrientation, setImageOrientation] = useState<'auto' | 'portrait' | 'landscape'>('portrait');
  const [imagePageSize, setImagePageSize] = useState<'a4' | 'letter' | 'fit-image'>('a4');
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover' | 'original'>('contain');
  const [imageMargin, setImageMargin] = useState(20);

  const handleOrganizerPageStateChange = useCallback((sourceFile: File, state: OrganizePageState) => {
    setOrganizePageStates((current) => {
      const next = new Map(current);
      next.set(sourceFile, state);
      return next;
    });
  }, []);

  useEffect(() => {
    if (tool.id !== 'jpg-to-pdf') {
      setImagePages((current) => current.length > 0 ? [] : current);
      setDeletedImagePages((current) => current.length > 0 ? [] : current);
      return;
    }

    const activeFiles = new Set(files);
    setImagePages((current) => {
      const knownFiles = new Set([...current, ...deletedImagePages].map((page) => page.file));
      const retained = current.filter((page) => activeFiles.has(page.file));
      const added = files
        .filter((file) => !knownFiles.has(file))
        .map((file) => createImagePageItem(file, files.indexOf(file)));
      if (retained.length === current.length && added.length === 0) return current;
      return [...retained, ...added];
    });
    setDeletedImagePages((current) => {
      const retained = current.filter((page) => activeFiles.has(page.file));
      return retained.length === current.length ? current : retained;
    });
  }, [tool.id, files, deletedImagePages]);

  useEffect(() => {
    if (files.length === 0) {
      if (organizeSelectedFile) setOrganizeSelectedFile(null);
      return;
    }
    if (!organizeSelectedFile || !files.includes(organizeSelectedFile)) {
      setOrganizeSelectedFile(files[0]);
    }
  }, [files, organizeSelectedFile]);

  // Compress PDF options: Presets (low, medium, high, custom) & fine-tuning
  // Low (High Quality) is #1 recommended by default as requested
  const [compressPreset, setCompressPreset] = useState<CompressionPreset>('low');
  const [compressQuality, setCompressQuality] = useState<number>(68);
  const [compressDpi, setCompressDpi] = useState<'low' | 'medium' | 'high' | 'original'>('medium');
  const [compressGrayscale, setCompressGrayscale] = useState<boolean>(false);
  const [compressMode, setCompressMode] = useState<'deep' | 'lossless'>('deep');

  // Track per-file processing state and output data for instant individual download
  const [processedFilesMap, setProcessedFilesMap] = useState<Record<string, ProcessedFileInfo>>({});
  const [metadataDraft, setMetadataDraft] = useState<MetadataFormValues | null>(null);
  useEffect(() => {
    if (!files.length) setMetadataDraft(null);
  }, [files.length]);
  const hasIndividualDownloads = Object.values(processedFilesMap).some(info => info.status === 'done');
  const [resourceWarning, setResourceWarning] = useState<string | null>(null);
  const outputStoreRef = useRef<LocalOutputStore | null>(null);
  const stagedOutputsRef = useRef(new WeakSet<Uint8Array>());
  const getOutputStore = () => {
    outputStoreRef.current ??= new LocalOutputStore(setResourceWarning);
    return outputStoreRef.current;
  };
  class JSZip extends OutputArchive {
    constructor() { super(getOutputStore()); }
  }

  useEffect(() => () => {
    void outputStoreRef.current?.dispose();
    outputStoreRef.current = null;
  }, []);

  useEffect(() => {
    for (const [id, info] of Object.entries(processedFilesMap)) {
      const data = info.data;
      if (info.status !== 'done' || !(data instanceof Uint8Array) ||
          data.byteLength < 8 * 1024 * 1024 || stagedOutputsRef.current.has(data)) continue;
      stagedOutputsRef.current.add(data);
      void getOutputStore().put(data).then((stored) => {
        setProcessedFilesMap((current) => current[id]?.data === data
          ? { ...current, [id]: { ...current[id], data: stored } }
          : current);
      });
    }
  }, [processedFilesMap]);

  // 5-Second Auto-Download Countdown across ALL tools
  const [autoDownloadSeconds, setAutoDownloadSeconds] = useState<number | null>(null);
  const [autoDownloadCancelled, setAutoDownloadCancelled] = useState(false);
  const autoDownloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const successResultRef = useRef<{ data: Uint8Array; fileName: string; details?: string } | null>(null);
  const earlyDownloadTriggerRef = useRef<Record<string, () => void>>({});
  const downloadRequestGate = useRef(new DownloadRequestGate());
  const processedFilesRef = useRef(processedFilesMap);
  processedFilesRef.current = processedFilesMap;

  const cancelItemDownloads = () => {
    Object.values(earlyDownloadTriggerRef.current).forEach(cancel => cancel());
    earlyDownloadTriggerRef.current = {};
    downloadRequestGate.current.clear();
  };
  useEffect(() => () => cancelItemDownloads(), []);

  // Web Crypto Protect & Unlock states
  const [protectPassword, setProtectPassword] = useState('');
  const [protectConfirmPassword, setProtectConfirmPassword] = useState('');
  const [protectShowPassword, setProtectShowPassword] = useState(false);
  const [protectHint, setProtectHint] = useState('');
  const [protectIterations, setProtectIterations] = useState<number>(100000);
  const [encryptedPackageResult, setEncryptedPackageResult] = useState<ProtectPdfResult | null>(null);

  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockShowPassword, setUnlockShowPassword] = useState(false);
  const [detectedEncryptedMeta, setDetectedEncryptedMeta] = useState<EncryptedPackageMetadata | null>(null);

  // Inspect uploaded file if unlocking
  useEffect(() => {
    let active = true;
    if (tool.id === 'unlock' && files.length > 0) {
      inspectEncryptedPdf(files[0])
        .then((meta: any) => {
          if (active && meta && meta.isProtected) setDetectedEncryptedMeta(meta);
          else if (active) setDetectedEncryptedMeta(null);
        })
        .catch(() => {
          if (active) setDetectedEncryptedMeta(null);
        });
    } else {
      setDetectedEncryptedMeta(null);
    }
    return () => {
      active = false;
    };
  }, [tool.id, files]);

  // Helper to construct ordered file items with guaranteed unique keys
  const createOrderedFiles = (newFiles: File[]): OrderedFile[] => {
    return newFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}-${encodeURIComponent(file.name.slice(0, 20))}`,
      file
    }));
  };

  // In-browser memory pressure & queue concurrency audit
  const [memoryAudit, setMemoryAudit] = useState<MemoryAuditResult | null>(null);
  const consumedInitialFilesRef = useRef<string | null>(null);

  // Consume incoming initial files from global drop or external trigger
  useEffect(() => {
    if (isProcessing) return;
    if (!initialFiles || initialFiles.length === 0) {
      consumedInitialFilesRef.current = null;
      return;
    }

    const signature = initialFiles
      .map(file => `${file.name}:${file.size}:${file.lastModified}`)
      .join('|');
    if (consumedInitialFilesRef.current === signature) return;
    consumedInitialFilesRef.current = signature;

    const batch = validateFileBatch(
      initialFiles,
      getExpectedTypeForTool(tool.id),
      fileItems.map(item => item.file)
    );
    if (batch.validFiles.length > 0) {
      setFileItems(prev => [...prev, ...createOrderedFiles(batch.validFiles)]);
      setSuccessResult(null);
    }
    setErrorMessage(batch.errors[0] || null);
    onFilesConsumed?.();
  }, [initialFiles, onFilesConsumed, isProcessing]);

  useEffect(() => {
    const audit = auditMemoryPressure(fileItems.map(item => item.file));
    setMemoryAudit(audit.warning ? audit : null);
  }, [fileItems]);

  // Synchronize successResultRef with latest successResult
  useEffect(() => {
    successResultRef.current = successResult;
  }, [successResult]);

  // 5-Second Auto-Download Countdown across single-file tools (Merge, Compress, Rotate, Protect, Unlock, etc.)
  // NEVER auto-download .zip archives automatically; ZIP archives must only download on explicit user click.
  useEffect(() => {
    if (!successResult || autoDownloadCancelled || ((files.length > 1 || tool.id === 'edit-metadata') && hasIndividualDownloads)) {
      if (autoDownloadTimerRef.current) {
        clearInterval(autoDownloadTimerRef.current);
        autoDownloadTimerRef.current = null;
      }
      setAutoDownloadSeconds(null);
      return;
    }

    // Stop auto-downloading ZIP archives!
    if (successResult.fileName.endsWith('.zip')) {
      if (autoDownloadTimerRef.current) {
        clearInterval(autoDownloadTimerRef.current);
        autoDownloadTimerRef.current = null;
      }
      setAutoDownloadSeconds(null);
      return;
    }

    let remaining = 5;
    setAutoDownloadSeconds(remaining);

    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }

    autoDownloadTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setAutoDownloadSeconds(remaining);
      } else {
        if (autoDownloadTimerRef.current) {
          clearInterval(autoDownloadTimerRef.current);
          autoDownloadTimerRef.current = null;
        }
        setAutoDownloadSeconds(0);

        // Trigger automatic download directly and cleanly OUTSIDE setState (single-file only)
        const target = successResultRef.current;
        if (target && !target.fileName.endsWith('.zip')) {
          downloadBlob(target.data, target.fileName, getDownloadMimeType(target.fileName));
        }
      }
    }, 1000);

    return () => {
      if (autoDownloadTimerRef.current) {
        clearInterval(autoDownloadTimerRef.current);
        autoDownloadTimerRef.current = null;
      }
    };
  }, [successResult, autoDownloadCancelled, files.length, hasIndividualDownloads, tool.id]);

  const getExpectedTypeForTool = (toolId: string): 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'any' => {
    if (toolId === 'jpg-to-pdf') return 'image';
    if (toolId === 'word-to-pdf' || toolId === 'word-to-excel') return 'word';
    if (toolId === 'excel-to-pdf') return 'excel';
    if (toolId === 'powerpoint-to-pdf') return 'powerpoint';
    return 'pdf';
  };

  const addFilesToWorkspace = (selectedFiles: File[]) => {
    if (isProcessing) {
      setErrorMessage('Please wait for the current operation to finish before adding files. Your selection has been kept.');
      return;
    }
    const docxOnly = tool.id === 'word-to-pdf' || tool.id === 'word-to-excel';
    const compatibleFiles = docxOnly
      ? selectedFiles.filter(file => file.name.toLowerCase().endsWith('.docx'))
      : selectedFiles;
    const unsupportedFiles = docxOnly
      ? selectedFiles.filter(file => !file.name.toLowerCase().endsWith('.docx'))
      : [];
    const batch = validateFileBatch(
      compatibleFiles,
      getExpectedTypeForTool(tool.id),
      fileItems.map(item => item.file)
    );
    const errors = [
      ...unsupportedFiles.map(file => `"${file.name}" is not supported here. Please choose a .docx file.`),
      ...batch.errors
    ];

    if (batch.validFiles.length > 0) {
      setFileItems(prev => [...prev, ...createOrderedFiles(batch.validFiles)]);
      setSuccessResult(null);
      setProcessedFilesMap({});
    }

    setErrorMessage(errors.length ? errors.join(' ') : (batch.validFiles.length === 0 ? 'None of the selected files could be loaded.' : null));
  };

  // File drop / upload handlers with security & crash protection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToWorkspace(Array.from(e.target.files));
    }
    // Clean input value so selecting the same files again triggers onChange
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling to window and GlobalDropOverlay
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToWorkspace(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    if (isProcessing) return;
    const itemToRemove = fileItems[index];
    setFileItems(prev => prev.filter((_, i) => i !== index));
    if (itemToRemove) {
      setProcessedFilesMap(prev => {
        const next = { ...prev };
        delete next[itemToRemove.id];
        return next;
      });
    }
  };

  const clearAllFiles = () => {
    if (isProcessing) return;
    setMetadataDraft(null);
    void outputStoreRef.current?.dispose();
    outputStoreRef.current = null;
    setFileItems([]);
    setOrganizeSelectedFile(null);
    setOrganizePageStates(new Map());
    setImagePages([]);
    setDeletedImagePages([]);
    setProcessedFilesMap({});
    setErrorMessage(null);
    setSuccessResult(null);
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    cancelItemDownloads();
    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }
  };

  const downloadSingleProcessedFile = (item: OrderedFile, info: ProcessedFileInfo) => {
    if (!info || !info.data || (info.data instanceof Blob ? info.data.size : info.data.length) === 0) return;
    if (files.length === 1) setAutoDownloadCancelled(true);
    // If an auto-download countdown is active for this file, resolve it early so it doesn't wait
    if (earlyDownloadTriggerRef.current[item.id]) {
      earlyDownloadTriggerRef.current[item.id]();
      delete earlyDownloadTriggerRef.current[item.id];
    }
    const downloadName = info.fileName || `${item.file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`;
    if (!downloadRequestGate.current.claim(item.id)) return;
    downloadBlob(info.data, downloadName, getDownloadMimeType(downloadName));
    setProcessedFilesMap(prev => {
      const existing = prev[item.id];
      if (!existing) return prev;
      return {
        ...prev,
        [item.id]: {
          ...existing,
          autoDownloadSeconds: 0,
          autoDownloaded: true
        }
      };
    });
  };

  // Auto-Download Countdown for individual files (triggers a 5-second countdown per completed file)
  const runItemAutoDownloadCountdown = async (
    item: OrderedFile,
    _data: Uint8Array | Blob,
    fileName: string,
    _fileIndex: number,
    totalFiles: number,
    forceIndividual = false
  ) => {
    // Single-file results already have the workspace countdown. Never download twice.
    if (totalFiles <= 1 && !forceIndividual) return;
    earlyDownloadTriggerRef.current[item.id]?.();
    earlyDownloadTriggerRef.current[item.id] = startDownloadCountdown((s) => {
      setProcessedFilesMap(prev => {
        const existing = prev[item.id];
        if (!existing || existing.status !== 'done' || existing.autoDownloaded) return prev;
        return { ...prev, [item.id]: { ...existing, autoDownloadSeconds: s } };
      });
    }, () => {
      delete earlyDownloadTriggerRef.current[item.id];
      // Read the current Blob/File (which may now be disk-backed), rather than
      // retaining a large result buffer in each five-second timer closure.
      const info = processedFilesRef.current[item.id];
      if (!info || info.status !== 'done' || info.autoDownloaded) return;
      if (!downloadRequestGate.current.claim(item.id)) return;
      downloadBlob(info.data, info.fileName || fileName, getDownloadMimeType(info.fileName || fileName));
      setProcessedFilesMap(prev => prev[item.id] === info
        ? { ...prev, [item.id]: { ...info, autoDownloadSeconds: 0, autoDownloaded: true } }
        : prev);
    });
  };

  const handleMetadataFromPanel = async (draft: MetadataFormValues, sanitize = false) => {
    if (isProcessing || !fileItems.length) return;
    const items = [...fileItems];
    const payload = {
      title: draft.title.trim(), author: draft.author.trim(), subject: draft.subject.trim(),
      keywords: draft.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
      creator: draft.creator.trim(), producer: draft.producer.trim(), modificationDate: new Date()
    };
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessResult(null);
    cancelItemDownloads();
    setProcessedFilesMap({});
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    const archive = new JSZip();
    let singleResult: Uint8Array | null = null;
    let singleName = '';
    let completed = 0;
    const failures: string[] = [];
    try {
      for (const [index, item] of items.entries()) {
        const file = item.file;
        setProcessingStatus(`Updating metadata: ${index + 1} of ${items.length} — ${file.name}`);
        setProcessedFilesMap(current => ({
          ...current, [item.id]: { data: new Uint8Array(), fileName: file.name, status: 'processing' }
        }));
        try {
          const bytes = sanitize ? await sanitizePdfMetadata(file) : await updatePdfMetadata(file, payload);
          const fileName = `${file.name.replace(/\.pdf$/i, '')}-${sanitize ? 'cleaned' : 'updated'}-metadata.pdf`;
          const stored = await getOutputStore().put(bytes);
          if (items.length > 1) archive.file(fileName, stored);
          else { singleResult = bytes; singleName = fileName; }
          setProcessedFilesMap(current => ({
            ...current, [item.id]: {
              data: stored, fileName, originalSize: file.size, newSize: bytes.byteLength,
              status: 'done', autoDownloadSeconds: 5, autoDownloaded: false
            }
          }));
          void runItemAutoDownloadCountdown(item, stored, fileName, index, items.length, true);
          completed++;
        } catch (error: any) {
          const message = error?.message || 'Could not update this PDF.';
          failures.push(`${file.name}: ${message}`);
          setProcessedFilesMap(current => ({
            ...current, [item.id]: {
              data: new Uint8Array(), fileName: file.name, status: 'error', errorMessage: message
            }
          }));
        }
        await yieldToMainThread(25);
      }
      if (!completed) throw new Error(failures.join('; ') || 'No PDFs could be updated.');
      setProcessingStatus('Preparing metadata results...');
      setSuccessResult({
        data: items.length > 1 ? await archive.generateAsync({ type: 'uint8array' }) : singleResult!,
        fileName: items.length > 1 ? `metadata_documents_${completed}_files.zip` : singleName,
        details: `${sanitize ? 'Cleared metadata from' : 'Applied the same metadata to'} ${completed} of ${items.length} PDFs.${failures.length ? ` Failed: ${failures.join('; ')}` : ''}`
      });
      if (failures.length) setErrorMessage(`${failures.length} file(s) could not be processed. Successful files remain available.`);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not update PDF metadata.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Dedicated handler for interactive Rotate PDF workspace without timeout interruption
  const handleRotateFromPanel = async (pageRotations: PageRotationMap, globalDelta: number) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    cancelItemDownloads();
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    try {
      const primary = files[0];
      const res = await rotatePdfPages(primary, pageRotations, globalDelta);

      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      const modifiedPagesCount = Object.keys(pageRotations).length;
      let details = '';
      if (modifiedPagesCount === 0 && globalDelta === 0) {
        details = `Verified document across ${res.totalPages} pages with original orientations preserved.`;
      } else if (globalDelta !== 0 && modifiedPagesCount === 0) {
        const dir = (globalDelta % 360 === 90 || globalDelta % 360 === -270) ? 'Clockwise' : 'Counter-Clockwise';
        details = `Rotated all ${res.totalPages} pages by ${Math.abs(globalDelta)}° ${dir}.`;
      } else if (modifiedPagesCount === res.totalPages) {
        details = `Successfully rotated all ${res.totalPages} pages directly in your browser.`;
      } else {
        details = `Successfully rotated ${modifiedPagesCount} of ${res.totalPages} pages directly in your browser.`;
      }

      setSuccessResult({
        data: res.data,
        fileName: `rotated_${primary.name}`,
        details,
      });
    } catch (err: any) {
      console.warn('[ClickPDF Rotate]', err);
      setErrorMessage(err.message || 'Failed to rotate PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Dedicated handler for interactive Organize PDF workspace
  const handleOrganizeFromPanel = async (
    reorganizedData: Uint8Array,
    activePagesCount: number,
    detailsMsg: string,
    sourceFile: File,
    activePageItems: OrganizePageCardItem[]
  ) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    try {
      if (tool.id === 'pdf-to-image') {
        const states = new Map(organizePageStates);
        states.set(sourceFile, { pages: activePageItems, deletedPages: [] });
        const result = await exportPdfDocumentsAsImages(files, states, setProcessingStatus, getOutputStore());
        setSuccessResult(result);
        return;
      }
      const activeFile = sourceFile || organizeSelectedFile || files[0];
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      setSuccessResult({
        data: reorganizedData,
        fileName: `organized_${activeFile.name}`,
        details: detailsMsg || `Successfully organized ${activePagesCount} pages in your browser.`,
      });
    } catch (err: any) {
      console.warn('[ClickPDF Organize]', err);
      setErrorMessage(err.message || 'Failed to organize PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Main processing trigger
  const handleProcess = async () => {
    if (tool.id === 'pdf-to-word' && wordAbortControllerRef.current) return;
    if (tool.id === 'edit-metadata') {
      if (metadataDraft) await handleMetadataFromPanel(metadataDraft);
      return;
    }
    if (files.length === 0) {
      setErrorMessage('Please upload at least one file to process.');
      return;
    }

    if (tool.id === 'split') {
      const parts = splitRange.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) {
        setErrorMessage('Please enter valid page numbers or range (e.g. 1-3, 5).');
        return;
      }
    }

    if (tool.id === 'protect') {
      if (!protectPassword) {
        setErrorMessage('Please enter a password to protect your PDF.');
        return;
      }
      if (protectPassword.length < 4) {
        setErrorMessage('Password must be at least 4 characters long.');
        return;
      }
      if (protectConfirmPassword && protectPassword !== protectConfirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter identical passwords.');
        return;
      }
    }

    if (tool.id === 'unlock') {
      if (!unlockPassword) {
        setErrorMessage('Please enter the decryption password for this PDF.');
        return;
      }
    }

    const wordController = tool.id === 'pdf-to-word' ? new AbortController() : null;
    if (wordController) wordAbortControllerRef.current = wordController;
    setIsProcessing(true);
    setErrorMessage(null);
    setAutoDownloadCancelled(false);
    setAutoDownloadSeconds(null);
    cancelItemDownloads();

    try {
      let resultData: Uint8Array = new Uint8Array();
      let outputName = 'clickpdf_processed.pdf';
      let details = '';

      if (tool.id === 'merge') {
        setProcessingStatus(`Merging 0 of ${files.length} document${files.length > 1 ? 's' : ''}...`);
        resultData = await mergePdfFiles(files, (curr, tot) => {
          setProcessingStatus(`Merging file ${curr} of ${tot}...`);
        });
        outputName = 'merged_document.pdf';
        details = files.length > 1
          ? `Successfully merged ${files.length} PDF files into a single document.`
          : `Successfully processed and consolidated PDF into a standard document.`;
      } else if (tool.id === 'split') {
        // Parse split range e.g. "1, 2, 3-5"
        const pagesToKeep: number[] = [];
        const parts = splitRange.split(',').map(s => s.trim());
        for (const p of parts) {
          if (p.includes('-')) {
            const [start, end] = p.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) pagesToKeep.push(i);
            }
          } else {
            const val = Number(p);
            if (!isNaN(val)) pagesToKeep.push(val);
          }
        }
        if (pagesToKeep.length === 0) {
          throw new Error('Please enter valid page numbers or range (e.g. 1-3, 5).');
        }

        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus('Extracting selected pages...');
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: new Uint8Array(),
                fileName: primary.name,
                originalSize: primary.size,
                newSize: 0,
                status: 'processing'
              }
            });
          }
          resultData = await splitPdfFile(primary, pagesToKeep);
          outputName = `split_${primary.name}`;
          details = `Extracted pages ${pagesToKeep.join(', ')} into a new PDF.`;

          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: resultData,
                fileName: outputName,
                originalSize: primary.size,
                newSize: resultData.byteLength,
                status: 'done',
                autoDownloadSeconds: 5,
                autoDownloaded: false
              }
            });
            runItemAutoDownloadCountdown(item, resultData, outputName, 0, 1);
          }
        } else {
          setProcessingStatus(`Splitting 0 of ${files.length} documents...`);
          const zip = new JSZip();
          const zipFolder = zip.folder('ClickPDF_Split_Files') || zip;
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Splitting file ${i + 1} of ${files.length}: ${f.name}...`);
            if (item) {
              setProcessedFilesMap(prev => ({
                ...prev,
                [item.id]: {
                  data: new Uint8Array(),
                  fileName: f.name,
                  originalSize: f.size,
                  newSize: 0,
                  status: 'processing'
                }
              }));
            }

            try {
              const splitData = await splitPdfFile(f, pagesToKeep);
              const splitName = `split_${f.name.replace(/\.[^/.]+$/, '')}.pdf`;
              zipFolder.file(splitName, splitData);
              successCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: splitData,
                    fileName: splitName,
                    originalSize: f.size,
                    newSize: splitData.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));

                runItemAutoDownloadCountdown(item, splitData, splitName, i, files.length);
              }
            } catch (itemErr: any) {
              failCount++;
              const errorMsg = formatMemoryErrorMessage(itemErr, f.name);
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: errorMsg
                  }
                }));
              }
            } finally {
              await yieldToMainThread(35);
            }
          }

          if (successCount === 0) throw new Error(`Could not extract pages from any document. Please verify page range.`);
          setProcessingStatus('Packaging batch ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `split_documents_${successCount}_files.zip`;
          details = `Successfully extracted pages ${pagesToKeep.join(', ')} across ${successCount} documents. Each file auto-downloads above in 5s, or you can download the complete ZIP archive below.`;
        }
      } else if (tool.id === 'compress') {
        const compressOptions: CompressPdfOptions = {
          preset: compressPreset,
          quality: compressQuality / 100,
          scale: compressDpi === 'low' ? 0.95 : compressDpi === 'medium' ? 1.25 : compressDpi === 'high' ? 1.6 : 2.0,
          maxDimension: compressDpi === 'low' ? 1200 : compressDpi === 'medium' ? 1600 : compressDpi === 'high' ? 2200 : 2800,
          grayscale: compressGrayscale,
          mode: compressMode,
          onProgress: (_curr, _tot, statusText) => {
            setProcessingStatus(statusText);
          }
        };

        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: new Uint8Array(),
                fileName: primary.name,
                originalSize: primary.size,
                newSize: 0,
                status: 'processing'
              }
            });
          }
          setProcessingStatus('Starting document compression...');
          const res = await compressPdfFile(primary, compressOptions);
          resultData = res.data;
          outputName = `compressed_${primary.name}`;
          const savedPercent = res.savedPercent ?? Math.max(0, Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100));
          const origMb = (res.originalSize / (1024 * 1024)).toFixed(2);
          const newMb = (res.newSize / (1024 * 1024)).toFixed(2);
          details = res.newSize >= res.originalSize
            ? `No size reduction with these settings; the original PDF has been kept (${origMb} MB). Try Medium or High for stronger compression.`
            : `Optimized from ${origMb} MB down to ${newMb} MB (${savedPercent}% saved). Preset: ${{ low: 'High Quality — Recommended', medium: 'Medium', high: 'High Compression', custom: 'Custom' }[compressPreset]}${compressGrayscale ? ' (Grayscale)' : ''}.`;

          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: outputName,
                originalSize: res.originalSize,
                newSize: res.newSize,
                savedPercent,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Compressing 0 of ${files.length} documents...`);
          const zip = new JSZip();
          // Create the main folder inside the ZIP so when extracted it extracts as a single folder containing all separate files
          const zipFolder = zip.folder('ClickPDF_Compressed_Files') || zip;
          let totalOrig = 0;
          let totalNew = 0;
          let successCount = 0;
          let failCount = 0;
          const usedZipNames = new Set<string>();

          await executeConcurrentBatch({
            items: fileItems,
            // PDF decoding expands far beyond the input size, particularly on mobile.
            concurrency: 1,
            retainResults: false,
            worker: async (item, idx, onProgress) => {
              const f = item.file;
              setProcessedFilesMap(prev => ({
                ...prev,
                [item.id]: {
                  data: new Uint8Array(),
                  fileName: f.name,
                  originalSize: f.size,
                  newSize: 0,
                  status: 'processing'
                }
              }));

              const res = await compressPdfFile(f, {
                ...compressOptions,
                onProgress: (_curr, _tot, statusText) => {
                  setProcessingStatus(`File ${idx + 1}/${files.length} (${f.name}): ${statusText}`);
                  onProgress(50, statusText);
                }
              });

              // Finish staging before the next document starts, not in a later effect.
              const stored = await getOutputStore().put(res.data);
              return { item, res: { ...res, data: stored }, idx };
            },
            onItemSuccess: (_it, idx, { item, res }) => {
              totalOrig += res.originalSize;
              totalNew += res.newSize;
              successCount++;

              const baseName = item.file.name.replace(/\.pdf$/i, '');
              let cleanName = `${baseName}_compressed.pdf`;
              if (usedZipNames.has(cleanName.toLowerCase())) {
                cleanName = `${baseName}_compressed_${idx + 1}.pdf`;
              }
              usedZipNames.add(cleanName.toLowerCase());

              zipFolder.file(cleanName, res.data);
              const savedPct = res.savedPercent ?? Math.max(0, Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100));

              setProcessedFilesMap(prev => ({
                ...prev,
                [item.id]: {
                  data: res.data,
                  fileName: cleanName,
                  originalSize: res.originalSize,
                  newSize: res.newSize,
                  savedPercent: savedPct,
                  status: 'done',
                  autoDownloadSeconds: 5,
                  autoDownloaded: false
                }
              }));

              void runItemAutoDownloadCountdown(item, res.data, cleanName, idx, files.length);
            },
            onItemError: (item, _idx, err) => {
              failCount++;
              const errorMsg = formatMemoryErrorMessage(err, item.file.name);
              console.warn(`[ClickPDF] Compression failed for "${item.file.name}":`, errorMsg);
              setProcessedFilesMap(prev => ({
                ...prev,
                [item.id]: {
                  data: new Uint8Array(),
                  fileName: item.file.name,
                  originalSize: item.file.size,
                  newSize: 0,
                  status: 'error',
                  errorMessage: errorMsg
                }
              }));
            }
          });

          if (successCount === 0) {
            throw new Error(`None of the ${files.length} documents could be compressed. Files may exceed available browser memory.`);
          }

          setProcessingStatus('Packaging batch ZIP archive with all individual compressed PDFs...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
          outputName = `compressed_documents_${successCount}_files.zip`;
          const savedPercent = totalOrig > 0 ? Math.max(0, Math.round(((totalOrig - totalNew) / totalOrig) * 100)) : 0;
          details = `Successfully compressed ${successCount} of ${files.length} PDF files separately! Reduced from ${(totalOrig / (1024 * 1024)).toFixed(1)} MB down to ${(totalNew / (1024 * 1024)).toFixed(1)} MB (${savedPercent}% saved across batch). ${failCount > 0 ? `(${failCount} file(s) exceeded browser memory and were skipped)` : ''}`;
          if (totalNew >= totalOrig) {
            details = `Processed ${successCount} of ${files.length} PDFs. No size reduction with these settings; original files were kept. Try Medium or High for stronger compression.${failCount > 0 ? ` ${failCount} file(s) failed; see their individual errors.` : ''}`;
          }
        }
      } else if (tool.id === 'jpg-to-pdf') {
        setProcessingStatus(`Converting ${files.length} image${files.length > 1 ? 's' : ''} to PDF...`);
        if (!imagePages.length) throw new Error('Keep at least one image page before converting.');
        const basePdfData = await imagesToPdf(imagePages.map((page) => page.file), {
          orientation: imageOrientation,
          pageSize: imagePageSize,
          fit: imageFitMode,
          margin: imageMargin
        });
        resultData = basePdfData;
        if (imagePages.some((page) => page.rotationDelta !== 0)) {
          const source = new File([basePdfData as unknown as BlobPart], 'images.pdf', { type: 'application/pdf' });
          resultData = await organizePdfPagesWithRotations(source, imagePages.map((page, index) => ({
            originalIndex: index,
            rotationDelta: page.rotationDelta,
          })));
        }
        const firstName = files[0]?.name ? files[0].name.replace(/\.[^/.]+$/, '') : 'images';
        outputName = imagePages.length === 1 ? `${firstName}.pdf` : `converted_images_${imagePages.length}_pages.pdf`;
        const sizeDesc = imagePageSize === 'fit-image' ? 'Original image dimensions' : imagePageSize.toUpperCase();
        details = `Converted ${imagePages.length} arranged image pages into one PDF (${sizeDesc}, ${imageOrientation}, ${imageFitMode}, ${imageMargin}px margins). Page copies, removals, and rotations are included.`;
      } else if (tool.id === 'rotate') {
        if (files.length === 1) {
          const primary = files[0];
          resultData = await rotatePdfFile(primary, rotateDeg);
          outputName = `rotated_${primary.name}`;
          details = `Rotated all document pages by ${rotateDeg} degrees.`;
        } else {
          setProcessingStatus(`Rotating 0 of ${files.length} documents...`);
          const zip = new JSZip();
          const zipFolder = zip.folder('ClickPDF_Rotated_Files') || zip;
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Rotating file ${i + 1} of ${files.length}: ${f.name}...`);
            try {
              const rotated = await rotatePdfFile(f, rotateDeg);
              const rotatedName = `${f.name.replace(/\.[^/.]+$/, '')}_rotated_${rotateDeg}deg.pdf`;
              zipFolder.file(rotatedName, rotated);
              successCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: rotated,
                    fileName: rotatedName,
                    originalSize: f.size,
                    newSize: rotated.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));

                runItemAutoDownloadCountdown(item, rotated, rotatedName, i, files.length);
              }
            } catch (itemErr: any) {
              failCount++;
              const errorMsg = formatMemoryErrorMessage(itemErr, f.name);
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: errorMsg
                  }
                }));
              }
            } finally {
              await yieldToMainThread(35);
            }
          }
          if (successCount === 0) throw new Error(`Could not rotate documents due to memory or file limits.`);
          setProcessingStatus('Packaging batch ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `rotated_documents_${successCount}_files.zip`;
          details = `Successfully rotated ${successCount} documents by ${rotateDeg}°. ${failCount > 0 ? `(${failCount} skipped due to memory limits)` : ''}`;
        }
      } else if (tool.id === 'watermark') {
        const sharedWatermarkOptions = { ...watermarkOptions };
        const textToStamp = sharedWatermarkOptions.text || 'CONFIDENTIAL';
        if (files.length === 1) {
          const primary = files[0];
          resultData = await addWatermarkToPdf(primary, textToStamp, sharedWatermarkOptions);
          outputName = `watermarked_${primary.name}`;
          details = watermarkOptions.type === 'image'
            ? `Applied custom logo watermark to document.`
            : `Applied watermark "${textToStamp}" across document.`;
        } else {
          setProcessingStatus(`Watermarking 0 of ${files.length} documents...`);
          const zip = new JSZip();
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Watermarking file ${i + 1} of ${files.length}: ${f.name}...`);
            try {
              setProcessedFilesMap(prev => ({
                ...prev, [item.id]: {
                  data: new Uint8Array(), fileName: f.name,
                  originalSize: f.size, newSize: 0, status: 'processing'
                }
              }));
              const stamped = await addWatermarkToPdf(f, textToStamp, sharedWatermarkOptions);
              const stampedName = `${f.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`;
              zip.file(stampedName, stamped);
              successCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: stamped,
                    fileName: stampedName,
                    originalSize: f.size,
                    newSize: stamped.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));

                runItemAutoDownloadCountdown(item, stamped, stampedName, i, files.length);
              }
            } catch (itemErr: any) {
              failCount++;
              const errorMsg = formatMemoryErrorMessage(itemErr, f.name);
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: errorMsg
                  }
                }));
              }
            } finally {
              await yieldToMainThread(35);
            }
          }
          if (successCount === 0) throw new Error(`Could not watermark documents due to memory or file limits.`);
          setProcessingStatus('Packaging watermarked ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `watermarked_documents_${successCount}_files.zip`;
          details = watermarkOptions.type === 'image'
            ? `Applied image watermark to ${successCount} documents.`
            : `Applied watermark "${textToStamp}" to ${successCount} documents. ${failCount > 0 ? `(${failCount} skipped due to memory limits)` : ''}`;
        }
      } else if (tool.id === 'page-numbers') {
        if (files.length === 1) {
          const primary = files[0];
          setProcessingStatus(`Adding page numbers to ${primary.name}...`);
          resultData = await addPageNumbersToPdf(primary, {
            position: pageNumberSettings.position,
            format: pageNumberSettings.format,
            startAt: pageNumberSettings.startAt,
            fontSize: pageNumberSettings.fontSize,
            colorHex: pageNumberSettings.colorHex,
            fontFamily: pageNumberSettings.fontFamily,
            skipCoverPage: pageNumberSettings.skipCoverPage,
            margin: pageNumberSettings.margin,
            onProgress: (current, total) => {
              setProcessingStatus(`Numbering page ${current} of ${total} (${(primary.size / (1024 * 1024)).toFixed(1)} MB)...`);
            }
          });
          outputName = `numbered_${primary.name}`;
          details = `Numbered ${primary.name} starting from ${pageNumberSettings.startAt} (${pageNumberSettings.fontSize}pt, ${pageNumberSettings.isBold ? 'Bold' : 'Regular'}, ${pageNumberSettings.colorHex}).`;
        } else {
          setProcessingStatus(`Numbering 0 of ${files.length} documents...`);
          const zip = new JSZip();
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Numbering file ${i + 1} of ${files.length}: ${f.name}...`);
            try {
              const numbered = await addPageNumbersToPdf(f, {
                position: pageNumberSettings.position,
                format: pageNumberSettings.format,
                startAt: pageNumberSettings.startAt,
                fontSize: pageNumberSettings.fontSize,
                colorHex: pageNumberSettings.colorHex,
                fontFamily: pageNumberSettings.fontFamily,
                skipCoverPage: pageNumberSettings.skipCoverPage,
                margin: pageNumberSettings.margin,
                onProgress: (current, total) => {
                  setProcessingStatus(`File ${i + 1}/${files.length} (${f.name}): page ${current} of ${total}...`);
                }
              });
              const numberedName = `${f.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`;
              zip.file(numberedName, numbered);
              successCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: numbered,
                    fileName: numberedName,
                    originalSize: f.size,
                    newSize: numbered.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));

                runItemAutoDownloadCountdown(item, numbered, numberedName, i, files.length);
              }
            } catch (itemErr: any) {
              failCount++;
              const errorMsg = formatMemoryErrorMessage(itemErr, f.name);
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: errorMsg
                  }
                }));
              }
            } finally {
              await yieldToMainThread(35);
            }
          }
          if (successCount === 0) throw new Error(`Could not add page numbers due to memory or file limits.`);
          setProcessingStatus('Packaging paginated ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `numbered_documents_${successCount}_files.zip`;
          details = `Successfully paginated ${successCount} documents. ${failCount > 0 ? `(${failCount} skipped due to memory limits)` : ''}`;
        }
      } else if (tool.id === 'organize') {
        const primary = files[0];
        const info = await inspectPdf(primary);
        // Default keep all or reversed as demonstration
        const indices = Array.from({ length: info.pageCount }, (_, i) => i);
        resultData = await organizePdfPages(primary, indices);
        outputName = `organized_${primary.name}`;
        details = `Rebuilt document with verified page stream.`;
      } else if (tool.id === 'metadata') {
        const primary = files[0];
        const [meta, pageData] = await Promise.all([
          extractPdfMetadata(primary),
          countPdfPages(primary)
        ]);
        const combined = { ...meta, pageAnalysis: pageData };
        const jsonStr = JSON.stringify(combined, null, 2);
        const encoder = new TextEncoder();
        resultData = encoder.encode(jsonStr);
        outputName = `${primary.name.replace(/\.pdf$/i, '')}_analysis.json`;
        details = `Verified total page count: ${pageData.totalPages} pages (${pageData.portraitCount} Portrait, ${pageData.landscapeCount} Landscape, ${pageData.primaryPaperFormat}). Technical metadata & structure extracted.`;
      } else if (tool.id === 'protect') {
        if (!protectPassword) {
          throw new Error('Please enter a password to protect your PDF.');
        }
        if (protectPassword.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }
        if (protectConfirmPassword && protectPassword !== protectConfirmPassword) {
          throw new Error('Passwords do not match. Please re-enter identical passwords.');
        }

        if (files.length === 1) {
          const primary = files[0];
          const primaryBytes = new Uint8Array(await primary.arrayBuffer());
          const res = await encryptPdfWithWebCrypto(primaryBytes, protectPassword, {
            fileName: primary.name,
            hint: protectHint.trim() || undefined
          });

          resultData = res.protectedPdfBytes;
          outputName = res.fileName || `${primary.name.replace(/\.pdf$/i, '')}.protected.pdf`;
          details = `Encrypted with military-grade AES-256-GCM using Web Crypto API (${res.metadata.iterations.toLocaleString()} PBKDF2 rounds). 100% client-side privacy.`;
          setEncryptedPackageResult(res);
        } else {
          setProcessingStatus(`Encrypting 0 of ${files.length} documents...`);
          const zip = new JSZip();
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Encrypting file ${i + 1} of ${files.length}: ${f.name}...`);
            const fBytes = new Uint8Array(await f.arrayBuffer());
            const res = await encryptPdfWithWebCrypto(fBytes, protectPassword, {
              fileName: f.name,
              hint: protectHint.trim() || undefined
            });
            const encName = res.fileName || `${f.name}.protected.pdf`;
            zip.file(encName, res.protectedPdfBytes);
            if (item) {
              setProcessedFilesMap(prev => ({
                ...prev,
                [item.id]: {
                  data: res.protectedPdfBytes,
                  fileName: encName,
                  originalSize: f.size,
                  newSize: res.protectedPdfBytes.byteLength,
                  status: 'done',
                  autoDownloadSeconds: 5,
                  autoDownloaded: false
                }
              }));

              // 5-Second live countdown & auto-download directly to user's device
              runItemAutoDownloadCountdown(item, res.protectedPdfBytes, encName, i, files.length);
            }
          }
          setProcessingStatus('Packaging encrypted ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `protected_documents_${files.length}_files.zip`;
          details = `Successfully encrypted all ${files.length} documents with Web Crypto AES-256-GCM.`;
        }
      } else if (tool.id === 'unlock') {
        if (!unlockPassword) {
          throw new Error('Please enter the password to unlock this PDF.');
        }

        if (files.length === 1) {
          const primary = files[0];
          const primaryBytes = new Uint8Array(await primary.arrayBuffer());
          const res = await decryptPdfWithWebCrypto(primaryBytes, unlockPassword);
          resultData = res.decryptedBytes;
          outputName = res.originalName || `unlocked_${primary.name.replace(/\.protected/i, '')}`;
          details = `Successfully decrypted with Web Crypto AES-256-GCM. Original document verified and restored (${(res.originalSize / 1024).toFixed(1)} KB).`;
        } else {
          setProcessingStatus(`Decrypting 0 of ${files.length} documents...`);
          const zip = new JSZip();
          let decryptedCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Decrypting file ${i + 1} of ${files.length}: ${f.name}...`);
            try {
              const fBytes = new Uint8Array(await f.arrayBuffer());
              const res = await decryptPdfWithWebCrypto(fBytes, unlockPassword);
              const decName = res.originalName || `unlocked_${f.name}`;
              zip.file(decName, res.decryptedBytes);
              decryptedCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: res.decryptedBytes,
                    fileName: decName,
                    originalSize: f.size,
                    newSize: res.decryptedBytes.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));

                // 5-Second live countdown & auto-download directly to user's device
                runItemAutoDownloadCountdown(item, res.decryptedBytes, decName, i, files.length);
              }
            } catch {
              // skip unmatching
            }
          }
          setProcessingStatus('Packaging unlocked ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `unlocked_documents_${files.length}_files.zip`;
          details = `Decrypted ${decryptedCount} of ${files.length} documents with Web Crypto AES-256-GCM.`;
        }
      } else if (tool.id === 'pdf-to-word') {
        setWordReports({});
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting ${primary.name} to ${pdfWordOptions.imageFallback === 'all' ? 'image-only' : pdfWordOptions.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} Word (.docx)...`);
          const res = await convertAdvancedPdfToWord(
            primary,
            (_curr, _tot, txt) => setProcessingStatus(txt),
            pdfOcrLanguage,
            { ...pdfWordOptions, additionalLanguages: pdfWordOptions.ocrLanguages || [] },
            wordController?.signal
          );
          if (wordController?.signal.aborted) throw new DOMException('PDF to Word conversion cancelled.', 'AbortError');
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) setWordReports({ [item.id]: { source: primary, outputName: res.fileName, report: res.report } });
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} documents to Word...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Converting file ${i + 1}/${files.length}: ${f.name} to Word...`);
            try {
              const res = await convertAdvancedPdfToWord(
                f,
                (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`),
                pdfOcrLanguage,
                { ...pdfWordOptions, additionalLanguages: pdfWordOptions.ocrLanguages || [] },
                wordController?.signal
              );
              if (wordController?.signal.aborted) throw new DOMException('PDF to Word conversion cancelled.', 'AbortError');
              zip.file(res.fileName, res.data);
              if (currentItem) setWordReports(previous => ({ ...previous, [currentItem.id]: { source: f, outputName: res.fileName, report: res.report } }));
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (wordController?.signal.aborted) throw err;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (wordController?.signal.aborted) throw new DOMException('PDF to Word batch was cancelled; no partial ZIP was downloaded.', 'AbortError');
          if (successCount === 0) throw new Error('None of the selected PDFs could be converted to Word.');
          setProcessingStatus('Packaging batch Word documents ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' },
            metadata => setProcessingStatus(`Packaging Word ZIP: ${Math.round(metadata.percent)}%`));
          if (wordController?.signal.aborted) throw new DOMException('Batch ZIP generation finished after cancellation; it was not downloaded.', 'AbortError');
          outputName = `converted_word_${successCount}_files.zip`;
          details = `Successfully converted ${successCount} of ${files.length} PDF(s) into ${pdfWordOptions.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} Word documents. Review the per-page quality reports, including any image-fallback pages.`;
        }
      } else if (tool.id === 'pdf-to-excel') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Extracting tables from ${primary.name} to Excel (.xlsx)...`);
          const res = await convertPdfToExcelXlsx(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Extracting tables from 0 of ${files.length} documents...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Extracting tables from file ${i + 1}/${files.length}: ${f.name}...`);
            try {
              const res = await convertPdfToExcelXlsx(f, (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`));
              zip.file(res.fileName, res.data);
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (successCount === 0) throw new Error('None of the selected PDFs could be converted to Excel.');
          setProcessingStatus('Packaging batch Excel spreadsheets ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `converted_excel_${successCount}_files.zip`;
          details = `Successfully extracted tables and data rows from ${successCount} PDF(s) into Microsoft Excel (.xlsx).`;
        }
      } else if (tool.id === 'pdf-to-powerpoint') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting ${primary.name} to PowerPoint (.pptx)...`);
          const res = await convertPdfToPowerPointPptx(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} documents to PowerPoint...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Converting file ${i + 1}/${files.length}: ${f.name} to PowerPoint...`);
            try {
              const res = await convertPdfToPowerPointPptx(f, (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`));
              zip.file(res.fileName, res.data);
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (successCount === 0) throw new Error('None of the selected PDFs could be converted to PowerPoint.');
          setProcessingStatus('Packaging batch PowerPoint presentations ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `converted_powerpoint_${successCount}_files.zip`;
          details = `Successfully converted ${successCount} PDF(s) into editable Microsoft PowerPoint (.pptx) presentations.`;
        }
      } else if (tool.id === 'word-to-pdf') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting Word document ${primary.name} to PDF...`);
          const res = await convertWordToPdf(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} Word documents to PDF...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Converting file ${i + 1}/${files.length}: ${f.name} to PDF...`);
            try {
              const res = await convertWordToPdf(f, (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`));
              zip.file(res.fileName, res.data);
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (successCount === 0) throw new Error('None of the selected Word documents could be converted.');
          setProcessingStatus('Packaging batch converted PDFs ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `word_to_pdf_${successCount}_files.zip`;
          details = `Successfully converted ${successCount} Word document(s) into PDF.`;
        }
      } else if (tool.id === 'word-to-excel') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting ${primary.name} to Excel (.xlsx)...`);
          const res = await convertWordToExcelXlsx(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} Word documents to Excel...`);
          const zip = new JSZip();
          const zipFolder = zip.folder('ClickPDF_Word_to_Excel') || zip;
          const usedNames = new Set<string>();
          let successCount = 0;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const item = fileItems[i];
            setProcessingStatus(`Converting file ${i + 1}/${files.length}: ${file.name}...`);
            try {
              const res = await convertWordToExcelXlsx(
                file,
                (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`)
              );
              const baseName = res.fileName.replace(/\.xlsx$/i, '');
              let uniqueName = res.fileName;
              let suffix = 2;
              while (usedNames.has(uniqueName.toLowerCase())) {
                uniqueName = `${baseName}_${suffix++}.xlsx`;
              }
              usedNames.add(uniqueName.toLowerCase());
              zipFolder.file(uniqueName, res.data);
              successCount++;
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: uniqueName,
                    originalSize: file.size,
                    newSize: res.data.byteLength,
                    status: 'done'
                  }
                }));
              }
            } catch (err: any) {
              if (item) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [item.id]: {
                    data: new Uint8Array(),
                    fileName: file.name,
                    originalSize: file.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, file.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }

          if (successCount === 0) throw new Error('None of the selected Word documents could be converted to Excel.');
          setProcessingStatus('Packaging the Excel files into a ZIP archive...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
          outputName = `word_to_excel_${successCount}_files.zip`;
          details = `Converted ${successCount} of ${files.length} Word document(s) into separate Excel workbooks.`;
        }
      } else if (tool.id === 'excel-to-pdf') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting spreadsheet ${primary.name} to PDF...`);
          const res = await convertExcelToPdf(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} spreadsheets to PDF...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Converting spreadsheet ${i + 1}/${files.length}: ${f.name} to PDF...`);
            try {
              const res = await convertExcelToPdf(f, (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`));
              zip.file(res.fileName, res.data);
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (successCount === 0) throw new Error('None of the selected spreadsheets could be converted.');
          setProcessingStatus('Packaging batch converted PDFs ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `excel_to_pdf_${successCount}_files.zip`;
          details = `Successfully converted ${successCount} spreadsheet(s) into styled landscape PDF tables.`;
        }
      } else if (tool.id === 'powerpoint-to-pdf') {
        if (files.length === 1) {
          const primary = files[0];
          const item = fileItems[0];
          setProcessingStatus(`Converting presentation ${primary.name} to PDF...`);
          const res = await convertPowerPointToPdf(primary, (_curr, _tot, txt) => setProcessingStatus(txt));
          resultData = res.data;
          outputName = res.fileName;
          details = res.details;
          if (item) {
            setProcessedFilesMap({
              [item.id]: {
                data: res.data,
                fileName: res.fileName,
                originalSize: primary.size,
                newSize: res.data.byteLength,
                status: 'done'
              }
            });
          }
        } else {
          setProcessingStatus(`Converting 0 of ${files.length} presentations to PDF...`);
          const zip = new JSZip();
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const currentItem = fileItems[i];
            setProcessingStatus(`Converting presentation ${i + 1}/${files.length}: ${f.name} to PDF...`);
            try {
              const res = await convertPowerPointToPdf(f, (_curr, _tot, txt) => setProcessingStatus(`File ${i + 1}/${files.length}: ${txt}`));
              zip.file(res.fileName, res.data);
              successCount++;
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: res.data,
                    fileName: res.fileName,
                    originalSize: f.size,
                    newSize: res.data.byteLength,
                    status: 'done',
                    autoDownloadSeconds: 5,
                    autoDownloaded: false
                  }
                }));
                runItemAutoDownloadCountdown(currentItem, res.data, res.fileName, i, files.length);
              }
            } catch (err: any) {
              if (currentItem) {
                setProcessedFilesMap(prev => ({
                  ...prev,
                  [currentItem.id]: {
                    data: new Uint8Array(),
                    fileName: f.name,
                    originalSize: f.size,
                    newSize: 0,
                    status: 'error',
                    errorMessage: formatMemoryErrorMessage(err, f.name)
                  }
                }));
              }
            }
            await yieldToMainThread(30);
          }
          if (successCount === 0) throw new Error('None of the selected presentations could be converted.');
          setProcessingStatus('Packaging batch converted PDFs ZIP...');
          resultData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
          outputName = `powerpoint_to_pdf_${successCount}_files.zip`;
          details = `Successfully converted ${successCount} presentation(s) into 16:9 widescreen PDF slides.`;
        }
      } else if (tool.id === 'repair') {
        const zip = new JSZip();
        const failures: string[] = [];
        let repaired = 0;
        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          setProcessingStatus(`Rebuilding document ${index + 1} of ${files.length}: ${file.name}...`);
          try {
            const data = await runPdfBackground('repair', [file]);
            const name = `repaired_${file.name}`;
            if (files.length === 1) { resultData = data; outputName = name; }
            else zip.file(name, data);
            repaired++;
            const item = fileItems[index];
            if (item) setProcessedFilesMap((current) => ({
              ...current, [item.id]: { data, fileName: name, status: 'done', originalSize: file.size, newSize: data.byteLength },
            }));
          } catch (error) {
            const message = formatMemoryErrorMessage(error, file.name);
            failures.push(`${file.name}: ${message}`);
            const item = fileItems[index];
            if (item) setProcessedFilesMap((current) => ({
              ...current, [item.id]: { data: new Uint8Array(), fileName: file.name, status: 'error', errorMessage: message },
            }));
          }
          await yieldToMainThread(20);
        }
        if (!repaired) throw new Error(`No documents could be rebuilt. ${failures.join('; ')}`);
        if (files.length > 1) {
          resultData = await zip.generateAsync({ type: 'uint8array' });
          outputName = 'repaired_documents.zip';
        }
        details = `Rebuilt ${repaired} of ${files.length} PDFs with fresh object indexes. Best-effort structural recovery cannot restore missing content.${failures.length ? ` Failed: ${failures.join('; ')}` : ''}`;
      } else {
        throw new Error(`The "${getToolTitle(tool)}" processing engine is not implemented. No files were changed. Compression is not a substitute for this operation.`);
      }

      setSuccessResult({
        data: resultData,
        fileName: outputName,
        details
      });

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // non-critical
      }
    } catch (err: any) {
      const userMessage = formatMemoryErrorMessage(err);
      setErrorMessage(userMessage);
      console.warn('[ClickPDF Engine Warn]', userMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (wordAbortControllerRef.current === wordController) wordAbortControllerRef.current = null;
    }
  };

  const handleDownload = () => {
    if (tool.id === 'edit-metadata' && fileItems.length === 1) {
      const item = fileItems[0];
      const result = processedFilesMap[item.id];
      if (result?.status === 'done') {
        downloadSingleProcessedFile(item, result);
        return;
      }
    }
    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }
    setAutoDownloadSeconds(null);

    const target = successResult || successResultRef.current;
    if (target) {
      downloadBlob(target.data, target.fileName, getDownloadMimeType(target.fileName));
    }
  };

  const handleCancelAutoDownload = () => {
    if (autoDownloadTimerRef.current) {
      clearInterval(autoDownloadTimerRef.current);
      autoDownloadTimerRef.current = null;
    }
    setAutoDownloadCancelled(true);
    setAutoDownloadSeconds(null);
  };

  const plugin = useMemo(() => getToolPlugin(tool.id), [tool.id]);

  // Isolated text-tool implementation; all other tools retain their existing paths.
  if (tool.id === 'pdf-to-text') {
    return <PdfTextWorkspace tool={tool} initialFiles={initialFiles} onBack={onBack} onSelectTool={onSelectTool} />;
  }
  // Only PDF to Excel uses this isolated implementation; no other tool paths change.
  if (tool.id === 'pdf-to-excel') {
    return <PdfExcelWorkspace tool={tool} initialFiles={initialFiles} onBack={onBack} onSelectTool={onSelectTool} />;
  }

  if (plugin) {
    const PluginComponent = plugin.Component;
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToTools}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.clientProcessingBadge}</span>
          </div>
        </div>

        {/* Plugin React Component */}
        <div className="mb-12">
          <PluginComponent
            onBack={onBack}
            initialFiles={initialFiles}
            onSwitchTool={(newToolId) => {
              if (onSelectTool) {
                const targetTool = PDF_TOOLS.find((t) => t.id === newToolId);
                if (targetTool) {
                  onSelectTool(targetTool);
                }
              }
            }}
          />
        </div>

        {/* Tool-Specific SEO Content Section (Overview, Step-by-Step Instructions, Privacy USP, FAQs & Related Tools) */}
        <ToolSeoContentSection
          tool={tool}
          seoInfo={seoInfo}
          onSelectRelatedTool={onSelectTool}
          stage={currentStage}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top bar with back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToTools}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t.clientProcessingBadge}</span>
        </div>
      </div>

      {/* Tool header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="w-full">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {getToolTitle(tool)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl mx-auto">
              {getToolDescription(tool)}
            </p>
          </div>
        </div>
      </div>

      {/* Keep the picker mounted in every workspace mode so additional files can always be added. */}
      {['sign', 'crop', 'pdf-to-pdfa', 'compare'].includes(tool.id) && (
        <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
          {language === 'ur'
            ? 'اس ٹول کا اصل processing انجن موجودہ ایپ میں مکمل نہیں ہے۔ فائلیں منتخب ہو سکتی ہیں، مگر درست نتیجہ ابھی نہیں بنایا جا سکتا۔ پہلے یہ ٹول اصل کام کے بجائے صرف پہلی فائل compress کر رہا تھا؛ اب غلط کامیابی نہیں دکھائی جائے گی۔'
            : 'This tool’s processing engine is not implemented in the current app. File selection is available, but a correct output cannot yet be produced. Previously it silently compressed only the first file instead of performing this operation; that misleading fallback has been removed.'}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={tool.acceptedFileTypes}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {resourceWarning && <p role="status" className="mb-4 text-xs text-amber-600">{resourceWarning}</p>}

      {tool.id === 'rotate' && files.length === 1 && !successResult ? (
        <RotatePdfPanel
          file={files[0]}
          isProcessing={isProcessing}
          onRotateComplete={handleRotateFromPanel}
          onPreviewOriginal={() => setPreviewFile(files[0])}
          onReplaceFile={() => {
            setFileItems([]);
            setSuccessResult(null);
            setErrorMessage(null);
          }}
        />
      ) : (tool.id === 'organize' || tool.id === 'pdf-to-image') && files.length > 0 && !successResult ? (
        <OrganizePdfPanel
          file={organizeSelectedFile || files[0]}
          allFiles={files}
          onSelectDifferentFile={(f) => setOrganizeSelectedFile(f)}
          isProcessing={isProcessing}
          onOrganizeComplete={handleOrganizeFromPanel}
          onPageStateChange={handleOrganizerPageStateChange}
          saveButtonLabel={tool.id === 'pdf-to-image'
            ? (language === 'ur' ? 'تمام PDFs کی PNG تصاویر بنائیں' : 'Export all PDFs as PNG images')
            : undefined}
          skipPdfBuildOnSave={tool.id === 'pdf-to-image'}
          onPreviewOriginal={() => setPreviewFile(organizeSelectedFile || files[0])}
          onReplaceFile={() => {
            setFileItems([]);
            setOrganizeSelectedFile(null);
            setOrganizePageStates(new Map());
            setSuccessResult(null);
            setErrorMessage(null);
          }}
        />
      ) : (
        <>
          {/* Upload drop zone - Disappears as soon as any files are selected/dropped */}
          {files.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:border-indigo-300 transition-all shadow-xs">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tool.multiFile ? t.dropZoneTitleMulti : t.dropZoneTitleSingle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {tool.acceptedFileTypes.includes('image')
                  ? t.dropZoneSubtitleImg
                  : t.dropZoneSubtitlePdf}
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {t.selectFilesBtn}
              </button>
            </div>
          )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.selectedFiles} ({files.length})
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium border border-emerald-100 dark:border-emerald-800">
                {t.readyVerification}
              </span>
            </div>

            <div className={`flex items-center gap-2 ${tool.id === 'pdf-to-word' ? 'max-sm:flex-wrap max-sm:gap-2' : ''}`}>
              <button
                type="button"
                onClick={() => setShowInlinePreview(!showInlinePreview)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showInlinePreview 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showInlinePreview ? t.hidePreview : t.showPreview}</span>
              </button>

              {onOpenBatchQueue && files.length > 1 && !['jpg-to-pdf', 'organize', 'pdf-to-image'].includes(tool.id) && (
                <button
                  type="button"
                  onClick={() => ['watermark', 'edit-metadata', 'pdf-to-word'].includes(tool.id) ? void handleProcess() : onOpenBatchQueue(files)}
                  disabled={isProcessing || (tool.id === 'edit-metadata' && !metadataDraft)}
                  title={tool.id === 'watermark'
                    ? 'Apply the current watermark settings to every selected PDF'
                    : tool.id === 'pdf-to-word'
                    ? 'Convert all selected PDFs using the current Word mode and OCR language'
                    : tool.id === 'edit-metadata'
                    ? 'Apply the current metadata fields to every selected PDF'
                    : 'Switch to Batch Queue to process each file independently with progress indicator'}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{tool.id === 'watermark' ? 'Watermark All Files' : tool.id === 'edit-metadata' ? 'Apply Metadata to All Files' : t.batchProcessEachFile}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addMoreFiles}</span>
              </button>
            </div>
          </div>

          {/* High-Fidelity in-browser PDF Thumbnail Previewer (pdf.js engine) */}
          {showInlinePreview && files[0] && (
            <div className="mb-5">
              {tool.id === 'pdf-to-word' ? <PdfTextSourcePreview file={files[0]} /> : files[0].type.startsWith('image/') && inlinePreviewUrl ? (
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white">
                  <div className="flex items-center justify-between mb-2 px-1 text-xs">
                    <span className="text-slate-300 font-semibold min-w-0 flex items-center gap-1.5 flex-1 mr-2">
                      <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="break-all line-clamp-1">{t.quickInlinePreview}: {files[0].name}</span>
                    </span>
                    <button
                      onClick={() => setPreviewFile(files[0])}
                      className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>{t.expandFullscreen}</span>
                    </button>
                  </div>
                  <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-slate-800">
                    <img
                      src={inlinePreviewUrl}
                      alt={files[0].name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <PdfThumbnailPreviewer
                  file={files[0]}
                  onFullscreenRequested={() => setPreviewFile(files[0])}
                />
              )}
            </div>
          )}

          {/* Draggable & Sortable File List with dnd-kit */}
          <SortableFileList
            items={fileItems}
            isMultiFile={!!tool.multiFile}
            toolId={tool.id}
            processedFiles={processedFilesMap}
            language={language}
            onReorder={(items) => { if (!isProcessing) setFileItems(items); }}
            onPreview={(file) => {
              if (tool.id === 'pdf-to-word') {
                const source = fileItems.find(entry => entry.file === file || processedFilesMap[entry.id]?.fileName === file.name);
                if (source) setWordPreview({ source: source.file, output: processedFilesMap[source.id]?.status === 'done' ? processedFilesMap[source.id].data : undefined });
                return;
              }
              const item = fileItems.find(entry => entry.file === file);
              const result = item && processedFilesMap[item.id];
              if (['watermark', 'edit-metadata'].includes(tool.id) && result?.status === 'done') {
                setPreviewFile(new File([result.data as BlobPart], result.fileName, { type: 'application/pdf' }));
              } else {
                setPreviewFile(file);
              }
            }}
            onRemove={removeFile}
            onClearAll={clearAllFiles}
            onDownloadSingle={downloadSingleProcessedFile}
          />
        </div>
      )}

      {tool.id === 'jpg-to-pdf' && files.length > 0 && !successResult && (
        <ImagePageEditor
          files={files}
          pages={imagePages}
          deletedPages={deletedImagePages}
          onPagesChange={setImagePages}
          onDeletedPagesChange={setDeletedImagePages}
        />
      )}

      {tool.id === 'pdf-to-word' && <PdfWordQualityPanel
        reports={Object.fromEntries(Object.entries(wordReports).filter(([id]) => fileItems.some(item => item.id === id)))}
        onPreview={id => {
          const entry = wordReports[id], output = processedFilesMap[id];
          if (entry) setWordPreview({ source: entry.source, output: output?.status === 'done' ? output.data : undefined });
        }}
      />}

      {/* Dedicated PDF Metadata Editor Panel */}
      {tool.id === 'edit-metadata' && files.length > 0 && !successResult && (
        <div className="mt-6">
          <DocumentSelector files={files} selected={organizeSelectedFile || files[0]} onSelect={setOrganizeSelectedFile} />
          <MetadataEditorPanel
            file={organizeSelectedFile || files[0]}
            value={metadataDraft}
            onChange={setMetadataDraft}
            onProcess={handleMetadataFromPanel}
            fileCount={files.length}
            processing={isProcessing}
            onPreviewRequested={() => setPreviewFile(organizeSelectedFile || files[0])}
          />
        </div>
      )}

      {/* Specialized Technical Metadata Inspector Panel */}
      {tool.id === 'metadata' && files.length > 0 && !successResult && (
        <div className="mt-6">
        <DocumentSelector files={files} selected={organizeSelectedFile || files[0]} onSelect={setOrganizeSelectedFile} />
        <MetadataInspector
          file={organizeSelectedFile || files[0]}
          onPreviewRequested={() => setPreviewFile(organizeSelectedFile || files[0])}
        />
        </div>
      )}

      {/* Tool-specific customization panel (for manipulation tools) */}
      {files.length > 0 && !successResult && tool.id !== 'metadata' && tool.id !== 'edit-metadata' && tool.id !== 'rotate' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            {t.optionsAndSettings}
          </h4>

          {/* Compress PDF Configuration Options (High, Medium, Low, Custom) */}
          {tool.id === 'compress' && (
            <div className="space-y-5">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block text-sm mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{'Choose Compression Level & Quality'}</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    {compressPreset === 'low'
                      ? 'Recommended: Highest clarity and print resolution'
                      : compressPreset === 'medium'
                      ? 'Balanced compression & clarity'
                      : compressPreset === 'high'
                      ? 'Smallest size for WhatsApp & emails'
                      : 'Custom configured'}
                  </span>
                </label>

                {/* 4 Cards: Low (Recommended #1), Medium, High, Custom */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {/* 1. Low (Light - High Quality) (Recommended per user request) */}
                  <button
                    type="button"
                    onClick={() => setCompressPreset('low')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      compressPreset === 'low'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{'High Quality (Crisp & Clear)'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                        {'Recommended'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {'Gentle image compression with higher visual quality. Actual size reduction depends on the PDF.'}
                    </p>
                  </button>

                  {/* 2. Medium (Standard Balanced) */}
                  <button
                    type="button"
                    onClick={() => setCompressPreset('medium')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      compressPreset === 'medium'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{'Medium'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                        {'Balanced'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {'Balanced (~70-80%). Great file size reduction with crisp readability.'}
                    </p>
                  </button>

                  {/* 3. High (Strong Compression) */}
                  <button
                    type="button"
                    onClick={() => setCompressPreset('high')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      compressPreset === 'high'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{'High (Strong)'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider">
                        {'Smallest'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {'Maximum compression (~85-95%). Shrinks 100MB+ files down to small MBs. Ideal for WhatsApp & emails.'}
                    </p>
                  </button>

                  {/* 4. Custom */}
                  <button
                    type="button"
                    onClick={() => setCompressPreset('custom')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      compressPreset === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{'Custom'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
                        {'Advanced'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {'Fine-tune quality slider, DPI resolution, and Grayscale B&W mode.'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Settings Expansion Panel */}
              {compressPreset === 'custom' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Quality Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {'Image Quality:'} <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{compressQuality}%</strong>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {compressQuality < 40 ? 'Maximum Compression' : compressQuality < 75 ? 'Balanced' : 'High Quality'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="95"
                        step="5"
                        value={compressQuality}
                        onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>15% ({'Smallest File'})</span>
                        <span>95% ({'Highest Fidelity'})</span>
                      </div>
                    </div>

                    {/* Resolution / DPI */}
                    <div>
                      <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block mb-1">
                        {'Resolution & Target DPI'}
                      </label>
                      <select
                        value={compressDpi}
                        onChange={(e) => setCompressDpi(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="low">{'Web / Mobile (90 DPI - Fast & Light)'}</option>
                        <option value="medium">{'Standard Screen (120-130 DPI - Recommended)'}</option>
                        <option value="high">{'Sharp HD (160-180 DPI - Good for Print)'}</option>
                        <option value="original">{'Original Dimensions (200+ DPI)'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    {/* Grayscale Toggle */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compressGrayscale}
                        onChange={(e) => setCompressGrayscale(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {'Convert to Grayscale (Black & White)'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {'Discards color channels. Ideal for text documents, scanned receipts & invoices (saves an extra 40-60%).'}
                        </span>
                      </div>
                    </label>

                    {/* Engine Mode */}
                    <div>
                      <label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block mb-1">
                        {'Compression Engine'}
                      </label>
                      <select
                        value={compressMode}
                        onChange={(e) => setCompressMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="deep">{'Deep Visual & Image Downsampling (Recommended for Scans & 10MB-120MB+ files)'}</option>
                        <option value="lossless">{'Lossless Stream & Metadata Cleaning (Vector & pure text only)'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(compressPreset !== 'custom' || compressMode !== 'lossless' || compressGrayscale) && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ur'
                    ? 'تصویری compression صفحات کو تصاویر میں بدلتا ہے؛ نتیجے میں متن کی تلاش، کاپی، روابط اور فارم متاثر ہو سکتے ہیں۔ اصل فائل تبدیل نہیں ہوتی۔'
                    : 'Visual compression converts pages to images; searchable/copyable text, links and forms may be lost. Your original file is not changed.'}
                </p>
              )}
              {/* Original File Size Banner (Estimated output calculation removed per user request) */}
              {files.length > 0 && (
                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {'Original Document Size:'} <strong className="font-mono text-slate-900 dark:text-white">{(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB</strong>
                      {files.length > 1 && ` (${files.length} files)`}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {'Exact compressed size & reduction will be shown once finished'}
                  </span>
                </div>
              )}
            </div>
          )}

          {tool.id === 'watermark' && (
            <fieldset disabled={isProcessing} className="min-w-0 space-y-3">
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                {language === 'ur'
                  ? `یہی واٹرمارک settings تمام ${files.length} منتخب PDFs پر لاگو ہوں گی۔ Preview کی فائل بدلنے سے settings نہیں بدلیں گی۔`
                  : `The same watermark settings apply to all ${files.length} selected PDFs. Switching the preview document does not change these shared settings.`}
              </p>
              <DocumentSelector files={files} selected={organizeSelectedFile || files[0]} onSelect={setOrganizeSelectedFile} />
              <WatermarkPanel
                primaryFile={organizeSelectedFile || files[0]}
                options={watermarkOptions}
                onChange={setWatermarkOptions}
              />
            </fieldset>
          )}

          {tool.id === 'page-numbers' && (
            <PageNumberPanel
              primaryFile={files[0]}
              totalFilesCount={files.length}
              settings={pageNumberSettings}
              onChange={setPageNumberSettings}
            />
          )}

          {tool.id === 'split' && (
            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">
                {t.pagesToExtractLabel}
              </label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="1-3, 5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter single page numbers or ranges separated by commas.
              </p>
            </div>
          )}

          {tool.id === 'rotate' && (
            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-2">{t.rotationAngleLabel}</label>
              <div className="flex gap-2">
                {[
                  { deg: 90, label: '90° Clockwise' },
                  { deg: 180, label: '180° Flip' },
                  { deg: 270, label: '270° Counter-Clockwise' },
                ].map((item) => (
                  <button
                    key={item.deg}
                    onClick={() => setRotateDeg(item.deg)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      rotateDeg === item.deg
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool.id === 'jpg-to-pdf' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2 p-3 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200/60 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-200">
                <ImageIcon className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <p className="text-[11px] leading-relaxed">
                  Converts <strong>{imagePages.length}</strong> arranged image pages into one PDF. Use the page editor to rotate, reorder, copy, delete, or restore pages. Files stay in your browser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Page Size */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Page Format
                  </label>
                  <select
                    value={imagePageSize}
                    onChange={(e: any) => setImagePageSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="a4">Standard A4 (595 × 842 pt)</option>
                    <option value="letter">US Letter (612 × 792 pt)</option>
                    <option value="fit-image">Fit to Image (Preserve Exact Dimensions)</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.orientationLabel}
                  </label>
                  <div className="flex gap-1">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'portrait', label: 'Portrait' },
                      { id: 'landscape', label: 'Landscape' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setImageOrientation(opt.id as any)}
                        className={`flex-1 py-1.5 px-2 rounded-lg border font-semibold cursor-pointer transition-colors text-[11px] ${
                          imageOrientation === opt.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaling / Fit Mode */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Image Fit Mode
                  </label>
                  <select
                    value={imageFitMode}
                    onChange={(e: any) => setImageFitMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="contain">Contain (Best Fit, Keep Proportions)</option>
                    <option value="cover">Cover (Fill Whole Page)</option>
                    <option value="original">Original Size (No Scaling)</option>
                  </select>
                </div>
              </div>

              {/* Margins Slider */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {t.marginLabel}
                  </label>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">
                    {imageMargin} px {imageMargin === 0 ? '(Edge-to-edge borderless)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={imageMargin}
                  onChange={(e) => setImageMargin(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0px (No Margin)</span>
                  <span>20px (Standard)</span>
                  <span>60px (Wide)</span>
                </div>
              </div>
            </div>
          )}

          {/* Web Crypto API Protect PDF Options */}
          {tool.id === 'protect' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-500/20 dark:via-rose-500/20 dark:to-indigo-500/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Browser Web Crypto API (AES-256-GCM)</span>
                    <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      Zero-Knowledge
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Military-grade 256-bit encryption executed natively inside your browser. Your password and files never leave your device. Uses PBKDF2 with SHA-256 key derivation and a 128-bit integrity authentication tag.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Encryption Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={protectShowPassword ? 'text' : 'password'}
                      value={protectPassword}
                      onChange={(e) => setProtectPassword(e.target.value)}
                      placeholder="Enter secret password..."
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setProtectShowPassword(!protectShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {protectShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {protectPassword && (
                    <div className="mt-2 space-y-1">
                      {(() => {
                        let score = 0;
                        if (protectPassword.length >= 6) score += 1;
                        if (protectPassword.length >= 10) score += 1;
                        if (/[A-Z]/.test(protectPassword) && /[a-z]/.test(protectPassword)) score += 1;
                        if (/\d/.test(protectPassword)) score += 1;
                        if (/[^A-Za-z0-9]/.test(protectPassword)) score += 1;
                        let pct = 25;
                        let label = 'Weak';
                        let barColor = 'bg-rose-500';
                        if (score >= 4) {
                          pct = 100;
                          label = 'Maximum Security';
                          barColor = 'bg-emerald-500';
                        } else if (score >= 3) {
                          pct = 75;
                          label = 'Strong';
                          barColor = 'bg-indigo-500';
                        } else if (score >= 2) {
                          pct = 50;
                          label = 'Moderate';
                          barColor = 'bg-amber-500';
                        }
                        return (
                          <>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                              <span>Password Strength: <strong className="text-slate-800 dark:text-slate-200">{label}</strong></span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={protectShowPassword ? 'text' : 'password'}
                      value={protectConfirmPassword}
                      onChange={(e) => setProtectConfirmPassword(e.target.value)}
                      placeholder="Confirm identical password..."
                      className={`w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border ${
                        protectConfirmPassword && protectPassword !== protectConfirmPassword
                          ? 'border-rose-400 dark:border-rose-600'
                          : 'border-slate-200 dark:border-slate-700'
                      } text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs`}
                    />
                  </div>
                  {protectConfirmPassword && protectPassword !== protectConfirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">Passwords do not match yet.</p>
                  )}
                  {protectConfirmPassword && protectPassword === protectConfirmPassword && (
                    <p className="text-[11px] text-emerald-500 mt-1">✓ Passwords match perfectly.</p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Password Hint (Optional)
                  </label>
                  <input
                    type="text"
                    value={protectHint}
                    onChange={(e) => setProtectHint(e.target.value)}
                    placeholder="e.g. Favorite book title"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Displayed on the cover page to assist authorized recipients.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    PBKDF2 Key Derivation Rounds
                  </label>
                  <select
                    value={protectIterations}
                    onChange={(e) => setProtectIterations(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value={100000}>100,000 Rounds (OWASP Standard · Recommended)</option>
                    <option value={250000}>250,000 Rounds (Ultra Armor · Maximum Brute-Force Immunity)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Web Crypto API Unlock PDF Options */}
          {tool.id === 'unlock' && (
            <div className="space-y-4">
              {detectedEncryptedMeta ? (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <span>Web Crypto Protected PDF Detected</span>
                      <span className="text-[10px] font-semibold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                        AES-256-GCM
                      </span>
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                      Target document: <strong className="font-mono">{detectedEncryptedMeta.originalName || 'Protected Document'}</strong> ({((detectedEncryptedMeta.originalSize || 0) / 1024).toFixed(1)} KB)
                    </p>
                    {detectedEncryptedMeta.hint && (
                      <div className="mt-2 p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200">
                        <strong>Password Hint:</strong> &ldquo;{detectedEncryptedMeta.hint}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Decrypt Protected PDF
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Enter the decryption password to unlock this document. Decryption executes entirely inside your browser memory with zero server uploads.
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs max-w-md">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Decryption Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={unlockShowPassword ? 'text' : 'password'}
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter decryption password..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setUnlockShowPassword(!unlockShowPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {unlockShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. PDF to Editable Word (.docx) Converter Options Panel */}
          {tool.id === 'pdf-to-word' && (
            <div className="space-y-4">
              <PdfWordOptionsPanel value={pdfWordOptions} onChange={setPdfWordOptions} disabled={isProcessing}
                onPreview={() => files[0] && setWordPreview({ source: files[0] })} primaryLanguage={pdfOcrLanguage}
                onPrimaryLanguageChange={setPdfOcrLanguage} files={files} />
              <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                  <FileType className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      100% Client-Side PDF to Word (.docx) Engine
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                      Editable Text + Separate Artwork
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Extracts Unicode PDF text and layout into editable Word pages. For scans, you select the OCR languages; OCR workers are bundled with the app and model files load only when needed. The PDF stays in the browser.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Extracts selectable, editable text runs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Detects headings, paragraphs & line breaks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Reader-dependent layout — review the quality report</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Private local conversion in browser memory</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PDF to Excel (.xlsx) Converter Options Panel */}
          {tool.id === 'pdf-to-excel' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Tabular Data & Spreadsheet (.xlsx) Extraction Engine
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                      Auto-Grid Tables
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Clusters horizontal and vertical coordinates of text runs, parses table columns and data rows, and auto-detects numbers and currencies into clean Microsoft Excel (.xlsx) workbooks.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Extracts financial tables, receipts & data grids</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Converts numeric values to active spreadsheet cells</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Standard OpenXML .xlsx compatible with Excel & Sheets</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>100% confidential in-memory processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PDF to PowerPoint (.pptx) Converter Options Panel */}
          {tool.id === 'pdf-to-powerpoint' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/20 shrink-0">
                  <Presentation className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Presentation Slide Deck (.pptx) Generator
                    </span>
                    <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                      16:9 Widescreen Slides
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Transforms each PDF page into a 16:9 widescreen presentation slide. Extracted text is mapped to formatted slide shapes rather than static images so you can edit text in PowerPoint.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Detects slide titles, body bullet cards & layouts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Editable slide shapes in PowerPoint, Keynote & Google Slides</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Preserves slide order with slide number watermarks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Client-side PptxGenJS generation with zero upload</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Word to PDF (.docx to PDF) Converter Options Panel */}
          {tool.id === 'word-to-pdf' && (
            <div className="space-y-4">
              <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-500/20 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Microsoft Word (.docx) to Readable PDF
                    </span>
                    <span className="text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-700">
                      High-resolution A4 pages
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Preserves readable paragraph structure, headings, lists, tables, and embedded images. The PDF is rendered as high-resolution page images, so its text is not selectable.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Accepts .docx files</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Preserves paragraph hierarchy & line wrapping</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Generates standard A4 PDF with clean margins</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Zero server transmission - processed directly in browser</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tool.id === 'word-to-excel' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Word (.docx) tables to Excel</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                      One worksheet per table
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Each Word table becomes a separate worksheet. Paragraphs and lists are included in a Text worksheet; cell text is kept as text to avoid changing codes or leading zeros.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Excel to PDF (.xlsx to PDF) Converter Options Panel */}
          {tool.id === 'excel-to-pdf' && (
            <div className="space-y-4">
              <div className="bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Excel Spreadsheet (.xlsx / .csv) to PDF Table Engine
                    </span>
                    <span className="text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-700">
                      Landscape Paginated Tables
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Reads worksheet rows and columns, calculates auto-fitting column dimensions, and renders professional landscape PDF tables with high-contrast headers and zebra-striping.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Accepts .xlsx, .xls, and .csv files</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Indigo headers with alternating zebra-stripe rows</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Auto-splits large tables across multiple pages</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>100% in-browser SheetJS + pdf-lib compilation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. PowerPoint to PDF (.pptx to PDF) Converter Options Panel */}
          {tool.id === 'powerpoint-to-pdf' && (
            <div className="space-y-4">
              <div className="bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded-xl p-4 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-md shadow-orange-500/20 shrink-0">
                  <Presentation className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      PowerPoint Presentation (.pptx) to PDF Converter
                    </span>
                    <span className="text-[10px] font-semibold bg-orange-100 dark:bg-orange-900/80 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700">
                      16:9 Widescreen PDF Slides
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Unpacks OpenXML presentation slides, extracts slide titles, content paragraphs, and bullet points, and generates crystal-clear 16:9 widescreen PDF slides ready for sharing.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>Accepts .pptx and .ppt presentation files</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>Widescreen 16:9 PDF geometry with slide headers</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>Maintains slide sequencing, bullet cards & footers</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Immediate offline conversion with no server delay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action trigger button */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing || ['sign', 'crop', 'pdf-to-pdfa', 'compare'].includes(tool.id) || (tool.id === 'jpg-to-pdf' && imagePages.length === 0)}
              className={`inline-flex items-center gap-2 px-6 py-2.5 max-w-full ${
                tool.id === 'protect'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : tool.id === 'unlock'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : tool.id === 'pdf-to-word'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : tool.id === 'pdf-to-excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : tool.id === 'pdf-to-powerpoint'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  : tool.id === 'word-to-pdf'
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20'
                  : tool.id === 'word-to-excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : tool.id === 'excel-to-pdf'
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
                  : tool.id === 'powerpoint-to-pdf'
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900'
              } disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer`}
            >
              <span className="shrink-0">
                {tool.id === 'protect' ? (
                  <Lock className="w-4 h-4" />
                ) : tool.id === 'unlock' ? (
                  <Unlock className="w-4 h-4" />
                ) : tool.id === 'pdf-to-word' ? (
                  <FileType className="w-4 h-4" />
                ) : tool.id === 'pdf-to-excel' ? (
                  <FileSpreadsheet className="w-4 h-4" />
                ) : tool.id === 'pdf-to-powerpoint' ? (
                  <Presentation className="w-4 h-4" />
                ) : tool.id === 'word-to-pdf' ? (
                  <FileText className="w-4 h-4" />
                ) : tool.id === 'word-to-excel' ? (
                  <FileSpreadsheet className="w-4 h-4" />
                ) : tool.id === 'excel-to-pdf' ? (
                  <FileSpreadsheet className="w-4 h-4" />
                ) : tool.id === 'powerpoint-to-pdf' ? (
                  <Presentation className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
              </span>
              <span className="break-all line-clamp-2 text-left">
                {isProcessing
                  ? processingStatus || (tool.id === 'protect'
                    ? t.encryptingStatus
                    : tool.id === 'unlock'
                    ? t.decryptingStatus
                    : tool.id === 'pdf-to-word'
                    ? 'Converting to Word (.docx)...'
                    : tool.id === 'pdf-to-excel'
                    ? 'Extracting tables to Excel...'
                    : tool.id === 'pdf-to-powerpoint'
                    ? 'Generating PowerPoint slides...'
                    : tool.id === 'word-to-pdf'
                    ? 'Converting Word to PDF...'
                    : tool.id === 'word-to-excel'
                    ? 'Converting Word to Excel...'
                    : tool.id === 'excel-to-pdf'
                    ? 'Converting spreadsheet to PDF...'
                    : tool.id === 'powerpoint-to-pdf'
                    ? 'Converting presentation to PDF...'
                    : t.processingBtn)
                  : tool.id === 'protect'
                  ? t.encryptProtectPdf
                  : tool.id === 'unlock'
                  ? t.decryptUnlockPdf
                  : tool.id === 'pdf-to-word'
                  ? `Convert to ${pdfWordOptions.imageFallback === 'all' ? 'Image-Only' : pdfWordOptions.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} Word (.docx)`
                  : tool.id === 'pdf-to-excel'
                  ? 'Convert to Excel (.xlsx)'
                  : tool.id === 'pdf-to-powerpoint'
                  ? 'Convert to PowerPoint (.pptx)'
                  : tool.id === 'word-to-pdf'
                  ? 'Convert Word to PDF'
                  : tool.id === 'word-to-excel'
                  ? 'Convert Word to Excel (.xlsx)'
                  : tool.id === 'excel-to-pdf'
                  ? 'Convert Excel to PDF'
                  : tool.id === 'powerpoint-to-pdf'
                  ? 'Convert PowerPoint to PDF'
                  : tool.id === 'jpg-to-pdf'
                  ? 'Convert image pages to PDF'
                  : tool.id === 'watermark' && files.length > 1
                  ? `Apply Watermark to All ${files.length} PDFs`
                  : `${t.processBtn}`}
              </span>
            </button>
            {isProcessing && tool.id === 'pdf-to-word' && <button type="button"
              disabled={wordAbortControllerRef.current?.signal.aborted === true}
              onClick={() => {
                const controller = wordAbortControllerRef.current;
                if (!controller || controller.signal.aborted) return;
                controller.abort();
                cancelItemDownloads();
                setAutoDownloadCancelled(true);
                setAutoDownloadSeconds(null);
                setSuccessResult(null);
                setProcessingStatus('Cancelling PDF-to-Word conversion…');
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-800 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 disabled:opacity-60"
            >Cancel Word conversion</button>}
          </div>
        </div>
      )}

      {/* High-Volume Batch / Memory Protection Notice */}
      {memoryAudit?.warning && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start sm:items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
          <Zap className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold mr-1">In-Browser Memory Protection:</span>
            <span>{memoryAudit.warning}</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Result & Download Box */}
      {successResult && (
        <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-md">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.docReady}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
            {successResult.details || 'Your PDF has been processed 100% in your browser.'}
          </p>
          {files.length > 1 && hasIndividualDownloads && (
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {language === 'ur'
                ? 'ہر تیار فائل کی خودکار ڈاؤن لوڈ 5 سیکنڈ بعد شروع کرنے کی کوشش ہوگی۔ اگر browser متعدد downloads روکے تو اجازت دیں، یا متعلقہ Download بٹن استعمال کریں۔ ZIP صرف بٹن دبانے پر ڈاؤن لوڈ ہوگی۔'
                : 'Each completed file requests an automatic download after 5 seconds. If your browser blocks multiple downloads, allow them or use its Download button. The ZIP downloads only when clicked.'}
            </p>
          )}

          {/* 5-Second Auto-Download Countdown Badge across single-file tools (NEVER for ZIPs) */}
          {!successResult.fileName.endsWith('.zip') && autoDownloadSeconds !== null && autoDownloadSeconds > 0 && !autoDownloadCancelled && (
            <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in duration-200">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>
                {`Auto-downloading in ${autoDownloadSeconds}s...`}
              </span>
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center font-bold shadow-xs">
                {autoDownloadSeconds}
              </span>
              <button
                type="button"
                onClick={handleCancelAutoDownload}
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 underline ml-1 cursor-pointer font-normal"
                title="Cancel auto-download"
              >
                {'Cancel'}
              </button>
            </div>
          )}

          {!successResult.fileName.endsWith('.zip') && autoDownloadSeconds === 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {'File auto-downloaded successfully!'}
              </span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer max-w-full"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="break-all line-clamp-2 text-left">
                {successResult.fileName.endsWith('.zip')
                  ? `Download All ${files.length} Files as ZIP Folder (${successResult.fileName})`
                  : `${t.downloadBtn} ${successResult.fileName}`}
              </span>
            </button>

            {/* Standalone Offline HTML Vault Download (Available for Protect PDF) */}
            {encryptedPackageResult && (
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([encryptedPackageResult.vaultHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = encryptedPackageResult.vaultFileName || 'secure_vault.html';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                title="Download single-file offline HTML vault that any recipient can open to decrypt in any browser"
              >
                <FileCode className="w-4 h-4" />
                <span>Download Standalone Offline Vault (.html)</span>
              </button>
            )}

            {/* Only preview single-file outputs (cannot preview a ZIP as a PDF) */}
            {successResult.fileName.toLowerCase().endsWith('.pdf') && (
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([successResult.data as unknown as BlobPart], { type: 'application/pdf' });
                  const outputPreviewFile = new File([blob], successResult.fileName, { type: 'application/pdf' });
                  setPreviewFile(outputPreviewFile);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{t.previewOutputBtn}</span>
              </button>
            )}

            {onOpenShare && (
              <button
                type="button"
                onClick={onOpenShare}
                className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                title="Share ClickPDF on WhatsApp & Social Media"
              >
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Share</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setEncryptedPackageResult(null);
                setFileItems([]);
                setProcessedFilesMap({});
              }}
              className="px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {t.processAnotherBtn}
            </button>
          </div>

        </div>
      )}
      </>
    )}

      {/* Tool-Specific SEO Content Section (Overview, Step-by-Step Instructions, Privacy USP, FAQs & Related Tools) */}
      <ToolSeoContentSection
        tool={tool}
        seoInfo={seoInfo}
        onSelectRelatedTool={onSelectTool}
        stage={currentStage}
      />

      {/* Client-Side File Preview Modal using URL.createObjectURL */}
      {tool.id === 'pdf-to-word' && wordPreview && <PdfWordPreview source={wordPreview.source} output={wordPreview.output} onClose={() => setWordPreview(null)} />}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onProcess={files.length > 0 && !successResult ? handleProcess : undefined}
      />
    </div>
  );
};
