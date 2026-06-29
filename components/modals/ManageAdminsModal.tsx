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
                
                {/* Botão de Adicionar */}
                <div className="flex justify-center items-center">
                    <button 
                        onClick={onOpenAddAdmin}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <UserPlusIcon className="w-5 h-5" />
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
                                    <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                                        <span className="truncate">{admin.email}</span>
                                        <span>Mat: {admin.matricula}</span>
                                        <span className="truncate">Senha: <strong className="font-mono text-gray-700 dark:text-gray-300">{admin.senha || "N/A"}</strong></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onOpenEditAdmin(admin.id)}
                                        className="p-2 rounded-lg transition-all text-white bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow transform hover:-translate-y-0.5"
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
                                        className={`p-2 rounded-lg transition-all text-white shadow-sm hover:shadow transform ${isMe ? 'opacity-50 cursor-not-allowed bg-red-400' : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5'}`}
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
