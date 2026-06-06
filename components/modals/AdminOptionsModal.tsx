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
    onHistory: () => void;
    onClearBiometrics: () => void;
    hasBiometrics: boolean;
    is6HActive: boolean;
    isAutomationPaused: boolean;
    scale: number;
    selectedTurma: string | null;
}> = ({ isOpen, onClose, onClear, onReorganize, onAddUser, onSendReport, onImportUser, onEnterDemo, onStartAdminTutorial, onToggle6H, onToggleAutomation, onHistory, onClearBiometrics, hasBiometrics, is6HActive, isAutomationPaused, scale, selectedTurma }) => {
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
                <div className="col-span-2 grid grid-cols-2 gap-2 md:gap-3">
                    <AdminButton
                        id="admin-history-btn"
                        onClick={onHistory}
                        className="bg-indigo-500 text-white hover:bg-indigo-600 w-full"
                        icon={<HistoryIcon className="w-7 h-7" />}
                        label="Histórico"
                    />
                    <button
                        onClick={onToggleAutomation}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform ${isAutomationPaused ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                    >
                        <div className="scale-[0.85] md:scale-90 origin-bottom"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">
                            {isAutomationPaused ? "AÇÕES OFF" : "PAUSAR AÇÕES"}
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
                    <button
                        id="admin-demo-btn"
                        onClick={onEnterDemo}
                        className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-md border border-violet-500 h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform"
                    >
                        <MousePointerIcon className="w-7 h-7" />
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">MODO DEMO</span>
                    </button>
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
