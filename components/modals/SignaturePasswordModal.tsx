import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

interface SignaturePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (senha: string) => void;
    onChangePassword: (current: string, newPass: string) => Promise<boolean>;
    employeeName: string;
    scale?: number;
}

const SignaturePasswordModal: React.FC<SignaturePasswordModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onChangePassword,
    employeeName,
    scale = 1
}) => {
    const [view, setView] = useState<'confirm' | 'change'>('confirm');
    
    // Confirm view state
    const [senha, setSenha] = useState('');
    
    // Change view state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setView('confirm');
            setSenha('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setErrorMsg('');
        }
    }, [isOpen]);

    const handleConfirmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(senha);
    };

    const handleChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (!newPassword) {
            setErrorMsg('A nova senha não pode ser vazia.');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setErrorMsg('A nova senha e a confirmação não coincidem.');
            return;
        }
        
        const success = await onChangePassword(currentPassword, newPassword);
        if (success) {
            setView('confirm');
            setSenha(newPassword);
        }
    };

    if (!isOpen) return null;

    if (view === 'confirm') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Assinatura" scale={scale}>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                    Confirme sua assinatura, <strong className="text-light-text dark:text-dark-text">{employeeName}</strong>
                </p>
                <form onSubmit={handleConfirmSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-success dark:text-white text-center tracking-widest text-lg"
                        autoFocus
                    />
                    <button type="submit" className="w-full py-3 bg-green-600 hover:bg-success text-white font-bold rounded-lg transition uppercase tracking-widest">
                        CONFIRMAR ASSINATURA
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setView('change')}
                        className="w-full py-3 bg-danger dark:bg-[#3A1414] hover:bg-red-700 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 text-white font-bold rounded-lg transition uppercase tracking-widest mt-2 shadow-sm"
                    >
                        Trocar Senha
                    </button>
                </form>
            </Modal>
        );
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={() => setView('confirm')} 
            title="Trocar Senha" 
            scale={scale}
        >
            <form onSubmit={handleChangeSubmit} className="space-y-3">
                <input
                    type="password"
                    placeholder="Senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    autoFocus
                />
                <input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
                <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
                
                {errorMsg && (
                    <p className="text-danger text-sm font-bold">{errorMsg}</p>
                )}
                
                <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition uppercase mt-2">
                    SALVAR NOVA SENHA
                </button>
            </form>
        </Modal>
    );
};

export default SignaturePasswordModal;
