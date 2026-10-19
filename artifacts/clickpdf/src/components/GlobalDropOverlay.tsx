import React, { useState, useEffect, useRef } from 'react';
import { PDFTool } from '../types';
import { ToolIcon } from './ToolIcon';
import { useLanguage } from '../context/LanguageContext';
import {
  Upload,
  FileUp,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Minimize2,
  LayoutGrid,
  Lock,
  FileSearch,
  CheckCircle2,
  X
} from 'lucide-react';

interface GlobalDropOverlayProps {
  currentTool: PDFTool | null;
  tools: PDFTool[];
  onFilesDropped: (files: File[], targetToolId?: string) => void;
}

export const GlobalDropOverlay: React.FC<GlobalDropOverlayProps> = ({
  currentTool,
  tools,
  onFilesDropped
}) => {
  const { getToolTitle } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Suggested quick target tools on the drop overlay
  const quickTargetIds = ['compress', 'merge', 'organize', 'jpg-to-pdf', 'protect', 'metadata'];
  const quickTargetTools = tools.filter(t => quickTargetIds.includes(t.id));

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      // Check if dragging files
      if (e.dataTransfer && e.dataTransfer.types) {
        const types = Array.from(e.dataTransfer.types);
        if (types.includes('Files')) {
          dragCounter.current += 1;
          if (dragCounter.current === 1) {
            setIsDragging(true);
          }
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      // Must prevent default to allow drop
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
        setHoveredToolId(null);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      setHoveredToolId(null);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        onFilesDropped(files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  // Handle drop on a specific tool target
  const handleSpecificTargetDrop = (e: React.DragEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    setHoveredToolId(null);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesDropped(files, toolId);
    }
  };

  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 select-none cursor-copy"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        setHoveredToolId(null);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onFilesDropped(Array.from(e.dataTransfer.files));
        }
      }}
    >
      {/* Surrounding Ambient Radial Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0,transparent_70%)]" />

      {/* Main Drop Container */}
      <div className="relative z-10 max-w-3xl w-full border-2 border-dashed border-indigo-400/80 dark:border-indigo-500/80 bg-slate-900/90 rounded-3xl p-6 sm:p-10 text-center shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-500/10 transition-all duration-200">
        
        {/* Pulsing Central Icon */}
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
          <FileUp className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Dynamic Context Heading */}
        {currentTool ? (
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Active: {getToolTitle(currentTool)}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Drop files to load into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">
                {getToolTitle(currentTool)}
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
              Release anywhere inside the window to immediately stage files into your current workspace.
            </p>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Global Quick Drop • 100% Client-Side</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Drop your files anywhere to start
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
              Drop PDF documents or images (.jpg, .png, .webp). Processed locally with complete privacy.
            </p>
          </div>
        )}

        {/* Quick Drop Target Cards (Shown on Homepage / Global Navigation) */}
        {!currentTool && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-xs font-semibold text-indigo-300/80 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
              <span>Or drop directly onto a specific tool:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {quickTargetTools.map((tool) => {
                const isHovered = hoveredToolId === tool.id;
                return (
                  <div
                    key={tool.id}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoveredToolId(tool.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'copy';
                      if (hoveredToolId !== tool.id) {
                        setHoveredToolId(tool.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (hoveredToolId === tool.id) {
                        setHoveredToolId(null);
                      }
                    }}
                    onDrop={(e) => handleSpecificTargetDrop(e, tool.id)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
                      isHovered
                        ? 'border-indigo-400 bg-indigo-600/30 ring-2 ring-indigo-400 scale-105 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                      isHovered ? 'bg-indigo-500 text-white' : 'bg-slate-700/60 text-indigo-300'
                    }`}>
                      <ToolIcon name={tool.iconName} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white block truncate w-full">
                      {getToolTitle(tool)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {isHovered ? 'Release to open!' : 'Drop here'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Safety & Privacy Assurance Badge */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Files never leave your device</span>
          </div>
          <span>•</span>
          <div>Zero server uploads</div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300">Esc</kbd>
            <span>to cancel</span>
          </div>
        </div>

      </div>
    </div>
  );
};
