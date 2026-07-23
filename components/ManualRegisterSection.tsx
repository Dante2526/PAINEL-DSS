import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SubjectIcon, UserIcon } from './icons';
import { getMainShiftLabel } from '../utils/turmaUtils';
import { Employee, Administrator } from '../types';

export const ManualRegisterSection: React.FC<{
    subject: string;
    matricula: string;
    onRegister: (subject: string, matricula: string) => void;
    employeesForLookup: (Pick<Employee, 'name' | 'matricula'>)[];
    administrators: Administrator[];
    turma: string | null;
    dbName?: string;
    isAdminOnlyTheme?: boolean;
    isAdmin?: boolean;
    onLockedClick?: () => void;
}> = React.memo(({ subject, matricula, onRegister, employeesForLookup, administrators, turma, dbName, isAdminOnlyTheme, isAdmin, onLockedClick }) => {
    const [localSubject, setLocalSubject] = useState(subject);
    const [localMatricula, setLocalMatricula] = useState(matricula);

    useEffect(() => {
        setLocalSubject(subject);
    }, [subject]);

    useEffect(() => {
        setLocalMatricula(matricula);
    }, [matricula]);
    const isRegistered = subject && subject !== 'Não preenchido' && matricula && localSubject === subject && localMatricula === matricula;

    const foundName = useMemo(() => {
        if (!localMatricula) return '';

        // If currently viewing the saved registration, use the name from the database
        // This is crucial for cross-turma registrations where the employee isn't in employeesForLookup
        if (isRegistered && dbName) return dbName;

        const admin = administrators.find(a => a.matricula === localMatricula);
        if (admin) return admin.name;

        const employee = employeesForLookup.find(e => e.matricula === localMatricula);
        return employee ? employee.name : '';
    }, [localMatricula, employeesForLookup, administrators, isRegistered, dbName]);

    const handleMatriculaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMatricula(e.target.value.replace(/[^0-9]/g, ''));
    }, []);

    const isSubjectEmpty = !localSubject || localSubject === 'Não preenchido';
    const isMatriculaEmpty = !localMatricula;

    const subjectBorderClass = isSubjectEmpty
        ? "border-red-500/70 dark:border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] focus:ring-red-400 focus:border-red-400"
        : "border-gray-200 dark:border-gray-600 focus:ring-primary focus:border-primary";

    const matriculaBorderClass = isMatriculaEmpty
        ? "border-red-500/70 dark:border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] focus:ring-red-400 focus:border-red-400"
        : "border-gray-200 dark:border-gray-600 focus:ring-primary focus:border-primary";

    const isLocked = isAdminOnlyTheme && !isAdmin;

    const handleLockedClick = (e: React.MouseEvent) => {
        if (isLocked) {
            e.preventDefault();
            e.stopPropagation();
            if (onLockedClick) onLockedClick();
        }
    };

    return (
        <div className="w-full bg-light-card dark:bg-dark-card rounded-3xl p-6 shadow-lg mb-8 shrink-0">
            {/* Status indicator card */}
            {!isRegistered ? (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-bold w-fit animate-pulse shadow-sm">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block animate-ping"></span>
                    <span>PENDENTE: PREENCHER TEMA E RESPONSÁVEL DO DSS</span>
                </div>
            ) : (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center gap-2.5 text-green-600 dark:text-green-400 text-xs font-bold w-fit shadow-sm">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
                    <span>DSS REGISTRADO COM SUCESSO</span>
                </div>
            )}

            <div id="tutorial-manual-register-bar" className="flex gap-4 items-center w-fit" onClickCapture={handleLockedClick}>
                <div className="relative w-[600px]">
                    <SubjectIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={localSubject}
                        onChange={(e) => setLocalSubject(e.target.value)}
                        placeholder={`TEMA DSS - TURNO ${getMainShiftLabel(turma)}`}
                        disabled={isLocked}
                        className={`w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 rounded-xl outline-none transition uppercase ${isLocked ? 'opacity-60 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : `${subjectBorderClass} focus:ring-2`}`}
                        autoCapitalize="characters"
                    />
                </div>
                <div className="relative w-[180px]">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={localMatricula}
                        onChange={handleMatriculaChange}
                        placeholder="Matrícula"
                        disabled={isLocked}
                        className={`w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 rounded-xl outline-none transition ${isLocked ? 'opacity-60 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : `${matriculaBorderClass} focus:ring-2`}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                    />
                </div>
                <div className="relative w-[250px]">
                    <input
                        type="text"
                        value={foundName}
                        readOnly
                        placeholder="Nome do Responsável"
                        className="w-full px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl outline-none pointer-events-none truncate text-center"
                    />
                </div>
                <button
                    onClick={() => !isLocked && onRegister(localSubject, localMatricula)}
                    disabled={isLocked}
                    className={`w-[180px] py-4 font-bold text-white rounded-xl shadow-md transition-all duration-300 ${isLocked ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:-translate-y-0.5'}`}
                >
                    {isLocked ? 'BLOQUEADO' : 'REGISTRAR'}
                </button>
            </div>
        </div>
    );
}, (prev, next) =>
    prev.subject === next.subject &&
    prev.matricula === next.matricula &&
    prev.turma === next.turma &&
    prev.onRegister === next.onRegister &&
    prev.employeesForLookup === next.employeesForLookup &&
    prev.administrators === next.administrators &&
    prev.dbName === next.dbName &&
    prev.isAdminOnlyTheme === next.isAdminOnlyTheme &&
    prev.isAdmin === next.isAdmin &&
    prev.onLockedClick === next.onLockedClick
);

export default ManualRegisterSection;
