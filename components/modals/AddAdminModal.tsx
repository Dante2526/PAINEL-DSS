import React, { useState } from 'react';
import Modal from '../Modal';

export const AddAdminModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddAdmin: (name: string, email: string, matricula: string, nivel: string) => Promise<void>;
    scale: number;
}> = ({ isOpen, onClose, onAddAdmin, scale }) => {
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newMatricula, setNewMatricula] = useState('');
    const [newNivel, setNewNivel] = useState('1');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim() || !newMatricula.trim()) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        await onAddAdmin(newName.trim().toUpperCase(), newEmail.trim().toLowerCase(), newMatricula.trim(), newNivel);
        setNewName('');
        setNewEmail('');
        setNewMatricula('');
        setNewNivel('1');
        onClose();
    };

    if (!isOpen) return null;

    const inputClassName = "w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white text-sm";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Cadastrar Novo ADM" 
            scale={scale}
            size="md"
        >
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Nome Completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={inputClassName}
                />
                <input
                    type="text"
                    placeholder="Matrícula"
                    value={newMatricula}
                    onChange={(e) => setNewMatricula(e.target.value)}
                    className={inputClassName}
                />
                <input
                    type="email"
                    placeholder="E-mail Corporativo"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClassName}
                />
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nível de Acesso</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setNewNivel('1')}
                            className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                                newNivel === '1' 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <span className={`font-bold ${newNivel === '1' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Nível 1</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Acesso Padrão</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewNivel('2')}
                            className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                                newNivel === '2' 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <span className={`font-bold ${newNivel === '2' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Nível 2</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Super ADM</span>
                        </button>
                    </div>
                </div>

                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold italic bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg mt-2 text-center">
                    * A senha inicial será configurada automaticamente igual ao E-mail Corporativo.
                </p>

                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md mt-2 text-lg">
                    SALVAR ADMINISTRADOR
                </button>
            </form>
        </Modal>
    );
};

export default AddAdminModal;
