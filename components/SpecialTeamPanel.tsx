
import React, { useMemo } from 'react';
import { Employee, Administrator, StatusType } from '../types';
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
    onRegister: (subject: string, matricula: string) => void;
    onTimeChange?: (id: string, newDate: Date | null) => void;
    onMatriculaUpdate?: (id: string, newMatricula: string) => void; // Added prop
    employeesForLookup: (Pick<Employee, 'name' | 'matricula'>)[];
    administrators: Administrator[]; // Access to admin list for lookup
    turma: string | null;
    dbName?: string;
}

const SpecialTeamPanelComponent: React.FC<SpecialTeamPanelProps> = ({
    specialTeam,
    onStatusChange,
    onToggleSpecialTeam,
    togglingSpecialTeamId,
    isAdmin,
    onDeleteUser,
    subject,
    matricula,
    onRegister,
    onTimeChange,
    onMatriculaUpdate, // Destructure prop
    employeesForLookup,
    administrators,
    turma,
    dbName
}) => {
    const [localSubject, setLocalSubject] = React.useState(subject);
    const [localMatricula, setLocalMatricula] = React.useState(matricula);

    React.useEffect(() => {
        setLocalSubject(subject);
    }, [subject]);

    React.useEffect(() => {
        setLocalMatricula(matricula);
    }, [matricula]);
    const shiftLabel = React.useMemo(() => {
        return (turma === 'C' || turma === 'D') ? '18H' : '6H';
    }, [turma]);

    const mainShiftLabel = React.useMemo(() => {
        return (turma === 'C' || turma === 'D') ? '19H' : '7H';
    }, [turma]);
    const handleMatriculaChangeLocal = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMatricula(e.target.value.replace(/[^0-9]/g, ''));
    }, []);

    const isRegistered = subject && subject !== 'Não preenchido' && matricula && localSubject === subject && localMatricula === matricula;

    // Find name based on matricula from administrators list first, then all employees from all turmas
    const foundName = useMemo(() => {
        if (!localMatricula) return '';

        if (isRegistered && dbName) return dbName;

        // Prioritize administrators collection for manual registry
        const admin = administrators.find(a => a.matricula === localMatricula);
        if (admin) return admin.name;

        // Fallback to the global employee lookup list
        const employee = employeesForLookup.find(e => e.matricula === localMatricula);
        return employee ? employee.name : '';
    }, [localMatricula, employeesForLookup, administrators, isRegistered, dbName]);

    const firstEmployee = specialTeam[0];
    const remainingEmployees = specialTeam.slice(1);

    const isSubjectEmpty = !localSubject || localSubject === 'Não preenchido';
    const isMatriculaEmpty = !localMatricula;

    const subjectBorderClass = isSubjectEmpty
        ? "border-red-500/70 dark:border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] focus:ring-red-400 focus:border-red-400"
        : "border-gray-200 dark:border-gray-600 focus:ring-primary focus:border-primary";

    const matriculaBorderClass = isMatriculaEmpty
        ? "border-red-500/70 dark:border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] focus:ring-red-400 focus:border-red-400"
        : "border-gray-200 dark:border-gray-600 focus:ring-primary focus:border-primary";

    return (
        <div id="tutorial-special-panel" className="w-[870px] flex-shrink-0 bg-light-card dark:bg-dark-card rounded-3xl p-8 shadow-lg h-fit">
            <div id="tutorial-special-demo-area">
                <div id="tutorial-special-header">
                    <h2 className="text-2xl font-bold text-center text-light-text dark:text-dark-text pb-4 mb-6 border-b-2 border-gray-200 dark:border-gray-700">TURNO {shiftLabel}</h2>

                    {/* Indicator Card */}
                    {!isRegistered ? (
                        <div className="mb-4 mx-auto p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center justify-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-bold w-[50%] animate-pulse shadow-sm">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block animate-ping"></span>
                            <span>PENDENTE: PREENCHER TEMA E RESPONSÁVEL DO DSS</span>
                        </div>
                    ) : (
                        <div className="mb-4 mx-auto p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center justify-center gap-2.5 text-green-600 dark:text-green-400 text-xs font-bold w-[50%] shadow-sm">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
                            <span>DSS REGISTRADO COM SUCESSO</span>
                        </div>
                    )}

                    <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <SubjectIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={localSubject}
                                onChange={(e) => setLocalSubject(e.target.value)}
                                placeholder={`TEMA DSS - TURNO ${shiftLabel}`}
                                className={`w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 rounded-lg outline-none transition uppercase ${subjectBorderClass} focus:ring-2`}
                                autoCapitalize="characters"
                            />
                        </div>
                        {/* Modified Matricula Field with Split View - Width Reduced to 50% and Centered */}
                        <div className="relative flex items-stretch w-[50%] mx-auto">
                            <div className="relative w-[40%] focus-within:z-10">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={localMatricula}
                                    onChange={handleMatriculaChangeLocal}
                                    placeholder="Matrícula"
                                    className={`w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 rounded-l-lg outline-none transition ${matriculaBorderClass} ${!isMatriculaEmpty ? 'border-r border-r-gray-300 dark:border-r-gray-600' : ''} focus:ring-2`}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            </div>
                            <div className="relative w-[60%]">
                                <input
                                    type="text"
                                    value={foundName}
                                    readOnly
                                    placeholder={localMatricula ? "Não encontrado" : "Nome do Responsável"}
                                    className="w-full px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium border-2 border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg outline-none pointer-events-none truncate text-center"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onRegister(localSubject, localMatricula)}
                        className="w-[50%] mx-auto block py-4 text-center font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-8"
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
                        onMatriculaChange={onMatriculaUpdate} // Pass the function
                        specialTurnBtnId="tutorial-return-turn-btn"
                        shiftLabel={mainShiftLabel}
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
                            onMatriculaChange={onMatriculaUpdate} // Pass the function
                            shiftLabel={mainShiftLabel}
                            />
                    ))}
                </div>
            )}
        </div>
    );
};

const arePropsEqual = (prevProps: SpecialTeamPanelProps, nextProps: SpecialTeamPanelProps) => {
    // Check primitives and specific props that should trigger a re-render
    if (
        prevProps.togglingSpecialTeamId !== nextProps.togglingSpecialTeamId ||
        prevProps.isAdmin !== nextProps.isAdmin ||
        prevProps.subject !== nextProps.subject ||
        prevProps.matricula !== nextProps.matricula ||
        prevProps.turma !== nextProps.turma ||
        prevProps.onRegister !== nextProps.onRegister ||
        prevProps.dbName !== nextProps.dbName ||
        prevProps.administrators !== nextProps.administrators ||
        prevProps.employeesForLookup !== nextProps.employeesForLookup
    ) {
        return false;
    }

    // Deep reference check for the specialTeam array elements
    // If employees changed in App.tsx but none of the 6H employees changed their reference, we can skip rendering
    if (prevProps.specialTeam.length !== nextProps.specialTeam.length) return false;
    
    for (let i = 0; i < prevProps.specialTeam.length; i++) {
        const prevEmp = prevProps.specialTeam[i];
        const nextEmp = nextProps.specialTeam[i];
        if (
            prevEmp.id !== nextEmp.id ||
            prevEmp.ausente !== nextEmp.ausente ||
            prevEmp.assDss !== nextEmp.assDss ||
            prevEmp.bem !== nextEmp.bem ||
            prevEmp.mal !== nextEmp.mal ||
            prevEmp.name !== nextEmp.name ||
            prevEmp.matricula !== nextEmp.matricula ||
            prevEmp.time !== nextEmp.time ||
            prevEmp.turno !== nextEmp.turno
        ) {
            return false;
        }
    }
    
    return true;
};

export default React.memo(SpecialTeamPanelComponent, arePropsEqual);
