
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveTutorialProps {
    isOpen: boolean;
    onClose: () => void;
    steps: TutorialStep[];
    scale?: number; // Added scale prop
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ isOpen, onClose, steps, scale = 1 }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    
    // Prevent scrolling when tutorial is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const updateTargetPosition = useCallback(() => {
        if (!isOpen) return;
        
        // Small delay to ensure DOM is ready and any layout shifts/scrolls have initiated
        const timer = setTimeout(() => {
            const step = steps[currentStepIndex];
            const element = document.getElementById(step.targetId);
            
            if (element) {
                // Scroll element into view smoothly
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                
                const rect = element.getBoundingClientRect();
                // Check if element has valid dimensions
                if (rect.width > 0 && rect.height > 0) {
                    setTargetRect(rect);
                } else {
                    console.warn(`Tutorial: Element ${step.targetId} has 0 dimensions.`);
                    setTargetRect(null);
                }
            } else {
                console.warn(`Tutorial: Element ${step.targetId} not found.`);
                setTargetRect(null); 
            }
        }, 150); // 150ms delay for robustness

        return () => clearTimeout(timer);
    }, [isOpen, currentStepIndex, steps]);

    useEffect(() => {
        updateTargetPosition();
        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition, true); // true for capture phase

        return () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition, true);
        };
    }, [updateTargetPosition]);

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

    // Calculate Tooltip Position with Scale
    let tooltipStyle: React.CSSProperties = {};
    
    if (targetRect) {
        const pos = getTooltipPosition(targetRect, scale, step.position);
        tooltipStyle = {
            top: pos.top,
            left: pos.left,
            position: 'absolute',
            transform: `scale(${scale})`,
            transformOrigin: 'top left', // Important so the calculations in getTooltipPosition match the visual anchor
            width: '400px' // Base width before scaling
        };
    } else {
        // Fallback: Center of screen
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
            
            {/* 1. Dark Background / Highlight Logic */}
            {targetRect ? (
                /* Box Shadow Trick for "Hole" effect */
                <div 
                    className="absolute transition-all duration-500 ease-in-out border-2 border-white rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        zIndex: 1000
                    }}
                >
                    {/* Pulsing indicator */}
                    <span className="absolute -top-2 -right-2 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-primary"></span>
                    </span>
                </div>
            ) : (
                /* Fallback Full Dark Overlay if target not found */
                <div className="absolute inset-0 bg-black/80 transition-opacity duration-500 z-[1000]" />
            )}

            {/* 2. Tooltip Card */}
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
                    {!targetRect && (
                        <p className="text-xs text-orange mt-2 italic">
                            (Elemento destacado não visível no momento)
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

// Helper to calculate tooltip position to ensure it stays on screen
function getTooltipPosition(rect: DOMRect, scale: number, preferredPosition?: 'top' | 'bottom' | 'left' | 'right') {
    const margin = 20 * scale; // Scale the margin too
    // Base dimensions
    const baseWidth = 400; 
    const baseHeight = 300; // estimated max height

    // Effective dimensions on screen after scaling
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    // Strategy: Try to place it, if it overflows, flip it.
    // Calculations return the Top-Left coordinate for the *Scaled Box*

    // Default: Bottom Center
    if (rect.bottom + scaledHeight + margin < windowHeight) {
        top = rect.bottom + margin;
        left = rect.left + (rect.width / 2) - (scaledWidth / 2);
    } 
    // Fallback: Top Center
    else if (rect.top - scaledHeight - margin > 0) {
        top = rect.top - scaledHeight - margin;
        left = rect.left + (rect.width / 2) - (scaledWidth / 2);
    }
    // Fallback: Right
    else if (rect.right + scaledWidth + margin < windowWidth) {
        top = rect.top;
        left = rect.right + margin;
    }
    // Fallback: Left
    else {
        top = rect.top;
        left = rect.left - scaledWidth - margin;
    }
    
    // Clamp horizontal
    // We must ensure the SCALED box fits.
    if (left < margin) left = margin;
    if (left + scaledWidth > windowWidth - margin) left = windowWidth - scaledWidth - margin;
    
    // Clamp vertical
    if (top < margin) top = margin;
    if (top + scaledHeight > windowHeight - margin) top = windowHeight - scaledHeight - margin;

    return { top, left };
}

export default InteractiveTutorial;
