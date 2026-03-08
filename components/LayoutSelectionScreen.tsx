import React from 'react';
import { ShieldLogo, SortIcon, GridIcon } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';

interface LayoutSelectionScreenProps {
    onSelect: (layout: 'standard' | 'custom') => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onBack: () => void;
    selecionadaTurma: string;
}

const LayoutSelectionScreen: React.FC<LayoutSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode, onBack, selecionadaTurma }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] overflow-hidden text-light-text dark:text-dark-text transition-colors flex flex-col items-center px-2 py-2 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] w-full">
            <div className="fixed top-2 right-2 selection-screen-toggle z-[100]">
                <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            </div>

            <button
                onClick={onBack}
                className="fixed top-2 left-2 md:top-8 md:left-8 z-[100] px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-bold text-light-text-secondary dark:text-dark-text-secondary bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition shadow"
            >
                ← Voltar
            </button>

            <div className="flex-grow flex flex-col w-full mt-10 md:mt-8 pb-2">
                <main className="flex-grow flex flex-col items-center text-center m-auto w-full max-w-2xl px-2">
                    <ShieldLogo className="h-8 w-8 md:h-24 md:w-24 mb-1 md:mb-4" />
                    <h1 className="text-xl md:text-4xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-0.5 md:mb-1">Turma {selecionadaTurma}</h1>
                    <p className="text-[11px] md:text-lg font-medium text-light-text-secondary dark:text-dark-text-secondary mb-4 md:mb-6">Escolha como deseja visualizar o painel</p>

                    <div className="flex-grow flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-4 w-[300px] md:w-full md:max-w-xl mx-auto mb-2">
                        {/* Padrão */}
                        <button
                            onClick={() => onSelect('standard')}
                            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-light-card dark:bg-dark-card rounded-3xl shadow-lg border border-transparent hover:border-blue-500 transform hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-blue-500 w-full"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                <GridIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400 group-hover:text-blue-500" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-extrabold text-light-text dark:text-dark-text mb-2 max-w-[95%] leading-tight text-center">Layout Padrão</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-lg px-2 md:px-4 leading-snug flex-grow flex items-center justify-center text-center">
                                Grid simples de 3 colunas, focado no conteúdo. Visualização tradicional em formato de lista.
                            </p>
                        </button>

                        {/* Customizado / Alfabético */}
                        <button
                            onClick={() => onSelect('custom')}
                            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-light-card dark:bg-dark-card rounded-3xl shadow-lg border border-transparent hover:border-cyan-500 transform hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-cyan-500 w-full relative overflow-hidden"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                <SortIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-extrabold text-light-text dark:text-dark-text mb-2 max-w-[95%] leading-tight text-center">Layout Alfabético</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-lg px-2 md:px-4 leading-snug flex-grow flex items-center justify-center text-center">
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
