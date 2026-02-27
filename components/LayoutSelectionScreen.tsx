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
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-screen overflow-hidden text-light-text dark:text-dark-text transition-colors flex flex-col items-center px-4 py-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="fixed top-4 right-4 selection-screen-toggle z-[100]">
                <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            </div>

            <button
                onClick={onBack}
                className="fixed top-4 left-4 md:top-8 md:left-8 z-[100] px-4 py-2 font-bold text-light-text-secondary dark:text-dark-text-secondary bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition shadow"
            >
                ← Voltar
            </button>

            <div className="flex-grow flex items-center justify-center w-full mt-10 md:mt-8">
                <main className="flex flex-col items-center text-center">
                    <ShieldLogo className="h-16 w-16 md:h-24 md:w-24 mb-4" />
                    <h1 className="text-2xl md:text-4xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-1">Turma {selecionadaTurma}</h1>
                    <p className="text-sm md:text-lg font-medium text-light-text-secondary dark:text-dark-text-secondary mb-6">Escolha como deseja visualizar o painel</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-xl px-4">
                        {/* Padrão */}
                        <button
                            onClick={() => onSelect('standard')}
                            className="flex flex-col items-center p-4 bg-light-card dark:bg-dark-card border-2 border-transparent hover:border-blue-500 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <div className="w-14 h-14 mb-3 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <GridIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:text-blue-500" />
                            </div>
                            <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text mb-1">Layout Padrão</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm px-2">
                                Grid simples de 3 colunas, focado no conteúdo. Visualização tradicional em formato de lista contínua.
                            </p>
                        </button>

                        {/* Customizado / Alfabético */}
                        <button
                            onClick={() => onSelect('custom')}
                            className="flex flex-col items-center p-4 bg-light-card dark:bg-dark-card border-2 border-transparent hover:border-cyan-500 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 relative overflow-hidden"
                        >
                            <div className="w-14 h-14 mb-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <SortIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text mb-1">Layout Alfabético</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm px-2">
                                Interface moderna com separadores fixos de cabeçalho por letra e um menu rápido lateral.
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
