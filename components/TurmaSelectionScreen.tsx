import React from 'react';
import { ShieldLogo } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';

interface TurmaSelectionScreenProps {
    onSelect: (turma: 'A' | 'B' | 'C' | 'D' | 'C_CG' | 'B_CG' | 'A_CG' | 'D_CG' | 'ESTAGIO') => void;
    isDarkMode: boolean;
    onToggleDarkMode: (e?: any) => void;
}

const TurmaSelectionScreen: React.FC<TurmaSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] overflow-hidden">
            {/* This container grows to push the footer down, and centers the main content within the available space. */}
            <div className="flex-grow flex flex-col justify-center w-full mt-2 md:mt-0 pb-2">
                <main className="flex flex-col items-center text-center m-auto w-full px-2">
                    <ShieldLogo className="h-16 w-16 md:h-20 md:w-20 mb-3 md:mb-4" />
                    <h1 className="text-3xl md:text-4xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-2 md:mb-3">Painel de Acompanhamento</h1>
                    <p className="text-base md:text-lg font-medium text-light-text-secondary dark:text-dark-text-secondary mb-8 md:mb-10">Selecione a turma para continuar</p>

                    <div className="grid grid-cols-2 gap-4 md:gap-5 w-full max-w-[340px] sm:max-w-[500px] md:max-w-[560px] mx-auto mb-6 md:mb-8">
                        {/* Turma A | A CG */}
                        <button
                            onClick={() => onSelect('A')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                        >
                            TURMA A
                        </button>
                        <button
                            onClick={() => onSelect('A_CG')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-red-500 to-red-700 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800"
                        >
                            TURMA A CG
                        </button>

                        {/* Turma B | B CG */}
                        <button
                            onClick={() => onSelect('B')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                        >
                            TURMA B
                        </button>
                        <button
                            onClick={() => onSelect('B_CG')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-300 dark:focus:ring-violet-800"
                        >
                            TURMA B CG
                        </button>

                        {/* Turma C | C CG */}
                        <button
                            onClick={() => onSelect('C')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                        >
                            TURMA C
                        </button>
                        <button
                            onClick={() => onSelect('C_CG')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-fuchsia-500 to-pink-700 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fuchsia-300 dark:focus:ring-fuchsia-800"
                        >
                            TURMA C CG
                        </button>

                        {/* Turma D | D CG */}
                        <button
                            onClick={() => onSelect('D')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800"
                        >
                            TURMA D
                        </button>
                        <button
                            onClick={() => onSelect('D_CG')}
                            className="flex items-center justify-center whitespace-nowrap w-full px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-rose-600 to-red-800 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                        >
                            TURMA D CG
                        </button>

                        {/* Estágio (linha inteira) */}
                        <button
                            onClick={() => onSelect('ESTAGIO')}
                            className="flex items-center justify-center whitespace-nowrap w-full col-span-2 px-2 py-5 md:py-6 font-extrabold text-base sm:text-lg md:text-xl text-white bg-gradient-to-br from-pink-500 to-rose-700 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                        >
                            ESTÁGIO
                        </button>
                    </div>

                </main>

                <div className="mt-auto w-full pb-0 md:pb-6">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default TurmaSelectionScreen;
