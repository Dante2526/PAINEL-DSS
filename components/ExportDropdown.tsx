import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon, FileTextIcon, ImageIcon, PdfIcon, ExcelIcon, DocIcon } from './icons';

interface ExportDropdownProps {
  onExportTxt: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onExportDoc: () => void;
  disabled?: boolean;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportTxt,
  onExportPng,
  onExportPdf,
  onExportExcel,
  onExportDoc,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DownloadIcon className="w-5 h-5" />
        BAIXAR
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-full bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col py-1">
            <button
              onClick={() => handleAction(onExportPng)}
              className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Imagem (PNG)
            </button>
            <button
              onClick={() => handleAction(onExportPdf)}
              className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors"
            >
              <PdfIcon className="w-5 h-5 text-red-500" />
              Documento PDF
            </button>
            <div className="h-px bg-gray-200 dark:bg-dark-hover my-1 mx-2"></div>
            <button
              onClick={() => handleAction(onExportExcel)}
              className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors"
            >
              <ExcelIcon className="w-5 h-5 text-green-600" />
              Planilha Excel
            </button>
            <button
              onClick={() => handleAction(onExportDoc)}
              className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors"
            >
              <DocIcon className="w-5 h-5 text-blue-500" />
              Word (DOC)
            </button>
            <div className="h-px bg-gray-200 dark:bg-dark-hover my-1 mx-2"></div>
            <button
              onClick={() => handleAction(onExportTxt)}
              className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors"
            >
              <FileTextIcon className="w-5 h-5 text-gray-500" />
              Texto (TXT)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
