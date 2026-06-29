import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { UserPlusIcon, InfoIcon } from '../icons';

export const AddUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onAdd: (name: string, matricula: string, addAnother: boolean) => void;
    scale: number;
}> = ({ isOpen, onClose, onBack, onAdd, scale }) => {
    const [name, setName] = useState('');
    const [matricula, setMatricula] = useState('');
    const [addAnother, setAddAnother] = useState(false);
    const [showWarningCard, setShowWarningCard] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset state when modal is closed to ensure it's fresh next time
        if (!isOpen) {
            setName('');
            setMatricula('');
            setAddAnother(false);
            setShowWarningCard(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (matricula.length !== 8) {
            setShowWarningCard(true);
            return;
        }

        if (name.trim() && matricula.trim()) {
            onAdd(name.trim(), matricula, addAnother);
            // Sempre limpa os campos após enviar
            setName('');
            setMatricula('');

            // Se "Continuar Adicionando" estiver marcado, o modal não fechará
            // então focamos automaticamente no campo de nome para o próximo
            if (addAnother && nameInputRef.current) {
                setTimeout(() => {
                    nameInputRef.current?.focus();
                }, 100);
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={onBack} title="" scale={scale}>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center mb-4 mt-2">
                    <div className="relative group">
                        {/* Efeito Glow / Sombra pulsante para design premium */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full blur-md opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                        {/* Contêiner principal com gradiente verde */}
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300">
                            <UserPlusIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Título reposicionado abaixo do ícone */}
                <h2 className="text-lg md:text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6 mt-1 shrink-0">
                    Adicionar Colaborador
                </h2>

                <div>
                    <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Nome e Sobrenome"
                        value={name}
                        onChange={handleNameChange}
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white uppercase"
                        autoFocus
                    />
                    <p className="text-xs text-left text-warning font-semibold px-1 mt-1.5">
                        *Coloque apenas o primeiro nome e o último sobrenome
                    </p>
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Matrícula"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        inputMode="numeric"
                        maxLength={8}
                        minLength={8}
                        required
                    />
                    <p className="text-xs text-left text-light-text-secondary dark:text-dark-text-secondary px-1 mt-1.5 leading-relaxed">
                        Se você é da <strong className="text-light-text dark:text-white">Velha Guarda</strong>, adicione <strong className="text-light-text dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">01</strong> na frente dos demais números para completar os 8 dígitos.
                    </p>
                </div>
                <label htmlFor="add-another-user-checkbox" className="flex items-center justify-center gap-4 py-2 cursor-pointer group">
                    <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text transition-colors select-none">
                        Continuar adicionando
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="add-another-user-checkbox"
                            className="sr-only"
                            checked={addAnother}
                            onChange={(e) => setAddAnother(e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${addAnother ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${addAnother ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </label>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition shadow-lg shadow-green-600/20 active:scale-[0.98] transform uppercase">
                    ADICIONAR
                </button>
            </form>
            )}
        </Modal>
    );
};

export default AddUserModal;
