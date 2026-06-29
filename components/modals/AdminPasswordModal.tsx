import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

export const AdminPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onConfirm: (newPassword: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onBack, onConfirm, scale }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setErrorMsg('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim()) {
            setErrorMsg('A senha não pode ser vazia.');
            return;
        }
        if (newPassword.trim().length < 8) {
            setErrorMsg('A senha deve ter no mínimo 8 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            return;
        }
        setErrorMsg('');
        onConfirm(newPassword);
    };

    if (!isOpen) return null;

    const inputClassName = "w-full p-4 pr-12 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white font-mono";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack}
            title="Alterar Minha Senha" 
            scale={scale}
        >
            <form noValidate onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                </div>
                
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
                    Após cadastrar uma senha, você deverá usá-la no lugar do seu e-mail para fazer login.
                </p>

                <div className="relative w-full">
                    <input
                        type="password"
                        placeholder="Nova Senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClassName}
                    />
                </div>

                <div className="relative w-full">
                    <input
                        type="password"
                        placeholder="Confirmar Nova Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClassName}
                    />
                </div>

                {errorMsg && (
                    <div className="text-red-500 font-bold text-sm text-center">
                        {errorMsg}
                    </div>
                )}

                <button type="submit" className="w-full py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg">
                    SALVAR SENHA
                </button>
            </form>
        </Modal>
    );
};

export default AdminPasswordModal;
