import React from 'react';
import Modal from '../Modal';
import { EraserIcon, FileTextIcon, UserPlusIcon, SortIcon, ExchangeIcon, ShiftIcon, HistoryIcon, HelpIcon, MousePointerIcon } from '../icons';
import { getShiftLabel } from '../../utils/turmaUtils';

const AdminButton: React.FC<{ id: string; onClick: () => void; className: string; icon: React.ReactNode; label: string }> = ({ id, onClick, className, icon, label }) => (
    <button id={id} onClick={onClick} className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform ${className}`}>
        <div className="scale-[0.85] md:scale-90 origin-bottom">{icon}</div>
        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">{label}</span>
    </button>
);

export const AdminOptionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    onReorganize: () => void;
    onAddUser: () => void;
    onSendReport: () => void;
    onImportUser: () => void;
    onEnterDemo: () => void;
    onStartAdminTutorial: () => void;
    onToggle6H: () => void;
    onToggleAutomation: () => void;
    onToggleSignaturePassword: () => void;
    onChangeAdminPassword: () => void;
    onHistory: () => void;
    onClearBiometrics: () => void;
    onManageAdmins: () => void;
    onAuditLog: () => void;
    onMigrateDatabase: () => void;
    hasBiometrics: boolean;
    is6HActive: boolean;
    isAutomationPaused: boolean;
    isSignaturePasswordActive: boolean;
    scale: number;
    selectedTurma: string | null;
    currentAdminNivel: string;
}> = ({ isOpen, onClose, onClear, onReorganize, onAddUser, onSendReport, onImportUser, onEnterDemo, onStartAdminTutorial, onToggle6H, onToggleAutomation, onToggleSignaturePassword, onChangeAdminPassword, onHistory, onClearBiometrics, onManageAdmins, onAuditLog, onMigrateDatabase, hasBiometrics, is6HActive, isAutomationPaused, isSignaturePasswordActive, scale, selectedTurma, currentAdminNivel }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Painel do Administrador" scale={scale} size="md">
            <div className="flex flex-col gap-2 md:gap-3">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
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
                    <div className="col-span-2 grid grid-cols-2 gap-2 md:gap-3">
                        <AdminButton
                            id="admin-import-user-btn"
                            onClick={onImportUser}
                            className="bg-teal-500 text-white hover:bg-teal-600 w-full"
                            icon={<ExchangeIcon className="w-7 h-7" />}
                            label="Importar Colab."
                        />
                        <button
                            onClick={onToggle6H}
                            className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform ${is6HActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        >
                            <div className="scale-[0.85] md:scale-90 origin-bottom"><ShiftIcon className="w-7 h-7" /></div>
                            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">
                                {is6HActive ? `Desativar ${getShiftLabel(selectedTurma)}` : `Ativar ${getShiftLabel(selectedTurma)}`}
                            </span>
                        </button>
                    </div>
                </div>
                <div className={`col-span-2 grid ${currentAdminNivel === '2' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 md:gap-3`}>
                    <AdminButton
                        id="admin-history-btn"
                        onClick={onHistory}
                        className="bg-indigo-500 text-white hover:bg-indigo-600 w-full"
                        icon={<HistoryIcon className="w-7 h-7" />}
                        label="Histórico"
                    />
                    {currentAdminNivel === '2' && (
                        <button
                            onClick={onToggleAutomation}
                            className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform ${isAutomationPaused ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                        >
                            <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">
                                {isAutomationPaused ? "AÇÕES OFF" : "PAUSAR AÇÕES"}
                            </span>
                        </button>
                    )}
                </div>
                <div className="col-span-2 grid grid-cols-1 gap-2 md:gap-3">
                    <button
                        onClick={onToggleSignaturePassword}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform ${isSignaturePasswordActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                    >
                        <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">
                            {isSignaturePasswordActive ? "DESATIVAR ASSINATURA COM SENHA" : "ATIVAR ASSINATURA COM SENHA"}
                        </span>
                    </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 md:pt-3 mt-1 md:mt-1 grid grid-cols-2 gap-2 md:gap-3">
                    <button
                        id="admin-tutorial-btn"
                        onClick={onStartAdminTutorial}
                        className="p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                    >
                        <HelpIcon className="w-7 h-7" />
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">AJUDA / TUTORIAL</span>
                    </button>
                    {currentAdminNivel === '2' && (
                        <button
                            id="admin-demo-btn"
                            onClick={onEnterDemo}
                            className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md border border-violet-500 h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                        >
                            <MousePointerIcon className="w-7 h-7" />
                            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">MODO DEMO</span>
                        </button>
                    )}
                </div>
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-1 md:mt-1">
                    <button
                        id="admin-password-btn"
                        onClick={onChangeAdminPassword}
                        className={`p-3 bg-gray-700 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-900 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform col-span-1 md:col-span-1`}
                    >
                        <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">MINHA SENHA</span>
                    </button>
                    <button
                        id="admin-migrate-btn"
                        onClick={onMigrateDatabase}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform col-span-1 md:col-span-1"
                    >
                        <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">MIGRAR DB (AUSENTE)</span>
                    </button>
                    {currentAdminNivel === '2' && (
                        <>
                            <button
                                id="admin-manage-btn"
                                onClick={onManageAdmins}
                                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                            >
                                <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">GERENCIAR ADMS</span>
                            </button>
                            <button
                                id="admin-audit-btn"
                                onClick={onAuditLog}
                                className="p-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                            >
                                <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
                                <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">LOG DE AUDITORIA</span>
                            </button>
                        </>
                    )}
                </div>
                {hasBiometrics && (
                    <div className="mt-1">
                        <button
                            onClick={onClearBiometrics}
                            className="w-full p-3 border-2 border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 h-[50px] md:h-[60px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .131-5.354 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2" /></svg>
                            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider">Desativar Digital</span>
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AdminOptionsModal;
