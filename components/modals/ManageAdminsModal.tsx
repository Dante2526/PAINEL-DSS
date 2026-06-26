import React, { useState } from 'react';
import Modal from '../Modal';
import { Administrator } from '../../types';
import { TrashIcon, InfoIcon, UserPlusIcon, EditIcon } from '../icons';

export const ManageAdminsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    administrators: Administrator[];
    currentAdminEmail: string;
    onOpenAddAdmin: () => void;
    onOpenEditAdmin: (id: string) => void;
    onDeleteAdmin: (id: string) => Promise<void>;
    scale: number;
}> = ({ isOpen, onClose, onBack, administrators, currentAdminEmail, onOpenAddAdmin, onOpenEditAdmin, onDeleteAdmin, scale }) => {

    if (!isOpen) return null;

    const inputClassName = "w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white text-sm";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack}
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
                        onClick={onOpenAddAdmin}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                        <UserPlusIcon className="w-4 h-4" />
                        <span>Novo ADM</span>
                    </button>
                </div>

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
                                        {isSuper && <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap">Super ADM</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        <span className="truncate">{admin.email}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Mat: {admin.matricula}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Senha: <strong className="font-mono text-gray-700 dark:text-gray-300">{admin.senha || "N/A"}</strong></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onOpenEditAdmin(admin.id)}
                                        className="p-2 rounded-full transition-colors text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        title="Editar Administrador"
                                    >
                                        <EditIcon className="w-5 h-5" />
                                    </button>
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default ManageAdminsModal;
