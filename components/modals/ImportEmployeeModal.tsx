import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../Modal';
import { ExchangeIcon } from '../icons';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { formatTimestamp } from '../../services/employeeService';
import { TurmaType, ALL_TURMAS, TURMA_DISPLAY_NAMES, getTurmaCollectionName } from '../../utils/turmaUtils';
import { Employee } from '../../types';

export const ImportEmployeeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onImport: (employeeId: string, sourceTurma: TurmaType) => void;
    currentTurma: TurmaType;
    scale: number;
    showNotification: (msg: string, type: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onBack, onImport, currentTurma, scale, showNotification }) => {
    const [sourceTurma, setSourceTurma] = useState<TurmaType | ''>('');
    const [sourceEmployees, setSourceEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTurmaDropdownOpen, setIsTurmaDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const turmaDropdownRef = useRef<HTMLDivElement>(null);


    const turmas: TurmaType[] = [...ALL_TURMAS];
    const availableTurmas = turmas.filter(t => t !== currentTurma);

    useEffect(() => {
        if (isOpen) {
            setSourceTurma('');
            setSourceEmployees([]);
            setSelectedEmployeeId('');
            setLoadingEmployees(false);
            setSearchTerm('');
            setIsDropdownOpen(false);
            setIsTurmaDropdownOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (turmaDropdownRef.current && !turmaDropdownRef.current.contains(event.target as Node)) {
                setIsTurmaDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!sourceTurma) return;
            if (!db) {
                showNotification("A conexão com o banco de dados não está disponível.", "error");
                return;
            }

            setLoadingEmployees(true);
            setSelectedEmployeeId('');
            setSourceEmployees([]);
            setSearchTerm('');

            try {
                const collectionName = getTurmaCollectionName(sourceTurma as TurmaType);
                const q = query(collection(db, collectionName), orderBy("name", "asc"));
                const querySnapshot = await getDocs(q);

                const employeesData: Employee[] = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        matricula: data.matricula,
                        assDss: data.assDss,
                        bem: data.bem,
                        mal: data.mal,
                        ausente: data.ausente !== undefined ? data.ausente : (data.absent || false),
                        time: data.time ? formatTimestamp(data.time as Timestamp) : null,
                        turno: data.turno || '7H',
                    };
                });
                setSourceEmployees(employeesData);
            } catch (error) {
                console.error("Error fetching source employees:", error);
                showNotification('Erro ao buscar colaboradores da turma de origem.', 'error');
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, [sourceTurma, showNotification]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return sourceEmployees;
        return sourceEmployees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.matricula.includes(searchTerm)
        );
    }, [searchTerm, sourceEmployees]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (selectedEmployeeId) {
            setSelectedEmployeeId(''); // Clear selection if user starts typing again
        }
    };

    const handleSelectEmployee = (emp: Employee) => {
        setSelectedEmployeeId(emp.id);
        setSearchTerm(`${emp.name} (Mat: ${emp.matricula})`);
        setIsDropdownOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeId && sourceTurma) {
            onImport(selectedEmployeeId, sourceTurma as TurmaType);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={onBack} title="" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="flex justify-center mb-4 mt-2">
                    <div className="relative group">
                        {/* Efeito Glow / Sombra pulsante para design premium */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur-md opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                        {/* Contêiner principal com gradiente azul/teal */}
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300">
                            <ExchangeIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Título reposicionado abaixo do ícone */}
                <h2 className="text-lg md:text-xl font-bold uppercase text-light-text dark:text-dark-text text-center mb-6 mt-1 shrink-0">
                    Importar Colaborador
                </h2>

                <div ref={turmaDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Turma de Origem</label>
                    <div
                        onClick={() => setIsTurmaDropdownOpen(!isTurmaDropdownOpen)}
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white flex items-center justify-between cursor-pointer select-none transition-all duration-200"
                    >
                        <span className={`font-semibold ${sourceTurma ? 'text-light-text dark:text-white' : 'text-gray-400'}`}>
                            {sourceTurma ? `Turma ${TURMA_DISPLAY_NAMES[sourceTurma]}` : 'Selecione uma turma'}
                        </span>
                        <div className={`text-gray-400 transition-transform duration-200 ${isTurmaDropdownOpen ? 'transform rotate-180' : ''}`}>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    {isTurmaDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-light-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {availableTurmas.map(turma => (
                                <div
                                    key={turma}
                                    onClick={() => {
                                        setSourceTurma(turma);
                                        setIsTurmaDropdownOpen(false);
                                    }}
                                    className={`p-3.5 hover:bg-light-bg dark:hover:bg-dark-hover cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 font-semibold text-light-text dark:text-gray-200 transition-colors duration-150 flex items-center justify-between ${sourceTurma === turma ? 'bg-primary/5 text-primary dark:text-indigo-400' : ''}`}
                                >
                                    <span>Turma {TURMA_DISPLAY_NAMES[turma]}</span>
                                    {sourceTurma === turma && (
                                        <svg className="w-4 h-4 text-primary dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div ref={dropdownRef} className="relative">
                    <label htmlFor="employee-search" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Colaborador</label>
                    <div className="relative">
                        <input
                            id="employee-search"
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder={
                                loadingEmployees ? "Carregando..." :
                                    (sourceTurma ? "Pesquisar por nome ou matrícula..." : "Selecione uma turma primeiro")
                            }
                            className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary dark:text-white transition-all duration-200"
                            disabled={!sourceTurma || loadingEmployees}
                        />
                        {loadingEmployees && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-primary-light border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    {isDropdownOpen && sourceEmployees.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-light-card dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleSelectEmployee(emp)}
                                        className="p-3.5 hover:bg-light-bg dark:hover:bg-dark-hover cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors duration-150"
                                    >
                                        <p className="font-semibold text-light-text dark:text-white">{emp.name}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">Matrícula: {emp.matricula}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center font-medium text-light-text-secondary dark:text-dark-text-secondary">Nenhum colaborador encontrado.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={!selectedEmployeeId} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-green-600/10 active:scale-[0.98] transform uppercase text-sm">
                        IMPORTAR PARA TURMA {TURMA_DISPLAY_NAMES[currentTurma]}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ImportEmployeeModal;
