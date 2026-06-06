import React, { useState, useEffect, useCallback } from 'react';
import CustomDatePicker from './CustomDatePicker';
import { CheckIcon, XIcon, TrashIcon } from './icons';

interface CustomDateTimePickerProps {
    initialDateValue: string; // ISO string "YYYY-MM-DDTHH:mm"
    onSave: (dateStr: string) => void;
    onCancel: () => void;
    onClear: () => void;
}

const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ initialDateValue, onSave, onCancel, onClear }) => {
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('12:00');
    const [openDropdown, setOpenDropdown] = useState<'hours' | 'minutes' | null>(null);

    useEffect(() => {
        if (initialDateValue) {
            const [d, t] = initialDateValue.split('T');
            setDatePart(d);
            if (t) setTimePart(t.substring(0, 5));
        } else {
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
            const [d, t] = localISOTime.split('T');
            setDatePart(d);
            setTimePart(t.substring(0, 5));
        }
    }, [initialDateValue]);

    const handleDateChange = useCallback((newDate: string) => {
        setDatePart(newDate);
    }, []);

    const handleHourChange = (h: string) => {
        const m = timePart.split(':')[1] || '00';
        setTimePart(`${h}:${m}`);
        setOpenDropdown(null);
    };

    const handleMinuteChange = (m: string) => {
        const h = timePart.split(':')[0] || '12';
        setTimePart(`${h}:${m}`);
        setOpenDropdown(null);
    };

    const handleSaveClick = () => {
        onSave(`${datePart}T${timePart}`);
    };

    return (
        <div className="flex flex-col gap-4 w-full shrink-0">
            <CustomDatePicker 
                selectedDate={datePart} 
                onChange={handleDateChange} 
            />
            
            <div className="flex flex-wrap items-center gap-2 justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm relative">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-1">Hora</span>
                    
                    {/* Horas Custom Dropdown */}
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'hours' ? null : 'hours')}
                            className="bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer w-7 text-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1"
                        >
                            {timePart.split(':')[0] || '12'}
                        </button>
                        {openDropdown === 'hours' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-14 max-h-48 overflow-y-auto hide-scrollbar bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 flex flex-col py-1">
                                {hours.map(h => (
                                    <div 
                                        key={h} 
                                        onClick={() => handleHourChange(h)}
                                        className={`px-2 py-1.5 text-center text-sm font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/30 ${timePart.split(':')[0] === h ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <span className="text-gray-400 font-bold">:</span>
                    
                    {/* Minutos Custom Dropdown */}
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'minutes' ? null : 'minutes')}
                            className="bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer w-7 text-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1"
                        >
                            {timePart.split(':')[1] || '00'}
                        </button>
                        {openDropdown === 'minutes' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-14 max-h-48 overflow-y-auto hide-scrollbar bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 flex flex-col py-1">
                                {minutes.map(m => (
                                    <div 
                                        key={m} 
                                        onClick={() => handleMinuteChange(m)}
                                        className={`px-2 py-1.5 text-center text-sm font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/30 ${timePart.split(':')[1] === m ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Fechar dropdown se clicar fora */}
                    {openDropdown && (
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }}
                        ></div>
                    )}
                </div>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onClear} 
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 transition" 
                        title="Deixar Vazio"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onCancel} 
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 transition" 
                        title="Cancelar"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleSaveClick} 
                        className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition shadow-sm" 
                        title="Salvar"
                    >
                        <CheckIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomDateTimePicker;
