import React, { ReactNode, useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  scale?: number;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, scale = 1, size = 'sm' }) => {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    if (!isOpen) return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
    };

    updateHeight();

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
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
      className="fixed inset-x-0 top-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 overflow-hidden"
      style={{ height: viewportHeight }}
      onClick={onClose}
    >
      <div
        className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-4 md:p-8 w-full max-h-full overflow-y-auto hide-scrollbar ${sizeClass} text-center relative flex flex-col`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10 font-bold">&times;</button>
        <h2 className="text-lg md:text-xl font-bold uppercase text-light-text dark:text-dark-text mb-3 md:mb-6 mt-1 md:mt-2 shrink-0">{title}</h2>
        <div className="flex-grow flex flex-col min-h-0">
          {children}
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