import React from 'react';
import { ShieldLogo } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';

interface TurmaSelectionScreenProps {
    onSelect: (turma: 'A' | 'B' | 'C' | 'D' | 'CCG') => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const TurmaSelectionScreen: React.FC<TurmaSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto">
            <div className="absolute top-4 right-4 md:top-8 md:right-8 selection-screen-toggle z-[100]">
                <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            </div>

            {/* This container grows to push the footer down, and centers the main content within the available space. */}
            <div className="flex-grow flex flex-col justify-center w-full mt-12 md:mt-0 pb-2">
                <main className="flex flex-col items-center text-center m-auto w-full max-w-2xl px-2">
                    <ShieldLogo className="h-24 w-24 md:h-40 md:w-40 mb-4" />
                    <h1 className="text-3xl md:text-5xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-2">Painel de Acompanhamento DSS</h1>
                    <p className="text-base md:text-xl font-medium text-light-text-secondary dark:text-dark-text-secondary mb-8">Selecione a turma para continuar</p>

                    <div className="grid grid-cols-2 gap-4 md:gap-4 w-full max-w-sm md:max-w-none px-4 md:px-0 mx-auto mb-4">
                        <button
                            onClick={() => onSelect('A')}
                            className="px-6 md:px-12 py-6 md:py-8 font-extrabold text-lg md:text-2xl text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                        >
                            TURMA A
                        </button>
                        <button
                            onClick={() => onSelect('B')}
                            className="px-6 md:px-12 py-6 md:py-8 font-extrabold text-lg md:text-2xl text-white bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                        >
                            TURMA B
                        </button>
                        <button
                            onClick={() => onSelect('C')}
                            className="px-6 md:px-12 py-6 md:py-8 font-extrabold text-lg md:text-2xl text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                        >
                            TURMA C
                        </button>
                        <button
                            onClick={() => onSelect('D')}
                            className="px-6 md:px-12 py-6 md:py-8 font-extrabold text-lg md:text-2xl text-white bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800"
                        >
                            TURMA D
                        </button>
                    </div>

                    {/* Botão Turma C CG - Carga Geral, centralizado abaixo */}
                    <div className="flex justify-center w-full max-w-sm md:max-w-none px-4 md:px-0 mx-auto mb-8">
                        <button
                            onClick={() => onSelect('CCG')}
                            className="w-[calc(50%-0.5rem)] px-6 md:px-12 py-6 md:py-8 font-extrabold text-lg md:text-2xl text-white bg-gradient-to-br from-pink-500 to-rose-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                        >
                            TURMA C CG
                            <span className="block text-xs md:text-sm font-semibold opacity-80 mt-1">Carga Geral</span>
                        </button>
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default TurmaSelectionScreen;