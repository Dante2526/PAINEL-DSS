import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import { AuditRecord } from '../../types';

export const AuditLogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    auditRecords: AuditRecord[];
    scale: number;
}> = ({ isOpen, onClose, onBack, auditRecords, scale }) => {
    const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null);

    // Função utilitária para converter timestamp "DD/MM/YYYY, HH:mm:ss" para objeto Date
    const parseTimestamp = (timestampStr: string) => {
        if (!timestampStr) return 0;
        try {
            const [datePart, timePart] = timestampStr.split(', ');
            const [day, month, year] = datePart.split('/');
            const [hour, minute, second] = timePart.split(':');
            // Formato ISO: YYYY-MM-DDTHH:mm:ss
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).getTime();
        } catch (e) {
            return 0; // fallback caso dê erro no parse
        }
    };

    // Ordena os administradores pelo último acesso (mais recente primeiro)
    const sortedAdmins = useMemo(() => {
        return [...auditRecords].sort((a, b) => {
            return parseTimestamp(b.ultimo_acesso) - parseTimestamp(a.ultimo_acesso);
        });
    }, [auditRecords]);

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack}
            title="Registros de Auditoria" 
            scale={scale}
            size="lg"
        >
            <div className="flex flex-col space-y-4 max-h-[70vh]">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg flex items-center gap-3 border border-indigo-100 dark:border-indigo-800/50">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div>
                        <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm uppercase">Monitoramento por Usuário</h3>
                        <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                            Selecione um administrador para ver suas alterações mais recentes.
                        </p>
                    </div>
                </div>

                <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {sortedAdmins.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 italic">
                            Nenhum registro de auditoria encontrado.
                        </div>
                    ) : (
                        sortedAdmins.map(admin => {
                            const isExpanded = expandedAdminId === admin.id;
                            
                            // Ordena as ações do administrador da mais recente para a mais antiga
                            const sortedActions = [...(admin.acoes || [])].sort((a, b) => {
                                return parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp);
                            });

                            return (
                                <div key={admin.id} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-all duration-200">
                                    <button 
                                        onClick={() => setExpandedAdminId(isExpanded ? null : admin.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                    >
                                        <div className="flex flex-col items-start text-left">
                                            <span className="font-bold text-gray-800 dark:text-white text-sm md:text-base">
                                                {admin.id}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Ação mais recente: {admin.ultimo_acesso || 'Desconhecida'}
                                            </span>
                                        </div>
                                        <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                                            {sortedActions.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">Nenhuma ação registrada para este usuário.</p>
                                            ) : (
                                                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-600 before:to-transparent">
                                                    {sortedActions.map((acao, idx) => (
                                                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                            {/* Timeline Icon / Dot */}
                                                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-indigo-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>
                                                            
                                                            {/* Content Card */}
                                                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                                                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                                                        {acao.action}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                                        {acao.timestamp}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                                                    {acao.details}
                                                                </p>
                                                                {acao.turma && acao.turma !== 'N/A' && (
                                                                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                                        Turma: {acao.turma}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AuditLogModal;
