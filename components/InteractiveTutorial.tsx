
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    onStepChange?: (step: TutorialStep) => void; // New prop for zoom control
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ isOpen, onClose, steps, scale = 1, onStepChange }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    // New state to track if we are currently moving between steps
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Use refs to track animation frames and avoid state staleness in callbacks
    const requestRef = useRef<number>();
    
    // Prevent scrolling when tutorial is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Check for mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Function to calculate and set rect without scrolling
    const measurePosition = useCallback(() => {
        const step = steps[currentStepIndex];
        const element = document.getElementById(step.targetId);
        
        if (element) {
            const rect = element.getBoundingClientRect();
            // Only update if dimensions are valid and different (simple check)
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
                return;
            }
        }
        // If element missing or hidden
        if (!element) {
             setTargetRect(null);
        }
    }, [steps, currentStepIndex]);

    // Handle scroll/resize updates using rAF for performance
    const handleScrollResize = useCallback(() => {
        if (!isOpen) return;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        requestRef.current = requestAnimationFrame(() => {
            measurePosition();
        });
    }, [isOpen, measurePosition]);

    // Initial Step Change Logic (includes scrolling)
    useEffect(() => {
        if (!isOpen) return;

        // 1. Clear any pending updates
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        // Hide spotlight and indicate transition started
        setTargetRect(null);
        setIsTransitioning(true);

        const step = steps[currentStepIndex];

        // Notify parent to adjust zoom/layout BEFORE we scroll/measure
        if (onStepChange) {
            onStepChange(step);
        }

        // 2. Delay to allow React to render any DOM changes (e.g. modals opening) 
        // and allow Parent Zoom to settle. Increased to 300ms for smoother zoom sync.
        const timer = setTimeout(() => {
            const element = document.getElementById(step.targetId);
            
            if (element) {
                // 3. Scroll instantly to position to ensure subsequent measurement is correct.
                element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                
                // 4. Measure immediately after scroll
                measurePosition();
            } else {
                setTargetRect(null);
            }
            // Transition finished, allow UI updates
            setIsTransitioning(false);
        }, 300);

        return () => {
            clearTimeout(timer);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isOpen, currentStepIndex, steps, measurePosition, onStepChange]);

    // Attach scroll/resize listeners
    useEffect(() => {
        if (!isOpen) return;
        
        window.addEventListener('resize', handleScrollResize);
        window.addEventListener('scroll', handleScrollResize, true); // capture: true for internal scrolling

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

    // Calculate Tooltip Position
    let tooltipStyle: React.CSSProperties = {};
    
    if (isMobile) {
        // MOBILE LOGIC: Dock to bottom or top based on target position to avoid covering it
        const isTargetInBottomHalf = targetRect ? targetRect.top > window.innerHeight / 2 : false;
        
        tooltipStyle = {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            zIndex: 1002,
            // If target is in bottom half, show tooltip at top. Otherwise bottom.
            bottom: isTargetInBottomHalf ? undefined : '20px',
            top: isTargetInBottomHalf ? '20px' : undefined,
        };
    } else if (targetRect) {
        // DESKTOP LOGIC: Follow the target
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
                /* Box Shadow Trick for "Hole" effect. 
                   RGBA(0,0,0,0.75) matches the fallback opacity below exactly. */
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
                /* Fallback Full Dark Overlay if target not found or during transition.
                   Hardcoded RGBA to match shadow exactly, preventing flicker. */
                <div 
                    className="absolute inset-0 transition-opacity duration-500 z-[1000]" 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
                />
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
                    {/* Only show "missing element" text if we are NOT transitioning and still have no rect */}
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

// Helper to calculate tooltip position to ensure it stays on screen (Desktop only)
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
    
    // Clamp horizontal to prevent negative left or overflow
    if (left < margin) left = margin;
    if (left + scaledWidth > windowWidth - margin) left = windowWidth - scaledWidth - margin;
    
    // Clamp vertical
    if (top < margin) top = margin;
    if (top + scaledHeight > windowHeight - margin) top = windowHeight - scaledHeight - margin;

    return { top, left };
}

export default InteractiveTutorial;
