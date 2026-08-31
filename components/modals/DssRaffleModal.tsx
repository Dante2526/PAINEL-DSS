import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';

interface DssRaffleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (subject: string, inspectorMatricula: string) => void;
    employeeName: string;
    scale?: number;
}

export const DssRaffleModal: React.FC<DssRaffleModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    employeeName,
    scale = 1
}) => {
    const [subject, setSubject] = useState('');
    const [inspectorMatricula, setInspectorMatricula] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSubject('');
            setInspectorMatricula('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (subject.trim() && inspectorMatricula.trim()) {
            onSubmit(subject.trim().toUpperCase(), inspectorMatricula.trim().toUpperCase());
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✨ VOCÊ FOI O ESCOLHIDO! ✨" scale={scale} size="md">
            <div className="flex flex-col items-center justify-center p-2 py-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-2 border-amber-400/30 dark:border-amber-500/30 rounded-2xl p-5 shadow-lg text-center relative overflow-hidden">
                    
                    <div className="absolute -right-6 -top-6 text-amber-200/50 dark:text-amber-800/30 rotate-12">
                        <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-inner border border-amber-200 dark:border-amber-700/50 -rotate-3">
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                        
                        <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-2 md:mb-3">
                            PARABÉNS, {employeeName.split(' ')[0]}!
                        </h3>
                        
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-5 text-[12px] md:text-sm font-medium text-amber-950/80 dark:text-amber-100/80 leading-relaxed text-left">
                            <p>
                                Hoje o sistema sorteou <strong className="text-amber-700 dark:text-amber-300 font-bold">VOCÊ</strong> para registrar o Tema da DSS da sua equipe! 🎯
                            </p>
                            <div className="bg-white/60 dark:bg-black/20 p-2.5 md:p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
                                <p className="text-[11px] md:text-[13px] text-amber-800/90 dark:text-amber-200/80 leading-snug">
                                    Vá até a pessoa que realizou a DSS, pergunte o tema do dia e a matrícula dela, e preencha abaixo para liberar a sua presença.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[11px] md:text-xs font-bold text-amber-800 dark:text-amber-300 text-left ml-1">
                                    TEMA DA DSS:
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Digite o assunto da DSS..."
                                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700/50 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 dark:text-white transition-all shadow-inner uppercase text-sm md:text-base"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] md:text-xs font-bold text-amber-800 dark:text-amber-300 text-left ml-1">
                                    MATRÍCULA DE QUEM REALIZOU A DSS:
                                </label>
                                <input
                                    type="text"
                                    value={inspectorMatricula}
                                    onChange={(e) => setInspectorMatricula(e.target.value)}
                                    placeholder="Ex: 123456"
                                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700/50 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 dark:text-white transition-all shadow-inner uppercase font-mono text-sm md:text-base"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-2 pt-1 md:pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 md:py-3.5 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-700/50 rounded-xl font-bold uppercase tracking-widest hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all active:scale-95 whitespace-nowrap text-[10px] sm:text-xs"
                                >
                                    AGORA NÃO
                                </button>
                                <button
                                    type="submit"
                                    disabled={!subject.trim() || !inspectorMatricula.trim()}
                                    className="flex-1 py-3 md:py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap text-[10px] sm:text-xs"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    SALVAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DssRaffleModal;
