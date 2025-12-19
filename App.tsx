
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import EmployeeCard from './components/EmployeeCard';
import SpecialTeamPanel from './components/SpecialTeamPanel';
import Modal from './components/Modal';
import Notification from './components/Notification';
import Footer from './components/Footer';
import InteractiveTutorial, { TutorialStep } from './components/InteractiveTutorial';
import { SubjectIcon, UserIcon, EraserIcon, FileTextIcon, SortIcon, UserPlusIcon, ShiftIcon, AbsentIcon, TrashIcon, ExchangeIcon, MousePointerIcon } from './components/icons';
import { Employee, StatusType, ModalType, ManualRegistration } from './types';
import type { NotificationData } from './components/Notification';
import { db, auth, isConfigured } from './firebase';
import { FALLBACK_LOGO } from './components/logoConstants';
// FIX: Switched to standard Firebase packages for imports to match project configuration and resolve module errors.
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
    deleteDoc
} from 'firebase/firestore';
// FIX: Ensure correct import for signInAnonymously from firebase/auth
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
        content: 'Use "TURNO 6H" para mover o colaborador para uma coluna somente para esse turno. Use "AUSENTE" para marcar que o colaborador faltou. Use "DELETAR" para remover permanentemente o usuário (Aparece somente para-ADM).'
    },
    {
        targetId: 'tutorial-card-time',
        title: 'Registro de Horário',
        content: 'Aqui fica registrado o momento exato em que o colaborador assinou sua DSS'
    },
    {
        targetId: 'tutorial-special-demo-area',
        title: 'Turno Diferenciado (6H)',
        content: 'Painel exclusivo para a turma do turno de 6H. Funciona da mesma forma que o painel principal, mas com controle separado.'
    },
    {
        targetId: 'tutorial-return-turn-btn',
        title: 'Retornar ao Turno Normal',
        content: 'Ao Clicar neste botão na coluna do horário especial, o colaborador é movido de volta para o turno normal.'
    },
    {
        targetId: 'tutorial-stats',
        title: 'Estatísticas em Tempo Real',
        content: 'Acompanhe quantos colaboradores estão bem, mal ou ausentes instantaneamente.'
    },
    {
        targetId: 'tutorial-dark-mode',
        title: 'Modo Escuro (BB-8)',
        content: 'Clique no pequeno droide BB-8 para alternar entre o modo Claro e Escuro. Ideal para ambientes com pouca luz.'
    },
    {
        targetId: 'tutorial-admin-btn',
        title: 'Área Administrativa',
        content: 'Acesso restrito para limpar os dados diários, gerar relatórios em PDF/Texto e cadastrar novos usuários.'
    }
];

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
    employees: Employee[];
}> = ({ subject, matricula, onSubjectChange, onMatriculaChange, onRegister, employees }) => {
    // Logic to find name
    const foundName = useMemo(() => {
        if (!matricula) return '';
        const employee = employees.find(e => e.matricula === matricula);
        return employee ? employee.name : '';
    }, [matricula, employees]);

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
                        className="w-full px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl outline-none pointer-events-none truncate"
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

// ... [AdminLoginModal, AdminOptionsModal, AddUserModal, ReportModal remain unchanged, omitting for brevity] ...
// Re-inserting them properly for context:

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
                    onClick={() => { onClear(); onClose(); }} 
                    className="p-4 bg-orange text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-600 transition shadow-lg"
                >
                    <EraserIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">LIMPAR TUDO</span>
                </button>

                 <button 
                    id="admin-report-btn"
                    onClick={() => { onSendReport(); onClose(); }}
                    className="p-4 bg-blue-500 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg"
                >
                    <FileTextIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">RELATÓRIO</span>
                </button>

                 <button 
                    id="admin-reorganize-btn"
                    onClick={() => { onReorganize(); onClose(); }}
                    className="p-4 bg-purple-500 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-purple-600 transition shadow-lg"
                >
                    <SortIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">REORGANIZAR</span>
                </button>
                
                <button 
                    id="admin-adduser-btn"
                    onClick={() => { onAddUser(); onClose(); }}
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
    onAdd: (name: string, matricula: string) => void;
    scale: number;
}> = ({ isOpen, onClose, onAdd, scale }) => {
    const [name, setName] = useState('');
    const [matricula, setMatricula] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && matricula) {
            onAdd(name, matricula);
            setName('');
            setMatricula('');
        }
    };
    
    // Auto uppercase for name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value.toUpperCase());
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Colaborador" scale={scale}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white uppercase"
                    autoFocus
                />
                 <input
                    type="text"
                    placeholder="Matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-4 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    inputMode="numeric"
                />
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
}> = ({ isOpen, onClose, employees, showNotification, scale }) => {
    const generateReport = () => {
        const present = employees.filter(e => e.bem || e.assDss || e.mal);
        const absent = employees.filter(e => e.absent);
        const missing = employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.absent);
        const mal = employees.filter(e => e.mal);

        const date = new Date().toLocaleDateString('pt-BR');
        
        let report = `RELATÓRIO DSS - ${date}\n\n`;
        report += `TOTAL: ${employees.length}\n`;
        report += `PRESENTES: ${present.length}\n`;
        report += `AUSENTES: ${absent.length}\n`;
        report += `PENDENTES: ${missing.length}\n`;
        report += `RELATOS DE MAL-ESTAR: ${mal.length}\n\n`;

        if (mal.length > 0) {
            report += `⚠️ COLABORADORES COM MAL-ESTAR:\n`;
            mal.forEach(e => report += `- ${e.name} (${e.matricula})\n`);
            report += `\n`;
        }

        if (absent.length > 0) {
            report += `❌ AUSENTES:\n`;
            absent.forEach(e => report += `- ${e.name} (${e.matricula})\n`);
            report += `\n`;
        }

        if (missing.length > 0) {
            report += `⏳ PENDENTES DE ASSINATURA:\n`;
            missing.forEach(e => report += `- ${e.name} (${e.matricula})\n`);
        }

        return report;
    };

    const handleCopy = () => {
        const text = generateReport();
        navigator.clipboard.writeText(text);
        showNotification('Relatório copiado para a área de transferência!', 'success');
        onClose();
    };

    const handleDownload = () => {
        const text = generateReport();
        const blob = new Blob([text], { type: 'text/plain' });
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
        <Modal isOpen={isOpen} onClose={onClose} title="Gerar Relatório" scale={scale}>
            <div className="space-y-4">
                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-4">
                    Escolha como deseja exportar o resumo diário da equipe.
                </p>
                <button 
                    onClick={handleCopy}
                    className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-md"
                >
                    <FileTextIcon className="w-5 h-5" />
                    COPIAR TEXTO
                </button>
                <button 
                    onClick={handleDownload}
                    className="w-full py-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    BAIXAR ARQUIVO
                </button>
            </div>
        </Modal>
    );
};

const App: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
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
    const [specialSubject, setSpecialSubject] = useState('');
    const [specialMatricula, setSpecialMatricula] = useState('');

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
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
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
        if (!loading) {
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
                // Short delay to ensure rendering frames are complete
                setTimeout(() => {
                    setActiveModal(ModalType.Tutorial);
                    localStorage.setItem('hasSeenTutorial', 'true');
                }, 1000);
            }
        }
    }, [loading]);

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
        // ... [Email alert logic unchanged] ...
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
                // O Template do EmailJS deve conter APENAS: {{{html_content}}}
                html_content: emailContent,
                // Assunto personalizado com Sirene e "ESTOU MAL" em maiúsculo
                subject: `🚨 ALERTA URGENTE TURMA B: "ESTOU MAL"`,
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
            // Não mostramos erro visual para o usuário final para não gerar pânico, apenas logamos
        }
    };

    useEffect(() => {
        let unsubscribeEmployees = () => {};
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

                // Listener for employees
                // UPDATED: Now points to 'turma b' instead of 'employees'
                const employeesQuery = query(collection(db, 'turma b'), orderBy("name", "asc"));
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
                
                // Listener for manual registrations to persist fields
                const registrationsQuery = query(collection(db, 'registrosDSS'));
                unsubscribeRegistrations = onSnapshot(registrationsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;
                    
                    const registrations = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ManualRegistration[];
                    
                    const mainReg = registrations.find(r => r.TURNO === '7H-19H');
                    const specialReg = registrations.find(r => r.TURNO === '6H');

                    setMainSubject(mainReg?.assunto || '');
                    setMainMatricula(mainReg?.matricula || '');
                    
                    setSpecialSubject(specialReg?.assunto || '');
                    setSpecialMatricula(specialReg?.matricula || '');
                });


                if (!isDemoModeRef.current) {
                    showNotification('Dados carregados com sucesso!', 'success');
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
            unsubscribeRegistrations();
        };
    }, [showNotification]);

    const setScale = useCallback((newScale: number, scrollX?: number, scrollY?: number) => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        const contentWrapper = contentWrapperRef.current;
        if (!viewport || !scalableContainer || !contentWrapper) return;

        const finalScale = Math.max(0.2, Math.min(newScale, 2.0));
        scaleStateRef.current.currentScale = finalScale;

        scalableContainer.style.transform = `scale(${finalScale})`;
        
        // CRITICAL FIX: Update wrapper dimensions to match the scaled content size.
        // This prevents empty space when scaling down and ensures scrollbars are correct.
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

        // Enhanced mobile detection: Touch capability OR small screen width
        const isMobileView = ('ontouchstart' in window || navigator.maxTouchPoints > 0) || window.innerWidth < 1366; 

        if (isMobileView) {
            // Calculate scale to fit width
            const fitScale = viewport.clientWidth / scalableContainer.offsetWidth;
            // Ensure we don't scale up on mobile if the content is smaller (unlikely here)
            // and apply the scale
            setScale(fitScale, 0, 0);
        } else {
            setScale(1.0, 0, 0);
        }
    }, [setScale]);


    useEffect(() => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;

        if (!viewport || !scalableContainer) return;
        
        // CRITICAL FIX: Call initializeScale immediately to fix "zoomed in" start
        initializeScale();
        // Fallback for race conditions
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

                // Adjust origin to account for the current scaled offset
                // Current scroll offset relative to unscaled content:
                // (viewport.scrollLeft + originX) / currentScale
                
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
             // CRITICAL FIX: If user is typing, ignore resize events caused by virtual keyboard
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                return;
            }

            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                // Re-applying the scale will trigger a recalculation of minWidth/minHeight
                // based on the new viewport dimensions.
                setScale(scaleStateRef.current.currentScale);
                initializeScale(); // Re-check if we need to switch between mobile/desktop modes
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

    }, [initializeScale, setScale]);

    // ... [handleEnterDemoMode, processStatusUpdate, handleTimeUpdate, handleStatusChange, handleConfirmMal, handleConfirmAbsent, processToggleSpecialTeam, handleToggleSpecialTeam, handleConfirmTurno, processDeleteUser, handleDeleteUser, handleConfirmDelete, handleManualRegister, handleAdminLogin, handleAddUser, handleClearData, handleReorganize, stats, mainTeam, specialTeam logic unchanged] ...
    
    // ... inserting logic back for context ...
    const handleEnterDemoMode = () => {
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
                assDss: isBem, // Usually check together
                bem: isBem,
                mal: isMal,
                absent: isAbsent,
                time: isPresent ? formatTimestamp(Timestamp.now()) : null,
                turno: i < 35 ? '7H' : '6H' // Mostly 7H, some 6H for the small column
            };
        }).sort((a,b) => a.name.localeCompare(b.name));
        
        setEmployees(mockEmployees);
        setIsDemoMode(true);
        setIsAdmin(true); // Grant simulated admin for demo
        setActiveModal(ModalType.None);
        setLoading(false);
        showNotification('Modo de Demonstração Ativado! Dados fictícios carregados.', 'success');
    };

    const processStatusUpdate = async (id: string, type: StatusType) => {
        const employee = employees.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        // Admin check: only admins can uncheck a status.
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
        
        // Handle Demo Mode Local State Update
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
            } else if (finalStates.bem || finalStates.mal || finalStates.assDss) {
                // In Demo Mode, use simple string date
                const date = new Date();
                newTime = `${date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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

        // Handle DB Update
        try {
            const finalStates = {
                absent: updatedData.absent !== undefined ? updatedData.absent : employee.absent,
                assDss: updatedData.assDss !== undefined ? updatedData.assDss : employee.assDss,
                bem: updatedData.bem !== undefined ? updatedData.bem : employee.bem,
                mal: updatedData.mal !== undefined ? updatedData.mal : employee.mal,
            };
            
            if (finalStates.absent) {
                updatedData.time = null;
            } else if (finalStates.bem || finalStates.mal || finalStates.assDss) {
                updatedData.time = serverTimestamp();
            } else {
                updatedData.time = null;
            }
            // UPDATED: Now points to 'turma b' instead of 'employees'
            const docRef = doc(db, 'turma b', id);
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

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            // UPDATED: Now points to 'turma b' instead of 'employees'
            const docRef = doc(db, 'turma b', id);
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

    const handleStatusChange = (id: string, type: StatusType) => {
        const employee = employees.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        // Intercept 'mal'
        if (type === 'mal' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmMal);
            return;
        }

        // Intercept 'absent' - NEW
        if (type === 'absent' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmAbsent);
            return;
        }

        // Otherwise, proceed normally
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
        setTogglingSpecialTeamId(id);
        const employee = employees.find(e => e.id === id);
        if (!employee) {
            setTogglingSpecialTeamId(null);
            return;
        }
        const newTurno = employee.turno === '6H' ? '7H' : '6H';

        if (isDemoMode) {
             // Simulate network delay
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
            // UPDATED: Now points to 'turma b' instead of 'employees'
            const docRef = doc(db, 'turma b', id);
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
        // Open confirmation modal
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
            // UPDATED: Now points to 'turma b' instead of 'employees'
            const docRef = doc(db, 'turma b', employeeId);
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

        // Instead of window.confirm, open modal
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

    const handleManualRegister = async (turno: '7H-19H' | '6H') => {
        const matricula = turno === '7H-19H' ? mainMatricula : specialMatricula;
        const rawSubject = turno === '7H-19H' ? mainSubject : specialSubject;
        // FIX: Ensure subject is UPPERCASE when saving, but allow normal typing in input to prevent cursor jumps
        const subject = rawSubject ? rawSubject.toUpperCase() : '';

        if (!matricula) {
            showNotification('Por favor, insira uma matrícula.', 'error');
            return;
        }
        
        if (isDemoMode) {
            showNotification(`Registro para turno ${turno} salvo com sucesso (DEMO).`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const registrationData = {
            matricula,
            assunto: subject || 'Não informado',
            TURNO: turno,
        };

        try {
            const q = query(collection(db, 'registrosDSS'), where("TURNO", "==", turno));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docRef = doc(db, 'registrosDSS', querySnapshot.docs[0].id);
                await updateDoc(docRef, registrationData);
            } else {
                await addDoc(collection(db, 'registrosDSS'), registrationData);
            }
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
                 }, 500); // Small delay to allow modal animation to complete
             }
        };

        // Hardcoded admin for test environment
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
    
    const handleAddUser = async (name: string, matricula: string) => {
        if (!isAdmin) {
            showNotification('Apenas administradores podem adicionar usuários.', 'error');
            return;
        }
        
        // FIX: UpperCase name here instead of during typing
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
            setActiveModal(ModalType.None);
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
            // UPDATED: Now points to 'turma b' instead of 'employees'
            await addDoc(collection(db, 'turma b'), {
                name: finalName,
                matricula,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
                turno: '7H'
            });
            setActiveModal(ModalType.None);
            showNotification(`Usuário ${finalName} adicionado com sucesso!`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro.';
            showNotification(errorMessage, 'error');
        }
    };

    const handleClearData = async () => {
        if (!isAdmin) {
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
             setSpecialSubject('');
             setSpecialMatricula('');
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
            
            // UPDATED: Now points to 'turma b' instead of 'employees'
            const employeesSnapshot = await getDocs(collection(db, 'turma b'));
            employeesSnapshot.forEach((doc) => {
                batch.update(doc.ref, {
                    assDss: false,
                    bem: false,
                    mal: false,
                    absent: false,
                    time: null,
                });
            });

            const registrationsSnapshot = await getDocs(collection(db, 'registrosDSS'));
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

    const stats = useMemo(() => ({
        bem: employees.filter(e => e.bem).length,
        mal: employees.filter(e => e.mal).length,
        absent: employees.filter(e => e.absent).length,
        total: employees.length,
    }), [employees]);
    
    const mainTeam = useMemo(() => employees.filter(e => e.turno !== '6H'), [employees]);
    const specialTeam = useMemo(() => employees.filter(e => e.turno === '6H'), [employees]);

    // Split mainTeam into 3 columns instead of 2
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

    // --- NEW TUTORIAL ZOOM LOGIC ---
    const handleTutorialStepChange = (step: TutorialStep) => {
        // Only auto-zoom on mobile/touch devices
        const isMobile = window.innerWidth < 1024; 
        if (!isMobile) return;

        const element = document.getElementById(step.targetId);
        if (!element) return;
        
        // Logic to calculate scale to make element focused
        const margin = 32;
        const availableWidth = window.innerWidth - margin;
        // Visual width in layout flow (approx)
        const elementWidth = element.offsetWidth; 
        
        if (elementWidth > 0) {
            let newScale = availableWidth / elementWidth;
            
            // Clamp scale to avoid extreme zooms
            // Min 0.3 (very zoomed out)
            // Max 1.1 (slightly zoomed in)
            newScale = Math.min(Math.max(newScale, 0.3), 1.1);
            
            // Apply scale
            setScale(newScale);
        }
    }
    // -------------------------------

    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text transition-colors">
            <div ref={viewportRef} className="viewport fixed inset-0">
                <div ref={contentWrapperRef} className="origin-top-left">
                    <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8">
                        <Header
                            stats={stats}
                            loading={loading}
                            onAdminClick={() => setActiveModal(ModalType.AdminLogin)}
                            onHelpClick={() => setActiveModal(ModalType.Tutorial)}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={handleToggleDarkMode}
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
                                    onRegister={() => handleManualRegister('7H-19H')}
                                    employees={employees}
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
                                                // ID especifico para o primeiro cartão do tutorial
                                                domId={index === 0 ? "tutorial-first-card" : undefined}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-6 w-[870px]">
                                        {col2.map(emp => <EmployeeCard key={emp.id} employee={emp} onStatusChange={handleStatusChange} onToggleSpecialTeam={handleToggleSpecialTeam} isTogglingSpecialTeam={togglingSpecialTeamId === emp.id} isAdmin={isAdmin} onDelete={handleDeleteUser} onTimeChange={handleTimeUpdate} />)}
                                    </div>
                                    <div className="flex flex-col gap-6 w-[870px]">
                                        {col3.map(emp => <EmployeeCard key={emp.id} employee={emp} onStatusChange={handleStatusChange} onToggleSpecialTeam={handleToggleSpecialTeam} isTogglingSpecialTeam={togglingSpecialTeamId === emp.id} isAdmin={isAdmin} onDelete={handleDeleteUser} onTimeChange={handleTimeUpdate} />)}
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
                                subject={specialSubject}
                                matricula={specialMatricula}
                                onSubjectChange={setSpecialSubject}
                                onMatriculaChange={setSpecialMatricula}
                                onRegister={() => handleManualRegister('6H')}
                                employees={employees}
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
            {/* ... rest of the modals ... */}
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

            {/* ... [ConfirmTurno, ConfirmAbsent, ConfirmDelete modals remain identical to previous App.tsx] ... */}
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
