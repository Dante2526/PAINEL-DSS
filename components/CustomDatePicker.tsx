import React, { useState, useRef, useEffect, useMemo } from 'react';

interface CustomDatePickerProps {
    selectedDate: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    maxDate?: string; // YYYY-MM-DD
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type DayData = {
    day: number;
    dateString: string;
    isCurrentMonth: boolean;
    isDisabled: boolean;
    isToday: boolean;
    isSelected: boolean;
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange, maxDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Data "alvo" para navegação dos meses do calendário (inicia na selecionada ou hoje)
    const initialViewDate = selectedDate 
        ? new Date(selectedDate + 'T12:00:00') 
        : new Date();
    
    const [viewDate, setViewDate] = useState(initialViewDate);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fecha o modal ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Reseta a data de visualização quando o pop up abre se o usuário mudou prop "selectedDate"
    useEffect(() => {
        if (isOpen && selectedDate) {
            setViewDate(new Date(selectedDate + 'T12:00:00'));
        }
    }, [isOpen, selectedDate]);

    // Lógica para preencher a tabela de dias do calendário
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0-6 (Dom-Sab)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Pega dias do mês anterior para completar a primeira linha
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        const days: DayData[] = [];
        
        // Preencher o início (mês passado)
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
            const pd = new Date(year, month - 1, prevDay);
            const ds = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}-${String(pd.getDate()).padStart(2, '0')}`;
            
            days.push({
                day: prevDay,
                dateString: ds,
                isCurrentMonth: false,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr,
                isSelected: ds === selectedDate
            });
        }
        
        // Mês atual
        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateString: ds,
                isCurrentMonth: true,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr,
                isSelected: ds === selectedDate
            });
        }
        
        // Preencher o final (próximo mês)
        const totalCells = Math.ceil(days.length / 7) * 7;
        const remainingCells = totalCells - days.length;
        
        for (let i = 1; i <= remainingCells; i++) {
            const nd = new Date(year, month + 1, i);
            const ds = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
            days.push({
                day: i,
                dateString: ds,
                isCurrentMonth: false,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr,
                isSelected: ds === selectedDate
            });
        }
        
        return days;
    }, [viewDate, selectedDate, maxDate]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleSelectDay = (dateString: string, disabled: boolean) => {
        if (disabled) return;
        onChange(dateString);
        setIsOpen(false);
    };

    const formatDatePreview = (ds: string) => {
        if (!ds) return "Selecione uma data...";
        const d = new Date(ds + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Input Button Viewer */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 flex items-center justify-between text-left border-2 rounded-xl transition-all duration-200 outline-none
                ${isOpen 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-4 ring-indigo-500/10' 
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
                }
                `}
            >
                <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Data de Consulta
                    </span>
                    <span className={`text-base font-bold ${selectedDate ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatDatePreview(selectedDate)}
                    </span>
                </div>
                <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </button>

            {/* Pop-up Dashboard Calendar */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-3 p-4 md:p-5 bg-white dark:bg-[#1A1C23] border border-gray-100 dark:border-gray-700/50 rounded-2xl shadow-2xl origin-top animate-fade-in-down ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-xl">
                    
                    {/* Header: Meses e Setas */}
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="font-extrabold text-lg md:text-xl text-gray-800 dark:text-gray-100 capitalize flex flex-col">
                            {MONTHS[viewDate.getMonth()]}
                            <span className="text-xs text-indigo-500 font-black tracking-widest">{viewDate.getFullYear()}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrevMonth}
                                className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 dark:bg-gray-800/80 dark:hover:bg-indigo-900/40 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button 
                                onClick={handleNextMonth}
                                className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 dark:bg-gray-800/80 dark:hover:bg-indigo-900/40 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Semana Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="text-center text-[10px] md:text-xs font-black tracking-widest text-gray-400 uppercase pb-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Dias Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {calendarDays.map((d, idx) => {
                            // Definir estilos complexos para cada estado do botão
                            let baseStyle = "h-10 md:h-12 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 outline-none ";
                            
                            if (d.isDisabled) {
                                baseStyle += "text-gray-300 dark:text-gray-600 bg-transparent cursor-not-allowed ";
                            } else if (d.isSelected) {
                                baseStyle += "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 z-10 ";
                            } else if (!d.isCurrentMonth) {
                                baseStyle += "text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer ";
                            } else {
                                baseStyle += "text-gray-700 dark:text-gray-200 bg-gray-50/50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800/30 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 cursor-pointer ";
                            }
                            
                            // Highlight do Dia Atual (Hoje) usando border, se não tiver selecionado
                            if (d.isToday && !d.isSelected) {
                                baseStyle += "ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500 text-indigo-700 dark:text-indigo-400 ";
                            }

                            return (
                                <button
                                    key={`${d.dateString}-${idx}`}
                                    disabled={d.isDisabled}
                                    onClick={() => handleSelectDay(d.dateString, d.isDisabled)}
                                    type="button"
                                    className={baseStyle}
                                >
                                    {d.day}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Botão Atalho Hover Base */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                handleSelectDay(todayStr, maxDate ? todayStr > maxDate : false);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                            Selecionar Hoje
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
