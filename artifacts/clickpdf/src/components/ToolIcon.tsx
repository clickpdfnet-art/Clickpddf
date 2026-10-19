import React from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  Image,
  RotateCw,
  Stamp,
  Hash,
  LayoutGrid,
  Lock,
  Unlock,
  FileText,
  PenTool,
  Crop,
  Archive,
  Wrench,
  Columns,
  FileCheck,
  FileSearch,
  Edit3,
  FileSpreadsheet,
  Presentation,
  FileType,
  Table,
  FileCode,
  Sparkles,
  Shield,
  ShieldCheck,
  Key,
  FilePlus,
  FileUp,
  FileDown,
  Search,
  Zap,
  Sliders,
  Download,
  Database,
  Terminal,
  Printer,
  Folder,
  Boxes,
  FileSignature,
  QrCode,
  Code
} from 'lucide-react';

interface ToolIconProps {
  name: string;
  className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ name, className = 'w-6 h-6' }) => {
  switch (name) {
    case 'Layers': return <Layers className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'Image': return <Image className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    case 'Stamp': return <Stamp className={className} />;
    case 'Hash': return <Hash className={className} />;
    case 'LayoutGrid': return <LayoutGrid className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Unlock': return <Unlock className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'PenTool': return <PenTool className={className} />;
    case 'Crop': return <Crop className={className} />;
    case 'Archive': return <Archive className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Columns': return <Columns className={className} />;
    case 'FileSearch': return <FileSearch className={className} />;
    case 'Edit3': return <Edit3 className={className} />;
    case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
    case 'Presentation': return <Presentation className={className} />;
    case 'FileType': return <FileType className={className} />;
    case 'Table': return <Table className={className} />;
    case 'FileCode': return <FileCode className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Key': return <Key className={className} />;
    case 'FilePlus': return <FilePlus className={className} />;
    case 'FileUp': return <FileUp className={className} />;
    case 'FileDown': return <FileDown className={className} />;
    case 'Search': return <Search className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Sliders': return <Sliders className={className} />;
    case 'Download': return <Download className={className} />;
    case 'Database': return <Database className={className} />;
    case 'Terminal': return <Terminal className={className} />;
    case 'Printer': return <Printer className={className} />;
    case 'Folder': return <Folder className={className} />;
    case 'Boxes': return <Boxes className={className} />;
    case 'FileSignature': return <FileSignature className={className} />;
    case 'QrCode': return <QrCode className={className} />;
    case 'Code': return <Code className={className} />;
    default: return <FileCheck className={className} />;
  }
};
