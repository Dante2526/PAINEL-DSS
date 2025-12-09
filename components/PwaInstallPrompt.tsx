import React, { useEffect, useState } from 'react';

interface PwaInstallPromptProps {
    scale?: number;
}

const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ scale = 1 }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can add to home screen
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!mounted || !isVisible) return null;

    // Ensure scale is a valid number
    const safeScale = typeof scale === 'number' && !isNaN(scale) ? scale : 1;

    return (
        <div 
            className="fixed top-6 left-1/2 z-50 pointer-events-auto"
            style={{
                transform: `translateX(-50%) scale(${safeScale})`,
                transformOrigin: 'top center',
                maxWidth: `calc(90vw / ${safeScale})`,
                width: 'max-content'
            }}
        >
            <div className="bg-gradient-to-r from-primary to-primary-dark p-1 rounded-2xl shadow-2xl">
                <div className="bg-light-card dark:bg-dark-card rounded-xl p-4 flex flex-wrap justify-center items-center gap-4 pr-6">
                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <div className="text-left flex-grow min-w-[200px]">
                        <h3 className="font-bold text-light-text dark:text-dark-text text-lg leading-tight">Instalar App</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Acesse o painel direto da tela inicial</p>
                    </div>
                    <div className="flex gap-3 ml-4 border-l pl-4 border-gray-200 dark:border-gray-700 flex-wrap justify-center">
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 whitespace-nowrap"
                        >
                            Agora não
                        </button>
                        <button 
                            onClick={handleInstallClick}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all transform hover:scale-105 whitespace-nowrap"
                        >
                            INSTALAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PwaInstallPrompt;