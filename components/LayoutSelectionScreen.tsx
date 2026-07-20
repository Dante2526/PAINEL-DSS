import React from 'react';
import { ShieldLogo, SortIcon, GridIcon } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';

interface LayoutSelectionScreenProps {
    onSelect: (layout: 'standard' | 'custom') => void;
    isDarkMode: boolean;
    onToggleDarkMode: (e?: any) => void;
    onBack: () => void;
    selecionadaTurma: string;
}

const LayoutSelectionScreen: React.FC<LayoutSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode, onBack, selecionadaTurma }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] overflow-hidden">
            <button 
                onClick={onBack}
                className="fixed top-2 left-2 md:top-8 md:left-8 z-[100] px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-bold text-light-text-secondary dark:text-dark-text-secondary bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition shadow"
            >
                ← Voltar
            </button>

            <div className="flex-grow flex flex-col w-full mt-8 md:mt-6 pb-1">
                <main className="flex-grow flex flex-col items-center justify-center text-center m-auto w-full max-w-2xl px-2">
                    <ShieldLogo className="h-8 w-8 md:h-16 md:w-16 mb-1 md:mb-2" />
                    <h1 className="text-xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-0.5 md:mb-1">Turma {selecionadaTurma.replace('_', ' - ')}</h1>
                    <p className="text-[11px] md:text-base font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3 md:mb-6">Escolha como deseja visualizar o painel</p>

                    <div className="flex flex-col md:grid md:grid-cols-2 gap-3 w-[300px] md:w-full md:max-w-xl mx-auto mb-2 md:mb-4">
                        {/* Padrão */}
                        <button
                            onClick={() => onSelect('standard')}
                            className="group flex flex-col items-center text-center p-3 md:p-5 rounded-2xl md:rounded-3xl border-[3px] border-transparent bg-white dark:bg-gray-800 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 w-full"
                        >
                            <div className="w-14 h-14 md:w-20 md:h-20 mb-3 md:mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                <GridIcon className="w-7 h-7 md:w-10 md:h-10 text-blue-600 dark:text-blue-400 group-hover:text-blue-500" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-extrabold text-light-text dark:text-dark-text mb-2 max-w-[95%] leading-tight text-center">Layout Padrão</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-lg px-2 md:px-4 leading-snug text-center mt-1 md:mt-2">
                                Interface tradicional em grade simples, focada na exibição direta do conteúdo.
                            </p>
                        </button>

                        {/* Customizado / Alfabético */}
                        <button
                            onClick={() => onSelect('custom')}
                            className="group flex flex-col items-center text-center p-3 md:p-5 rounded-2xl md:rounded-3xl border-[3px] border-transparent bg-white dark:bg-gray-800 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500 w-full relative overflow-hidden"
                        >
                            <div className="w-14 h-14 md:w-20 md:h-20 mb-3 md:mb-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                <SortIcon className="w-7 h-7 md:w-10 md:h-10 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-extrabold text-light-text dark:text-dark-text mb-2 max-w-[95%] leading-tight text-center">Layout Alfabético</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-lg px-2 md:px-4 leading-snug text-center mt-1 md:mt-2">
                                Interface moderna com separadores fixos de cabeçalho por letra e um menu rápido.
                            </p>
                        </button>
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default LayoutSelectionScreen;
