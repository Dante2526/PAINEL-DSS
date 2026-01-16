




















import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import EmployeeCard from './components/EmployeeCard';
import SpecialTeamPanel from './components/SpecialTeamPanel';
import Modal from './components/Modal';
import Notification from './components/Notification';
import Footer from './components/Footer';
import InteractiveTutorial, { TutorialStep } from './components/InteractiveTutorial';
import TurmaSelectionScreen from './components/TurmaSelectionScreen';
import { SubjectIcon, UserIcon, EraserIcon, FileTextIcon, SortIcon, UserPlusIcon, ShiftIcon, AbsentIcon, TrashIcon, ExchangeIcon, MousePointerIcon, InfoIcon } from './components/icons';
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
    setDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './styles.css';
import { formatTimestamp } from './services/employeeService';

// --- CONFIGURAÇÃO EMAILJS ---
const EMAILJS_SERVICE_ID = "service_adjw0cj";
const EMAILJS_TEMPLATE_ID = "template_owo0dmm";
const EMAILJS_PUBLIC_KEY = "Ef-7IoF9U9NQ_iV8X";
// ----------------------------

const tutorialSteps: TutorialStep[] = [
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
        content: 'Use "TURNO 6H" para mover o colaborador para uma coluna somente para esse turno. Use "AUSENTE" para marcar que o colaborador faltou. Use "DELETAR" para remover permanentemente o usuário (Aparece somente para-ADM).',
        scrollTargetId: 'tutorial-first-card' 
    },
    {
        targetId: 'tutorial-card-time',
        title: 'Registro de Horário',
        content: 'Aqui fica registrado o momento exato em que o colaborador assinou sua DSS',
        scrollTargetId: 'tutorial-first-card' 
    },
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
    },
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
];

const adminTutorialSteps: TutorialStep[] = [
    {
        targetId: 'admin-clear-btn',
        title: 'Limpar Status Diário',
        content: 'O sistema realiza a limpeza automática diariamente. Use esta opção apenas caso seja realmente necessário forçar o reset de todos os status manually.'
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
    employees: Employee[];
    administrators: Administrator[];
}> = ({ subject, matricula, onSubjectChange, onMatriculaChange, onRegister, employees, administrators }) => {
    const foundName = useMemo(() => {
        if (!matricula) return '';
        const admin = administrators.find(a => a.matricula === matricula);
        if (admin) return admin.name;
        
        const employee = employees.find(e => e.matricula === matricula);
        return employee ? employee.name : '';
    }, [matricula, employees, administrators]);

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
    onEnterDemo: () => void;
    scale: number;
}> = ({ isOpen, onClose, onClear, onReorganize, onAddUser, onSendReport, onEnterDemo, scale }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Painel do Administrador" scale={scale}>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    id="admin-clear-btn"
                    onClick={onClear} 
                    className="p-4 bg-orange text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-600 transition shadow-lg"
                >
                    <EraserIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">LIMPAR TUDO</span>
                </button>

                 <button 
                    id="admin-report-btn"
                    onClick={onSendReport}
                    className="p-4 bg-blue-500 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg"
                >
                    <FileTextIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">RELATÓRIO</span>
                </button>

                 <button 
                    id="admin-reorganize-btn"
                    onClick={onReorganize}
                    className="p-4 bg-purple-500 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-purple-600 transition shadow-lg"
                >
                    <SortIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">REORGANIZAR</span>
                </button>
                
                <button 
                    id="admin-adduser-btn"
                    onClick={onAddUser}
                    className="p-4 bg-green-500 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg"
                >
                    <UserPlusIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">ADD USUÁRIO</span>
                </button>

                <button 
                    id="admin-demo-btn"
                    onClick={() => { onEnterDemo(); onClose(); }}
                    className="col-span-2 p-4 bg-gray-700 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg mt-2 border border-gray-500"
                >
                    <MousePointerIcon className="w-6 h-6" />
                    <span className="font-bold text-sm">MODO DEMONSTRAÇÃO</span>
                </button>
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
            setName('');
            setMatricula('');
            if (addAnother) {
                nameInputRef.current?.focus();
            }
        }
    };
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value.toUpperCase());
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Colaborador" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="Nome e Sobrenome"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white uppercase"
                    autoFocus
                />
                <p className="text-xs text-left text-warning font-semibold px-1 !-mt-2">
                    *Coloque apenas o primeiro nome e o último sobrenome
                </p>
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
}> = ({ isOpen, onClose, employees, showNotification, scale, subject7H, responsible7H, matricula7H, subject6H, responsible6H, matricula6H }) => {
    // Generate text for Clipboard/File functions
    const generateReport = () => {
        // Filter groups by Turno
        const team7H = employees.filter(e => e.turno !== '6H');
        const team6H = employees.filter(e => e.turno === '6H');

        const totalEmployees = employees.length;
        const totalPresent = employees.filter(e => e.bem || e.assDss || e.mal).length;
        // Grouping Pending and Absent together for the summary count
        const totalPendingAbsent = employees.filter(e => !e.bem && !e.assDss && !e.mal).length;

        
        let report = `RESUMO GERAL\n`;
        report += `Total de Funcionários: ${totalEmployees}\n`;
        report += `Presentes (DSS + Bem/Mal): ${totalPresent}\n`;
        report += `Pendentes / Ausentes: ${totalPendingAbsent}\n\n`;

        // Helper to generate section list
        const getStatusList = (team: Employee[]) => {
            const bem = team.filter(e => e.bem || e.assDss);
            const mal = team.filter(e => e.mal);
            const pendingAbsent = team.filter(e => !e.bem && !e.assDss && !e.mal);

            let section = `STATUS: "ASS.DSS + ESTOU BEM"\n`;
            section += bem.length > 0 ? bem.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\n"ESTOU MAL"\n`;
            section += mal.length > 0 ? mal.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nPENDENTES / AUSENTES\n`;
            section += pendingAbsent.length > 0 ? pendingAbsent.map(e => `${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            
            return section;
        };

        report += `EQUIPE TURNO 7H\n`;
        report += getStatusList(team7H);
        report += `\n\n`;

        report += `EQUIPE TURNO 6H\n`;
        report += getStatusList(team6H);
        report += `\n\n`;

        // Footer Section with Registries
        report += `REGISTROS DSS (TURNO 7H)\n`;
        report += `Assunto: ${subject7H || 'NÃO INFORMADO'}`;
        if (responsible7H) {
            // Using a new line for Responsible to be clear, including Matricula
            report += `\nResponsável: ${responsible7H} (Matrícula: ${matricula7H || '---'})\n`;
        } else {
             report += `\n`;
        }

        report += `\nREGISTROS DSS (TURNO 6H)\n`;
        report += `Assunto: ${subject6H || 'NÃO INFORMADO'}`;
        if (responsible6H) {
            report += `\nResponsável: ${responsible6H} (Matrícula: ${matricula6H || '---'})\n`;
        } else {
             report += `\n`;
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
        onClose();
    };

    const handleDownload = () => {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-dss-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Relatório baixado com sucesso!', 'success');
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

const App: React.FC = () => {
    const [selectedTurma, setSelectedTurma] = useState<'A' | 'B' | 'C' | null>(() => {
        const savedTurma = localStorage.getItem('selectedTurma');
        if (savedTurma === 'A' || savedTurma === 'B' || savedTurma === 'C') {
            return savedTurma;
        }
        return null;
    });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [administrators, setAdministrators] = useState<Administrator[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.None);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [togglingSpecialTeamId, setTogglingSpecialTeamId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null); // New wrapper ref
    const scalableContainerRef = useRef<HTMLDivElement>(null);
    const scaleStateRef = useRef({ currentScale: 1 });
    const [modalScale, setModalScale] = useState(1);
    
    // State for manual registration inputs
    const [mainSubject, setMainSubject] = useState('');
    const [mainMatricula, setMainMatricula] = useState('');
    const [mainResponsible, setMainResponsible] = useState('');

    const [specialSubject, setSpecialSubject] = useState('');
    const [specialMatricula, setSpecialMatricula] = useState('');
    const [specialResponsible, setSpecialResponsible] = useState('');

    // State for safety confirmation (Generic for Mal, Absent, Turno, Delete)
    const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);

    // Admin Tutorial State
    const [isAdminTutorialOpen, setIsAdminTutorialOpen] = useState(false);

    // Demo Mode State
    const [isDemoMode, setIsDemoMode] = useState(false);
    const isDemoModeRef = useRef(false);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
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

    useEffect(() => {
        const calculateModalScale = () => {
            // Com o viewport configurado para device-width, usamos escala 1 para elementos de UI fixa (modais/notificações)
            setModalScale(1);
        };

        calculateModalScale();
        window.addEventListener('resize', calculateModalScale);
        return () => window.removeEventListener('resize', calculateModalScale);
    }, []);

    // Effect to check if tutorial should be shown for first-time users
    useEffect(() => {
        // Wait for loading to finish so DOM elements are present
        if (!loading && selectedTurma) {
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
                // Short delay to ensure rendering frames are complete
                setTimeout(() => {
                    setActiveModal(ModalType.Tutorial);
                    localStorage.setItem('hasSeenTutorial', 'true');
                }, 1000);
            }
        }
    }, [loading, selectedTurma]);

    const handleToggleDarkMode = () => setIsDarkMode(prev => !prev);

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
                subject: `🚨 ALERTA URGENTE TURMA ${selectedTurma}: "ESTOU MAL"`,
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

    useEffect(() => {
        if (!selectedTurma) {
            setLoading(false);
            return;
        }

        let unsubscribeEmployees = () => {};
        let unsubscribeAdministrators = () => {};
        let unsubscribeRegistrations = () => {};

        const signInAndSetupListeners = async () => {
             if (!isConfigured) {
                showNotification("Modo de pré-visualização: Faça o deploy no Vercel para carregar dados ao vivo.", "error");
                setLoading(false);
                return;
            }
            try {
                if (!auth || !db) throw new Error("Firebase not initialized correctly.");
                
                await signInAnonymously(auth);
                console.log("Signed in anonymously");

                // Determina o nome da coleção do Firestore com base na turma selecionada ('turma a', 'turma b', etc.).
                const collectionName = `turma ${selectedTurma.toLowerCase()}`;
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
                    if (loading) setLoading(false);
                }, (error) => {
                    console.error("Error listening to employee updates:", error);
                    if (!isDemoModeRef.current) {
                        showNotification(`Erro ao carregar funcionários: ${error.message}`, "error");
                    }
                    setLoading(false);
                });

                // Acessa a coleção de administradores, que é compartilhada entre as turmas.
                const administratorsQuery = query(collection(db, 'administrators'));
                unsubscribeAdministrators = onSnapshot(administratorsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;

                    const adminsData: Administrator[] = querySnapshot.docs.map(doc => {
                         const data = doc.data();
                         return {
                             id: doc.id,
                             name: data.name || 'Admin',
                             matricula: data.matricula || '',
                             email: data.email || ''
                         };
                    });
                    setAdministrators(adminsData);
                }, (error) => {
                    console.error("Error listening to admin updates:", error);
                });
                
                const registrationCollectionName = `registrosDSS ${selectedTurma}`;
                // Acessa os registros de DSS, agora específicos da turma.
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


                if (!isDemoModeRef.current) {
                    showNotification(`Dados da Turma ${selectedTurma} carregados!`, 'success');
                }

            } catch (error) {
                console.error("Authentication or listener setup failed:", error);
                const message = error instanceof Error ? error.message : 'Verifique as credenciais e as regras de segurança do Firebase.';
                if (!isDemoModeRef.current) {
                    showNotification(`Falha na conexão: ${message}`, "error");
                }
                setLoading(false);
            }
        };

        signInAndSetupListeners();

        return () => {
            unsubscribeEmployees();
            unsubscribeAdministrators();
            unsubscribeRegistrations();
        };
    }, [selectedTurma, showNotification]);

    const setScale = useCallback((newScale: number, scrollX?: number, scrollY?: number) => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        const contentWrapper = contentWrapperRef.current;
        if (!viewport || !scalableContainer || !contentWrapper) return;

        const finalScale = Math.max(0.2, Math.min(newScale, 2.0));
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
                const newScale = initialScale * scaleRatio;
                
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
                const newScale = scaleStateRef.current.currentScale + delta * scaleStateRef.current.currentScale;

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

    }, [initializeScale, setScale, selectedTurma]);

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
        }).sort((a,b) => a.name.localeCompare(b.name));
        
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

    const processStatusUpdate = async (id: string, type: StatusType) => {
        if (!selectedTurma) return;
        const employee = employees.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        if (!isChecking && !isAdmin) {
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
                     newTime = `${date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedData);
        } catch (error) {
            console.error("Error updating status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        }
    };

    const handleTimeUpdate = async (id: string, newDate: Date) => {
        if (!isAdmin) {
            showNotification('Apenas administradores podem editar o horário.', 'error');
            return;
        }

        if (isDemoMode) {
            const newTimeStr = `${newDate.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${newDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, time: newTimeStr } : e));
            showNotification('Horário atualizado com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db || !selectedTurma) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                time: Timestamp.fromDate(newDate)
            });
            showNotification('Horário atualizado com sucesso!', 'success');
        } catch (error) {
            console.error("Error updating time:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar horário: ${message}`, 'error');
        }
    };

    const handleMatriculaUpdate = async (id: string, newMatricula: string) => {
        if (!isAdmin) {
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
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
            
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
        } catch (error) {
            console.error("Error updating matricula:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar matrícula: ${message}`, 'error');
        }
    };

    const handleStatusChange = (id: string, type: StatusType) => {
        const employee = employees.find(e => e.id === id);
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
    };

    const handleConfirmMal = () => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'mal');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    };

    const handleConfirmAbsent = () => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'absent');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    };
    
    const processToggleSpecialTeam = async (id: string) => {
        if (!selectedTurma) return;
        setTogglingSpecialTeamId(id);
        const employee = employees.find(e => e.id === id);
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
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, { 
                turno: newTurno
            });
            showNotification(`${employee.name} foi movido para o turno ${newTurno}.`, 'success');
        } catch (error) {
            console.error("Failed to toggle special team status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        } finally {
            setTogglingSpecialTeamId(null);
        }
    };

    const handleToggleSpecialTeam = (id: string) => {
        setPendingEmployeeId(id);
        setActiveModal(ModalType.ConfirmTurno);
    };

    const handleConfirmTurno = () => {
        if (pendingEmployeeId) {
            processToggleSpecialTeam(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    };

    const processDeleteUser = async (employeeId: string) => {
        if (!selectedTurma) return;
        const employeeToDelete = employees.find(e => e.id === employeeId);
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
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
            const docRef = doc(db, collectionName, employeeId);
            await deleteDoc(docRef);
            showNotification(`Usuário ${employeeToDelete.name} deletado com sucesso!`, 'success');
        } catch (error) {
            console.error("Error deleting user:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao deletar: ${message}`, 'error');
        }
    };

    const handleDeleteUser = (employeeId: string) => {
        if (!isAdmin) {
            showNotification('Apenas administradores podem deletar usuários.', 'error');
            return;
        }
        const employeeToDelete = employees.find(e => e.id === employeeId);
        if (!employeeToDelete) {
             showNotification('Usuário não encontrado.', 'error');
            return;
        }

        setPendingEmployeeId(employeeId);
        setActiveModal(ModalType.ConfirmDelete);
    };

    const handleConfirmDelete = () => {
        if (pendingEmployeeId) {
            processDeleteUser(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    };

    const handleManualRegister = async (turno: '7H' | '6H') => {
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
        const emp = employees.find(e => e.matricula === matricula);
        const resolvedName = admin ? admin.name : (emp ? emp.name : '');

        if (isDemoMode) {
            showNotification(`Registro para turno ${turno} salvo com sucesso (DEMO).`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const registrationCollectionName = `registrosDSS ${selectedTurma}`;
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
        } catch (error) {
            console.error("Error saving manual registration:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao salvar registro: ${message}`, 'error');
        }
    };
    
    const handleAdminLogin = async (email: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        
        const checkAndTriggerAdminTutorial = () => {
             const hasSeenAdmin = localStorage.getItem('hasSeenAdminTutorial');
             if (!hasSeenAdmin) {
                 setTimeout(() => {
                     setIsAdminTutorialOpen(true);
                     localStorage.setItem('hasSeenAdminTutorial', 'true');
                 }, 500); 
             }
        };

        if (normalizedEmail === 'naylanmoreira350@gmail.com') {
             setIsAdmin(true);
             setActiveModal(ModalType.AdminOptions);
             showNotification('Login de administrador bem-sucedido!', 'success');
             checkAndTriggerAdminTutorial();
             return;
        }

        if (isDemoMode) {
            setIsAdmin(true);
            setActiveModal(ModalType.AdminOptions);
            showNotification('Acesso Admin (DEMO) concedido.', 'success');
            checkAndTriggerAdminTutorial();
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
                setIsAdmin(true);
                setActiveModal(ModalType.AdminOptions);
                showNotification('Login de administrador bem-sucedido!', 'success');
                checkAndTriggerAdminTutorial();
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
            setEmployees(prev => [...prev, newUser].sort((a,b) => a.name.localeCompare(b.name)));
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
            if (matricula) {
                const existingUser = employees.find(e => e.matricula === matricula);
                if(existingUser) {
                    throw new Error('Matrícula já existe.');
                }
            }
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro.';
            showNotification(errorMessage, 'error');
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
            const collectionName = `turma ${selectedTurma.toLowerCase()}`;
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

            const registrationCollectionName = `registrosDSS ${selectedTurma}`;
            const registrationsSnapshot = await getDocs(collection(db, registrationCollectionName));
            registrationsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            setActiveModal(ModalType.None);
            showNotification('Dados de status diário e registros manuais foram limpos!', 'success');
        } catch(error) {
            console.error("Error clearing data:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao limpar dados: ${message}`, 'error');
        }
    };

    const handleReorganize = () => {
        setEmployees(prev => [...prev].sort((a,b) => a.name.localeCompare(b.name)));
        setActiveModal(ModalType.None);
        showNotification('Painel reorganizado alfabeticamente!', 'success');
    };

    const handleSelectTurma = (turma: 'A' | 'B' | 'C') => {
        localStorage.setItem('selectedTurma', turma);
        setLoading(true);
        setEmployees([]); // Limpa dados antigos para evitar exibir dados da turma errada
        setSelectedTurma(turma);
    };

    const handleReturnToSelection = () => {
        localStorage.removeItem('selectedTurma');
        setSelectedTurma(null);
        setEmployees([]);
        setIsAdmin(false); // Reseta o estado de admin ao trocar de turma
        isDemoModeRef.current = false;
        setIsDemoMode(false);
    };

    const stats = useMemo(() => ({
        bem: employees.filter(e => e.bem).length,
        mal: employees.filter(e => e.mal).length,
        absent: employees.filter(e => e.absent).length,
        total: employees.length,
    }), [employees]);
    
    const mainTeam = useMemo(() => employees.filter(e => e.turno !== '6H'), [employees]);
    const specialTeam = useMemo(() => employees.filter(e => e.turno === '6H'), [employees]);

    const columnSize = Math.ceil(mainTeam.length / 3);
    const col1 = mainTeam.slice(0, columnSize);
    const col2 = mainTeam.slice(columnSize, columnSize * 2);
    const col3 = mainTeam.slice(columnSize * 2);

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

    if (!selectedTurma) {
        return (
            <TurmaSelectionScreen 
                onSelect={handleSelectTurma} 
                isDarkMode={isDarkMode} 
                onToggleDarkMode={handleToggleDarkMode}
            />
        );
    }

    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text transition-colors">
            <div ref={viewportRef} className={`viewport fixed inset-0 bg-light-bg-secondary dark:bg-dark-bg`}>
                <div ref={contentWrapperRef} className="origin-top-left">
                    <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8 bg-light-bg-secondary dark:bg-dark-bg">
                        <Header
                            stats={stats}
                            loading={loading}
                            onAdminClick={() => setActiveModal(ModalType.AdminLogin)}
                            onHelpClick={() => setActiveModal(ModalType.Tutorial)}
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
                        
                        <div className="flex gap-8 flex-nowrap">
                        <div className="flex flex-col gap-8 shrink-0">
                                <ManualRegisterSection 
                                    subject={mainSubject}
                                    matricula={mainMatricula}
                                    onSubjectChange={setMainSubject}
                                    onMatriculaChange={setMainMatricula}
                                    onRegister={() => handleManualRegister('7H')}
                                    employees={employees}
                                    administrators={administrators}
                                />
                                <div className="flex gap-8">
                                    <div className="flex flex-col gap-6 w-[870px]">
                                        {col1.map((emp, index) => (
                                            <EmployeeCard 
                                                key={emp.id} 
                                                employee={emp} 
                                                onStatusChange={handleStatusChange} 
                                                onToggleSpecialTeam={handleToggleSpecialTeam} 
                                                isTogglingSpecialTeam={togglingSpecialTeamId === emp.id} 
                                                isAdmin={isAdmin} 
                                                onDelete={handleDeleteUser}
                                                onTimeChange={handleTimeUpdate}
                                                onMatriculaChange={handleMatriculaUpdate}
                                                domId={index === 0 ? "tutorial-first-card" : undefined}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-6 w-[870px]">
                                        {col2.map(emp => <EmployeeCard key={emp.id} employee={emp} onStatusChange={handleStatusChange} onToggleSpecialTeam={handleToggleSpecialTeam} isTogglingSpecialTeam={togglingSpecialTeamId === emp.id} isAdmin={isAdmin} onDelete={handleDeleteUser} onTimeChange={handleTimeUpdate} onMatriculaChange={handleMatriculaUpdate} />)}
                                    </div>
                                    <div className="flex flex-col gap-6 w-[870px]">
                                        {col3.map(emp => <EmployeeCard key={emp.id} employee={emp} onStatusChange={handleStatusChange} onToggleSpecialTeam={handleToggleSpecialTeam} isTogglingSpecialTeam={togglingSpecialTeamId === emp.id} isAdmin={isAdmin} onDelete={handleDeleteUser} onTimeChange={handleTimeUpdate} onMatriculaChange={handleMatriculaUpdate} />)}
                                    </div>
                                </div>
                        </div>
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
                                onRegister={() => handleManualRegister('6H')}
                                employees={employees}
                                administrators={administrators}
                            />
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>
            
            <AdminLoginModal 
                isOpen={activeModal === ModalType.AdminLogin} 
                onClose={() => setActiveModal(ModalType.None)} 
                onLogin={handleAdminLogin} 
                scale={modalScale} 
            />
            <AdminOptionsModal 
                isOpen={activeModal === ModalType.AdminOptions} 
                onClose={() => setActiveModal(ModalType.None)} 
                onClear={handleClearData} 
                onReorganize={handleReorganize} 
                onAddUser={() => setActiveModal(ModalType.AddUser)}
                onSendReport={() => setActiveModal(ModalType.Report)}
                onEnterDemo={handleEnterDemoMode}
                scale={modalScale}
            />
            <AddUserModal isOpen={activeModal === ModalType.AddUser} onClose={() => setActiveModal(ModalType.None)} onAdd={handleAddUser} scale={modalScale} />
            <ReportModal 
                isOpen={activeModal === ModalType.Report}
                onClose={() => setActiveModal(ModalType.None)}
                employees={employees}
                showNotification={showNotification}
                scale={modalScale}
                subject7H={mainSubject}
                responsible7H={mainResponsible}
                matricula7H={mainMatricula}
                subject6H={specialSubject}
                responsible6H={specialResponsible}
                matricula6H={specialMatricula}
            />
            
            <InteractiveTutorial
                isOpen={activeModal === ModalType.Tutorial}
                onClose={() => setActiveModal(ModalType.None)}
                steps={tutorialSteps}
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
                                Isso enviará um alerta imediato para a <strong>gestão</strong>. <br/>Deseja realmente confirmar que não está se sentindo bem?
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
                className="fixed top-5 right-5 z-[100] space-y-3"
                style={{ transform: `scale(${modalScale})`, transformOrigin: 'top right' }}
            >
                {notifications.map(n => <Notification key={n.id} notification={n} onDismiss={dismissNotification} />)}
            </div>
        </div>
    );
};

export default App;