import React from 'react';
import { ShieldLogo } from './icons';
import DarkModeToggle from './DarkModeToggle';

interface ThemeSelectionScreenProps {
    isDarkMode: boolean;
    onToggleDarkMode: (e?: any) => void;
    onContinue: () => void;
}

const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({ isDarkMode, onToggleDarkMode, onContinue }) => {
    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg h-[100dvh] w-full text-light-text dark:text-dark-text transition-colors flex flex-col items-center justify-center p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] overflow-hidden relative">
            <div className="flex flex-col items-center text-center max-w-md w-full px-4 z-10 flex-grow justify-center">
                <ShieldLogo className="h-10 w-10 md:h-14 md:w-14 mb-2" />
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
                    Bem-vindo ao Painel DSS
                </h1>
                <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary mb-4 md:mb-6">
                    Antes de começar, defina o tema.
                </p>

                {/* Container do BB8 com instruções */}
                <div className="bg-light-card dark:bg-dark-card border-2 border-primary/20 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center gap-2 w-fit px-8 md:px-12 mx-auto mb-4">
                    <p className="font-bold text-base md:text-xl text-light-text-secondary dark:text-dark-text-secondary">
                        {isDarkMode ? '🌙 MODO ESCURO' : '☀️ MODO CLARO'}
                    </p>
                    
                    <div style={{ '--bb8-size': '16px' } as React.CSSProperties} className="my-1 md:my-2">
                        <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
                    </div>

                    <p className="text-xs md:text-sm font-medium opacity-70 flex items-center justify-center">
                        Clique no BB-8 para alternar
                    </p>
                </div>

                <button
                    onClick={onContinue}
                    className="w-full max-w-[280px] bg-primary text-white font-extrabold py-3 md:py-4 px-6 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg hover:bg-primary/90 transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30"
                >
                    Continuar
                </button>
            </div>
            
            {/* Elementos decorativos no fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default React.memo(ThemeSelectionScreen);
