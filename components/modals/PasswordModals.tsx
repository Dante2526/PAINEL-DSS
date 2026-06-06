import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

export const DemoPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, scale }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Senha de Demonstração" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    autoFocus
                    inputMode="numeric"
                />
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition">
                    ENTRAR
                </button>
            </form>
        </Modal>
    );
};

export const AutomationPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, scale }) => {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) setPassword('');
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Senha do Sistema" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white text-center tracking-widest text-lg"
                    autoFocus
                />
                <button type="submit" className="w-full py-3 bg-red-600/90 hover:bg-red-700 text-white font-bold rounded-lg transition uppercase tracking-widest">
                    AUTORIZAR
                </button>
            </form>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-4">Essa ação impacta diretamente a automação das ações do painel.</p>
        </Modal>
    );
};
