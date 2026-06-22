
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    scrollTargetId?: string;
    disableHorizontalScroll?: boolean;
    noHighlight?: boolean; // Nova propriedade para indicar que não deve haver holofote
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
    
    // Initialized with null to satisfy TypeScript requirements in some environments
    const requestRef = useRef<number | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
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
        
        // Se o passo for configurado para não ter destaque, forçamos null no targetRect
        // Isso fará com que o card fique centralizado e o overlay cubra tudo
        if (step.noHighlight) {
            setTargetRect(null);
            return;
        }

        const element = document.getElementById(step.targetId);
        
        if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
                return;
            }
        }
        if (!element) {
             setTargetRect(null);
        }
    }, [steps, currentStepIndex]);

    const handleScrollResize = useCallback(() => {
        if (!isOpen) return;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        requestRef.current = requestAnimationFrame(() => {
            measurePosition();
        });
    }, [isOpen, measurePosition]);

    // Step Change Logic with Continuous Tracking
    useEffect(() => {
        if (!isOpen) return;

        // Cleanup previous frames
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        setIsTransitioning(true);
        const step = steps[currentStepIndex];

        if (onStepChange) {
            onStepChange(step);
        }

        // Se não tiver destaque, não precisamos rolar a tela, apenas medir (que retornará null)
        if (step.noHighlight) {
            measurePosition();
            setIsTransitioning(false);
            return;
        }

        // Increased delay to 60ms to ensure App.tsx setScale and layout reflow completes 
        // before we measure and scroll. Prevents layout thrashing/jumping.
        const timer = setTimeout(() => {
            const element = document.getElementById(step.targetId);
            const scrollElement = step.scrollTargetId ? document.getElementById(step.scrollTargetId) : element;
            const target = scrollElement || element;
            
            if (target) {
                // Logic to handle scroll
                const shouldDisableHorizontal = step.disableHorizontalScroll;

                if (shouldDisableHorizontal) {
                    // Try to find the specific viewport container first, or fallback to generic scroll parent
                    let scrollContainer: HTMLElement | null = document.querySelector('.viewport');
                    
                    if (!scrollContainer || !scrollContainer.contains(target)) {
                        let parent = target.parentElement;
                        scrollContainer = null;
                        while (parent) {
                            const style = window.getComputedStyle(parent);
                            if (['scroll', 'auto'].includes(style.overflowY) || ['scroll', 'auto'].includes(style.overflow)) {
                                scrollContainer = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }

                    if (scrollContainer) {
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const targetRect = target.getBoundingClientRect();
                        
                        // Calculate offset to center the element vertically
                        const elementTopRelativeToContainer = targetRect.top - containerRect.top;
                        const desiredTopRelative = (containerRect.height - targetRect.height) / 2;
                        const scrollOffset = elementTopRelativeToContainer - desiredTopRelative;

                        // EXPLICITLY set 'left' to current scrollLeft. 
                        // This forces the browser to lock the X-axis and prevents any automatic horizontal adjustment.
                        scrollContainer.scrollTo({
                            top: scrollContainer.scrollTop + scrollOffset,
                            left: scrollContainer.scrollLeft, 
                            behavior: 'smooth'
                        });
                    } else {
                        // Fallback: use scrollIntoView but with strict inline nearest
                        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                    }
                } else {
                    // Standard behavior for other steps
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
                
                // 2. Start a Tracking Loop
                const startTime = performance.now();
                
                const track = () => {
                    measurePosition();
                    // Track for 1.2 seconds to ensure scroll momentum is finished
                    if (performance.now() - startTime < 1200) {
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
        }, 60);

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
        const isTargetInBottomHalf = targetRect ? targetRect.top > window.innerHeight / 2 : false;
        tooltipStyle = {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            zIndex: 1002,
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
            width: '400px'
        };
    } else {
        // Centralizado se não houver targetRect
        tooltipStyle = {
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            position: 'fixed',
            width: '400px'
        };
        
        // Se for o passo de zoom sem highlight, empurramos o card um pouco para baixo para caber a animação
        if (step.noHighlight && step.targetId === 'app-header') {
            tooltipStyle.marginTop = '80px';
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[99999]">
            
            {/* Spotlight Overlay */}
            {targetRect ? (
                <div 
                    className="absolute border-2 border-white/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.75),inset_0_0_20px_rgba(0,0,0,0.3)] pointer-events-none will-change-[top,left,width,height]"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        zIndex: 1000,
                        // OPTIMIZATION: Only animate width and height. 
                        // We let the JS loop handle top/left updates instantly to match the scroll speed exactly.
                        // This prevents the "searching" or "rubber band" effect.
                        transition: 'width 0.4s ease-out, height 0.4s ease-out' 
                    }}
                >
                    <span className="absolute -top-2 -right-2 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-primary shadow-sm border border-white"></span>
                    </span>
                </div>
            ) : (
                <div 
                    className="absolute inset-0 transition-opacity duration-500 z-[1000]" 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
                />
            )}

            {/* PINCH ZOOM ANIMATION - DIAGONAL SPREAD (ROTATED) */}
            {step.targetId === 'app-header' && step.noHighlight && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[1002]" style={{ top: '-80px' }}>
                    <div 
                        className="relative w-48 h-24 flex items-center justify-center opacity-100" 
                        style={{ transform: 'rotate(-45deg)' }}
                    >
                        {/* Connecting Line (Grows from center) */}
                        <div 
                            className="absolute h-1 bg-white/50 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                animation: 'zoom-line-horizontal 2.5s infinite ease-out'
                            }}
                        />
                        
                        {/* Finger 1 (Left - Moves Left/Bottom-Left) */}
                        <div 
                            className="absolute w-12 h-12 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm shadow-xl z-10"
                            style={{
                                animation: 'zoom-finger-left 2.5s infinite ease-out',
                                left: '50%',
                                top: '50%',
                                marginTop: '-24px', // half height to center
                                marginLeft: '-24px' // half width to center
                            }}
                        />
                        
                        {/* Finger 2 (Right - Moves Right/Top-Right) */}
                        <div 
                            className="absolute w-12 h-12 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm shadow-xl z-10"
                            style={{
                                animation: 'zoom-finger-right 2.5s infinite ease-out',
                                left: '50%',
                                top: '50%',
                                marginTop: '-24px', // half height to center
                                marginLeft: '-24px' // half width to center
                            }}
                        />
                    </div>
                </div>
            )}


            {/* Tooltip Card */}
            <div 
                className="bg-white dark:bg-gray-800 text-slate-800 dark:text-white p-6 rounded-2xl shadow-2xl transition-all duration-500 ease-out flex flex-col gap-4 border border-gray-200 dark:border-gray-700 z-[1001]"
                style={tooltipStyle}
            >
                <div>
                    <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-xl text-primary">{step.title}</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {currentStepIndex + 1} / {steps.length}
                            </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                        {step.content}
                    </p>
                    {/* Exibe aviso apenas se NÃO estivermos no modo "sem highlight" (pois no sem highlight é intencional não ter foco) */}
                    {!targetRect && !isTransitioning && !step.noHighlight && (
                        <p className="text-xs text-orange mt-2 italic">
                            (Elemento não visível no momento)
                        </p>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <button 
                        onClick={onClose}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

            {/* Styles for the custom pinch animation */}
            <style>{`
                @keyframes zoom-line-horizontal {
                    0% { width: 0px; opacity: 0; }
                    15% { width: 0px; opacity: 1; }
                    60% { width: 100px; opacity: 1; }
                    80% { width: 100px; opacity: 0; }
                    100% { width: 100px; opacity: 0; }
                }
                @keyframes zoom-finger-left {
                    0% { transform: translateX(-10px); opacity: 0; }
                    15% { transform: translateX(-10px); opacity: 1; }
                    60% { transform: translateX(-60px); opacity: 1; }
                    80% { transform: translateX(-60px); opacity: 0; }
                    100% { transform: translateX(-60px); opacity: 0; }
                }
                @keyframes zoom-finger-right {
                    0% { transform: translateX(10px); opacity: 0; }
                    15% { transform: translateX(10px); opacity: 1; }
                    60% { transform: translateX(60px); opacity: 1; }
                    80% { transform: translateX(60px); opacity: 0; }
                    100% { transform: translateX(60px); opacity: 0; }
                }
            `}</style>
        </div>,
        document.body
    );
};

function getTooltipPosition(rect: DOMRect, scale: number, preferredPosition?: 'top' | 'bottom' | 'left' | 'right') {
    const margin = 20 * scale; 
    const baseWidth = 400; 
    const baseHeight = 300; 

    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;

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

export default React.memo(InteractiveTutorial);
