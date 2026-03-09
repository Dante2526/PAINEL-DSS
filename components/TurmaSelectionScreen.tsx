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
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-hidden">
            <div className="absolute top-4 right-4 md:top-8 md:right-8 selection-screen-toggle z-[100]">
                <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            </div>

            {/* This container grows to push the footer down, and centers the main content within the available space. */}
            <div className="flex-grow flex flex-col justify-center w-full mt-12 md:mt-0 pb-2">
                <main className="flex flex-col items-center text-center m-auto w-full px-2">
                    <ShieldLogo className="h-16 w-16 md:h-16 md:w-16 mb-2 md:mb-2" />
                    <h1 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-1 md:mb-1">Painel de Acompanhamento DSS</h1>
                    <p className="text-sm md:text-base font-medium text-light-text-secondary dark:text-dark-text-secondary mb-4 md:mb-6">Selecione a turma para continuar</p>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-[320px] md:max-w-[460px] mx-auto mb-3 md:mb-4">
                        <button
                            onClick={() => onSelect('A')}
                            className="flex items-center justify-center whitespace-nowrap px-4 py-8 md:py-6 font-extrabold text-xl md:text-xl text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl md:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                        >
                            TURMA A
                        </button>
                        <button
                            onClick={() => onSelect('B')}
                            className="flex items-center justify-center whitespace-nowrap px-4 py-8 md:py-6 font-extrabold text-xl md:text-xl text-white bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl md:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                        >
                            TURMA B
                        </button>
                        <button
                            onClick={() => onSelect('C')}
                            className="flex items-center justify-center whitespace-nowrap px-4 py-8 md:py-6 font-extrabold text-xl md:text-xl text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl md:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                        >
                            TURMA C
                        </button>
                        <button
                            onClick={() => onSelect('D')}
                            className="flex items-center justify-center whitespace-nowrap px-4 py-8 md:py-6 font-extrabold text-xl md:text-xl text-white bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl md:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800"
                        >
                            TURMA D
                        </button>
                    </div>

                    <div className="flex justify-center w-full max-w-[320px] md:max-w-[460px] mx-auto mb-4 md:mb-6">
                        <button
                            onClick={() => onSelect('CCG')}
                            className="flex items-center justify-center whitespace-nowrap w-[calc(50%-0.375rem)] md:w-[calc(50%-0.5rem)] px-4 py-8 md:py-6 font-extrabold text-xl md:text-xl text-white bg-gradient-to-br from-pink-500 to-rose-700 rounded-2xl md:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                        >
                            TURMA C CG
                        </button>
                    </div>

                </main>

                <div className="mt-auto w-full pb-2 md:pb-4">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default TurmaSelectionScreen;