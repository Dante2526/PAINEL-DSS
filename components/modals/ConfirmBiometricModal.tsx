import React from 'react';
import Modal from '../Modal';

export const ConfirmBiometricModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onActivate: () => void;
    scale: number;
}> = ({ isOpen, onClose, onActivate, scale }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ativar Impressão Digital" scale={scale}>
            <div className="space-y-4 text-center py-2">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white animate-pulse">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                            <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                            <path d="M2 12a10 10 0 0 1 18-6"/>
                            <path d="M2 16h.01"/>
                            <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                            <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                            <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                            <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                        </svg>
                    </div>
                </div>
                
                <h3 className="text-base font-bold text-light-text dark:text-dark-text leading-snug">
                    Deseja ativar o acesso rápido por biometria neste celular?
                </h3>
                
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary px-2">
                    Nos próximos acessos, você poderá entrar no painel de administração tocando na sua digital, de forma rápida e segura, sem precisar digitar seu e-mail corporativo.
                </p>

                <div className="flex gap-3 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition uppercase tracking-wider text-xs"
                    >
                        Agora Não
                    </button>
                    <button
                        type="button"
                        onClick={onActivate}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition shadow-md uppercase tracking-wider text-xs"
                    >
                        Ativar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmBiometricModal;
