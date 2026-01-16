
import React from 'react';
import { ShieldLogo } from './icons';
import DarkModeToggle from './DarkModeToggle';
import Footer from './Footer';

interface TurmaSelectionScreenProps {
    onSelect: (turma: 'A' | 'B' | 'C') => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const TurmaSelectionScreen: React.FC<TurmaSelectionScreenProps> = ({ onSelect, isDarkMode, onToggleDarkMode }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text transition-colors flex flex-col items-center p-4">
            <div className="absolute top-4 right-4 md:top-8 md:right-8 selection-screen-toggle">
                <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
            </div>
            
            {/* This container grows to push the footer down, and centers the main content within the available space. */}
            <div className="flex-grow flex items-center justify-center w-full">
                <main className="flex flex-col items-center text-center">
                    <ShieldLogo className="h-28 w-28 md:h-40 md:w-40 mb-6" />
                    <h1 className="text-3xl md:text-5xl font-extrabold text-light-text dark:text-dark-text tracking-tight mb-2">Painel de Acompanhamento DSS</h1>
                    <p className="text-base md:text-xl font-medium text-light-text-secondary dark:text-dark-text-secondary mb-10">Selecione a turma para continuar</p>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        <button 
                            onClick={() => onSelect('A')} 
                            className="px-12 py-6 md:px-16 md:py-8 font-extrabold text-2xl md:text-3xl text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                        >
                            TURMA A
                        </button>
                        <button 
                            onClick={() => onSelect('B')} 
                            className="px-12 py-6 md:px-16 md:py-8 font-extrabold text-2xl md:text-3xl text-white bg-gradient-to-br from-primary to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                        >
                            TURMA B
                        </button>
                        <button 
                            onClick={() => onSelect('C')} 
                            className="px-12 py-6 md:px-16 md:py-8 font-extrabold text-2xl md:text-3xl text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                        >
                            TURMA C
                        </button>
                    </div>
                </main>
            </div>
            
            {/* The footer is now part of the flex flow, no longer absolutely positioned */}
            <Footer />
        </div>
    );
};

export default TurmaSelectionScreen;