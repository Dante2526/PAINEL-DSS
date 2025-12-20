
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    scrollTargetId?: string;
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

        // Removed delay almost entirely to start tracking immediately with the scroll
        const timer = setTimeout(() => {
            const element = document.getElementById(step.targetId);
            const scrollElement = step.scrollTargetId ? document.getElementById(step.scrollTargetId) : element;
            
            if (element) {
                // 1. Trigger Smooth Scroll
                // Use scrollTargetId if available to center the view on a container (e.g. the card)
                // while keeping the spotlight on the specific target (e.g. the button).
                if (scrollElement) {
                    scrollElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                } else {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
                
                // 2. Start a Tracking Loop
                // Since we removed CSS transition on top/left, this loop will make the spotlight
                // stick perfectly to the element as it moves across the screen.
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
        }, 10);

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
        tooltipStyle = {
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            position: 'fixed',
            width: '400px'
        };
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
                    {!targetRect && !isTransitioning && (
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

export default InteractiveTutorial;
