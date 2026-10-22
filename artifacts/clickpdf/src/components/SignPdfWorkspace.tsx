import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, FilePlus2,
  FileText, ImagePlus, LoaderCircle, PenLine, Plus, RotateCcw, RotateCw, ShieldCheck,
  Trash2, Type, Undo2, Upload, ZoomIn, ZoomOut,
} from 'lucide-react';
import '@fontsource/dancing-script/400.css';
import '@fontsource/great-vibes/400.css';
import { useLanguage } from '../context/LanguageContext';
import { getToolSeoInfo } from '../data/toolSeoData';
import { PDFTool } from '../types';
import { ToolSeoContentSection } from './ToolSeoContentSection';
import { AdsterraBanner } from './AdsterraBanner';
import { SignaturePad } from './SignaturePad';
import {
  applySignPdfPlacements, createSignPdfPreviewTask, inspectSignPdfFile,
  LARGE_SIGN_PDF_WARNING_BYTES, MAX_SIGN_PDF_FILE_BYTES, MAX_SIGN_PNG_FILE_BYTES,
  parseSignPdfPages, readableSignPdfError, SignPdfPageSelection,
  SignPdfPlacement, SignPdfSignature,
} from '../utils/signPdfEngine';

interface SignPdfWorkspaceProps {
  tool: PDFTool;
  onBack: () => void;
  initialFiles?: File[];
  onFilesConsumed?: () => void;
  onSelectTool?: (tool: PDFTool) => void;
}

type DocumentStatus = 'checking' | 'ready' | 'signing' | 'signed' | 'error';
type TargetMode = SignPdfPageSelection['mode'];
type SignatureSource = 'drawn' | 'typed' | 'uploaded';

interface SignDocument {
  id: string;
  file: File;
  pageCount: number;
  status: DocumentStatus;
  error?: string;
  output?: Blob;
  outputName?: string;
  placementsByPage: Record<number, SignPdfPlacement[]>;
  pageSelection: SignPdfPageSelection;
}

interface SignatureAsset extends SignPdfSignature {
  label: string;
  source: SignatureSource;
  color?: string;
}

interface HistoryEntry {
  past: SignPdfPlacement[][];
  future: SignPdfPlacement[][];
}

interface DragState {
  key: string;
  documentId: string;
  pageNumber: number;
  placementId: string;
  kind: 'move' | 'resize';
  startX: number;
  startY: number;
  startPlacements: SignPdfPlacement[];
  startPlacement: SignPdfPlacement;
  stageWidth: number;
  stageHeight: number;
}

const SIGNATURE_FONTS = [
  { id: 'great-vibes', name: 'Great Vibes', family: '"Great Vibes", cursive' },
  { id: 'dancing-script', name: 'Dancing Script', family: '"Dancing Script", cursive' },
];
const MAX_ZIP_BYTES = 100 * 1024 * 1024;

function makeId(prefix: string) {
  return `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function clonePlacements(placements: SignPdfPlacement[]) {
  return placements.map(placement => ({ ...placement }));
}

function signedFileName(file: File, allDocuments: SignDocument[], documentId: string) {
  const base = file.name.replace(/\.pdf$/i, '');
  const duplicateIndex = allDocuments
    .filter(document => document.id !== documentId && document.file.name.replace(/\.pdf$/i, '').toLowerCase() === base.toLowerCase())
    .length;
  return `${base}-signed${duplicateIndex ? `-${duplicateIndex + 1}` : ''}.pdf`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createDataUrlFromBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the image data.'));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(blob);
  });
}

async function validatePngSignature(file: File) {
  if (file.type !== 'image/png' || !file.name.toLowerCase().endsWith('.png')) {
    throw new Error('Upload a PNG image. JPEG, SVG, and other image formats are not accepted as signatures.');
  }
  if (!file.size || file.size > MAX_SIGN_PNG_FILE_BYTES) throw new Error('The PNG signature must be smaller than 5 MB.');
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const expected = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!expected.every((value, index) => header[index] === value)) throw new Error('The selected file is not a valid PNG image.');

  const dataUrl = await createDataUrlFromBlob(file);
  const image = new Image();
  image.src = dataUrl;
  try {
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The PNG is damaged or cannot be decoded by this browser.'));
    });
  } catch {
    throw new Error('The PNG is damaged or cannot be decoded by this browser.');
  }
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096) {
    throw new Error('The PNG dimensions must be between 1 and 4096 pixels in each direction.');
  }
  return { dataUrl, aspectRatio: image.naturalWidth / image.naturalHeight };
}

function makeTypedSignature(text: string, fontFamily: string, color: string) {
  return new Promise<{ dataUrl: string; aspectRatio: number }>(async (resolve, reject) => {
    try {
      const font = `120px ${fontFamily}`;
      await document.fonts.load(font);
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 300;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('The browser could not create a signature image.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = font;
      context.fillStyle = color;
      context.textBaseline = 'middle';
      const isRtl = /[\u0590-\u08ff]/u.test(text);
      context.direction = isRtl ? 'rtl' : 'ltr';
      context.textAlign = isRtl ? 'right' : 'left';
      const metrics = context.measureText(text);
      const padding = 48;
      const width = Math.min(canvas.width, Math.max(360, Math.ceil(metrics.width + padding * 2)));
      const height = 260;
      const cropped = document.createElement('canvas');
      cropped.width = width;
      cropped.height = height;
      const croppedContext = cropped.getContext('2d');
      if (!croppedContext) throw new Error('The browser could not prepare the typed signature.');
      croppedContext.font = font;
      croppedContext.fillStyle = color;
      croppedContext.textBaseline = 'middle';
      croppedContext.direction = isRtl ? 'rtl' : 'ltr';
      croppedContext.textAlign = isRtl ? 'right' : 'left';
      croppedContext.fillText(text, isRtl ? width - padding : padding, height / 2, width - padding * 2);
      resolve({ dataUrl: cropped.toDataURL('image/png'), aspectRatio: width / height });
    } catch (error) {
      reject(error);
    }
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  if (typeof URL.createObjectURL !== 'function') throw new Error('Downloads are not available in this browser.');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function pageBoundsForPlacement(placement: SignPdfPlacement, asset: SignatureAsset, pageWidth: number, pageHeight: number) {
  let width = placement.width;
  let height = width * pageWidth / pageHeight / Math.max(0.05, asset.aspectRatio);
  const radians = (placement.rotation * Math.PI) / 180;
  const boundWidth = Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height;
  const boundHeight = Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height;
  const scale = Math.min(1, 1 / Math.max(boundWidth, 0.001), 1 / Math.max(boundHeight, 0.001));
  width *= scale;
  height *= scale;
  const fittedBoundWidth = Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height;
  const fittedBoundHeight = Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height;
  const centerX = Math.max(fittedBoundWidth / 2, Math.min(1 - fittedBoundWidth / 2, placement.x + placement.width / 2));
  const centerY = Math.max(fittedBoundHeight / 2, Math.min(1 - fittedBoundHeight / 2, placement.y + (placement.width * pageWidth / pageHeight / Math.max(0.05, asset.aspectRatio)) / 2));
  return { ...placement, width, x: centerX - width / 2, y: centerY - height / 2 };
}

export const SignPdfWorkspace: React.FC<SignPdfWorkspaceProps> = ({
  tool, onBack, initialFiles, onFilesConsumed, onSelectTool,
}) => {
  const { t, getToolTitle, getToolDescription } = useLanguage();
  const seoInfo = useMemo(() => getToolSeoInfo(tool.id), [tool.id]);
  const [documents, setDocuments] = useState<SignDocument[]>([]);
  const documentsRef = useRef<SignDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);
  const [assets, setAssets] = useState<SignatureAsset[]>([]);
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<SignatureSource>('drawn');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [typedName, setTypedName] = useState('');
  const [typedFontId, setTypedFontId] = useState(SIGNATURE_FONTS[0].id);
  const [signatureColor, setSignatureColor] = useState('#132238');
  const [notice, setNotice] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [previewPdf, setPreviewPdf] = useState<any>(null);
  const [showFinalPreview, setShowFinalPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ documentId: string; page: number; width: number; height: number } | null>(null);
  const [viewerWidth, setViewerWidth] = useState(720);
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [zipProcessing, setZipProcessing] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const historyRef = useRef<Record<string, HistoryEntry>>({});
  const dragRef = useRef<DragState | null>(null);
  const pageFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewTaskRef = useRef<any>(null);
  const signingAbortRef = useRef<AbortController | null>(null);
  const consumedInitialFilesRef = useRef<string | null>(null);

  const updateDocuments = useCallback((updater: (current: SignDocument[]) => SignDocument[]) => {
    setDocuments(current => {
      const next = updater(current);
      documentsRef.current = next;
      return next;
    });
  }, []);

  const patchDocument = useCallback((documentId: string, patch: Partial<SignDocument>) => {
    updateDocuments(current => current.map(document => document.id === documentId ? { ...document, ...patch } : document));
  }, [updateDocuments]);

  const activeDocument = documents.find(document => document.id === activeDocumentId) || null;
  const currentPage = activeDocument?.pageSelection.currentPage || 1;
  const activePlacements = activeDocument?.placementsByPage[currentPage] || [];
  const selectedAsset = assets.find(asset => asset.id === activeSignatureId) || null;
  const selectedPlacement = activePlacements.find(placement => placement.id === selectedPlacementId) || null;
  const previewIsCurrent = !!activeDocument && previewDimensions?.documentId === activeDocument.id && previewDimensions.page === currentPage;
  const outputDocuments = documents.filter(document => document.output);
  const zipSize = outputDocuments.reduce((total, document) => total + (document.output?.size || 0), 0);
  const canDownloadZip = outputDocuments.length > 1 && zipSize <= MAX_ZIP_BYTES;

  const setActiveDocument = (documentId: string) => {
    activeDocumentIdRef.current = documentId;
    setActiveDocumentId(documentId);
    setSelectedPlacementId(null);
    setZoom(1);
    setShowFinalPreview(!!documentsRef.current.find(document => document.id === documentId)?.output);
    setNotice(null);
  };

  const addFiles = useCallback(async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    for (const file of selectedFiles) {
      const id = makeId('sign-document');
      const draft: SignDocument = {
        id,
        file,
        pageCount: 0,
        status: 'checking',
        placementsByPage: {},
        pageSelection: { mode: 'current', currentPage: 1, customPages: '' },
      };
      updateDocuments(current => [...current, draft]);
      if (!activeDocumentIdRef.current) {
        activeDocumentIdRef.current = id;
        setActiveDocumentId(id);
      }
      try {
        const inspection = await inspectSignPdfFile(file);
        patchDocument(id, { pageCount: inspection.pageCount, status: 'ready' });
        if (file.size >= LARGE_SIGN_PDF_WARNING_BYTES) {
          setNotice({ kind: 'info', text: `${file.name} is a large file (${formatBytes(file.size)}). The browser processes it locally; available memory and speed depend on this device.` });
        }
      } catch (error) {
        patchDocument(id, { status: 'error', error: readableSignPdfError(error) });
      }
    }
  }, [patchDocument, updateDocuments]);

  useEffect(() => {
    if (!initialFiles?.length) {
      consumedInitialFilesRef.current = null;
      return;
    }
    const fingerprint = initialFiles.map(file => `${file.name}:${file.size}:${file.lastModified}`).join('|');
    if (consumedInitialFilesRef.current === fingerprint) return;
    consumedInitialFilesRef.current = fingerprint;
    void addFiles(initialFiles).finally(() => onFilesConsumed?.());
  }, [initialFiles, onFilesConsumed, addFiles]);

  useEffect(() => {
    const target = viewerRef.current;
    if (!target || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setViewerWidth(width);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeDocumentId]);

  useEffect(() => {
    if (!activeDocument || activeDocument.status === 'checking' || activeDocument.status === 'error') {
      setPreviewPdf(null);
      setPreviewDimensions(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    let task: any;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewPdf(null);
    setPreviewDimensions(null);

    const open = async () => {
      try {
        const blob = showFinalPreview && activeDocument.output ? activeDocument.output : activeDocument.file;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (cancelled) return;
        task = createSignPdfPreviewTask(bytes);
        previewTaskRef.current = task;
        const document = await task.promise;
        if (cancelled) {
          await task.destroy().catch(() => {});
          return;
        }
        setPreviewPdf(document);
      } catch (error) {
        if (!cancelled) setPreviewError(readableSignPdfError(error));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };
    void open();
    return () => {
      cancelled = true;
      if (task) void task.destroy().catch(() => {});
      if (previewTaskRef.current === task) previewTaskRef.current = null;
    };
  }, [activeDocument?.id, activeDocument?.output, activeDocument?.status, activeDocument?.file, showFinalPreview]);

  useEffect(() => {
    if (!previewPdf || !activeDocument) return;
    let cancelled = false;
    let renderTask: any = null;
    const render = async () => {
      try {
        const canvas = document.getElementById('sign-pdf-preview-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const pageNumber = Math.min(activeDocument.pageSelection.currentPage, previewPdf.numPages);
        const page = await previewPdf.getPage(pageNumber);
        if (cancelled) return;
        const unscaled = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(260, viewerWidth - 32);
        const maxHeight = Math.max(340, Math.min(window.innerHeight * 0.66, 760));
        const fitScale = Math.min(availableWidth / unscaled.width, maxHeight / unscaled.height, 1.35);
        const viewport = page.getViewport({ scale: Math.max(0.25, fitScale * zoom) });
        setPreviewDimensions({
          documentId: activeDocument.id,
          page: pageNumber,
          width: viewport.width,
          height: viewport.height,
        });
        const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas rendering is not available in this browser.');
        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
          background: '#ffffff',
        });
        await renderTask.promise;
        if (!cancelled) setPreviewError(null);
        page.cleanup();
      } catch (error) {
        if (!cancelled) setPreviewError(readableSignPdfError(error));
      }
    };
    void render();
    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [previewPdf, activeDocument?.id, activeDocument?.pageSelection.currentPage, viewerWidth, zoom]);

  useEffect(() => () => {
    if (previewTaskRef.current) void previewTaskRef.current.destroy().catch(() => {});
    if (signingAbortRef.current) signingAbortRef.current.abort();
    historyRef.current = {};
  }, []);

  const pageHistoryKey = (documentId: string, pageNumber: number) => `${documentId}:${pageNumber}`;
  const pushHistory = (key: string, placements: SignPdfPlacement[]) => {
    const entry = historyRef.current[key] || { past: [], future: [] };
    entry.past = [...entry.past, clonePlacements(placements)].slice(-30);
    entry.future = [];
    historyRef.current[key] = entry;
    setHistoryVersion(version => version + 1);
  };

  const updatePlacements = (documentId: string, pageNumber: number, next: SignPdfPlacement[], recordHistory = true) => {
    const document = documentsRef.current.find(item => item.id === documentId);
    if (!document) return;
    const key = pageHistoryKey(documentId, pageNumber);
    const existing = document.placementsByPage[pageNumber] || [];
    if (recordHistory) pushHistory(key, existing);
    patchDocument(documentId, {
      placementsByPage: { ...document.placementsByPage, [pageNumber]: clonePlacements(next) },
      status: 'ready',
      output: undefined,
      outputName: undefined,
      error: undefined,
    });
    if (documentId === activeDocumentIdRef.current) setShowFinalPreview(false);
  };

  const undo = (redo = false) => {
    if (!activeDocument) return;
    const key = pageHistoryKey(activeDocument.id, currentPage);
    const entry = historyRef.current[key];
    const source = redo ? entry?.future : entry?.past;
    if (!entry || !source?.length) return;
    const current = activeDocument.placementsByPage[currentPage] || [];
    const previous = source[source.length - 1];
    source.pop();
    if (redo) entry.past.push(clonePlacements(current));
    else entry.future.push(clonePlacements(current));
    setHistoryVersion(version => version + 1);
    updatePlacements(activeDocument.id, currentPage, previous, false);
  };

  const currentHistory = historyRef.current[pageHistoryKey(activeDocument?.id || '', currentPage)];
  const canUndo = !!currentHistory?.past.length;
  const canRedo = !!currentHistory?.future.length;
  void historyVersion;

  const addAsset = (dataUrl: string, aspectRatio: number, label: string, source: SignatureSource, color?: string) => {
    const asset: SignatureAsset = { id: makeId('signature'), dataUrl, aspectRatio, label, source, color };
    setAssets(previous => [...previous, asset]);
    setActiveSignatureId(asset.id);
    setNotice({ kind: 'success', text: `${label} is ready. Select a PDF page and add it to the document.` });
  };

  const createTypedSignature = async () => {
    const trimmed = typedName.trim();
    if (!trimmed) {
      setNotice({ kind: 'error', text: 'Enter a name before creating the typed signature.' });
      return;
    }
    try {
      const font = SIGNATURE_FONTS.find(item => item.id === typedFontId) || SIGNATURE_FONTS[0];
      const result = await makeTypedSignature(trimmed, font.family, signatureColor);
      addAsset(result.dataUrl, result.aspectRatio, `${trimmed} · ${font.name}`, 'typed', signatureColor);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not create the typed signature.' });
    }
  };

  const handleSignatureUpload = async (file?: File) => {
    if (!file) return;
    try {
      const result = await validatePngSignature(file);
      addAsset(result.dataUrl, result.aspectRatio, file.name, 'uploaded');
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not use that PNG signature.' });
    } finally {
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = '';
    }
  };

  const addPlacement = () => {
    if (!activeDocument || !selectedAsset || !previewIsCurrent || !previewDimensions) {
      setNotice({ kind: 'error', text: 'Open a valid PDF page and create or select a signature first.' });
      return;
    }
    const next: SignPdfPlacement = {
      id: makeId('signature-placement'),
      signatureId: selectedAsset.id,
      x: 0.34,
      y: 0.68,
      width: 0.3,
      rotation: 0,
    };
    const fitted = pageBoundsForPlacement(next, selectedAsset, previewDimensions.width, previewDimensions.height);
    updatePlacements(activeDocument.id, currentPage, [...activePlacements, fitted]);
    setSelectedPlacementId(next.id);
    setNotice(null);
  };

  const replaceSelectedSignature = () => {
    if (!activeDocument || !selectedAsset || !selectedPlacement) return;
    updatePlacements(activeDocument.id, currentPage, activePlacements.map(placement => (
      placement.id === selectedPlacement.id ? { ...placement, signatureId: selectedAsset.id } : placement
    )));
  };

  const removeSelectedSignature = () => {
    if (!activeDocument || !selectedPlacement) return;
    updatePlacements(activeDocument.id, currentPage, activePlacements.filter(placement => placement.id !== selectedPlacement.id));
    setSelectedPlacementId(null);
  };

  const rotateSelectedSignature = (delta: number) => {
    if (!activeDocument || !selectedPlacement) return;
    updatePlacements(activeDocument.id, currentPage, activePlacements.map(placement => (
      placement.id === selectedPlacement.id
        ? pageBoundsForPlacement({ ...placement, rotation: ((placement.rotation + delta + 540) % 360) - 180 }, assets.find(asset => asset.id === placement.signatureId) || selectedAsset!, previewDimensions?.width || 1, previewDimensions?.height || 1)
        : placement
    )));
  };

  const handlePlacementPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    placement: SignPdfPlacement,
    kind: 'move' | 'resize',
  ) => {
    if (!activeDocument || !stageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPlacementId(placement.id);
    const stage = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      key: pageHistoryKey(activeDocument.id, currentPage),
      documentId: activeDocument.id,
      pageNumber: currentPage,
      placementId: placement.id,
      kind,
      startX: event.clientX,
      startY: event.clientY,
      startPlacements: clonePlacements(activePlacements),
      startPlacement: { ...placement },
      stageWidth: stage.width,
      stageHeight: stage.height,
    };
  };

  const handlePlacementPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !previewDimensions) return;
    event.preventDefault();
    const dx = (event.clientX - drag.startX) / Math.max(1, drag.stageWidth);
    const dy = (event.clientY - drag.startY) / Math.max(1, drag.stageHeight);
    const asset = assets.find(item => item.id === drag.startPlacement.signatureId);
    if (!asset) return;
    const next = drag.startPlacements.map(placement => {
      if (placement.id !== drag.placementId) return placement;
      const changed = drag.kind === 'move'
        ? { ...placement, x: drag.startPlacement.x + dx, y: drag.startPlacement.y + dy }
        : { ...placement, width: Math.max(0.07, Math.min(0.82, drag.startPlacement.width + dx)) };
      return pageBoundsForPlacement(changed, asset, previewDimensions.width, previewDimensions.height);
    });
    updatePlacements(drag.documentId, drag.pageNumber, next, false);
  };

  const finishPlacementPointer = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const current = documentsRef.current.find(document => document.id === drag.documentId)?.placementsByPage[drag.pageNumber] || [];
    if (JSON.stringify(current) !== JSON.stringify(drag.startPlacements)) pushHistory(drag.key, drag.startPlacements);
  };

  const setTargetSetting = (patch: Partial<SignPdfPageSelection>) => {
    if (!activeDocument) return;
    patchDocument(activeDocument.id, {
      pageSelection: { ...activeDocument.pageSelection, ...patch },
    });
  };

  const signActiveDocument = async () => {
    if (!activeDocument) return;
    const pageSelection = activeDocument.pageSelection;
    const placementsForCurrent = activeDocument.placementsByPage[pageSelection.currentPage] || [];
    const placementsByPage = activeDocument.placementsByPage;
    if (pageSelection.mode === 'placed') {
      const count = Object.values(placementsByPage).reduce((sum, placements) => sum + placements.length, 0);
      if (!count) {
        setNotice({ kind: 'error', text: 'Place a signature on at least one page first.' });
        return;
      }
    } else if (!placementsForCurrent.length) {
      setNotice({ kind: 'error', text: 'Add a signature to the current page first. “All pages” and “Selected pages” repeat the current page placement.' });
      return;
    }
    if (pageSelection.mode === 'custom') {
      try {
        await parseSignPdfPages(pageSelection.customPages, activeDocument.pageCount);
      } catch (error) {
        setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Check the selected page numbers.' });
        return;
      }
    }

    const controller = new AbortController();
    signingAbortRef.current = controller;
    setProcessing(true);
    setNotice({ kind: 'info', text: `Embedding signature into ${activeDocument.file.name} locally in this browser…` });
    patchDocument(activeDocument.id, { status: 'signing', error: undefined });
    try {
      const selectedAssets = assets.filter(asset => {
        const used = pageSelection.mode === 'placed'
          ? Object.values(placementsByPage).flat()
          : placementsForCurrent;
        return used.some(placement => placement.signatureId === asset.id);
      });
      const bytes = await applySignPdfPlacements(
        activeDocument.file,
        selectedAssets,
        placementsForCurrent,
        { ...pageSelection, placementsByPage },
        controller.signal,
      );
      if (controller.signal.aborted) throw new DOMException('Signing was cancelled.', 'AbortError');
      const verification = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      if (verification.getPageCount() !== activeDocument.pageCount) {
        throw new Error('The generated PDF did not retain the original page count. No download was prepared.');
      }
      const outputBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const output = new Blob([outputBytes], { type: 'application/pdf' });
      const outputName = signedFileName(activeDocument.file, documentsRef.current, activeDocument.id);
      patchDocument(activeDocument.id, { status: 'signed', output, outputName });
      setShowFinalPreview(true);
      setNotice({ kind: 'success', text: `${outputName} is ready. The PDF pages remain in their original order; the signature image was embedded into the page content.` });
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Signing was cancelled. The original PDF is unchanged.'
        : readableSignPdfError(error);
      patchDocument(activeDocument.id, { status: 'ready', output: undefined, outputName: undefined, error: message });
      setNotice({ kind: 'error', text: message });
    } finally {
      signingAbortRef.current = null;
      setProcessing(false);
    }
  };

  const removeDocument = (documentId: string) => {
    const target = documentsRef.current.find(document => document.id === documentId);
    if (!target) return;
    const hasWork = !!target.output || Object.values(target.placementsByPage).some(placements => placements.length);
    if (hasWork && !window.confirm(`Remove ${target.file.name} and its unsaved signature placements and output?`)) return;
    const remaining = documentsRef.current.filter(document => document.id !== documentId);
    updateDocuments(() => remaining);
    const retainedSignatureIds = new Set(
      remaining.flatMap(document => Object.values(document.placementsByPage).flat().map(placement => placement.signatureId)),
    );
    setAssets(previous => previous.filter(asset => retainedSignatureIds.has(asset.id)));
    if (activeSignatureId && !retainedSignatureIds.has(activeSignatureId)) {
      setActiveSignatureId(remaining.flatMap(document => Object.values(document.placementsByPage).flat()).at(0)?.signatureId || null);
    }
    if (activeDocumentIdRef.current === documentId) {
      const nextId = remaining[0]?.id || null;
      activeDocumentIdRef.current = nextId;
      setActiveDocumentId(nextId);
      setSelectedPlacementId(null);
    }
    for (const key of Object.keys(historyRef.current)) if (key.startsWith(`${documentId}:`)) delete historyRef.current[key];
    setHistoryVersion(version => version + 1);
  };

  const startOver = () => {
    if (!activeDocument) return;
    if (!window.confirm(`Start over on ${activeDocument.file.name}? Its placements and signed output will be cleared.`)) return;
    patchDocument(activeDocument.id, {
      status: 'ready',
      output: undefined,
      outputName: undefined,
      error: undefined,
      placementsByPage: {},
      pageSelection: { mode: 'current', currentPage: 1, customPages: '' },
    });
    const retainedSignatureIds = new Set(
      documentsRef.current
        .filter(document => document.id !== activeDocument.id)
        .flatMap(document => Object.values(document.placementsByPage).flat().map(placement => placement.signatureId)),
    );
    setAssets(previous => previous.filter(asset => retainedSignatureIds.has(asset.id)));
    if (activeSignatureId && !retainedSignatureIds.has(activeSignatureId)) {
      setActiveSignatureId([...retainedSignatureIds][0] || null);
    }
    activeDocumentIdRef.current = activeDocument.id;
    setShowFinalPreview(false);
    setSelectedPlacementId(null);
    setNotice({ kind: 'info', text: 'The current document has been reset. The original file remains available.' });
    setZoom(1);
  };

  const downloadSignedDocument = (document: SignDocument) => {
    if (!document.output || !document.outputName) return;
    try {
      downloadBlob(document.output, document.outputName);
      setNotice({ kind: 'success', text: `Download started for ${document.outputName}.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'The browser could not start the download.' });
    }
  };

  const downloadZip = async () => {
    if (!canDownloadZip) return;
    setZipProcessing(true);
    try {
      const zip = new JSZip();
      for (const document of outputDocuments) {
        if (document.output && document.outputName) zip.file(document.outputName, document.output);
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      downloadBlob(blob, 'signed-pdfs.zip');
      setNotice({ kind: 'success', text: `ZIP download started with ${outputDocuments.length} signed PDFs.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not create the ZIP. Individual PDF downloads are still available.' });
    } finally {
      setZipProcessing(false);
    }
  };

  const onChooseFiles = (files: FileList | null) => {
    if (!files?.length) return;
    void addFiles(Array.from(files));
    if (pageFileInputRef.current) pageFileInputRef.current.value = '';
  };

  const changePage = (page: number) => {
    if (!activeDocument || page < 1 || page > activeDocument.pageCount) return;
    setTargetSetting({ currentPage: page });
    setSelectedPlacementId(null);
  };

  const setCustomMode = (mode: TargetMode) => {
    if (mode === 'placed' && activeDocument && !Object.values(activeDocument.placementsByPage).some(placements => placements.length)) {
      setNotice({ kind: 'error', text: 'Place signatures on pages first, then choose “Pages with placements”.' });
      return;
    }
    setTargetSetting({ mode });
    setNotice(null);
  };

  const placementCount = activeDocument
    ? Object.values(activeDocument.placementsByPage).reduce((sum, placements) => sum + placements.length, 0)
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
      <AdsterraBanner className="mb-4" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" /> <span>{t.backToTools}</span>
        </button>
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> <span>{t.clientProcessingBadge}</span>
        </div>
      </div>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-sm">
          <PenLine className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">{getToolTitle(tool)}</h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{getToolDescription(tool)}</p>
        <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Files and signature images are processed locally in this browser.
        </p>
      </section>

      <input ref={pageFileInputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={event => onChooseFiles(event.target.files)} />
      <input ref={signatureFileInputRef} type="file" accept="image/png,.png" className="hidden" onChange={event => void handleSignatureUpload(event.target.files?.[0])} />

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">PDF files</h2>
            <p className="mt-0.5 text-xs text-slate-500">Each file is opened and signed separately. Choose multiple PDFs at once if needed.</p>
          </div>
          <button type="button" onClick={() => pageFileInputRef.current?.click()} disabled={processing} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
            <FilePlus2 className="h-4 w-4" /> Add PDF files
          </button>
        </div>
        {documents.length === 0 ? (
          <button
            type="button"
            onClick={() => pageFileInputRef.current?.click()}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              void addFiles(Array.from(event.dataTransfer.files));
            }}
            className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:bg-indigo-950/20"
          >
            <Upload className="h-7 w-7 text-indigo-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Drop PDF files here or click to browse</span>
            <span className="text-xs text-slate-500">PDF only · up to {formatBytes(MAX_SIGN_PDF_FILE_BYTES)} per file · no server upload</span>
          </button>
        ) : (
          <div className="space-y-2">
            {documents.map(document => (
              <div key={document.id} className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 ${document.id === activeDocumentId ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
                <button type="button" onClick={() => setActiveDocument(document.id)} disabled={processing} className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-60">
                  {document.status === 'checking' || document.status === 'signing'
                    ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-indigo-600" />
                    : document.status === 'signed'
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      : document.status === 'error'
                        ? <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        : <FileText className="h-4 w-4 shrink-0 text-slate-500" />}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{document.file.name}</span>
                    <span className="block text-[11px] text-slate-500">{formatBytes(document.file.size)} · {document.pageCount || '—'} pages · {document.status === 'signed' ? 'Signed PDF ready' : document.status === 'checking' ? 'Checking PDF…' : document.status === 'signing' ? 'Embedding signature…' : document.status === 'error' ? 'Could not open' : 'Ready'}</span>
                    {document.error && <span className="mt-0.5 block text-[11px] text-rose-700 dark:text-rose-300">{document.error}</span>}
                  </span>
                </button>
                {document.output && <button type="button" onClick={() => downloadSignedDocument(document)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Download className="h-3.5 w-3.5" /> Download</button>}
                <button type="button" aria-label={`Remove ${document.file.name}`} onClick={() => removeDocument(document.id)} disabled={processing} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/40"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <p className="px-1 text-[11px] text-slate-500">Selected {documents.length} PDF{documents.length === 1 ? '' : 's'} · each file keeps separate page placements and output.</p>
          </div>
        )}
      </section>

      {activeDocument && activeDocument.status !== 'checking' && activeDocument.status !== 'error' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">PDF signing workspace</h2>
              <p className="mt-0.5 max-w-full truncate text-xs text-slate-500">{activeDocument.file.name}{showFinalPreview && activeDocument.output ? ' · signed result preview' : ' · original preview'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeDocument.output && (
                  <div className="mr-1 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                    <button type="button" onClick={() => setShowFinalPreview(false)} className={`rounded-md px-2 py-1.5 text-[10px] font-bold ${!showFinalPreview ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Edit original</button>
                    <button type="button" onClick={() => setShowFinalPreview(true)} className={`rounded-md px-2 py-1.5 text-[10px] font-bold ${showFinalPreview ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Signed result</button>
                  </div>
                )}
                <button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(0.55, Math.round((value - 0.15) * 100) / 100))} disabled={zoom <= 0.55} className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ZoomOut className="h-4 w-4" /></button>
                <span className="min-w-12 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
                <button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(2, Math.round((value + 0.15) * 100) / 100))} disabled={zoom >= 2} className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ZoomIn className="h-4 w-4" /></button>
                <button type="button" onClick={() => setZoom(1)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Fit</button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-950/60">
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Previous page" onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1 || processing} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"><ChevronLeft className="h-4 w-4" /></button>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  Page
                  <input aria-label="Current page" type="number" min="1" max={activeDocument.pageCount} value={currentPage} disabled={processing} onChange={event => changePage(Number(event.target.value))} className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-center disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900" />
                  of {activeDocument.pageCount}
                </label>
                <button type="button" aria-label="Next page" onClick={() => changePage(currentPage + 1)} disabled={currentPage >= activeDocument.pageCount || processing} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300" htmlFor="sign-page-target">Apply placements</label>
                <select id="sign-page-target" value={activeDocument.pageSelection.mode} onChange={event => setCustomMode(event.target.value as TargetMode)} disabled={processing} className="max-w-48 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <option value="current">Current page only</option>
                  <option value="all">Repeat on all pages</option>
                  <option value="custom">Repeat on selected pages</option>
                  <option value="placed">Use placements on their pages</option>
                </select>
              </div>
            </div>

            {activeDocument.pageSelection.mode === 'custom' && (
              <label className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                Page numbers or ranges
                <input type="text" value={activeDocument.pageSelection.customPages} disabled={processing} onChange={event => setTargetSetting({ customPages: event.target.value })} placeholder="1, 3-5" className="min-w-36 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900" />
                <span>Use commas and ranges, e.g. 1, 3-5</span>
              </label>
            )}

            {activeDocument.pageSelection.mode === 'placed' && (
              <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                Each signature will be added only to the page where you placed it.
              </p>
            )}

            <div ref={viewerRef} className="relative flex min-h-80 max-h-[72vh] w-full items-start justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-950 sm:p-3">
              {previewLoading && <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-white/80 text-sm font-semibold text-slate-700 dark:bg-slate-950/80 dark:text-slate-200"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading PDF pages…</div>}
              {previewError && <div role="alert" className="m-4 flex max-w-xl items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{previewError}</div>}
              {!previewError && !previewPdf && !previewLoading && <p className="m-auto text-xs text-slate-500">PDF preview is not available.</p>}
              {previewPdf && !previewError && (
                <div
                  ref={stageRef}
                  className="relative my-auto shrink-0 bg-white shadow-md"
                  style={previewIsCurrent && previewDimensions ? { width: previewDimensions.width, height: previewDimensions.height } : undefined}
                  onPointerDown={event => {
                    if (event.target === stageRef.current) setSelectedPlacementId(null);
                  }}
                >
                  <canvas id="sign-pdf-preview-canvas" className="block bg-white" />
                  {previewIsCurrent && previewDimensions && !showFinalPreview && activePlacements.map(placement => {
                    const asset = assets.find(item => item.id === placement.signatureId);
                    if (!asset) return null;
                    const selected = placement.id === selectedPlacementId;
                    return (
                      <div
                        key={placement.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Signature ${asset.label}; drag to move, use the corner handle to resize`}
                        onClick={() => setSelectedPlacementId(placement.id)}
                        onPointerDown={event => handlePlacementPointerDown(event, placement, (event.target as HTMLElement).closest('[data-signature-resize]') ? 'resize' : 'move')}
                        onPointerMove={handlePlacementPointerMove}
                        onPointerUp={finishPlacementPointer}
                        onPointerCancel={finishPlacementPointer}
                        onLostPointerCapture={finishPlacementPointer}
                        onKeyDown={event => {
                          if (event.key === 'Delete' || event.key === 'Backspace') {
                            event.preventDefault();
                            const current = documentsRef.current.find(document => document.id === activeDocument.id)?.placementsByPage[currentPage] || [];
                            updatePlacements(activeDocument.id, currentPage, current.filter(item => item.id !== placement.id));
                            setSelectedPlacementId(null);
                          }
                        }}
                        className={`absolute cursor-move touch-none select-none ${selected ? 'outline outline-2 outline-indigo-500 outline-offset-2' : 'hover:outline hover:outline-1 hover:outline-indigo-400'}`}
                        style={{
                          left: `${placement.x * 100}%`,
                          top: `${placement.y * 100}%`,
                          width: `${placement.width * 100}%`,
                          transform: `rotate(${placement.rotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <img src={asset.dataUrl} alt="Signature preview" draggable={false} className="pointer-events-none block h-auto w-full" />
                        {selected && <button type="button" data-signature-resize aria-label="Resize signature" className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-indigo-600 shadow" />}
                        {selected && <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{asset.label}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Drag a signature to move it. Drag its lower-right handle to resize without changing proportions. Placement uses the visible PDF page coordinates, including page rotation and crop offsets.</p>
          </section>

          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create or select a signature</h2>
                <p className="mt-1 text-xs text-slate-500">A visual signature mark only. This does not verify identity or create a certificate-backed digital signature.</p>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {([
                  ['drawn', 'Draw', PenLine],
                  ['typed', 'Type', Type],
                  ['uploaded', 'Upload PNG', ImagePlus],
                ] as const).map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => setSignatureMethod(id)} className={`inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-bold ${signatureMethod === id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              {signatureMethod === 'drawn' && <SignaturePad onCreate={(dataUrl, aspectRatio) => addAsset(dataUrl, aspectRatio, 'Drawn signature', 'drawn')} />}

              {signatureMethod === 'typed' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Name to sign
                    <input value={typedName} onChange={event => setTypedName(event.target.value)} maxLength={80} dir="auto" placeholder="Type your name" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SIGNATURE_FONTS.map(font => (
                      <button key={font.id} type="button" onClick={() => setTypedFontId(font.id)} className={`rounded-lg border px-3 py-2 text-left ${typedFontId === font.id ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
                        <span className="block text-[10px] font-semibold text-slate-500">{font.name}</span>
                        <span className="block truncate text-2xl leading-tight text-slate-900 dark:text-white" style={{ fontFamily: font.family }}>{typedName || 'Your signature'}</span>
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Ink color <input type="color" value={signatureColor} onChange={event => setSignatureColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
                  </label>
                  <button type="button" onClick={() => void createTypedSignature()} disabled={!typedName.trim()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" /> Create typed signature</button>
                  <p className="text-[11px] text-slate-500">Great Vibes and Dancing Script are bundled with this app. Characters not included in a font may use the browser’s fallback font.</p>
                </div>
              )}

              {signatureMethod === 'uploaded' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Upload a transparent or opaque PNG. Maximum 5 MB; dimensions up to 4096 × 4096 pixels.</p>
                  <button type="button" onClick={() => signatureFileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Upload className="h-4 w-4" /> Choose PNG signature</button>
                </div>
              )}

              {assets.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <label htmlFor="sign-signature-library" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">Saved for this browser session</label>
                  <select id="sign-signature-library" value={activeSignatureId || ''} onChange={event => setActiveSignatureId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
                    {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.label}</option>)}
                  </select>
                  {selectedAsset && <div className="mt-2 flex min-h-16 items-center justify-center rounded-lg bg-slate-50 p-2 dark:bg-slate-950/50"><img src={selectedAsset.dataUrl} alt="Selected signature" className="max-h-14 max-w-full object-contain" /></div>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={addPlacement} disabled={!activeDocument || !previewIsCurrent || processing} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-45"><Plus className="h-4 w-4" /> Add to page {currentPage}</button>
                    {selectedPlacement && <button type="button" onClick={replaceSelectedSignature} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Replace selected</button>}
                  </div>
                </div>
              )}
            </section>

            {selectedPlacement && (
              <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Selected signature</h2>
                  <button type="button" onClick={removeSelectedSignature} aria-label="Remove selected signature" className="rounded-lg p-2 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/50"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => rotateSelectedSignature(-15)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold dark:border-indigo-900 dark:bg-slate-900"><RotateCcw className="h-3.5 w-3.5" /> Rotate −15°</button>
                  <button type="button" onClick={() => rotateSelectedSignature(15)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold dark:border-indigo-900 dark:bg-slate-900"><RotateCw className="h-3.5 w-3.5" /> Rotate +15°</button>
                  <button type="button" onClick={() => undo(false)} disabled={!canUndo} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-indigo-900 dark:bg-slate-900"><Undo2 className="h-3.5 w-3.5" /> Undo</button>
                  <button type="button" onClick={() => undo(true)} disabled={!canRedo} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-indigo-900 dark:bg-slate-900"><RotateCw className="h-3.5 w-3.5" /> Redo</button>
                </div>
                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">Rotation: {selectedPlacement.rotation}° · Drag or resize the selected mark directly on the page.</p>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Save signed PDF</h2>
                  <p className="mt-1 text-xs text-slate-500">{placementCount} signature{placementCount === 1 ? '' : 's'} placed in this document.</p>
                </div>
                <button type="button" onClick={startOver} disabled={processing} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Start Over</button>
              </div>
              {processing ? (
                <button type="button" onClick={() => signingAbortRef.current?.abort()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Cancel signing
                </button>
              ) : (
                <button type="button" onClick={() => void signActiveDocument()} disabled={!activeDocument || !previewPdf} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  <Check className="h-4 w-4" /> {activeDocument.output ? 'Regenerate signed PDF' : 'Apply signature and preview'}
                </button>
              )}
              {activeDocument.output && activeDocument.outputName && (
                <button type="button" onClick={() => downloadSignedDocument(activeDocument)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700">
                  <Download className="h-4 w-4" /> Download {activeDocument.outputName}
                </button>
              )}
              {activeDocument.pageSelection.mode === 'placed' && <p className="mt-2 text-[11px] text-slate-500">Only pages that have a placement will be changed. Other page content remains in place.</p>}
              {activeDocument.pageSelection.mode === 'custom' && <p className="mt-2 text-[11px] text-slate-500">The current page’s placements will be repeated on the selected pages.</p>}
              {activeDocument.pageSelection.mode === 'all' && <p className="mt-2 text-[11px] text-slate-500">The current page’s placements will be repeated on every PDF page.</p>}
            </section>
          </aside>
        </div>
      )}

      {outputDocuments.length > 0 && (
        <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Signed files ready</h2>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">{outputDocuments.length} output{outputDocuments.length === 1 ? '' : 's'} · each PDF has its own download button above.</p>
            </div>
            {canDownloadZip
              ? <button type="button" onClick={() => void downloadZip()} disabled={zipProcessing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" /> {zipProcessing ? 'Preparing ZIP…' : `Download ${outputDocuments.length} as ZIP`}</button>
              : outputDocuments.length > 1 && <span className="max-w-xs text-[11px] text-emerald-900 dark:text-emerald-300">ZIP is disabled above 100 MB total to avoid a second large in-memory copy. Download each PDF separately.</span>}
          </div>
        </section>
      )}

      {notice && (
        <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${notice.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200' : notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'}`}>
          {notice.kind === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : notice.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className={documents.length ? 'mt-8' : 'mt-10'}>
        <ToolSeoContentSection tool={tool} seoInfo={seoInfo} onSelectRelatedTool={onSelectTool} stage={outputDocuments.length ? 'completed' : documents.length ? 'active' : 'empty'} />
      </div>

      <div className="sr-only" aria-live="polite">
        {processing ? 'Signing PDF. Processing remains in this browser.' : activeDocument ? `${activeDocument.file.name}: ${activeDocument.status}.` : 'No PDF selected.'}
      </div>
    </div>
  );
};
