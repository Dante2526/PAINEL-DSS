import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  children: ReactNode;
  scale?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onBack, title, children, scale = 1, size = 'sm', className = '' }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Trava o scroll agressivamente no mobile para impedir que o Chrome empurre a página para cima
    const scrollY = window.scrollY;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
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

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[6px] flex items-center justify-center p-4 z-[9999] overflow-hidden"
      style={{
        height: '100dvh', // Usa Dynamic Viewport Height para suportar teclado mobile nativamente
      }}
      onClick={onClose}
    >
      <div
        className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl px-5 pt-5 pb-5 md:px-8 md:pt-8 md:pb-8 w-full max-h-full overflow-y-auto hide-scrollbar ${sizeClass} text-center relative flex flex-col ${className}`}
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

  // Usa createPortal para renderizar o modal no final do body
  // Isso impede que ele seja "preso" por propriedades como transform ou overflow-hidden em elementos pai
  return createPortal(modalContent, document.body);
};

export default Modal;