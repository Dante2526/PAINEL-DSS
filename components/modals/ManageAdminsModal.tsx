import React, { useState } from 'react';
import Modal from '../Modal';
import { Administrator } from '../../types';
import { TrashIcon, InfoIcon, UserPlusIcon } from '../icons';

export const ManageAdminsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    administrators: Administrator[];
    currentAdminEmail: string;
    onAddAdmin: (name: string, email: string, matricula: string, nivel: string) => Promise<void>;
    onDeleteAdmin: (id: string) => Promise<void>;
    scale: number;
}> = ({ isOpen, onClose, administrators, currentAdminEmail, onAddAdmin, onDeleteAdmin, scale }) => {
    const [isAdding, setIsAdding] = useState(false);
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
        setIsAdding(false);
        setNewName('');
        setNewEmail('');
        setNewMatricula('');
        setNewNivel('1');
    };

    if (!isOpen) return null;

    const inputClassName = "w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white text-sm";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Gerenciar Administradores" 
            scale={scale}
            size="lg"
        >
            <div className="flex flex-col space-y-4">
                
                {/* Cabeçalho e Botão de Adicionar */}
                <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <div className="flex items-center gap-2">
                        <InfoIcon className="w-6 h-6 text-indigo-500" />
                        <span className="font-bold text-gray-700 dark:text-gray-200">ADMs Cadastrados</span>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                        {isAdding ? "Cancelar" : "+ Novo ADM"}
                    </button>
                </div>

                {/* Formulário de Adição */}
                {isAdding && (
                    <form onSubmit={handleAdd} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-3 animate-fade-in-down">
                        <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">CADASTRAR NOVO ADM</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <select
                                value={newNivel}
                                onChange={(e) => setNewNivel(e.target.value)}
                                className={inputClassName}
                            >
                                <option value="1">Nível 1 (Padrão)</option>
                                <option value="2">Nível 2 (Super ADM)</option>
                            </select>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold italic bg-white dark:bg-black/20 p-2 rounded">
                            * A senha inicial será configurada automaticamente igual ao E-mail Corporativo.
                        </p>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md mt-1">
                            SALVAR ADMINISTRADOR
                        </button>
                    </form>
                )}

                {/* Lista de Administradores */}
                <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {administrators.map(admin => {
                        const isMe = admin.email === currentAdminEmail;
                        const isSuper = admin.nivel === '2';
                        return (
                            <div key={admin.id} className={`flex items-center justify-between p-3 rounded-lg border ${isMe ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'} shadow-sm transition-all hover:shadow-md`}>
                                <div className="flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 dark:text-white truncate">{admin.name}</span>
                                        {isSuper && <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Super ADM</span>}
                                        {isMe && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Você</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        <span className="truncate">{admin.email}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Mat: {admin.matricula}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Senha: <strong className="font-mono text-gray-700 dark:text-gray-300">{admin.senha || "N/A"}</strong></span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (isMe) {
                                            alert("Você não pode excluir sua própria conta.");
                                            return;
                                        }
                                        if (window.confirm(`Tem certeza que deseja excluir o administrador ${admin.name}?`)) {
                                            onDeleteAdmin(admin.id);
                                        }
                                    }}
                                    disabled={isMe}
                                    className={`p-2 rounded-full transition-colors ${isMe ? 'opacity-30 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                                    title={isMe ? "Você não pode excluir a si mesmo" : "Excluir Administrador"}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default ManageAdminsModal;
