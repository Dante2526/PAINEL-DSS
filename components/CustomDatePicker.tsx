import React, { useState, useEffect, useMemo } from 'react';

interface CustomDatePickerProps {
    selectedDate: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    maxDate?: string; // YYYY-MM-DD
}

const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
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
    const today = new Date();
    
    const initialViewDate = selectedDate 
        ? new Date(selectedDate + 'T12:00:00') 
        : today;
    
    const [viewDate, setViewDate] = useState(initialViewDate);

    useEffect(() => {
        if (selectedDate) {
            setViewDate(new Date(selectedDate + 'T12:00:00'));
        }
    }, [selectedDate]);

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        const days: DayData[] = [];
        
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
            const pd = new Date(year, month - 1, prevDay);
            const ds = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}-${String(pd.getDate()).padStart(2, '0')}`;
            days.push({
                day: prevDay, dateString: ds, isCurrentMonth: false,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr, isSelected: ds === selectedDate
            });
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i, dateString: ds, isCurrentMonth: true,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr, isSelected: ds === selectedDate
            });
        }
        
        const totalCells = Math.ceil(days.length / 7) * 7;
        const remainingCells = totalCells - days.length;
        
        for (let i = 1; i <= remainingCells; i++) {
            const nd = new Date(year, month + 1, i);
            const ds = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
            days.push({
                day: i, dateString: ds, isCurrentMonth: false,
                isDisabled: maxDate ? ds > maxDate : false,
                isToday: ds === todayStr, isSelected: ds === selectedDate
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
    };

    return (
        <div className="w-full">
            {/* Calendário sempre visível, embutido inline */}
            <div className="w-full p-3 bg-white dark:bg-[#1A1C23] border border-gray-100 dark:border-gray-700/50 rounded-2xl">
                
                {/* Header: Mês/Ano + Setas */}
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="font-extrabold text-base text-gray-800 dark:text-gray-100 capitalize flex flex-col">
                        {MONTHS[viewDate.getMonth()]}
                        <span className="text-[10px] text-indigo-500 font-black tracking-widest">{viewDate.getFullYear()}</span>
                    </div>
                    <div className="flex gap-1.5">
                        <button 
                            onClick={handlePrevMonth}
                            type="button"
                            className="p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 dark:bg-gray-800/80 dark:hover:bg-indigo-900/40 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button 
                            onClick={handleNextMonth}
                            type="button"
                            className="p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 dark:bg-gray-800/80 dark:hover:bg-indigo-900/40 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Dias da Semana */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="text-center text-[9px] font-black tracking-wider text-gray-400 uppercase py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid de Dias (compacto) */}
                <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((d, idx) => {
                        let baseStyle = "h-8 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 outline-none ";
                        
                        if (d.isDisabled) {
                            baseStyle += "text-gray-300 dark:text-gray-600 bg-transparent cursor-not-allowed ";
                        } else if (d.isSelected) {
                            baseStyle += "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105 z-10 ";
                        } else if (!d.isCurrentMonth) {
                            baseStyle += "text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer ";
                        } else {
                            baseStyle += "text-gray-700 dark:text-gray-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 cursor-pointer ";
                        }
                        
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
                
                {/* Atalho "Hoje" */}
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            handleSelectDay(todayStr, maxDate ? todayStr > maxDate : false);
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer uppercase tracking-wider"
                    >
                        ● Selecionar Hoje
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CustomDatePicker;
