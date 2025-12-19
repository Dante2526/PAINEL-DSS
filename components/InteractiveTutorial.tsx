
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    scrollTargetId?: string;
    scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
}

interface InteractiveTutorialProps {
    isOpen: boolean;
    onClose: () => void;
    steps: TutorialStep[];
    scale?: number;
    onStepChange?: (step: TutorialStep) => void;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ isOpen, onClose, steps, scale = 1, onStepChange }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const requestRef = useRef<number>(0);
    const viewportRef = useRef<HTMLElement | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            viewportRef.current = document.querySelector('.viewport');
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const measurePosition = useCallback(() => {
        const step = steps[currentStepIndex];
        const element = document.getElementById(step.targetId);
        
        if (element) {
            const rect = element.getBoundingClientRect();
            // Verifica se o elemento tem dimensões reais e está no DOM
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
                return;
            }
        }
        setTargetRect(null);
    }, [steps, currentStepIndex]);

    const handleScrollResize = useCallback(() => {
        if (!isOpen) return;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(measurePosition);
    }, [isOpen, measurePosition]);

    useEffect(() => {
        if (!isOpen) return;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        setIsTransitioning(true);
        const step = steps[currentStepIndex];

        // Notifica o pai sobre a mudança de passo para que ele possa ajustar escala/scroll
        if (onStepChange) {
            onStepChange(step);
        }

        const timer = setTimeout(() => {
            const element = document.getElementById(step.targetId);
            const scrollElement = step.scrollTargetId ? document.getElementById(step.scrollTargetId) : element;
            
            if (element) {
                const blockPosition = step.scrollTargetId === 'app-header' ? 'start' : (step.scrollBlock || 'center');
                
                // CRITICAL FIX: Se o alvo é o cabeçalho e já estamos no topo, não forçamos scroll do navegador
                // para evitar conflitos com o scroll manual feito no App.tsx
                const isHeaderStep = ['tutorial-stats', 'tutorial-dark-mode', 'tutorial-admin-btn'].includes(step.targetId);
                const isAtTop = viewportRef.current ? viewportRef.current.scrollTop < 10 : true;

                if (scrollElement && !(isHeaderStep && isAtTop)) {
                    scrollElement.scrollIntoView({ 
                        behavior: isHeaderStep ? 'auto' : 'smooth', 
                        block: blockPosition, 
                        inline: 'center' 
                    });
                }
                
                // Inicia loop de rastreamento para garantir que o spotlight se ajuste ao zoom/scroll
                const startTime = performance.now();
                const track = () => {
                    measurePosition();
                    // Continua rastreando por 2 segundos para cobrir animações de zoom e scroll suave
                    if (performance.now() - startTime < 2000) {
                        requestRef.current = requestAnimationFrame(track);
                    } else {
                        setIsTransitioning(false); 
                    }
                };
                
                requestRef.current = requestAnimationFrame(track);
            } else {
                setTargetRect(null);
                setIsTransitioning(false);
            }
        }, 100); 

        return () => {
            clearTimeout(timer);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isOpen, currentStepIndex, steps, measurePosition, onStepChange]);

    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('resize', handleScrollResize);
        window.addEventListener('scroll', handleScrollResize, true);
        return () => {
            window.removeEventListener('resize', handleScrollResize);
            window.removeEventListener('scroll', handleScrollResize, true);
        };
    }, [isOpen, handleScrollResize]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onClose();
            setCurrentStepIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    const step = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    let tooltipStyle: React.CSSProperties = {};
    
    if (isMobile) {
        // No celular, posiciona o modal no topo ou rodapé dependendo da posição do alvo
        const isTargetInBottomHalf = targetRect ? targetRect.top > window.innerHeight / 2 : false;
        tooltipStyle = {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            zIndex: 100002,
            bottom: isTargetInBottomHalf ? undefined : '20px',
            top: isTargetInBottomHalf ? '20px' : undefined,
        };
    } else if (targetRect) {
        const pos = getTooltipPosition(targetRect, scale, step.position);
        tooltipStyle = {
            top: pos.top,
            left: pos.left,
            position: 'absolute',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '400px',
            zIndex: 100002
        };
    } else {
        tooltipStyle = {
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            position: 'fixed',
            width: '400px',
            zIndex: 100002
        };
    }

    return createPortal(
        <div className="fixed inset-0 z-[100000]">
            {targetRect ? (
                <div 
                    className="absolute border-4 border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.85),inset_0_0_30px_rgba(255,255,255,0.2)] pointer-events-none will-change-[top,left,width,height]"
                    style={{
                        top: targetRect.top - 12,
                        left: targetRect.left - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                        zIndex: 100000,
                        transition: 'none' // Desativamos transição CSS para acompanhar o zoom do pai sem atraso
                    }}
                >
                    <span className="absolute -top-3 -right-3 flex h-8 w-8">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-8 w-8 bg-primary shadow-lg border-2 border-white"></span>
                    </span>
                </div>
            ) : (
                <div 
                    className="absolute inset-0 bg-black/85 z-[100000]" 
                />
            )}

            <div 
                className="bg-white dark:bg-gray-800 text-slate-800 dark:text-white p-6 rounded-2xl shadow-2xl transition-all duration-300 ease-out flex flex-col gap-4 border border-gray-200 dark:border-gray-700"
                style={tooltipStyle}
            >
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl text-primary">{step.title}</h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                    </div>
                    <p className="text-base leading-relaxed text-slate-600 dark:text-gray-300">
                        {step.content}
                    </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <button 
                        onClick={onClose}
                        className="text-sm font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        Pular
                    </button>
                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <button 
                                onClick={handlePrev}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Voltar
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg hover:shadow-primary/30"
                        >
                            {isLastStep ? 'Concluir' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

function getTooltipPosition(rect: DOMRect, scale: number, preferredPosition?: 'top' | 'bottom' | 'left' | 'right') {
    const margin = 24 * scale; 
    const scaledWidth = 400 * scale;
    const scaledHeight = 250 * scale;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    
    if (rect.bottom + scaledHeight + margin < windowHeight) {
        top = rect.bottom + margin;
        left = rect.left + (rect.width / 2) - (scaledWidth / 2);
    } 
    else if (rect.top - scaledHeight - margin > 0) {
        top = rect.top - scaledHeight - margin;
        left = rect.left + (rect.width / 2) - (scaledWidth / 2);
    }
    else if (rect.right + scaledWidth + margin < windowWidth) {
        top = rect.top;
        left = rect.right + margin;
    }
    else {
        top = rect.top;
        left = rect.left - scaledWidth - margin;
    }
    
    if (left < margin) left = margin;
    if (left + scaledWidth > windowWidth - margin) left = windowWidth - scaledWidth - margin;
    
    if (top < margin) top = margin;
    if (top + scaledHeight > windowHeight - margin) top = windowHeight - scaledHeight - margin;

    return { top, left };
}

export default InteractiveTutorial;
