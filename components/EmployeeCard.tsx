

import React, { useState, memo } from 'react';
import { Employee, StatusType } from '../types';
import { ShiftIcon, AusenteIcon, TrashIcon, EditIcon, CheckIcon, XIcon } from './icons';
import { formatTimestamp } from '../services/employeeService';
import CustomDateTimePicker from './CustomDateTimePicker';
import Modal from './Modal';

interface EmployeeCardProps {
    employee: Employee;
    onStatusChange: (id: string, type: StatusType) => void;
    onToggleSpecialTeam: (id: string) => void;
    isTogglingSpecialTeam: boolean;
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onTimeChange?: (id: string, newDate: Date | null) => void;
    onMatriculaChange?: (id: string, newMatricula: string) => void; // New prop
    domId?: string; // Prop for tutorial targeting wrapper
    specialTurnBtnId?: string; // Prop specifically for the shift button tutorial
    hideShiftButton?: boolean; // Hide shift button for turmas without 6H
    shiftLabel?: string; // Dynamic label (6H or 18H)
    maskMatricula?: boolean; // Mascarar matrícula para o público
}

interface CheckboxItemProps {
    label: string;
    icon: string;
    checked: boolean;
    onClick: () => void;
    checkedClass: string;
    textColorClass: string;
    indicatorColorClass: string;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({ 
    label, 
    icon, 
    checked, 
    onClick,
    checkedClass,
    textColorClass,
    indicatorColorClass
}) => (
    <div
        className={`p-5 flex flex-col items-center gap-3 rounded-xl cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 border-2 ${
            checked 
                ? checkedClass 
                : 'bg-light-bg dark:bg-dark-bg border-transparent'
        }`}
        onClick={onClick}
    >
        <div className={`text-5xl transition-all duration-300 ${checked ? 'grayscale-0 opacity-100' : 'grayscale opacity-50'}`}>{icon}</div>
        <div className={`text-base font-bold text-center ${checked ? textColorClass : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{label}</div>
        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            checked 
                ? indicatorColorClass 
                : 'bg-white dark:bg-dark-bg-secondary border-gray-300 dark:border-gray-500'
        }`}>
            {checked && <span className="text-white font-bold text-lg">✓</span>}
        </div>
    </div>
);


const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
    employee, 
    onStatusChange, 
    onToggleSpecialTeam, 
    isTogglingSpecialTeam, 
    isAdmin, 
    onDelete, 
    onTimeChange, 
    onMatriculaChange, 
    domId,
    specialTurnBtnId,
    hideShiftButton,
    shiftLabel = '6H',
    maskMatricula = false
}) => {
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editTimeValue, setEditTimeValue] = useState<string>('');
    const [isEditingMatricula, setIsEditingMatricula] = useState(false);
    const [editMatriculaValue, setEditMatriculaValue] = useState(employee.matricula);

    const getMaskedMatricula = (mat: string) => {
        if (!mat) return "";
        if (mat.length <= 2) return '*'.repeat(mat.length);
        if (mat.length <= 4) return mat.slice(0, 2) + '*'.repeat(mat.length - 2);
        return mat.slice(0, 4) + '*'.repeat(mat.length - 4);
    };

    const displayMatricula = (maskMatricula && !isAdmin) 
        ? getMaskedMatricula(employee.matricula) 
        : employee.matricula;

    const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;

        const ripple = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;
        ripple.classList.add("ripple");

        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    };

    const handleToggleSpecialTeamClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isTogglingSpecialTeam) return;
        createRipple(e);
        onToggleSpecialTeam(employee.id);
    };

    const handleAbsentButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        onStatusChange(employee.id, 'ausente');
    };

    const getHeaderClass = () => {
        if (employee.bem) return 'bg-gradient-to-r from-success to-green-600';
        if (employee.mal) return 'bg-gradient-to-r from-danger to-red-600';
        if (employee.ausente) return 'bg-gradient-to-r from-warning to-amber-600';
        if (employee.assDss) return 'bg-gradient-to-r from-neutral to-gray-500';
        return 'bg-gradient-to-r from-primary to-primary-dark';
    };

    // --- Time Editing Handlers ---
    const handleTimeClick = () => {
        if (!isAdmin || !employee.time || !onTimeChange) return;

        // Parse format "DD/MM/YYYY HH:mm" to ISO for input
        try {
            const [datePart, timePart] = employee.time.split(' ');
            const [day, month, year] = datePart.split('/');
            // Create "YYYY-MM-DDTHH:mm"
            const isoString = `${year}-${month}-${day}T${timePart}`;
            setEditTimeValue(isoString);
            setIsEditingTime(true);
        } catch (e) {
            console.error("Failed to parse date for editing", e);
            // Fallback to current time if parse fails
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
            setEditTimeValue(localISOTime);
            setIsEditingTime(true);
        }
    };

    const handleTimeSaveNew = (dateStr: string) => {
        if (onTimeChange && dateStr) {
            const newDate = new Date(dateStr);
            if (!isNaN(newDate.getTime())) {
                onTimeChange(employee.id, newDate);
            }
        }
        setIsEditingTime(false);
    };

    const handleTimeClearNew = () => {
        if (onTimeChange) {
            onTimeChange(employee.id, null);
        }
        setIsEditingTime(false);
    };

    const handleTimeCancel = () => {
        setIsEditingTime(false);
    };

    // --- Matricula Editing Handlers ---
    const handleMatriculaSave = () => {
        if (onMatriculaChange && editMatriculaValue.trim() !== '' && editMatriculaValue !== employee.matricula) {
            onMatriculaChange(employee.id, editMatriculaValue);
        }
        setIsEditingMatricula(false);
    };

    const handleMatriculaCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditMatriculaValue(employee.matricula);
        setIsEditingMatricula(false);
    };

    return (
        <div id={domId} className="w-full bg-light-card dark:bg-dark-card rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden card-optimized">
            {/* Header compactado para ganhar espaço horizontal */}
            <div className={`px-5 py-4 flex items-center text-white ${getHeaderClass()}`}>
                <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0">👤</div>
                <div className="flex-grow min-w-0 mr-2">
                    <div className="text-xl font-bold truncate" title={employee.name}>{employee.name}</div>

                    {isEditingMatricula ? (
                        <div className="flex items-center gap-2 text-sm">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={editMatriculaValue}
                                onChange={(e) => setEditMatriculaValue(e.target.value.replace(/[^0-9]/g, ''))}
                                className="bg-white/20 rounded px-2 py-1 w-24 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-white/50"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleMatriculaSave(); if (e.key === 'Escape') handleMatriculaCancel(e as any); }}
                            />
                            <button
                                onClick={handleMatriculaSave}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-all shadow-md transform hover:scale-110"
                                aria-label="Salvar matrícula"
                            >
                                <CheckIcon className="w-5 h-5 text-success" />
                            </button>
                            <button
                                onClick={handleMatriculaCancel}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-all shadow-md transform hover:scale-110"
                                aria-label="Cancelar edição"
                            >
                                <XIcon className="w-5 h-5 text-danger" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`relative group text-sm opacity-90 truncate flex items-center gap-1.5 ${isAdmin ? 'cursor-pointer' : ''}`}
                            onClick={() => isAdmin && setIsEditingMatricula(true)}
                        >
                            <span>Matrícula: {displayMatricula}</span>
                            {isAdmin && (
                                <EditIcon className="w-3 h-3 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                    )}

                </div>
                {/* ID adicionado aqui condicionalmente para o tutorial focar nos botões deste cartão específico */}
                <div id={domId ? "tutorial-card-actions" : undefined} className="flex gap-2 flex-shrink-0">
                    {!hideShiftButton && (
                        <button
                            id={specialTurnBtnId}
                            onClick={handleToggleSpecialTeamClick}
                            disabled={isTogglingSpecialTeam}
                            className={`turno-button text-base ${employee.turno === '6H' ? 'active' : ''} ${isTogglingSpecialTeam ? 'loading' : ''}`}
                        >
                            <div className="default-state">
                                <ShiftIcon className="w-5 h-5" />
                                <span>TURNO {shiftLabel}</span>
                            </div>
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <span>SALVANDO</span>
                            </div>
                        </button>
                    )}
                    <button
                        onClick={handleAbsentButtonClick}
                        className={`absent-button text-base ${employee.ausente ? 'marked' : ''}`}
                    >
                        <AusenteIcon className="w-5 h-5" />
                        <span>AUSENTE</span>
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => onDelete(employee.id)}
                            className="delete-button text-base"
                            aria-label={`Deletar ${employee.name}`}
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span>DELETAR</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="p-7 grid grid-cols-3 gap-5">
                <CheckboxItem
                    label="ASS. DSS"
                    icon="📄"
                    checked={employee.assDss}
                    onClick={() => onStatusChange(employee.id, 'assDss')}
                    checkedClass="bg-gray-100 dark:bg-gray-800 border-neutral/60 dark:border-slate-400"
                    textColorClass="text-neutral dark:text-white"
                    indicatorColorClass="bg-neutral border-neutral"
                />
                <CheckboxItem
                    label="ESTOU BEM"
                    icon="🙂"
                    checked={employee.bem}
                    onClick={() => onStatusChange(employee.id, 'bem')}
                    checkedClass="bg-green-50 dark:bg-green-900/60 border-success dark:border-success"
                    textColorClass="text-success dark:text-white"
                    indicatorColorClass="bg-success border-success"
                />
                <CheckboxItem
                    label="ESTOU MAL"
                    icon="😟"
                    checked={employee.mal}
                    onClick={() => onStatusChange(employee.id, 'mal')}
                    checkedClass="bg-red-50 dark:bg-red-950/40 border-danger dark:border-danger"
                    textColorClass="text-danger dark:text-white"
                    indicatorColorClass="bg-danger border-danger"
                />
            </div>

            <div className="px-7 pb-7 text-center">
                {/* ID wrapper for tight tutorial focus on time */}
                <div id={domId ? "tutorial-card-time" : undefined} className="inline-block w-full max-w-[280px]">
                    <div
                        onClick={handleTimeClick}
                        className={`py-4 px-6 inline-block rounded-lg font-bold text-base min-w-[240px] relative group ${employee.time ? 'bg-gradient-to-r from-orange to-amber-500 text-white' : 'bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary'
                            } ${isAdmin && employee.time ? 'cursor-pointer hover:brightness-110' : ''}`}
                    >
                        {formatTimestamp(employee.time)}

                        {isAdmin && employee.time && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {isEditingTime && (
                        <Modal
                            isOpen={isEditingTime}
                            onClose={handleTimeCancel}
                            title="Editar Hora da Assinatura"
                        >
                            <CustomDateTimePicker 
                                initialDateValue={editTimeValue}
                                onSave={handleTimeSaveNew}
                                onCancel={handleTimeCancel}
                                onClear={handleTimeClearNew}
                            />
                        </Modal>
                    )}

                    <div className="mt-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                        Data / Hora da Assinatura
                    </div>
                </div>
            </div>
        </div>
    );
};

const arePropsEqual = (prevProps: EmployeeCardProps, nextProps: EmployeeCardProps) => {
    return (
        prevProps.isTogglingSpecialTeam === nextProps.isTogglingSpecialTeam &&
        prevProps.isAdmin === nextProps.isAdmin &&
        prevProps.hideShiftButton === nextProps.hideShiftButton &&
        prevProps.shiftLabel === nextProps.shiftLabel &&
        prevProps.domId === nextProps.domId &&
        prevProps.specialTurnBtnId === nextProps.specialTurnBtnId &&
        prevProps.onStatusChange === nextProps.onStatusChange &&
        prevProps.onToggleSpecialTeam === nextProps.onToggleSpecialTeam &&
        prevProps.onDelete === nextProps.onDelete &&
        prevProps.onTimeChange === nextProps.onTimeChange &&
        prevProps.onMatriculaChange === nextProps.onMatriculaChange &&
        prevProps.employee.id === nextProps.employee.id &&
        prevProps.employee.ausente === nextProps.employee.ausente &&
        prevProps.employee.assDss === nextProps.employee.assDss &&
        prevProps.employee.bem === nextProps.employee.bem &&
        prevProps.employee.mal === nextProps.employee.mal &&
        prevProps.employee.name === nextProps.employee.name &&
        prevProps.employee.matricula === nextProps.employee.matricula &&
        prevProps.employee.time === nextProps.employee.time &&
        prevProps.employee.turno === nextProps.employee.turno &&
        prevProps.maskMatricula === nextProps.maskMatricula
    );
};

export default memo(EmployeeCard, arePropsEqual);