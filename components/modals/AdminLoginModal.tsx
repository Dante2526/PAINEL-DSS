import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { UserIcon } from '../icons';
import { isMobileCellularWithBiometrics, hasRegisteredBiometrics, authenticateBiometricAdmin } from '../../services/biometricService';

export const AdminLoginModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string) => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
    scale: number;
}> = ({ isOpen, onClose, onLogin, showNotification, scale }) => {
    const [email, setEmail] = useState('');
    const [showEmail, setShowEmail] = useState(false);
    const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isBioAvailable, setIsBioAvailable] = useState(false);
    const [isSmallViewport, setIsSmallViewport] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset state when modal is opened or closed
        if (!isOpen) {
            setEmail('');
            setShowEmail(false);
            setVisibleIndex(null);
        } else {
            // Atraso intencional no focus para não colidir com a animação de abertura do modal
            const timer = setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 350);
            return () => clearTimeout(timer);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const checkViewport = () => {
                if (window.visualViewport) {
                    setIsSmallViewport(window.visualViewport.height < 600);
                } else {
                    setIsSmallViewport(window.innerHeight < 600);
                }
            };
            checkViewport();
            window.visualViewport?.addEventListener('resize', checkViewport);
            window.addEventListener('resize', checkViewport);

            const checkBiometrics = async () => {
                const isCell = await isMobileCellularWithBiometrics();
                const hasBio = hasRegisteredBiometrics();
                setIsBioAvailable(isCell && hasBio);
            };
            checkBiometrics();

            return () => {
                window.visualViewport?.removeEventListener('resize', checkViewport);
                window.removeEventListener('resize', checkViewport);
            };
        }
    }, [isOpen]);

    const handleBiometricClick = async () => {
        try {
            const authenticatedEmail = await authenticateBiometricAdmin();
            if (authenticatedEmail) {
                onLogin(authenticatedEmail);
            }
        } catch (error) {
            console.error("Erro na autenticação biométrica:", error);
            showNotification('Não foi possível ler a impressão digital. Tente novamente ou use a senha.', 'error');
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmail(val);

        // Se o novo valor for maior, identificamos o caractere recém adicionado
        if (val.length > email.length) {
            const addedIdx = val.length - 1;
            setVisibleIndex(addedIdx);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setVisibleIndex(null);
            }, 1000);
        } else {
            // Se apagou, reseta o índice visível
            setVisibleIndex(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email);
    };

    if (!isOpen) return null;

    const inputClassName = `w-full pr-12 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary caret-black dark:caret-white relative z-10 select-text font-mono transition-all duration-300 ${
        isSmallViewport ? 'p-2.5 text-sm' : 'p-4 text-base'
    } ${
        !showEmail && email.length > 0
            ? 'text-transparent dark:text-transparent'
            : 'text-light-text dark:text-white'
    }`;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="" 
            scale={scale}
        >
            <form onSubmit={handleSubmit} className={`flex flex-col transition-all duration-300 ${isSmallViewport ? 'space-y-2' : 'space-y-4'}`}>
                <div className={`flex justify-center transition-all duration-300 ${isSmallViewport ? 'mb-1 mt-0' : 'mb-3 mt-1'}`}>
                    <div className="relative group">
                        {/* Efeito Glow / Sombra pulsante para design premium */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur-md opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                        {/* Contêiner principal com gradiente azul */}
                        <div className={`relative rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300 ${
                            isSmallViewport ? 'w-10 h-10' : 'w-20 h-20'
                        }`}>
                            <UserIcon className={`text-white transition-all duration-300 ${isSmallViewport ? 'w-5 h-5' : 'w-10 h-10'}`} />
                        </div>
                    </div>
                </div>
                
                {/* Título reposicionado abaixo do ícone */}
                <h2 className={`font-bold uppercase text-light-text dark:text-dark-text shrink-0 transition-all duration-300 ${
                    isSmallViewport ? 'text-sm mb-1 mt-0' : 'text-lg md:text-xl mb-5 mt-1'
                }`}>
                    Acesso Administrativo
                </h2>

                {isBioAvailable && (
                    <div className={`flex flex-col transition-all duration-300 ${isSmallViewport ? 'gap-1.5 mb-1' : 'gap-3 mb-2'}`}>
                        <button
                            type="button"
                            onClick={handleBiometricClick}
                            className={`w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-700 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transform transition-all duration-300 ${
                                isSmallViewport ? 'py-2.5 text-xs' : 'py-3.5 text-sm'
                            }`}
                        >
                            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                                <path d="M2 12a10 10 0 0 1 18-6"/>
                                <path d="M2 16h.01"/>
                                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                                <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                            </svg>
                            ENTRAR COM DIGITAL
                        </button>
                        <div className={`flex items-center justify-center gap-2 opacity-60 transition-all duration-300 ${isSmallViewport ? 'my-0.5' : 'my-1'}`}>
                            <span className="h-px bg-gray-300 dark:bg-gray-600 w-full"></span>
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">ou entrar com e-mail</span>
                            <span className="h-px bg-gray-300 dark:bg-gray-600 w-full"></span>
                        </div>
                    </div>
                )}

                <div className="relative w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Email do Administrador"
                        value={email}
                        onChange={handleEmailChange}
                        className={inputClassName}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    {!showEmail && email.length > 0 && (
                        <div className={`absolute right-12 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-light-text dark:text-dark-text font-mono z-20 truncate transition-all duration-300 ${
                            isSmallViewport ? 'left-3 text-sm' : 'left-4 text-base'
                        }`}>
                            {email.split('').map((char, index) => (
                                <span key={index}>
                                    {index === visibleIndex ? char : '●'}
                                </span>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowEmail(!showEmail)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20 focus:outline-none"
                        title={showEmail ? "Ocultar Email" : "Exibir Email"}
                    >
                        {showEmail ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                        )}
                    </button>
                </div>
                {!isSmallViewport && (
                    <p className="text-left text-warning font-bold px-1 my-0.5 text-xs">
                        * Digite tudo em minúsculo
                    </p>
                )}
                <button type="submit" className={`w-full bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all duration-300 ${
                    isSmallViewport ? 'py-2.5 text-sm mt-1' : 'py-3'
                }`}>
                    ENTRAR
                </button>
            </form>
        </Modal>
    );
};

export default AdminLoginModal;
