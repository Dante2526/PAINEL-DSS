import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { UserPlusIcon } from '../icons';

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
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset state when modal is closed to ensure it's fresh next time
        if (!isOpen) {
            setName('');
            setMatricula('');
            setAddAnother(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
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
                <input
                    type="text"
                    placeholder="Matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    inputMode="numeric"
                />
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
        </Modal>
    );
};

export default AddUserModal;
