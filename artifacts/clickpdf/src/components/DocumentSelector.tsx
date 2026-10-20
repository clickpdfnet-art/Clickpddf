import React from 'react';

export function DocumentSelector({ files, selected, onSelect }: {
  files: File[];
  selected: File;
  onSelect: (file: File) => void;
}) {
  return <div className="flex flex-wrap gap-2 mb-4" aria-label="Choose a document">
    {files.map((file, index) => <button key={index} type="button"
      onClick={() => onSelect(file)} aria-pressed={file === selected}
      className={`text-xs px-3 py-2 rounded-lg border ${file === selected
        ? 'border-indigo-500 text-indigo-600'
        : 'border-slate-300 dark:border-slate-700'}`}>{file.name}</button>)}
  </div>;
}
