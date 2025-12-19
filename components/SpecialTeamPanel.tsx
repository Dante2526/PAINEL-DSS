
import React, { useMemo } from 'react';
import { Employee, StatusType } from '../types';
import EmployeeCard from './EmployeeCard';
import { SubjectIcon, UserIcon } from './icons';

interface SpecialTeamPanelProps {
    specialTeam: Employee[];
    onStatusChange: (id: string, type: StatusType) => void;
    onToggleSpecialTeam: (id: string) => void;
    togglingSpecialTeamId: string | null;
    isAdmin: boolean;
    onDeleteUser: (id: string) => void;
    // New props for controlled inputs
    subject: string;
    matricula: string;
    onSubjectChange: (value: string) => void;
    onMatriculaChange: (value: string) => void;
    onRegister: () => void;
    onTimeChange?: (id: string, newDate: Date) => void;
    employees: Employee[]; // Add access to full list for lookup
}

const SpecialTeamPanel: React.FC<SpecialTeamPanelProps> = ({ 
    specialTeam, 
    onStatusChange, 
    onToggleSpecialTeam, 
    togglingSpecialTeamId, 
    isAdmin, 
    onDeleteUser,
    subject,
    matricula,
    onSubjectChange,
    onMatriculaChange,
    onRegister,
    onTimeChange,
    employees
}) => {
    const handleMatriculaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onMatriculaChange(e.target.value.replace(/[^0-9]/g, ''));
    };
    
    // Find name based on matricula from full list
    const foundName = useMemo(() => {
        if (!matricula) return '';
        const employee = employees.find(e => e.matricula === matricula);
        return employee ? employee.name : '';
    }, [matricula, employees]);

    const firstEmployee = specialTeam[0];
    const remainingEmployees = specialTeam.slice(1);

    return (
        <div id="tutorial-special-panel" className="w-[870px] flex-shrink-0 bg-light-card dark:bg-dark-card rounded-3xl p-8 shadow-lg h-fit">
            <div id="tutorial-special-demo-area">
                <div id="tutorial-special-header">
                    <h2 className="text-2xl font-bold text-center text-light-text dark:text-dark-text pb-4 mb-6 border-b-2 border-gray-200 dark:border-gray-700">TURNO 6H</h2>
                    
                    <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <SubjectIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={subject}
                                onChange={(e) => onSubjectChange(e.target.value)}
                                placeholder="Assunto do DSS" 
                                className="w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition uppercase text-2xl"
                                autoCapitalize="characters"
                            />
                        </div>
                        {/* Modified Matricula Field with Split View */}
                        <div className="relative flex items-stretch">
                            <div className="relative w-[40%]">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={matricula}
                                    onChange={handleMatriculaChange}
                                    placeholder="Matrícula" 
                                    className="w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 border-r-0 border-gray-200 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-2xl"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            </div>
                            <div className="relative w-[60%]">
                                <input 
                                    type="text" 
                                    value={foundName} 
                                    readOnly
                                    placeholder={matricula ? "Colaborador não encontrado" : "Nome do Colaborador"}
                                    className="w-full px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium border-2 border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg outline-none pointer-events-none truncate text-2xl"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onRegister}
                        className="w-full py-4 text-center font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-8 text-2xl"
                    >
                        REGISTRAR
                    </button>
                </div>
                
                {firstEmployee && (
                    <EmployeeCard 
                        key={firstEmployee.id} 
                        employee={firstEmployee}
                        onStatusChange={onStatusChange}
                        onToggleSpecialTeam={onToggleSpecialTeam}
                        isTogglingSpecialTeam={togglingSpecialTeamId === firstEmployee.id}
                        isAdmin={isAdmin}
                        onDelete={onDeleteUser}
                        onTimeChange={onTimeChange}
                        specialTurnBtnId="tutorial-return-turn-btn"
                    />
                )}
            </div>
            
            {remainingEmployees.length > 0 && (
                <div className="space-y-6 mt-6">
                    {remainingEmployees.map(employee => (
                        <EmployeeCard 
                            key={employee.id} 
                            employee={employee}
                            onStatusChange={onStatusChange}
                            onToggleSpecialTeam={onToggleSpecialTeam}
                            isTogglingSpecialTeam={togglingSpecialTeamId === employee.id}
                            isAdmin={isAdmin}
                            onDelete={onDeleteUser}
                            onTimeChange={onTimeChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SpecialTeamPanel;
