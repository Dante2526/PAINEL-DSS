
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import EmployeeCard from './components/EmployeeCard';
import SpecialTeamPanel from './components/SpecialTeamPanel';
import Modal from './components/Modal';
import Notification from './components/Notification';
import Footer from './components/Footer';
import InteractiveTutorial, { TutorialStep } from './components/InteractiveTutorial';
import TurmaSelectionScreen from './components/TurmaSelectionScreen';
import LayoutSelectionScreen from './components/LayoutSelectionScreen';
import { SubjectIcon, UserIcon, EraserIcon, FileTextIcon, SortIcon, UserPlusIcon, ShiftIcon, AbsentIcon, TrashIcon, ExchangeIcon, MousePointerIcon, InfoIcon, HelpIcon } from './components/icons';
import { Employee, StatusType, ModalType, ManualRegistration, Administrator } from './types';
import type { NotificationData } from './components/Notification';
import { db, auth, isConfigured } from './firebase';
import { FALLBACK_LOGO } from './components/logoConstants';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    writeBatch,
    serverTimestamp,
    Timestamp,
    where,
    getDocs,
    deleteDoc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './styles.css';
import { formatTimestamp } from './services/employeeService';
import { logAuditEvent } from './services/auditService';

// --- CONFIGURAÇÃO EMAILJS ---
const EMAILJS_SERVICE_ID = "service_adjw0cj";
const EMAILJS_TEMPLATE_ID = "template_owo0dmm";
const EMAILJS_PUBLIC_KEY = "Ef-7IoF9U9NQ_iV8X";
// ----------------------------

// --- TIPO E HELPERS DE TURMA ---
type TurmaType = 'A' | 'B' | 'C' | 'D' | 'CCG';
const ALL_TURMAS: TurmaType[] = ['A', 'B', 'C', 'D', 'CCG'];

const TURMA_DISPLAY_NAMES: Record<TurmaType, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    CCG: 'C CG',
};

function getTurmaCollectionName(turma: TurmaType): string {
    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `turma ${displayName.toLowerCase()}`;
}

function getTurmaRegistrationName(turma: TurmaType): string {
    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `registrosDSS ${displayName}`;
}

function isValidTurma(value: string): value is TurmaType {
    return ALL_TURMAS.includes(value as TurmaType);
}
// --------------------------------

const getTutorialSteps = (isCCG: boolean): TutorialStep[] => {
    const baseSteps: TutorialStep[] = [
        {
            targetId: 'app-header',
            title: 'Controle de Zoom',
            content: 'O painel se adapta a você! Use o movimento de pinça (dois dedos na tela) para dar zoom e ajustar o tamanho ideal para sua visualização.',
            disableHorizontalScroll: true,
            noHighlight: true
        },
        {
            targetId: 'tutorial-manual-register-bar',
            title: 'Registro Manual',
            content: 'Use esta barra superior para registrar o Assunto do DSS do dia e a matrícula do responsável. O nome aparecerá automaticamente ao lado.'
        },
        {
            targetId: 'tutorial-first-card',
            title: 'Cartão do Colaborador',
            content: 'Este é o cartão individual. O funcionário deve marcar "ASS. DSS" e "ESTOU BEM" ao chegar. Se marcar "ESTOU MAL", um alerta será enviado imediatamente para a gestão.'
        },
        {
            targetId: 'tutorial-card-actions',
            title: 'Botões de Ação',
            content: `Use "AUSENTE" para marcar que o colaborador faltou. Use "DELETAR" para remover permanentemente o usuário (Aparece somente para-ADM).${!isCCG ? ' Use "TURNO 6H" para mover o colaborador para uma coluna somente para esse turno.' : ''}`,
            scrollTargetId: 'tutorial-first-card'
        },
        {
            targetId: 'tutorial-card-time',
            title: 'Registro de Horário',
            content: 'Aqui fica registrado o momento exato em que o colaborador assinou sua DSS',
            scrollTargetId: 'tutorial-first-card'
        }
    ];

    if (!isCCG) {
        baseSteps.push(
            {
                targetId: 'tutorial-special-demo-area',
                title: 'Turno Diferenciado (6H)',
                content: 'Painel exclusivo para a turma do turno de 6H. Funciona da mesma forma que o painel principal, mas com controle separado.'
            },
            {
                targetId: 'tutorial-return-turn-btn',
                title: 'Retornar ao Turno Normal',
                content: 'Ao Clicar neste botão na coluna do horário especial, o colaborador é movido de volta para o turno normal.',
                scrollTargetId: 'tutorial-special-demo-area'
            }
        );
    }

    baseSteps.push(
        {
            targetId: 'tutorial-change-turma-btn',
            title: 'Trocar de Turma',
            content: 'Precisa visualizar a outra turma? Use este botão para voltar à tela de seleção a qualquer momento.',
            disableHorizontalScroll: true
        },
        {
            targetId: 'tutorial-stats',
            title: 'Estatísticas em Tempo Real',
            content: 'Acompanhe quantos colaboradores estão bem, mal ou ausentes instantaneamente.',
            disableHorizontalScroll: true
        },
        {
            targetId: 'tutorial-dark-mode',
            title: 'Modo Escuro (BB-8)',
            content: 'Clique no pequeno droide BB-8 para alternar entre o modo Claro e Escuro. Ideal para ambientes com pouca luz.',
            disableHorizontalScroll: true
        },
        {
            targetId: 'tutorial-help-btn',
            title: 'Ajuda e Tutorial',
            content: 'Perdido? Clique neste botão a qualquer momento para rever este tutorial interativo e relembrar as funcionalidades.',
            disableHorizontalScroll: true
        },
        {
            targetId: 'tutorial-admin-btn',
            title: 'Área Administrativa',
            content: 'Acesso restrito para limpar os dados diários, gerar relatórios em PDF/Texto e cadastrar novos usuários.',
            disableHorizontalScroll: true
        }
    );

    return baseSteps;
};

const adminTutorialSteps: TutorialStep[] = [
    {
        targetId: 'admin-clear-btn',
        title: 'Limpar Status Diário',
        content: 'O sistema realiza a limpeza automática diariamente. Use esta opção apenas caso seja realmente necessário forçar o reset de todos os status manualmente.'
    },
    {
        targetId: 'admin-report-btn',
        title: 'Gerar Relatório',
        content: 'Cria um resumo completo da equipe, separando quem está Bem, Mal ou Pendente. Você pode copiar o texto ou baixar um arquivo.'
    },
    {
        targetId: 'admin-reorganize-btn',
        title: 'Reorganizar Painel',
        content: 'O sistema já organiza os cartões automaticamente. Use este botão apenas caso seja realmente necessário forçar a reordenação alfabética.'
    },
    {
        targetId: 'admin-adduser-btn',
        title: 'Novo Usuário',
        content: 'Cadastre novos colaboradores manualmente no sistema.'
    },
    {
        targetId: 'admin-demo-btn',
        title: 'Modo Demonstração',
        content: 'Preenche o sistema com dados fictícios para testes. Recurso destinado ao uso técnico do Desenvolvedor Near.'
    }
];

const ManualRegisterSection: React.FC<{
    subject: string;
    matricula: string;
    onSubjectChange: (v: string) => void;
    onMatriculaChange: (v: string) => void;
    onRegister: () => void;
    employeesForLookup: (Pick<Employee, 'name' | 'matricula'>)[];
    administrators: Administrator[];
}> = ({ subject, matricula, onSubjectChange, onMatriculaChange, onRegister, employeesForLookup, administrators }) => {
    const foundName = useMemo(() => {
        if (!matricula) return '';
        const admin = administrators.find(a => a.matricula === matricula);
        if (admin) return admin.name;

        const employee = employeesForLookup.find(e => e.matricula === matricula);
        return employee ? employee.name : '';
    }, [matricula, employeesForLookup, administrators]);

    const handleMatriculaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onMatriculaChange(e.target.value.replace(/[^0-9]/g, ''));
    };

    return (
        <div className="w-full bg-light-card dark:bg-dark-card rounded-3xl p-6 shadow-lg mb-8 shrink-0">
            <div id="tutorial-manual-register-bar" className="flex gap-4 items-center w-fit">
                <div className="relative w-[600px]">
                    <SubjectIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        placeholder="ASSUNTO DO DSS"
                        className="w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition uppercase"
                        autoCapitalize="characters"
                    />
                </div>
                <div className="relative w-[180px]">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={matricula}
                        onChange={handleMatriculaChange}
                        placeholder="Matrícula"
                        className="w-full pl-12 pr-4 py-4 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
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
                    onClick={onRegister}
                    className="h-[60px] px-8 font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                    REGISTRAR
                </button>
            </div>
        </div>
    );
};

const AdminLoginModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onLogin, scale }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Acesso Administrativo" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email do Administrador"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    autoFocus
                />
                <p className="text-xs text-left text-warning font-bold px-1">
                    * Digite tudo em minúsculo
                </p>
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition">
                    ENTRAR
                </button>
            </form>
        </Modal>
    );
};

const AdminOptionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    onReorganize: () => void;
    onAddUser: () => void;
    onSendReport: () => void;
    onImportUser: () => void;
    onEnterDemo: () => void;
    onStartAdminTutorial: () => void;
    scale: number;
}> = ({ isOpen, onClose, onClear, onReorganize, onAddUser, onSendReport, onImportUser, onEnterDemo, onStartAdminTutorial, scale }) => {
    if (!isOpen) return null;

    const AdminButton: React.FC<{ id: string; onClick: () => void; className: string; icon: React.ReactNode; label: string }> = ({ id, onClick, className, icon, label }) => (
        <button id={id} onClick={onClick} className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-lg h-24 ${className}`}>
            {icon}
            <span className="font-bold text-xs uppercase tracking-wider text-center leading-tight">{label}</span>
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Painel do Administrador" scale={scale} size="md">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <AdminButton
                        id="admin-clear-btn"
                        onClick={onClear}
                        className="bg-orange text-white hover:bg-orange-600"
                        icon={<EraserIcon className="w-7 h-7" />}
                        label="Limpar Tudo"
                    />
                    <AdminButton
                        id="admin-report-btn"
                        onClick={onSendReport}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        icon={<FileTextIcon className="w-7 h-7" />}
                        label="Relatório"
                    />
                    <AdminButton
                        id="admin-adduser-btn"
                        onClick={onAddUser}
                        className="bg-green-500 text-white hover:bg-green-600"
                        icon={<UserPlusIcon className="w-7 h-7" />}
                        label="Add Usuário"
                    />
                    <AdminButton
                        id="admin-reorganize-btn"
                        onClick={onReorganize}
                        className="bg-purple-500 text-white hover:bg-purple-600"
                        icon={<SortIcon className="w-7 h-7" />}
                        label="Reorganizar"
                    />
                    <div className="col-span-2">
                        <AdminButton
                            id="admin-import-user-btn"
                            onClick={onImportUser}
                            className="bg-teal-500 text-white hover:bg-teal-600 w-full"
                            icon={<ExchangeIcon className="w-7 h-7" />}
                            label="Importar Colab."
                        />
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex flex-col gap-3">
                    <button
                        id="admin-tutorial-btn"
                        onClick={onStartAdminTutorial}
                        className="w-full p-3 bg-cyan-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-600 transition shadow-lg"
                    >
                        <HelpIcon className="w-6 h-6" />
                        <span className="font-bold text-sm">AJUDA / TUTORIAL</span>
                    </button>
                    <button
                        id="admin-demo-btn"
                        onClick={onEnterDemo}
                        className="w-full p-3 bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg border border-gray-500"
                    >
                        <MousePointerIcon className="w-5 h-5" />
                        <span className="font-bold text-sm">MODO DEMONSTRAÇÃO</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const AddUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, matricula: string, addAnother: boolean) => void;
    scale: number;
}> = ({ isOpen, onClose, onAdd, scale }) => {
    const [name, setName] = useState('');
    const [matricula, setMatricula] = useState('');
    const [addAnother, setAddAnother] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset state when modal is closed to ensure it's fresh next time
        if (!isOpen) {
            setName('');
            setMatricula('');
            setAddAnother(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd(name.trim(), matricula, addAnother);
            // Sempre limpa os campos após enviar
            setName('');
            setMatricula('');

            // Se "Continuar Adicionando" estiver marcado, o modal não fechará
            // então focamos automaticamente no campo de nome para o próximo
            if (addAnother && nameInputRef.current) {
                setTimeout(() => {
                    nameInputRef.current?.focus();
                }, 100);
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Colaborador" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Nome e Sobrenome"
                        value={name}
                        onChange={handleNameChange}
                        className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white uppercase"
                        autoFocus
                    />
                    <p className="text-xs text-left text-warning font-semibold px-1 mt-1.5">
                        *Coloque apenas o primeiro nome e o último sobrenome
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    inputMode="numeric"
                />
                <label htmlFor="add-another-user-checkbox" className="flex items-center justify-center gap-4 py-2 cursor-pointer group">
                    <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text transition-colors select-none">
                        Continuar adicionando
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="add-another-user-checkbox"
                            className="sr-only"
                            checked={addAnother}
                            onChange={(e) => setAddAnother(e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${addAnother ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${addAnother ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </label>
                <button type="submit" className="w-full py-3 bg-success text-white font-bold rounded-lg hover:bg-green-600 transition shadow-lg">
                    ADICIONAR
                </button>
            </form>
        </Modal>
    );
};

const ReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    showNotification: (msg: string, type: 'success' | 'error') => void;
    scale: number;
    subject7H: string;
    responsible7H: string;
    matricula7H: string;
    subject6H: string;
    responsible6H: string;
    matricula6H: string;
    adminEmail: string;
    turma: string | null;
}> = ({ isOpen, onClose, employees, showNotification, scale, subject7H, responsible7H, matricula7H, subject6H, responsible6H, matricula6H, adminEmail, turma }) => {
    // Generate text for Clipboard/File functions
    const generateReport = () => {
        // Filter groups by Turno
        const team7H = employees.filter(e => e.turno !== '6H');
        const team6H = employees.filter(e => e.turno === '6H');

        const totalEmployees = employees.length;
        const totalPresent = employees.filter(e => e.bem || e.assDss || e.mal).length;
        const totalAbsent = employees.filter(e => e.absent).length;
        const totalPending = employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.absent).length;


        let report = `RESUMO GERAL\n`;
        report += `Total de Funcionários: ${totalEmployees}\n`;
        report += `Presentes (DSS + Bem/Mal): ${totalPresent}\n`;
        report += `Ausentes: ${totalAbsent}\n`;
        report += `Pendentes: ${totalPending}\n\n`;

        // Helper to generate section list
        const getStatusList = (team: Employee[]) => {
            const bem = team.filter(e => e.bem || e.assDss);
            const mal = team.filter(e => e.mal);
            const absent = team.filter(e => e.absent);
            const pending = team.filter(e => !e.bem && !e.assDss && !e.mal && !e.absent);

            let section = `STATUS: "ASS.DSS + ESTOU BEM"\n`;
            section += bem.length > 0 ? bem.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\n"ESTOU MAL"\n`;
            section += mal.length > 0 ? mal.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nAUSENTES\n`;
            section += absent.length > 0 ? absent.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nPENDENTES\n`;
            section += pending.length > 0 ? pending.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';

            return section;
        };

        report += `EQUIPE TURNO 7H\n`;
        report += getStatusList(team7H);
        report += `\n\n`;

        if (turma !== 'CCG') {
            report += `EQUIPE TURNO 6H\n`;
            report += getStatusList(team6H);
            report += `\n\n`;
        }

        // Footer Section with Registries
        report += `REGISTROS DSS (TURNO 7H)\n`;
        report += `Assunto: ${subject7H || 'NÃO INFORMADO'}`;
        if (responsible7H) {
            // Using a new line for Responsible to be clear, including Matricula
            report += `\nResponsável: ${responsible7H} (Matrícula: ${matricula7H || '---'})\n`;
        } else {
            report += `\n`;
        }

        if (turma !== 'CCG') {
            report += `\nREGISTROS DSS (TURNO 6H)\n`;
            report += `Assunto: ${subject6H || 'NÃO INFORMADO'}`;
            if (responsible6H) {
                report += `\nResponsável: ${responsible6H} (Matrícula: ${matricula6H || '---'})\n`;
            } else {
                report += `\n`;
            }
        }

        return report;
    };

    const reportText = generateReport();

    // Stats for Visual Display (Keep this simple for the modal visual)
    const visualStats = {
        total: employees.length,
        present: employees.filter(e => e.bem || e.assDss || e.mal).length,
        absentCount: employees.filter(e => e.absent).length,
        missingCount: employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.absent).length,
        malCount: employees.filter(e => e.mal).length,
        malList: employees.filter(e => e.mal),
        absentList: employees.filter(e => e.absent),
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(reportText);
        showNotification('Relatório copiado para a área de transferência!', 'success');
        logAuditEvent(adminEmail, 'REPORT_COPY', 'Relatório copiado para área de transferência', turma);
        onClose();
    };

    const handleDownload = () => {
        // Add UTF-8 BOM to ensure correct encoding on all devices
        const blob = new Blob(['\uFEFF' + reportText], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-dss-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Relatório baixado com sucesso!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório baixado como arquivo .txt', turma);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Relatório Diário" scale={scale}>
            {/* Visual Report Container */}
            <div className="w-full mb-6">
                <div className="text-sm font-semibold text-gray-500 mb-4 capitalize border-b border-gray-200 dark:border-gray-700 pb-2">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* Shift Info Cards Side-by-Side */}
                <div className="flex gap-3 mb-6">
                    {/* 7H Card */}
                    <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-left relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <SubjectIcon className="w-12 h-12 text-blue-600" />
                        </div>
                        <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO 7H</div>
                        <div className="mb-2 relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">{subject7H || 'NÃO INFORMADO'}</span>
                        </div>
                        <div className="relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">{responsible7H || '---'}</span>
                        </div>
                    </div>

                    {/* 6H Card */}
                    <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 text-left relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShiftIcon className="w-12 h-12 text-orange-600" />
                        </div>
                        <div className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO 6H</div>
                        <div className="mb-2 relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">{subject6H || 'NÃO INFORMADO'}</span>
                        </div>
                        <div className="relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">{responsible6H || '---'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">{visualStats.present}</span>
                        <span className="text-[8px] uppercase text-gray-500 font-bold tracking-tight">Presentes</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">{visualStats.malCount}</span>
                        <span className="text-[8px] uppercase text-red-500/80 font-bold tracking-tight">Mal</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{visualStats.absentCount}</span>
                        <span className="text-[8px] uppercase text-amber-500/80 font-bold tracking-tight">Ausentes</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 flex flex-col items-center justify-center opacity-80 shadow-sm">
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{visualStats.missingCount}</span>
                        <span className="text-[8px] uppercase text-gray-500 font-bold tracking-tight">Pendentes</span>
                    </div>
                </div>

                {/* Compact Issues Lists */}
                {(visualStats.malList.length > 0 || visualStats.absentList.length > 0) && (
                    <div className="text-left space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {visualStats.malList.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    Relatos de Mal-Estar
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {visualStats.malList.map(e => (
                                        <span key={e.id} className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded border border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-200 font-medium">
                                            {e.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {visualStats.absentList.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Ausentes
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {visualStats.absentList.map(e => (
                                        <span key={e.id} className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 font-medium">
                                            {e.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                    onClick={handleCopy}
                    className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-md text-sm"
                >
                    <FileTextIcon className="w-4 h-4" />
                    COPIAR
                </button>
                <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-md text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    BAIXAR
                </button>
            </div>
        </Modal>
    );
};

const DemoPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, scale }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Senha de Demonstração" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    autoFocus
                    inputMode="numeric"
                />
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition">
                    ENTRAR
                </button>
            </form>
        </Modal>
    );
};

const ImportEmployeeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (employeeId: string, sourceTurma: TurmaType) => void;
    currentTurma: TurmaType;
    scale: number;
    showNotification: (msg: string, type: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onImport, currentTurma, scale, showNotification }) => {
    const [sourceTurma, setSourceTurma] = useState<TurmaType | ''>('');
    const [sourceEmployees, setSourceEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);


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
        }
    }, [isOpen]);

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
                        absent: data.absent,
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
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Colaborador" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                    <label htmlFor="turma-select" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Turma de Origem</label>
                    <div className="relative">
                        <select
                            id="turma-select"
                            value={sourceTurma}
                            onChange={(e) => setSourceTurma(e.target.value as TurmaType)}
                            className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white appearance-none pr-12"
                            required
                        >
                            <option value="" disabled>Selecione uma turma</option>
                            {availableTurmas.map(turma => (
                                <option key={turma} value={turma}>Turma {TURMA_DISPLAY_NAMES[turma]}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
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
                            className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                            disabled={!sourceTurma || loadingEmployees}
                        />
                        {loadingEmployees && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-primary-light border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    {isDropdownOpen && sourceEmployees.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-light-card dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleSelectEmployee(emp)}
                                        className="p-3 hover:bg-light-bg dark:hover:bg-dark-bg-secondary cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                    >
                                        <p className="font-semibold text-light-text dark:text-dark-text">{emp.name}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Matrícula: {emp.matricula}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-light-text-secondary dark:text-dark-text-secondary">Nenhum colaborador encontrado.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={!selectedEmployeeId} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                        IMPORTAR PARA TURMA {TURMA_DISPLAY_NAMES[currentTurma]}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const App: React.FC = () => {
    const [selectedTurma, setSelectedTurma] = useState<TurmaType | null>(() => {
        const savedTurma = localStorage.getItem('selectedTurma');
        if (savedTurma && isValidTurma(savedTurma)) {
            return savedTurma;
        }
        return null;
    });

    const [selectedLayout, setSelectedLayout] = useState<'standard' | 'custom' | null>(() => {
        const savedLayout = localStorage.getItem('selectedLayout');
        if (savedLayout === 'standard' || savedLayout === 'custom') {
            return savedLayout as 'standard' | 'custom';
        }
        return null;
    });

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [administrators, setAdministrators] = useState<Administrator[]>([]);
    const [allEmployeesForLookup, setAllEmployeesForLookup] = useState<(Pick<Employee, 'name' | 'matricula'>)[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.None);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [togglingSpecialTeamId, setTogglingSpecialTeamId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [activeLetter, setActiveLetter] = useState<string>('');
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null); // New wrapper ref
    const scalableContainerRef = useRef<HTMLDivElement>(null);
    const scaleStateRef = useRef({ currentScale: 1 });
    const modalScale = 1;

    // Refs para estabilizar callbacks sem dependência de state mutável
    const employeesRef = useRef<Employee[]>([]);
    const isAdminRef = useRef(false);
    const adminEmailRef = useRef('');

    // State for manual registration inputs
    const [mainSubject, setMainSubject] = useState('');
    const [mainMatricula, setMainMatricula] = useState('');
    const [mainResponsible, setMainResponsible] = useState('');

    const [specialSubject, setSpecialSubject] = useState('');
    const [specialMatricula, setSpecialMatricula] = useState('');
    const [specialResponsible, setSpecialResponsible] = useState('');

    // State for safety confirmation (Generic for Mal, Absent, Turno, Delete)
    const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
    const [existingUserInfo, setExistingUserInfo] = useState<{ name: string; turma: string } | null>(null);

    const [isAdminTutorialOpen, setIsAdminTutorialOpen] = useState(false);

    // Demo Mode State
    const [isDemoMode, setIsDemoMode] = useState(false);
    const isDemoModeRef = useRef(false);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Ref to prevent double "loaded" notifications
    const initialLoadDoneRef = useRef(false);

    // Manter refs sincronizados com o state
    useEffect(() => { employeesRef.current = employees; }, [employees]);
    useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
    useEffect(() => { adminEmailRef.current = adminEmail; }, [adminEmail]);

    // Effect to set Favicon to the Shield Icon (FALLBACK_LOGO)
    useEffect(() => {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
            link.href = FALLBACK_LOGO;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = FALLBACK_LOGO;
            document.head.appendChild(newLink);
        }
    }, []);

    useEffect(() => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            // FIX: Set body background to match theme to prevent white flashes during overscroll/bounce
            document.body.style.backgroundColor = '#1A202C';
            // FIX: Update theme-color meta tag for mobile browsers (status bar color)
            if (themeColorMeta) themeColorMeta.setAttribute('content', '#1A202C');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            // FIX: Set body background to match theme (light-bg-secondary color)
            document.body.style.backgroundColor = '#e8ecf1';
            // FIX: Update theme-color meta tag for mobile browsers (status bar color)
            if (themeColorMeta) themeColorMeta.setAttribute('content', '#e8ecf1');
        }
    }, [isDarkMode]);

    // modalScale é sempre 1 (definido como constante acima)

    // Effect to check if tutorial should be shown for first-time users
    useEffect(() => {
        // Wait for loading to finish so DOM elements are present
        let timeoutId: NodeJS.Timeout;
        if (!loading && selectedTurma) {
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
                // Short delay to ensure rendering frames are complete
                timeoutId = setTimeout(() => {
                    setActiveModal(ModalType.Tutorial);
                    localStorage.setItem('hasSeenTutorial', 'true');
                }, 1000);
            }
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loading, selectedTurma]);

    const handleToggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Função para enviar alerta por e-mail
    const sendAlertEmail = async (name: string, matricula: string, turno: string) => {
        if (isDemoMode) {
            console.log(`[DEMO] Email alert triggered for ${name}`);
            return;
        }
        try {
            const currentTime = new Date().toLocaleString('pt-BR');
            const emailContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Alerta de Saúde</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                                <tr>
                                    <td style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
                                        🚨 Alerta de Saúde: Colaborador informou "ESTOU MAL". Verifique imediatamente.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="border-left: 4px solid #dc2626; padding-left: 15px;">
                                                    <h1 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: bold; line-height: 1.2;">
                                                        Alerta de Saúde e Segurança!
                                                    </h1>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <p style="margin: 0; font-size: 18px; line-height: 1.5; color: #000000;">
                                            O colaborador <strong>${name}</strong> informou que não está se sentindo bem.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                                            <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                                                DETALHES DO REGISTRO:
                                            </p>
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                        <strong style="font-size: 15px; color: #000000;">Nome:</strong>
                                                    </td>
                                                    <td style="padding-bottom: 8px; vertical-align: top;">
                                                        <span style="font-size: 15px; color: #000000; font-weight: bold;">${name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                        <strong style="font-size: 15px; color: #000000;">Matrícula:</strong>
                                                    </td>
                                                    <td style="padding-bottom: 8px; vertical-align: top;">
                                                        <span style="font-size: 15px; color: #000000; font-weight: bold;">${matricula}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                        <strong style="font-size: 15px; color: #000000;">Turno:</strong>
                                                    </td>
                                                    <td style="padding-bottom: 8px; vertical-align: top;">
                                                        <span style="font-size: 15px; color: #000000; font-weight: bold;">${turno}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom: 0; width: 100px; vertical-align: top;">
                                                        <strong style="font-size: 15px; color: #000000;">Horário:</strong>
                                                    </td>
                                                    <td style="padding-bottom: 0; vertical-align: top;">
                                                        <span style="font-size: 15px; color: #000000; font-weight: bold;">${currentTime}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" style="background-color: #ff5252; border-radius: 8px; padding: 16px; border: 1px solid #ff5252;">
                                                    <span style="color: #000000; font-weight: bold; font-size: 16px;">
                                                        Por favor, verifique a situação imediatamente.
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 30px;">
                                        <p style="margin: 0; font-size: 12px; color: #000000;">
                                            Este é um e-mail automático do sistema DSS.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `;

            const templateParams = {
                html_content: emailContent,
                subject: `🚨 ALERTA URGENTE TURMA ${TURMA_DISPLAY_NAMES[selectedTurma]}: "ESTOU MAL"`,
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            showNotification('Alerta enviado por e-mail ao setor responsável.', 'success');
        } catch (error) {
            console.error("Erro ao enviar e-mail via EmailJS:", error);
        }
    };

    // Effect for one-time global data fetching (like the employee lookup list)
    useEffect(() => {
        const fetchGlobalData = async () => {
            if (!isConfigured || !db) return;

            try {
                await signInAnonymously(auth!);
                console.log("Signed in anonymously for global data fetch.");

                if (allEmployeesForLookup.length === 0) {
                    const promises = ALL_TURMAS.map(turma => getDocs(query(collection(db, getTurmaCollectionName(turma)))));

                    const snapshots = await Promise.all(promises);
                    const allEmps: Pick<Employee, 'name' | 'matricula'>[] = [];
                    snapshots.forEach(snapshot => {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.name && data.matricula) {
                                allEmps.push({ name: data.name, matricula: data.matricula });
                            }
                        });
                    });

                    const uniqueEmps = Array.from(new Map(allEmps.map(item => [item.matricula, item])).values());
                    setAllEmployeesForLookup(uniqueEmps);
                }
            } catch (error) {
                console.error("Global data fetch or anonymous sign-in failed:", error);
            }
        }
        fetchGlobalData();
    }, []); // Empty dependency array ensures this runs only once

    // Effect for fetching data specific to the selected Turma
    useEffect(() => {
        if (!selectedTurma) {
            setLoading(false);
            return;
        }

        if (!isConfigured) {
            showNotification("Modo de pré-visualização: Faça o deploy no Vercel para carregar dados ao vivo.", "error");
            setLoading(false);
            return;
        }

        initialLoadDoneRef.current = false; // Reset notification flag when turma changes

        let unsubscribeEmployees = () => { };
        let unsubscribeAdministrators = () => { };
        let unsubscribeRegistrations = () => { };

        const setupListeners = async () => {
            if (!db) return;
            try {
                // Listeners for the specific turma
                const collectionName = getTurmaCollectionName(selectedTurma);
                const employeesQuery = query(collection(db, collectionName), orderBy("name", "asc"));
                unsubscribeEmployees = onSnapshot(employeesQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;

                    const employeesData: Employee[] = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.name,
                            matricula: data.matricula,
                            assDss: data.assDss,
                            bem: data.bem,
                            mal: data.mal,
                            absent: data.absent,
                            time: data.time ? formatTimestamp(data.time as Timestamp) : null,
                            turno: data.turno || '7H',
                        };
                    });
                    setEmployees(employeesData);

                    if (!initialLoadDoneRef.current) {
                        setLoading(false);
                        showNotification(`Dados da Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} carregados!`, 'success');
                        initialLoadDoneRef.current = true;
                    }

                }, (error) => {
                    console.error("Error listening to employee updates:", error);
                    if (!isDemoModeRef.current) showNotification(`Erro ao carregar funcionários: ${error.message}`, "error");
                    setLoading(false);
                });

                const administratorsQuery = query(collection(db, 'administrators'));
                unsubscribeAdministrators = onSnapshot(administratorsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;
                    const adminsData: Administrator[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Administrator));
                    setAdministrators(adminsData);
                }, (error) => console.error("Error listening to admin updates:", error));

                const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
                const registrationsQuery = query(collection(db, registrationCollectionName));
                unsubscribeRegistrations = onSnapshot(registrationsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;
                    const registrations = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ManualRegistration[];
                    const mainReg = registrations.find(r => r.TURNO === '7H');
                    const specialReg = registrations.find(r => r.TURNO === '6H');
                    setMainSubject(mainReg?.assunto || '');
                    setMainMatricula(mainReg?.matricula || '');
                    setMainResponsible(mainReg?.name || '');
                    setSpecialSubject(specialReg?.assunto || '');
                    setSpecialMatricula(specialReg?.matricula || '');
                    setSpecialResponsible(specialReg?.name || '');
                });

            } catch (error) {
                console.error("Listener setup failed:", error);
                const message = error instanceof Error ? error.message : 'Verifique as credenciais.';
                if (!isDemoModeRef.current) showNotification(`Falha na conexão: ${message}`, "error");
                setLoading(false);
            }
        };

        setupListeners();

        return () => {
            unsubscribeEmployees();
            unsubscribeAdministrators();
            unsubscribeRegistrations();
        };
    }, [selectedTurma]);

    const setScale = useCallback((newScale: number, scrollX?: number, scrollY?: number) => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        const contentWrapper = contentWrapperRef.current;
        if (!viewport || !scalableContainer || !contentWrapper) return;

        // Calcular escala mínima com a LARGURA ORIGINAL INTOCADA (scalableContainerRef)
        // Isso impede a "Tremedeira Matemática" descrita, pois a raiz nunca encolhe.
        let minScale = 0.2;
        if (scalableContainer.offsetWidth > 0) {
            minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
        }

        const finalScale = Math.max(minScale, Math.min(newScale, 2.0));
        scaleStateRef.current.currentScale = finalScale;

        scalableContainer.style.transform = `scale(${finalScale})`;

        const originalWidth = scalableContainer.offsetWidth;
        const originalHeight = scalableContainer.offsetHeight;

        contentWrapper.style.width = `${originalWidth * finalScale}px`;
        contentWrapper.style.height = `${originalHeight * finalScale}px`;

        if (scrollX !== undefined) viewport.scrollLeft = scrollX;
        if (scrollY !== undefined) viewport.scrollTop = scrollY;
    }, []);

    const initializeScale = useCallback(() => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        if (!viewport || !scalableContainer) return;

        const isMobileView = ('ontouchstart' in window || navigator.maxTouchPoints > 0) || window.innerWidth < 1366;

        if (isMobileView) {
            const oneColumnScale = viewport.clientWidth / 920;
            const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 1.0);
            setScale(finalScale, 0, 0);
        } else {
            setScale(1.0, 0, 0);
        }
    }, [setScale]);


    useEffect(() => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;

        if (!viewport || !scalableContainer) return;

        initializeScale();
        const initTimer = setTimeout(initializeScale, 50);

        let initialDistance = 0;
        let initialScale = 1;
        let scrollStart = { x: 0, y: 0 };
        let touchCenter = { x: 0, y: 0 };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                initialScale = scaleStateRef.current.currentScale;
                scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };
                touchCenter = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                const scaleRatio = currentDistance / initialDistance;
                let newScale = initialScale * scaleRatio;

                let minScale = 0.2;
                const scalableContainer = scalableContainerRef.current;
                if (scalableContainer && scalableContainer.offsetWidth > 0) {
                    minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
                }

                if (newScale < minScale) {
                    newScale = minScale;
                    if (scaleStateRef.current.currentScale === minScale) {
                        return; // Anti-Shake: Aborta a continuação matemática do offsetX se já estivermos travados
                    }
                }

                const originX = touchCenter.x - viewport.getBoundingClientRect().left;
                const originY = touchCenter.y - viewport.getBoundingClientRect().top;

                const contentOriginX = (scrollStart.x + originX) / initialScale;
                const contentOriginY = (scrollStart.y + originY) / initialScale;

                const newScrollX = (contentOriginX * newScale) - originX;
                const newScrollY = (contentOriginY * newScale) - originY;

                setScale(newScale, newScrollX, newScrollY);
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const zoomIntensity = 0.002;
                const delta = -e.deltaY * zoomIntensity;
                let newScale = scaleStateRef.current.currentScale + delta * scaleStateRef.current.currentScale;

                let minScale = 0.2;
                const scalableContainer = scalableContainerRef.current;
                if (scalableContainer && scalableContainer.offsetWidth > 0) {
                    minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
                }

                if (newScale < minScale) {
                    newScale = minScale;
                    if (scaleStateRef.current.currentScale === minScale) {
                        return; // Faz com que rolar o scroll no limite para trás ignore calclos de offset fantasmas
                    }
                }

                const originX = e.clientX - viewport.getBoundingClientRect().left;
                const originY = e.clientY - viewport.getBoundingClientRect().top;

                const contentOriginX = (viewport.scrollLeft + originX) / scaleStateRef.current.currentScale;
                const contentOriginY = (viewport.scrollTop + originY) / scaleStateRef.current.currentScale;

                const newScrollX = (contentOriginX * newScale) - originX;
                const newScrollY = (contentOriginY * newScale) - originY;

                setScale(newScale, newScrollX, newScrollY);
            }
        };

        let lastWidth = window.innerWidth;
        const handleResize = () => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                return;
            }

            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                setScale(scaleStateRef.current.currentScale);
                initializeScale();
            }
        };

        window.addEventListener('load', initializeScale);
        window.addEventListener('resize', handleResize);
        viewport.addEventListener('wheel', handleWheel, { passive: false });
        viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
        viewport.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            clearTimeout(initTimer);
            window.removeEventListener('load', initializeScale);
            window.removeEventListener('resize', handleResize);
            if (viewport) {
                viewport.removeEventListener('wheel', handleWheel);
                viewport.removeEventListener('touchstart', handleTouchStart);
                viewport.removeEventListener('touchmove', handleTouchMove);
            }
        };

    }, [initializeScale, setScale, selectedTurma, selectedLayout]);

    const handleConfirmDemoPassword = (password: string) => {
        if (password === '40402020') {
            handleEnterDemoMode();
        } else {
            showNotification('Senha incorreta.', 'error');
            setActiveModal(ModalType.AdminOptions);
        }
    };

    const handleEnterDemoMode = () => {
        if (!selectedTurma) {
            showNotification('Selecione uma turma antes de entrar no modo de demonstração.', 'error');
            return;
        }
        isDemoModeRef.current = true;

        const firstNames = ["João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana", "Marcos", "Beatriz", "Rafael", "Camila", "Gustavo", "Larissa", "Bruno"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins"];

        const generateName = () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            return `${first} ${last}`;
        };

        const mockEmployees: Employee[] = Array.from({ length: 45 }).map((_, i) => {
            const isPresent = Math.random() > 0.3;
            const isBem = isPresent && Math.random() > 0.1;
            const isMal = isPresent && !isBem;
            const isAbsent = !isPresent;

            return {
                id: `demo-${i}`,
                name: generateName(),
                matricula: `${1000 + i}`,
                assDss: isBem,
                bem: isBem,
                mal: isMal,
                absent: isAbsent,
                time: isPresent ? formatTimestamp(Timestamp.now()) : null,
                turno: i < 35 ? '7H' : '6H'
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        const mockAdmins: Administrator[] = [
            { id: 'admin1', name: 'Admin Demo User', matricula: '9999', email: 'admin@demo.com' }
        ];

        setEmployees(mockEmployees);
        setAdministrators(mockAdmins);
        setIsDemoMode(true);
        setIsAdmin(true);
        setActiveModal(ModalType.None);
        setLoading(false);
        showNotification('Modo de Demonstração Ativado! Dados fictícios carregados.', 'success');
    };

    const processStatusUpdate = useCallback(async (id: string, type: StatusType) => {
        if (!selectedTurma) return;
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        if (!isChecking && !isAdminRef.current) {
            showNotification('Apenas administradores podem desmarcar esta opção.', 'error');
            return;
        }

        const updatedData: { [key: string]: any } = {};

        if (type === 'absent') {
            updatedData.absent = isChecking;
            if (isChecking) {
                updatedData.assDss = false;
                updatedData.bem = false;
                updatedData.mal = false;
            }
        } else {
            if (isChecking) {
                updatedData.absent = false;
            }

            if (type === 'assDss') {
                updatedData.assDss = isChecking;
            } else if (type === 'bem') {
                updatedData.bem = isChecking;
                if (isChecking) {
                    updatedData.assDss = true;
                    updatedData.mal = false;
                }
            } else if (type === 'mal') {
                updatedData.mal = isChecking;
                if (isChecking) {
                    updatedData.bem = false;
                    sendAlertEmail(employee.name, employee.matricula, employee.turno);
                }
            }
        }

        if (isDemoMode) {
            const finalStates = {
                absent: updatedData.absent !== undefined ? updatedData.absent : employee.absent,
                assDss: updatedData.assDss !== undefined ? updatedData.assDss : employee.assDss,
                bem: updatedData.bem !== undefined ? updatedData.bem : employee.bem,
                mal: updatedData.mal !== undefined ? updatedData.mal : employee.mal,
            };

            let newTime = employee.time;
            if (finalStates.absent) {
                newTime = null;
            } else if (finalStates.assDss) {
                if (!newTime) {
                    const date = new Date();
                    newTime = `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                }
            } else {
                newTime = null;
            }

            setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedData, time: newTime } : e));
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const finalStates = {
                absent: updatedData.absent !== undefined ? updatedData.absent : employee.absent,
                assDss: updatedData.assDss !== undefined ? updatedData.assDss : employee.assDss,
                bem: updatedData.bem !== undefined ? updatedData.bem : employee.bem,
                mal: updatedData.mal !== undefined ? updatedData.mal : employee.mal,
            };

            if (finalStates.absent) {
                updatedData.time = null;
            } else if (finalStates.assDss) {
                if (!employee.time) {
                    updatedData.time = serverTimestamp();
                }
            } else {
                updatedData.time = null;
            }
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedData);
            logAuditEvent(adminEmailRef.current, 'STATUS_CHANGE', `Funcionário: ${employee.name} | Alteração: ${type} → ${isChecking ? 'marcado' : 'desmarcado'}`, selectedTurma);
        } catch (error) {
            console.error("Error updating status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        }
    }, [selectedTurma, showNotification, isDemoMode]);

    const handleTimeUpdate = useCallback(async (id: string, newDate: Date) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem editar o horário.', 'error');
            return;
        }

        if (isDemoMode) {
            const newTimeStr = `${newDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${newDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, time: newTimeStr } : e));
            showNotification('Horário atualizado com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db || !selectedTurma) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                time: Timestamp.fromDate(newDate)
            });
            showNotification('Horário atualizado com sucesso!', 'success');
            const emp = employeesRef.current.find(e => e.id === id);
            logAuditEvent(adminEmailRef.current, 'EDIT_TIME', `Funcionário: ${emp?.name || id} | Novo horário: ${newDate.toLocaleString('pt-BR')}`, selectedTurma);
        } catch (error) {
            console.error("Error updating time:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar horário: ${message}`, 'error');
        }
    }, [isAdminRef, isDemoMode, db, selectedTurma, showNotification]);

    const handleMatriculaUpdate = useCallback(async (id: string, newMatricula: string) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem editar a matrícula.', 'error');
            return;
        }

        if (isDemoMode) {
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, matricula: newMatricula } : e));
            showNotification('Matrícula atualizada com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db || !selectedTurma) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);

            // Check for duplicates
            const q = query(collection(db, collectionName), where("matricula", "==", newMatricula));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
                showNotification('Esta matrícula já está em uso por outro funcionário.', 'error');
                return;
            }

            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                matricula: newMatricula
            });
            showNotification('Matrícula atualizada com sucesso!', 'success');
            const emp = employeesRef.current.find(e => e.id === id);
            logAuditEvent(adminEmailRef.current, 'EDIT_MATRICULA', `Funcionário: ${emp?.name || id} | Nova matrícula: ${newMatricula}`, selectedTurma);
        } catch (error) {
            console.error("Error updating matricula:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar matrícula: ${message}`, 'error');
        }
    }, [isAdminRef, isDemoMode, db, selectedTurma, showNotification]);

    const handleStatusChange = useCallback((id: string, type: StatusType) => {
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        if (type === 'mal' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmMal);
            return;
        }

        if (type === 'absent' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmAbsent);
            return;
        }

        processStatusUpdate(id, type);
    }, [processStatusUpdate]);

    const handleConfirmMal = useCallback(() => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'mal');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processStatusUpdate]);

    const handleConfirmAbsent = useCallback(() => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'absent');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processStatusUpdate]);

    const processToggleSpecialTeam = useCallback(async (id: string) => {
        if (!selectedTurma) return;
        setTogglingSpecialTeamId(id);
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) {
            setTogglingSpecialTeamId(null);
            return;
        }
        const newTurno = employee.turno === '6H' ? '7H' : '6H';

        if (isDemoMode) {
            setTimeout(() => {
                setEmployees(prev => prev.map(e => e.id === id ? { ...e, turno: newTurno } : e));
                showNotification(`${employee.name} foi movido para o turno ${newTurno} (DEMO).`, 'success');
                setTogglingSpecialTeamId(null);
            }, 500);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                turno: newTurno
            });
            showNotification(`${employee.name} foi movido para o turno ${newTurno}.`, 'success');
            logAuditEvent(adminEmailRef.current, 'TOGGLE_TURNO', `Funcionário: ${employee.name} | Novo turno: ${newTurno}`, selectedTurma);
        } catch (error) {
            console.error("Failed to toggle special team status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        } finally {
            setTogglingSpecialTeamId(null);
        }
    }, [selectedTurma, isDemoMode, db, showNotification]);

    const handleToggleSpecialTeam = useCallback((id: string) => {
        setPendingEmployeeId(id);
        setActiveModal(ModalType.ConfirmTurno);
    }, []);

    const handleConfirmTurno = useCallback(() => {
        if (pendingEmployeeId) {
            processToggleSpecialTeam(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processToggleSpecialTeam]);

    const processDeleteUser = useCallback(async (employeeId: string) => {
        if (!selectedTurma) return;
        const employeeToDelete = employeesRef.current.find(e => e.id === employeeId);
        if (!employeeToDelete) return;

        if (isDemoMode) {
            setEmployees(prev => prev.filter(e => e.id !== employeeId));
            showNotification(`Usuário ${employeeToDelete.name} deletado com sucesso (DEMO)!`, 'success');
            return;
        }
        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }
        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, employeeId);
            await deleteDoc(docRef);
            showNotification(`Usuário ${employeeToDelete.name} deletado com sucesso!`, 'success');
            logAuditEvent(adminEmailRef.current, 'DELETE_USER', `Funcionário deletado: ${employeeToDelete.name} (Matrícula: ${employeeToDelete.matricula})`, selectedTurma);
        } catch (error) {
            console.error("Error deleting user:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao deletar: ${message}`, 'error');
        }
    }, [selectedTurma, isDemoMode, db, showNotification]);

    const handleDeleteUser = useCallback((employeeId: string) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem deletar usuários.', 'error');
            return;
        }
        const employeeToDelete = employeesRef.current.find(e => e.id === employeeId);
        if (!employeeToDelete) {
            showNotification('Usuário não encontrado.', 'error');
            return;
        }

        setPendingEmployeeId(employeeId);
        setActiveModal(ModalType.ConfirmDelete);
    }, [showNotification]);

    const handleConfirmDelete = useCallback(() => {
        if (pendingEmployeeId) {
            processDeleteUser(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processDeleteUser]);

    const handleManualRegister = useCallback(async (turno: '7H' | '6H') => {
        if (!selectedTurma) return;

        const matricula = turno === '7H' ? mainMatricula : specialMatricula;
        const rawSubject = turno === '7H' ? mainSubject : specialSubject;
        const subject = rawSubject ? rawSubject.toUpperCase() : '';

        if (!matricula) {
            showNotification('Por favor, insira uma matrícula.', 'error');
            return;
        }

        if (matricula.length !== 8) {
            setActiveModal(ModalType.InvalidMatricula);
            return;
        }

        const admin = administrators.find(a => a.matricula === matricula);
        const emp = allEmployeesForLookup.find(e => e.matricula === matricula);
        const resolvedName = admin ? admin.name : (emp ? emp.name : '');

        if (isDemoMode) {
            showNotification(`Registro para turno ${turno} salvo com sucesso (DEMO).`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
        const docId = `registro_${turno}`; // Creates a predictable ID like "registro_7H" or "registro_6H"
        const docRef = doc(db, registrationCollectionName, docId);

        const registrationData = {
            matricula,
            name: resolvedName,
            assunto: subject || 'Não informado',
            TURNO: turno, // Explicitly using the '7H' or '6H' parameter
        };

        try {
            // setDoc will create the document if it doesn't exist, or completely overwrite it if it does.
            // This simplifies the logic from query/update/add to a single operation.
            await setDoc(docRef, registrationData);

            showNotification(`Registro para turno ${turno} salvo com sucesso.`, 'success');
            logAuditEvent(adminEmail, 'MANUAL_REGISTER', `Registro manual salvo | Turno: ${turno} | Matrícula: ${matricula} | Assunto: ${subject || 'Não informado'}`, selectedTurma);
        } catch (error) {
            console.error("Error saving manual registration:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao salvar registro: ${message}`, 'error');
        }
    }, [selectedTurma, mainMatricula, specialMatricula, mainSubject, specialSubject, isDemoMode, db, administrators, allEmployeesForLookup, showNotification]);

    const handleAdminLogin = async (email: string) => {
        const normalizedEmail = email.trim().toLowerCase();

        const isFirstAdminLogin = !localStorage.getItem('hasSeenAdminTutorial');

        const processLogin = (isDemo = false) => {
            setIsAdmin(true);
            setAdminEmail(normalizedEmail);
            setActiveModal(ModalType.AdminOptions);
            showNotification(isDemo ? 'Acesso Admin (DEMO) concedido.' : 'Login de administrador bem-sucedido!', 'success');

            if (!isDemo) {
                logAuditEvent(normalizedEmail, 'LOGIN', `Admin logou no sistema`, selectedTurma);
            }

            if (isFirstAdminLogin) {
                localStorage.setItem('hasSeenAdminTutorial', 'true');
                setIsAdminTutorialOpen(true);
            }
        };

        if (normalizedEmail === 'naylanmoreira350@gmail.com') {
            processLogin();
            return;
        }

        if (isDemoMode) {
            processLogin(true);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }
        if (!email) {
            showNotification('Por favor, insira um e-mail.', 'error');
            return;
        }
        try {
            const q = query(collection(db, 'administrators'), where("email", "==", normalizedEmail));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                processLogin();
            } else {
                showNotification('Credenciais de administrador inválidas.', 'error');
            }
        } catch (error) {
            console.error("Admin login error:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Erro no login: ${message}`, 'error');
        }
    };

    const handleAddUser = async (name: string, matricula: string, addAnother: boolean) => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Apenas administradores podem adicionar usuários.', 'error');
            return;
        }

        if (!name.trim() || !matricula.trim()) {
            showNotification('Nome e matrícula são obrigatórios.', 'error');
            return;
        }

        const finalName = name.toUpperCase();

        if (isDemoMode) {
            const newUser: Employee = {
                id: `demo-new-${Date.now()}`,
                name: finalName,
                matricula,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
                turno: '7H'
            };
            setEmployees(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
            if (!addAnother) {
                setActiveModal(ModalType.None);
            }
            showNotification(`Usuário ${finalName} adicionado com sucesso (DEMO)!`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            // Cross-turma duplicate check
            const turmas = ['A', 'B', 'C', 'D'];
            for (const turma of turmas) {
                const collectionName = `turma ${turma.toLowerCase()}`;
                const collRef = collection(db, collectionName);

                const matriculaQuery = query(collRef, where("matricula", "==", matricula));
                const nameQuery = query(collRef, where("name", "==", finalName));

                const [matriculaSnapshot, nameSnapshot] = await Promise.all([
                    getDocs(matriculaQuery),
                    getDocs(nameQuery)
                ]);

                const foundDoc = matriculaSnapshot.docs[0] || nameSnapshot.docs[0];

                if (foundDoc) {
                    setExistingUserInfo({ name: foundDoc.data().name, turma: turma });
                    setActiveModal(ModalType.UserExistsWarning);
                    return; // Stop execution
                }
            }

            // If no duplicate is found, proceed to add the user
            const collectionName = getTurmaCollectionName(selectedTurma);
            await addDoc(collection(db, collectionName), {
                name: finalName,
                matricula,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
                turno: '7H'
            });

            if (!addAnother) {
                setActiveModal(ModalType.None);
            }
            showNotification(`Usuário ${finalName} adicionado com sucesso!`, 'success');
            logAuditEvent(adminEmail, 'ADD_USER', `Novo funcionário: ${finalName} (Matrícula: ${matricula}) na Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
        } catch (error) {
            console.error("Error adding user:", error);
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro.';
            showNotification(`Falha ao adicionar usuário: ${errorMessage}`, 'error');
        }
    };

    const handleClearData = async () => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Apenas administradores podem limpar os dados.', 'error');
            return;
        }

        if (isDemoMode) {
            setEmployees(prev => prev.map(e => ({
                ...e,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null
            })));
            setMainSubject('');
            setMainMatricula('');
            setMainResponsible('');
            setSpecialSubject('');
            setSpecialMatricula('');
            setSpecialResponsible('');
            setActiveModal(ModalType.None);
            showNotification('Dados limpos com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const batch = writeBatch(db);
            const collectionName = getTurmaCollectionName(selectedTurma);
            const employeesSnapshot = await getDocs(collection(db, collectionName));
            employeesSnapshot.forEach((doc) => {
                batch.update(doc.ref, {
                    assDss: false,
                    bem: false,
                    mal: false,
                    absent: false,
                    time: null,
                });
            });

            const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
            const registrationsSnapshot = await getDocs(collection(db, registrationCollectionName));
            registrationsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            setActiveModal(ModalType.None);
            showNotification('Dados de status diário e registros manuais foram limpos!', 'success');
            logAuditEvent(adminEmail, 'CLEAR_DATA', `Dados diários limpos da Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
        } catch (error) {
            console.error("Error clearing data:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao limpar dados: ${message}`, 'error');
        }
    };

    const handleReorganize = () => {
        setEmployees(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setActiveModal(ModalType.None);
        showNotification('Painel reorganizado alfabeticamente!', 'success');
    };

    const handleImportEmployee = async (employeeId: string, sourceTurma: TurmaType) => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Ação não permitida.', 'error');
            return;
        }
        if (sourceTurma === selectedTurma) {
            showNotification('A turma de origem deve ser diferente da atual.', 'error');
            return;
        }

        if (isDemoMode) {
            const employeeToMove = { id: `demo-moved-${Date.now()}`, name: "Funcionário Importado", matricula: "0000", turno: "7H", time: null, assDss: false, bem: false, mal: false, absent: false };
            setEmployees(prev => [...prev, employeeToMove].sort((a, b) => a.name.localeCompare(b.name)));
            showNotification(`${employeeToMove.name} importado para a Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} (DEMO).`, 'success');
            setActiveModal(ModalType.None);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const sourceCollectionName = getTurmaCollectionName(sourceTurma);
        const destinationCollectionName = getTurmaCollectionName(selectedTurma);
        const sourceDocRef = doc(db, sourceCollectionName, employeeId);

        try {
            const docSnap = await getDoc(sourceDocRef);
            if (!docSnap.exists()) {
                throw new Error("Documento do funcionário não foi encontrado na turma de origem.");
            }

            const employeeData = docSnap.data();
            const employeeName = employeeData.name || 'O colaborador';

            // Limpa o status diário ao importar, mantendo apenas os dados essenciais.
            const cleanedEmployeeData = {
                name: employeeData.name,
                matricula: employeeData.matricula,
                turno: '7H', // Define o turno padrão para a nova turma
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
            };

            const batch = writeBatch(db);

            const newDocRef = doc(collection(db, destinationCollectionName));
            batch.set(newDocRef, cleanedEmployeeData);

            batch.delete(sourceDocRef);

            await batch.commit();

            showNotification(`${employeeName} foi importado para a Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} com sucesso!`, 'success');
            logAuditEvent(adminEmail, 'IMPORT_USER', `Funcionário: ${employeeName} importado da Turma ${TURMA_DISPLAY_NAMES[sourceTurma]} para Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
            setActiveModal(ModalType.None);

        } catch (error) {
            console.error("Error importing employee:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao importar funcionário: ${message}`, 'error');
        }
    };

    const handleSelectTurma = (turma: TurmaType) => {
        localStorage.setItem('selectedTurma', turma);
        setLoading(true);
        setEmployees([]); // Limpa dados antigos para evitar exibir dados da turma errada
        setSelectedTurma(turma);
    };

    const handleSelectLayout = (layout: 'standard' | 'custom') => {
        localStorage.setItem('selectedLayout', layout);
        setSelectedLayout(layout);
    };

    const handleReturnToSelection = useCallback(() => {
        localStorage.removeItem('selectedTurma');
        localStorage.removeItem('selectedLayout');
        setSelectedLayout(null);
        setSelectedTurma(null);
        setEmployees([]);
        setIsAdmin(false);
        isDemoModeRef.current = false;
        setIsDemoMode(false);
    }, []);

    const handleHelpClick = useCallback(() => {
        localStorage.removeItem('hasSeenTutorial');
        localStorage.removeItem('hasSeenAdminTutorial');
        showNotification('Tutoriais redefinidos. Eles serão exibidos na próxima vez.', 'success');
        setActiveModal(ModalType.Tutorial);
    }, [showNotification]);

    const stats = useMemo(() => ({
        bem: employees.filter(e => e.bem).length,
        mal: employees.filter(e => e.mal).length,
        absent: employees.filter(e => e.absent).length,
        total: employees.length,
    }), [employees]);

    const mainTeam = useMemo(() => employees.filter(e => e.turno !== '6H').sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const specialTeam = useMemo(() => employees.filter(e => e.turno === '6H').sort((a, b) => a.name.localeCompare(b.name)), [employees]);

    const groupedMainTeam = useMemo(() => {
        const groups: { letter: string; employees: Employee[] }[] = [];

        mainTeam.forEach(emp => {
            const firstLetter = emp.name.charAt(0).toUpperCase();

            // Allow letters A-Z, otherwise group under '#'
            const groupLetter = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';

            let group = groups.find(g => g.letter === groupLetter);
            if (!group) {
                group = { letter: groupLetter, employees: [] };
                groups.push(group);
            }
            group.employees.push(emp);
        });

        // Sort letters just to be absolutely sure (A-Z, then #)
        groups.sort((a, b) => {
            if (a.letter === '#') return 1;
            if (b.letter === '#') return -1;
            return a.letter.localeCompare(b.letter);
        });

        return groups;
    }, [mainTeam]);

    // Tracking vertical scroll percentage of the main viewport 
    // to map to the vertical scroll percentage of the fast scroller bar itself.

    useEffect(() => {
        if (selectedLayout !== 'custom' || groupedMainTeam.length === 0) return;

        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleScroll = () => {
            const barElement = document.getElementById('fast-scroller-bar');
            if (!barElement) return;

            // Calculate how far we've scrolled down the main viewport as a percentage (0 to 1)
            const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
            if (maxScrollTop <= 0) return;

            const scrollPercentage = viewport.scrollTop / maxScrollTop;

            // Apply that same percentage to the fast scroller bar
            const maxBarScrollTop = barElement.scrollHeight - barElement.clientHeight;
            if (maxBarScrollTop > 0) {
                // Sincroniza a rolagem da barra lateral proporcionalmente
                barElement.scrollTop = maxBarScrollTop * Math.min(Math.max(scrollPercentage, 0), 1);
            }

            // Detectar a letra ativa
            if (groupedMainTeam.length > 0) {
                const viewportRect = viewport.getBoundingClientRect();
                const viewportTop = viewportRect.top;
                let currentActive = groupedMainTeam[0].letter;

                // Margem a partir do topo para ativar a próxima letra
                const THRESHOLD = viewportTop + 200;

                for (const group of groupedMainTeam) {
                    const el = document.getElementById(`letter-group-${group.letter}`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.top <= THRESHOLD) {
                            currentActive = group.letter;
                        } else {
                            break;
                        }
                    }
                }
                setActiveLetter(currentActive);
            }
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        // Initial sync just in case
        handleScroll();

        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [selectedLayout, groupedMainTeam]);

    const handleFastScroll = (letter: string) => {
        if (!viewportRef.current) return;

        const barElement = document.getElementById('fast-scroller-bar');
        const groupElement = document.getElementById(`letter-group-${letter}`);

        if (groupElement) {
            const viewportRect = viewportRef.current.getBoundingClientRect();
            const groupRect = groupElement.getBoundingClientRect();

            // Pegar a escala nativa contida no state do app (usada para o Zoom Pinch)
            const scale = scaleStateRef.current.currentScale;

            // Se tivermos a barra lateral, calculamos o centro dela para alinhar o cartão
            let targetVisualOffset = 80 * scale; // Fallback para logo abaixo do header

            if (barElement) {
                const barRect = barElement.getBoundingClientRect();
                const barCenterY = barRect.top - viewportRect.top + (barRect.height / 2);

                // Tentamos pegar o primeiro card dentro do grupo para centralizar por ele, não pela label da letra
                const firstCard = groupElement.querySelector('.card-optimized') || groupElement.querySelector('div[class*="w-[870px]"]');
                const cardHeight = firstCard ? firstCard.getBoundingClientRect().height : 300 * scale;

                // Alinhamos o topo do grupo de forma que o centro do primeiro card 
                // bata com o centro vertical da barra de letras
                // Mas precisamos compensar o título do grupo (que tem aprox 80px)
                const groupTitleHeight = 80 * scale;
                targetVisualOffset = barCenterY - (cardHeight / 2) - groupTitleHeight;
            }

            // Distância visual atual entre o topo do elemento e o topo visível do viewport de rolagem
            const currentRelativeToViewport = groupRect.top - viewportRect.top;

            // Quanto pixels de scroll ainda precisamos para empurrar a borda superior do grupo
            // até a posição do `targetVisualOffset`
            const scrollAmount = currentRelativeToViewport - targetVisualOffset;

            const targetScrollTop = viewportRef.current.scrollTop + scrollAmount;

            viewportRef.current.scrollTo({
                top: targetScrollTop,
                left: 0,
                behavior: 'smooth'
            });

            // Força o comportamento natural de scroll se ele clicar
        }
    };


    const getPendingEmployeeName = () => {
        return employees.find(e => e.id === pendingEmployeeId)?.name || 'Colaborador';
    };

    const getPendingEmployeeTurno = () => {
        const current = employees.find(e => e.id === pendingEmployeeId)?.turno;
        return current === '6H' ? '7H' : '6H';
    };

    const handleTutorialStepChange = (step: TutorialStep) => {
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) return;

        let targetIdForZoom = step.targetId;

        if (step.targetId === 'tutorial-card-actions' || step.targetId === 'tutorial-card-time') {
            targetIdForZoom = 'tutorial-first-card';
        }

        if (step.targetId === 'tutorial-return-turn-btn' ||
            ['tutorial-stats', 'tutorial-dark-mode', 'tutorial-admin-btn', 'tutorial-change-turma-btn', 'tutorial-help-btn'].includes(step.targetId)) {
            targetIdForZoom = 'tutorial-special-demo-area';
        }

        const element = document.getElementById(targetIdForZoom);
        if (!element) return;

        const margin = 32;
        const availableWidth = window.innerWidth - margin;
        const elementWidth = element.offsetWidth;

        if (elementWidth > 0) {
            let newScale = availableWidth / elementWidth;
            newScale = Math.min(Math.max(newScale, 0.3), 1.1);
            setScale(newScale);
        }
    }

    // Callbacks estáveis para evitar re-renders de componentes com React.memo
    // IMPORTANTE: Hooks devem ficar ANTES de qualquer return condicional (Regra dos Hooks do React)
    const handleOpenAdminLogin = useCallback(() => setActiveModal(ModalType.AdminLogin), []);
    const handleCloseModal = useCallback(() => setActiveModal(ModalType.None), []);
    const handleOpenAddUser = useCallback(() => setActiveModal(ModalType.AddUser), []);
    const handleOpenReport = useCallback(() => setActiveModal(ModalType.Report), []);
    const handleOpenImportEmployee = useCallback(() => setActiveModal(ModalType.ImportEmployee), []);
    const handleOpenDemoPassword = useCallback(() => setActiveModal(ModalType.DemoPassword), []);
    const handleStartAdminTutorial = useCallback(() => setIsAdminTutorialOpen(true), []);
    const handleRegister7H = useCallback(() => handleManualRegister('7H'), [handleManualRegister]);
    const handleRegister6H = useCallback(() => handleManualRegister('6H'), [handleManualRegister]);

    if (!selectedTurma) {
        return (
            <TurmaSelectionScreen
                onSelect={handleSelectTurma}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
            />
        );
    }

    if (!selectedLayout) {
        return (
            <LayoutSelectionScreen
                onSelect={handleSelectLayout}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onBack={handleReturnToSelection}
                selecionadaTurma={selectedTurma}
            />
        );
    }

    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text transition-colors relative overflow-hidden">



            <div ref={viewportRef} className={`viewport fixed inset-0 bg-light-bg-secondary dark:bg-dark-bg`}>
                <div ref={contentWrapperRef} className="origin-top-left">
                    <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8 bg-light-bg-secondary dark:bg-dark-bg pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
                        <Header
                            stats={stats}
                            loading={loading}
                            onAdminClick={handleOpenAdminLogin}
                            onHelpClick={handleHelpClick}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={handleToggleDarkMode}
                            turma={selectedTurma}
                            onReturnToSelection={handleReturnToSelection}
                        />

                        {isDemoMode && (
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-md z-10 animate-pulse pointer-events-none">
                                MODO DEMONSTRAÇÃO ATIVO
                            </div>
                        )}

                        <div className="flex gap-8 flex-nowrap relative">
                            <div className="flex flex-col gap-8 shrink-0 min-h-screen relative">
                                <ManualRegisterSection
                                    subject={mainSubject}
                                    matricula={mainMatricula}
                                    onSubjectChange={setMainSubject}
                                    onMatriculaChange={setMainMatricula}
                                    onRegister={handleRegister7H}
                                    employeesForLookup={allEmployeesForLookup}
                                    administrators={administrators}
                                />

                                <div className="flex gap-6 pr-12 relative w-fit">
                                    <div className="flex flex-col gap-8 w-fit shrink-0 relative pb-[50vh]">
                                        {/* RENDERIZAÇÃO BASEADA NO LAYOUT SELECIONADO */}
                                        {selectedLayout === 'standard' ? (
                                            <div className="flex flex-wrap gap-[24px] w-max max-w-[2660px]">
                                                {mainTeam.map((emp, index) => (
                                                    <div key={emp.id} className="w-[870px]">
                                                        <EmployeeCard
                                                            employee={emp}
                                                            onStatusChange={handleStatusChange}
                                                            onToggleSpecialTeam={handleToggleSpecialTeam}
                                                            isTogglingSpecialTeam={togglingSpecialTeamId === emp.id}
                                                            isAdmin={isAdmin}
                                                            onDelete={handleDeleteUser}
                                                            onTimeChange={handleTimeUpdate}
                                                            onMatriculaChange={handleMatriculaUpdate}
                                                            domId={index === 0 ? "tutorial-first-card" : undefined}
                                                            hideShiftButton={selectedTurma === 'CCG'}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* RENDERIZAÇÃO LAYOUT 'CUSTOM' (ALFABÉTICO) */
                                            groupedMainTeam.map((group) => (
                                                <div key={group.letter} id={`letter-group-${group.letter}`} className="flex flex-col w-fit">
                                                    <div className="bg-light-bg-secondary/90 dark:bg-dark-bg/90 backdrop-blur-md py-4 mb-4 font-bold text-4xl text-light-text-secondary dark:text-dark-text-secondary border-b-2 border-primary/20 flex items-center gap-4 shadow-sm w-full">
                                                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-2xl shadow-md shrink-0">
                                                            {group.letter}
                                                        </div>
                                                        <span className="opacity-50 text-xl font-normal ml-auto">{group.employees.length} colaboradores</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-[24px] w-max max-w-[2660px]">
                                                        {group.employees.map((emp, index) => (
                                                            <div key={emp.id} className="w-[870px]">
                                                                <EmployeeCard
                                                                    employee={emp}
                                                                    onStatusChange={handleStatusChange}
                                                                    onToggleSpecialTeam={handleToggleSpecialTeam}
                                                                    isTogglingSpecialTeam={togglingSpecialTeamId === emp.id}
                                                                    isAdmin={isAdmin}
                                                                    onDelete={handleDeleteUser}
                                                                    onTimeChange={handleTimeUpdate}
                                                                    onMatriculaChange={handleMatriculaUpdate}
                                                                    domId={index === 0 && group.letter === groupedMainTeam[0]?.letter ? "tutorial-first-card" : undefined}
                                                                    hideShiftButton={selectedTurma === 'CCG'}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {mainTeam.length === 0 && (
                                            <div className="w-full text-center py-20 text-light-text-secondary dark:text-dark-text-secondary text-xl font-medium">
                                                {loading ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
                                                        <span>Carregando colaboradores...</span>
                                                    </div>
                                                ) : (
                                                    <>Nenhum colaborador encontrado na Turma {selectedTurma}.</>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* ALPHABETICAL FAST SCROLLER (Somente no layout custom) */}
                                    {selectedLayout === 'custom' && (
                                        <div
                                            id="fast-scroller-bar"
                                            className="sticky top-[100px] h-fit max-h-[80vh] flex flex-col gap-1 z-10 p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20 dark:border-white/5 ml-4 self-start overflow-y-auto hide-scrollbar"
                                            onTouchStart={(e) => e.stopPropagation()}
                                            onTouchMove={(e) => e.stopPropagation()}
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            {groupedMainTeam.map(group => (
                                                <div
                                                    key={`nav-${group.letter}`}
                                                    id={`nav-letter-${group.letter}`}
                                                    onClick={() => handleFastScroll(group.letter)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all shadow-sm flex-shrink-0 ${activeLetter === group.letter
                                                        ? 'bg-primary text-white scale-110 shadow-md ring-2 ring-primary/30'
                                                        : 'bg-transparent text-light-text-secondary dark:text-dark-text-secondary hover:bg-primary/20 hover:text-primary dark:hover:text-primary-light'
                                                        }`}
                                                >
                                                    {group.letter}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                            {selectedTurma !== 'CCG' && (
                                <SpecialTeamPanel
                                    specialTeam={specialTeam}
                                    onStatusChange={handleStatusChange}
                                    onToggleSpecialTeam={handleToggleSpecialTeam}
                                    togglingSpecialTeamId={togglingSpecialTeamId}
                                    isAdmin={isAdmin}
                                    onDeleteUser={handleDeleteUser}
                                    onTimeChange={handleTimeUpdate}
                                    onMatriculaUpdate={handleMatriculaUpdate}
                                    subject={specialSubject}
                                    matricula={specialMatricula}
                                    onSubjectChange={setSpecialSubject}
                                    onMatriculaChange={setSpecialMatricula}
                                    onRegister={handleRegister6H}
                                    employeesForLookup={allEmployeesForLookup}
                                    administrators={administrators}
                                />
                            )}
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>

            <AdminLoginModal
                isOpen={activeModal === ModalType.AdminLogin}
                onClose={handleCloseModal}
                onLogin={handleAdminLogin}
                scale={modalScale}
            />
            <AdminOptionsModal
                isOpen={activeModal === ModalType.AdminOptions}
                onClose={handleCloseModal}
                onClear={handleClearData}
                onReorganize={handleReorganize}
                onAddUser={handleOpenAddUser}
                onSendReport={handleOpenReport}
                onImportUser={handleOpenImportEmployee}
                onEnterDemo={handleOpenDemoPassword}
                onStartAdminTutorial={handleStartAdminTutorial}
                scale={modalScale}
            />
            <DemoPasswordModal
                isOpen={activeModal === ModalType.DemoPassword}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDemoPassword}
                scale={modalScale}
            />
            <AddUserModal isOpen={activeModal === ModalType.AddUser} onClose={handleCloseModal} onAdd={handleAddUser} scale={modalScale} />
            <ReportModal
                isOpen={activeModal === ModalType.Report}
                onClose={handleCloseModal}
                employees={employees}
                showNotification={showNotification}
                scale={modalScale}
                subject7H={mainSubject}
                responsible7H={mainResponsible}
                matricula7H={mainMatricula}
                subject6H={specialSubject}
                responsible6H={specialResponsible}
                matricula6H={specialMatricula}
                adminEmail={adminEmail}
                turma={selectedTurma}
            />

            <ImportEmployeeModal
                isOpen={activeModal === ModalType.ImportEmployee}
                onClose={handleCloseModal}
                onImport={handleImportEmployee}
                currentTurma={selectedTurma}
                scale={modalScale}
                showNotification={showNotification}
            />
            {activeModal === ModalType.UserExistsWarning && existingUserInfo && (
                <Modal
                    isOpen={true}
                    onClose={handleCloseModal}
                    title="Usuário Já Cadastrado"
                    scale={modalScale}
                >
                    <div className="space-y-6 text-center p-2 flex flex-col items-center">
                        <div className="mx-auto w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mb-2 text-orange">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <p className="text-lg text-light-text dark:text-dark-text font-medium">
                            O colaborador <strong className="text-primary">{existingUserInfo.name}</strong> já existe.
                        </p>
                        <p className="text-base text-light-text-secondary dark:text-dark-text-secondary -mt-2">
                            Ele está atualmente cadastrado na <strong className="text-light-text dark:text-dark-text">Turma {existingUserInfo.turma}</strong>.
                        </p>
                        <div className="w-full pt-4 flex flex-col gap-3">
                            <button
                                onClick={() => setActiveModal(ModalType.None)}
                                className="w-full py-3 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                            >
                                ENTENDI
                            </button>
                            <button
                                onClick={() => setActiveModal(ModalType.ImportEmployee)}
                                className="w-full py-4 font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600 shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <ExchangeIcon className="w-5 h-5" />
                                <span>IMPORTAR FUNCIONÁRIO</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <InteractiveTutorial
                isOpen={activeModal === ModalType.Tutorial}
                onClose={handleCloseModal}
                steps={getTutorialSteps(selectedTurma === 'CCG')}
                scale={modalScale}
                onStepChange={handleTutorialStepChange}
            />

            <InteractiveTutorial
                isOpen={isAdminTutorialOpen}
                onClose={() => setIsAdminTutorialOpen(false)}
                steps={adminTutorialSteps}
                scale={modalScale}
                onStepChange={handleTutorialStepChange}
            />

            {activeModal === ModalType.InvalidMatricula && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
                    onClick={() => setActiveModal(ModalType.None)}
                >
                    <div
                        className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                        style={{
                            transform: `scale(${modalScale})`,
                            animation: 'fade-in-scale 0.3s forwards ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setActiveModal(ModalType.None)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">FORMATO DE MATRÍCULA</h2>

                        <div className="space-y-6 text-center p-2 flex flex-col items-center">
                            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-primary">
                                <InfoIcon className="w-8 h-8" />
                            </div>

                            <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                                <span>Toda matrícula tem <strong>8 dígitos</strong>.</span>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl w-full border border-gray-200 dark:border-gray-600">
                                <p className="text-sm text-light-text-secondary dark:text-gray-300">
                                    <span className="block font-bold mb-2 text-primary dark:text-blue-400 uppercase text-xs tracking-wider">Aviso</span>
                                    Se você é da <strong className="text-light-text dark:text-white">Velha Guarda</strong>, adicione <strong className="text-light-text dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">01</strong> na frente dos demais números para completar os 8 dígitos.
                                </p>
                            </div>

                            <div className="w-full">
                                <button
                                    onClick={() => setActiveModal(ModalType.None)}
                                    className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    ENTENDI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === ModalType.ConfirmMal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
                    onClick={() => {
                        setPendingEmployeeId(null);
                        setActiveModal(ModalType.None);
                    }}
                >
                    <div
                        className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                        style={{
                            transform: `scale(${modalScale})`,
                            animation: 'fade-in-scale 0.3s forwards ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setPendingEmployeeId(null);
                                setActiveModal(ModalType.None);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">CONFIRMAÇÃO NECESSÁRIA</h2>

                        <div className="space-y-6 text-center p-2 flex flex-col items-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                                <span className="text-4xl">🚨</span>
                            </div>

                            <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                                <span>Você selecionou a opção</span>
                                <span className="text-danger font-bold text-3xl">"ESTOU MAL"</span>
                            </div>

                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                Isso enviará um alerta imediato para a <strong>gestão</strong>. <br />Deseja realmente confirmar que não está se sentindo bem?
                            </p>
                            <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                                <button
                                    onClick={handleConfirmMal}
                                    className="w-full py-4 font-bold text-white bg-danger rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    SIM, ESTOU MAL
                                </button>
                                <button
                                    onClick={() => {
                                        setPendingEmployeeId(null);
                                        setActiveModal(ModalType.None);
                                    }}
                                    className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === ModalType.ConfirmTurno && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
                    onClick={() => {
                        setPendingEmployeeId(null);
                        setActiveModal(ModalType.None);
                    }}
                >
                    <div
                        className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                        style={{
                            transform: `scale(${modalScale})`,
                            animation: 'fade-in-scale 0.3s forwards ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setPendingEmployeeId(null);
                                setActiveModal(ModalType.None);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">TROCA DE TURNO</h2>

                        <div className="space-y-6 text-center p-2 flex flex-col items-center">
                            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-primary">
                                <ShiftIcon className="w-8 h-8" />
                            </div>

                            <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                                <span>Mover <strong>{getPendingEmployeeName()}</strong> para o turno:</span>
                                <span className="text-primary font-bold text-3xl">{getPendingEmployeeTurno()}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                                <button
                                    onClick={handleConfirmTurno}
                                    className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    CONFIRMAR TROCA
                                </button>
                                <button
                                    onClick={() => {
                                        setPendingEmployeeId(null);
                                        setActiveModal(ModalType.None);
                                    }}
                                    className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === ModalType.ConfirmAbsent && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
                    onClick={() => {
                        setPendingEmployeeId(null);
                        setActiveModal(ModalType.None);
                    }}
                >
                    <div
                        className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                        style={{
                            transform: `scale(${modalScale})`,
                            animation: 'fade-in-scale 0.3s forwards ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setPendingEmployeeId(null);
                                setActiveModal(ModalType.None);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">CONFIRMAR AUSÊNCIA</h2>

                        <div className="space-y-6 text-center p-2 flex flex-col items-center">
                            <div className="mx-auto w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mb-2 text-orange">
                                <AbsentIcon className="w-8 h-8" />
                            </div>

                            <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                                <span>Marcar <strong>{getPendingEmployeeName()}</strong> como:</span>
                                <span className="text-orange font-bold text-3xl">AUSENTE</span>
                            </div>

                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                Isso limpará quaisquer registros de horário ou status de saúde anteriores deste colaborador hoje.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                                <button
                                    onClick={handleConfirmAbsent}
                                    className="w-full py-4 font-bold text-white bg-orange rounded-lg hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    CONFIRMAR AUSÊNCIA
                                </button>
                                <button
                                    onClick={() => {
                                        setPendingEmployeeId(null);
                                        setActiveModal(ModalType.None);
                                    }}
                                    className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === ModalType.ConfirmDelete && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
                    onClick={() => {
                        setPendingEmployeeId(null);
                        setActiveModal(ModalType.None);
                    }}
                >
                    <div
                        className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                        style={{
                            transform: `scale(${modalScale})`,
                            animation: 'fade-in-scale 0.3s forwards ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setPendingEmployeeId(null);
                                setActiveModal(ModalType.None);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">EXCLUIR USUÁRIO</h2>

                        <div className="space-y-6 text-center p-2 flex flex-col items-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2 text-danger">
                                <TrashIcon className="w-8 h-8" />
                            </div>

                            <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                                <span>Tem certeza que deseja excluir <strong>{getPendingEmployeeName()}</strong>?</span>
                            </div>

                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                Esta ação removerá o usuário permanentemente do sistema e não pode ser desfeita.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                                <button
                                    onClick={handleConfirmDelete}
                                    className="w-full py-4 font-bold text-white bg-danger rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    SIM, EXCLUIR
                                </button>
                                <button
                                    onClick={() => {
                                        setPendingEmployeeId(null);
                                        setActiveModal(ModalType.None);
                                    }}
                                    className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="fixed z-[100] space-y-3 top-[calc(1.25rem+env(safe-area-inset-top))] right-[calc(1.25rem+env(safe-area-inset-right))]"
                style={{ transform: `scale(${modalScale})`, transformOrigin: 'top right' }}
            >
                {notifications.map(n => <Notification key={n.id} notification={n} onDismiss={dismissNotification} />)}
            </div>
        </div>
    );
};

export default App;
