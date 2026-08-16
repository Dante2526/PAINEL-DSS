import React from 'react';
import { ShieldLogo } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';
import { getDisplayModeFromPath, TurmaType } from '../utils/turmaUtils';

interface TurmaSelectionScreenProps {
    onSelect: (turma: TurmaType) => void;
    isDarkMode: boolean;
    onToggleDarkMode: (e?: any) => void;
}

const TurmaSelectionScreen: React.FC<TurmaSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode }) => {
    const displayMode = getDisplayModeFromPath();

    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] overflow-hidden">
            {/* This container grows to push the footer down, and centers the main content within the available space. */}
            <div className="flex-grow flex flex-col justify-center w-full mt-0 pb-1">
                <main className="flex flex-col items-center text-center m-auto w-full px-2">
                    <ShieldLogo className="h-10 w-10 md:h-14 md:w-14 mb-2" />
                    <h1 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-1">Painel de Acompanhamento</h1>
                    <p className="text-sm md:text-base font-medium text-light-text-secondary dark:text-dark-text-secondary mb-4 md:mb-6">Selecione a turma para continuar</p>

                    <div className="grid grid-cols-2 gap-2 md:gap-3 w-full max-w-[340px] sm:max-w-[460px] md:max-w-[500px] mx-auto mb-2 md:mb-4">
                        {displayMode === 'NORMAL' && (
                            <>
                                {/* Turma A | A CG */}
                                <button
                                    onClick={() => onSelect('A')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA A</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">MINÉRIO</span>
                                </button>
                                <button
                                    onClick={() => onSelect('A_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-red-500 to-red-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA A</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CARGA GERAL</span>
                                </button>

                                {/* Turma B | B CG */}
                                <button
                                    onClick={() => onSelect('B')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA B</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">MINÉRIO</span>
                                </button>
                                <button
                                    onClick={() => onSelect('B_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-300 dark:focus:ring-violet-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA B</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CARGA GERAL</span>
                                </button>

                                {/* Turma C | C CG */}
                                <button
                                    onClick={() => onSelect('C')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA C</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">MINÉRIO</span>
                                </button>
                                <button
                                    onClick={() => onSelect('C_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-fuchsia-500 to-pink-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fuchsia-300 dark:focus:ring-fuchsia-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA C</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CARGA GERAL</span>
                                </button>

                                {/* Turma D | D CG */}
                                <button
                                    onClick={() => onSelect('D')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA D</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">MINÉRIO</span>
                                </button>
                                <button
                                    onClick={() => onSelect('D_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-rose-600 to-red-800 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA D</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CARGA GERAL</span>
                                </button>

                                {/* Estágio (linha inteira) */}
                                <button
                                    onClick={() => onSelect('ESTAGIO')}
                                    className="flex items-center justify-center whitespace-nowrap w-full col-span-2 px-2 py-3 md:py-4 font-extrabold text-sm sm:text-base md:text-lg text-white bg-gradient-to-br from-pink-500 to-rose-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 dark:focus:ring-rose-800"
                                >
                                    ESTÁGIO
                                </button>
                            </>
                        )}

                        {displayMode === 'CG' && (
                            <>
                                {/* Turma A CCP */}
                                <button
                                    onClick={() => onSelect('A_CCP_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-lime-500 to-emerald-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-lime-300 dark:focus:ring-lime-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA A</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP CARGA GERAL</span>
                                </button>
                                {/* Turma B CCP */}
                                <button
                                    onClick={() => onSelect('B_CCP_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-sky-400 to-sky-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA B</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP CARGA GERAL</span>
                                </button>
                                {/* Turma C CCP */}
                                <button
                                    onClick={() => onSelect('C_CCP_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA C</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP CARGA GERAL</span>
                                </button>
                                {/* Turma D CCP */}
                                <button
                                    onClick={() => onSelect('D_CCP_CG')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-emerald-500 to-emerald-800 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA D</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP CARGA GERAL</span>
                                </button>
                            </>
                        )}

                        {displayMode === 'MINERIO' && (
                            <>
                                {/* Turma A CCP Minério */}
                                <button
                                    onClick={() => onSelect('A_CCP_MINERIO')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-lime-500 to-emerald-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-lime-300 dark:focus:ring-lime-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA A</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP MINÉRIO</span>
                                </button>
                                {/* Turma B CCP Minério */}
                                <button
                                    onClick={() => onSelect('B_CCP_MINERIO')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-sky-400 to-sky-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA B</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP MINÉRIO</span>
                                </button>
                                {/* Turma C CCP Minério */}
                                <button
                                    onClick={() => onSelect('C_CCP_MINERIO')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA C</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP MINÉRIO</span>
                                </button>
                                {/* Turma D CCP Minério */}
                                <button
                                    onClick={() => onSelect('D_CCP_MINERIO')}
                                    className="flex flex-col items-center justify-center w-full px-1 py-2 md:py-3 font-extrabold text-white bg-gradient-to-br from-emerald-500 to-emerald-800 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-800"
                                >
                                    <span className="text-sm sm:text-base md:text-lg leading-tight">TURMA D</span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-90 tracking-wide mt-0.5">CCP MINÉRIO</span>
                                </button>
                            </>
                        )}
                    </div>

                </main>

                <div className="mt-auto w-full pb-0 md:pb-2">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default TurmaSelectionScreen;
