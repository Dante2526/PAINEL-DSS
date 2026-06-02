import React, { ReactNode, useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  children: ReactNode;
  scale?: number;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onBack, title, children, scale = 1, size = 'sm' }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Trava o scroll da página (fundo) quando o modal abre
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      // Restaura o scroll da página ao fechar o modal
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalStyle = {
    transform: `scale(${scale})`,
    animation: 'fade-in-scale 0.3s forwards ease-out'
  };

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[6px] flex items-center justify-center p-4 z-50 overflow-hidden"
      style={{
        height: '100dvh', // Usa Dynamic Viewport Height para suportar teclado mobile nativamente
      }}
      onClick={onClose}
    >
      <div
        className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl px-5 pt-5 pb-5 md:px-8 md:pt-8 md:pb-8 w-full max-h-full overflow-y-auto hide-scrollbar ${sizeClass} text-center relative flex flex-col`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-3.5 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
            title="Voltar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10 font-bold">&times;</button>
        {title && <h2 className="text-lg md:text-xl font-bold uppercase text-light-text dark:text-dark-text mb-3 md:mb-4 mt-1 md:mt-2 shrink-0">{title}</h2>}
        <div className="flex-grow flex flex-col min-h-0">
          {children}
          {/* Espaçador invisível para garantir margem no final do scroll do modal, especialmente em mobile */}
          <div className="h-6 md:h-3 shrink-0 w-full pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(${scale * 0.95}); }
          to { opacity: 1; transform: scale(${scale}); }
        }
      `}</style>
    </div>
  );
};

export default Modal;