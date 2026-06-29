import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Administrator } from '../../types';

export const EditAdminModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    admin: Administrator | null;
    onEditAdmin: (id: string, name: string, email: string, matricula: string, nivel: string) => Promise<void>;
    scale: number;
}> = ({ isOpen, onClose, onBack, admin, onEditAdmin, scale }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [matricula, setMatricula] = useState('');
    const [nivel, setNivel] = useState('1');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (admin && isOpen) {
            setName(admin.name);
            setEmail(admin.email);
            setMatricula(admin.matricula);
            setNivel(admin.nivel || '1');
            setErrorMsg('');
        }
    }, [admin, isOpen]);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!admin) return;
        if (!name.trim() || !email.trim() || !matricula.trim()) {
            setErrorMsg('Preencha todos os campos obrigatórios.');
            return;
        }
        setErrorMsg('');
        await onEditAdmin(admin.id, name.trim().toUpperCase(), email.trim().toLowerCase(), matricula.trim(), nivel);
        if (onBack) onBack();
        else onClose();
    };

    if (!isOpen || !admin) return null;

    const inputClassName = "w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white text-sm";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack}
            title="Editar Administrador" 
            scale={scale}
            size="md"
        >
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClassName} uppercase`}
                />
                <input
                    type="text"
                    placeholder="Matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className={inputClassName}
                />
                <input
                    type="email"
                    placeholder="E-mail Corporativo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                />
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nível de Acesso</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setNivel('1')}
                            className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                                nivel === '1' 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <span className={`font-bold ${nivel === '1' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Nível 1</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Acesso Padrão</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNivel('2')}
                            className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                                nivel === '2' 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <span className={`font-bold ${nivel === '2' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Nível 2</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Super ADM</span>
                        </button>
                    </div>
                    </div>

                    {errorMsg && (
                        <div className="text-red-500 font-bold text-sm text-center mb-4 mt-2">
                            {errorMsg}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg mt-2 text-lg">
                        SALVAR ALTERAÇÕES
                    </button>
            </form>
        </Modal>
    );
};

export default EditAdminModal;
