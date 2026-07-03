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
    const [showMatriculaWarning, setShowMatriculaWarning] = useState(false);
    
    // Change view state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setView('confirm');
            setSenha('');
            setShowMatriculaWarning(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setErrorMsg('');
        }
    }, [isOpen]);

    const handleConfirmSubmit = () => {
        if (senha.length < 8) {
            setShowMatriculaWarning(true);
        } else {
            setShowMatriculaWarning(false);
        }
        onConfirm(senha);
    };

    const handleConfirmKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmSubmit();
        }
    };

    const handleChangeSubmit = async () => {
        setErrorMsg('');
        
        if (!newPassword || newPassword.length < 8) {
            setErrorMsg('A nova senha deve ter no mínimo 8 dígitos.');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setErrorMsg('A nova senha e a confirmação não coincidem.');
            return;
        }
        
        const success = await onChangePassword(currentPassword, newPassword);
        if (success) {
            setView('confirm');
            setSenha('');
        }
    };

    const handleChangeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleChangeSubmit();
        }
    };

    if (!isOpen) return null;

    if (view === 'confirm') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Assinatura" scale={scale}>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                    Confirme sua assinatura, <strong className="text-light-text dark:text-dark-text">{employeeName}</strong>
                </p>
                <div className="space-y-4">
                    <input
                        type="text"
                        style={{ WebkitTextSecurity: 'disc' } as any}
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        onKeyDown={handleConfirmKeyDown}
                        autoComplete="new-password"
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-success dark:text-white text-center tracking-widest text-lg"
                        autoFocus
                    />
                    {showMatriculaWarning && (
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl w-full border border-gray-200 dark:border-gray-600 text-left">
                            <p className="text-sm text-light-text-secondary dark:text-gray-300">
                                <span className="block font-bold mb-2 text-primary dark:text-blue-400 uppercase text-xs tracking-wider">Aviso</span>
                                Toda matrícula tem <strong>8 dígitos</strong>. Se você é da <strong className="text-light-text dark:text-white">Velha Guarda</strong>, adicione <strong className="text-light-text dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">01</strong> na frente dos demais números para completar.
                            </p>
                        </div>
                    )}
                    <button 
                        type="button" 
                        onClick={handleConfirmSubmit} 
                        className="w-full py-3 bg-green-600 hover:bg-success text-white font-bold rounded-lg transition-all uppercase tracking-widest transform hover:-translate-y-1 shadow-md hover:shadow-lg"
                    >
                        CONFIRMAR ASSINATURA
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setView('change')}
                        className="w-full py-3 bg-danger dark:bg-[#3A1414] hover:bg-red-700 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 text-white font-bold rounded-lg transition-all uppercase tracking-widest mt-2 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
                    >
                        Trocar Senha
                    </button>
                </div>
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
            <div className="space-y-3">
                <input
                    type="text"
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    placeholder="Senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onKeyDown={handleChangeKeyDown}
                    autoComplete="new-password"
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    autoFocus
                />
                <input
                    type="text"
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={handleChangeKeyDown}
                    autoComplete="new-password"
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
                <input
                    type="text"
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    placeholder="Confirmar nova senha"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    onKeyDown={handleChangeKeyDown}
                    autoComplete="new-password"
                    className="w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
                
                {errorMsg && (
                    <p className="text-danger text-sm font-bold">{errorMsg}</p>
                )}
                
                <button 
                    type="button" 
                    onClick={handleChangeSubmit} 
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-all uppercase mt-2 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
                >
                    SALVAR NOVA SENHA
                </button>
            </div>
        </Modal>
    );
};

export default SignaturePasswordModal;
