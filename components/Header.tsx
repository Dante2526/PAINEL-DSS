
import React from 'react';
import DarkModeToggle from './DarkModeToggle';
import { AdminIcon, HelpIcon, ShieldLogo } from './icons';

interface HeaderProps {
    stats: {
        bem: number;
        mal: number;
        absent: number;
        total: number;
    };
    loading: boolean;
    onAdminClick: () => void;
    onHelpClick: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const StatCard: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="text-center p-4 bg-light-bg dark:bg-dark-bg-secondary rounded-xl min-w-[100px] transition-colors">
        <div className={`text-4xl font-bold mb-1 transition-colors ${colorClass}`}>{value}</div>
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary uppercase font-semibold">{label}</div>
    </div>
);

const Header: React.FC<HeaderProps> = ({ stats, loading, onAdminClick, onHelpClick, isDarkMode, onToggleDarkMode }) => {
    return (
        <header id="app-header" className="bg-light-card dark:bg-dark-card rounded-3xl p-6 md:p-10 mb-8 shadow-lg flex justify-between items-center w-full transition-colors">
            <div className="flex items-center gap-6">
                {loading ? (
                    <div className="w-14 h-14 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
                ) : (
                    <ShieldLogo className="h-20 w-20 md:h-24 md:w-24" />
                )}
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-light-text dark:text-dark-text tracking-tight">Painel de Acompanhamento DSS</h1>
                    <p className="text-lg md:text-xl font-medium text-light-text-secondary dark:text-dark-text-secondary">Diálogo de Saúde e Segurança - Monitoramento em tempo real</p>
                </div>
            </div>
            <div id="tutorial-header-actions" className="flex flex-col items-end gap-5">
                <div className="flex items-center gap-5">
                   <button 
                        onClick={onHelpClick}
                        className="h-[90px] flex items-center gap-3 px-8 text-base font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                        aria-label="Iniciar Tutorial"
                        title="Como usar o sistema"
                   >
                       <HelpIcon className="w-7 h-7" />
                       <span>TUTORIAL</span>
                   </button>
                   
                   <div id="tutorial-dark-mode">
                        <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
                   </div>
                   
                    <button 
                      id="tutorial-admin-btn"
                      onClick={onAdminClick}
                      className="h-[90px] relative flex items-center gap-3 px-8 text-base font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300"
                      aria-label="Acesso Administrativo"
                    >
                        <AdminIcon className="w-7 h-7" />
                        <span>ACESSO ADM</span>
                    </button>
                </div>
                 <div id="tutorial-stats" className="flex gap-6">
                    <StatCard label="Estou Bem" value={stats.bem} colorClass="text-success" />
                    <StatCard label="Estou Mal" value={stats.mal} colorClass="text-danger" />
                    <StatCard label="Ausente" value={stats.absent} colorClass="text-warning" />
                    <StatCard label="Total" value={stats.total} colorClass="text-neutral" />
                </div>
            </div>
        </header>
    );
};

export default Header;
