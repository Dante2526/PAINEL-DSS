import React, { useState } from 'react';
import Modal from '../Modal';
import { InfoIcon, UserPlusIcon } from '../icons';

export const AddAdminModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onAddAdmin: (name: string, email: string, matricula: string, nivel: string) => Promise<void>;
    scale: number;
}> = ({ isOpen, onClose, onBack, onAddAdmin, scale }) => {
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newMatricula, setNewMatricula] = useState('');
    const [newNivel, setNewNivel] = useState('1');
    const [errorMsg, setErrorMsg] = useState('');
    const [showWarningCard, setShowWarningCard] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!newName.trim() || !newEmail.trim() || !newMatricula.trim()) {
            setErrorMsg('Preencha todos os campos obrigatórios.');
            return;
        }

        if (newMatricula.trim().length !== 8) {
            setShowWarningCard(true);
            return;
        }

        await onAddAdmin(newName.trim().toUpperCase(), newEmail.trim().toLowerCase(), newMatricula.trim(), newNivel);
        setNewName('');
        setNewEmail('');
        setNewMatricula('');
        setNewNivel('1');
        setErrorMsg('');
        setShowWarningCard(false);
        if (onBack) onBack();
        else onClose();
    };

    if (!isOpen) return null;

    const inputClassName = "w-full p-3 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary text-light-text dark:text-white text-sm";

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack}
            title="Cadastrar Novo ADM" 
            scale={scale}
            size="md"
        >
            {showWarningCard ? (
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-2">FORMATO DE MATRÍCULA</h2>
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-primary">
                        <InfoIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Toda matrícula tem <strong>8 dígitos</strong>.</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl w-full border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-light-text-secondary dark:text-gray-300">
                            <span className="block font-bold mb-2 text-primary dark:text-blue-400 uppercase text-xs tracking-wider">Aviso</span>
                            Se você é da <strong className="text-light-text dark:text-white">Velha Guarda</strong>, adicione <strong className="text-light-text dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">01</strong> na frente dos demais números para completar os 8 dígitos.
                        </p>
                    </div>
                    <div className="w-full mt-4">
                        <button
                            type="button"
                            onClick={() => setShowWarningCard(false)}
                            className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            ENTENDI E VOU CORRIGIR
                        </button>
                    </div>
                </div>
            ) : (
            <form noValidate onSubmit={handleAdd} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Nome Completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`${inputClassName} uppercase`}
                />
                <input
                    type="text"
                    placeholder="Matrícula"
                    value={newMatricula}
                    onChange={(e) => setNewMatricula(e.target.value.replace(/[^0-9]/g, ''))}
                    className={inputClassName}
                    inputMode="numeric"
                    maxLength={8}
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

                {errorMsg && (
                    <p className="text-danger text-sm font-bold text-center mt-2">{errorMsg}</p>
                )}

                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg mt-2 text-lg">
                    SALVAR ADMINISTRADOR
                </button>
            </form>
            )}
        </Modal>
    );
};

export default AddAdminModal;
