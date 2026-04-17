import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import CustomDatePicker from './CustomDatePicker';
import { FileTextIcon, SubjectIcon, ShiftIcon } from './icons';
import type { HistoryRecord, HistoryEmployee } from '../types';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, startAfter, startAt, endAt, QueryDocumentSnapshot, DocumentData, documentId } from 'firebase/firestore';
import ExportDropdown from './ExportDropdown';
import { exportToPng, exportToPdf, exportToDoc, exportToExcel, exportToTxt } from '../utils/exportService';
import { SearchIcon } from './icons';

// Cores do status compacto
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    BEM: { label: 'ASS.DSS + BEM', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    MAL: { label: 'ESTOU MAL', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
    AUS: { label: 'AUSENTE', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
    PEN: { label: 'PENDENTE', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
};

const STATUS_DOT_COLORS: Record<string, string> = {
    BEM: 'bg-green-500',
    MAL: 'bg-red-500',
    AUS: 'bg-amber-500',
    PEN: 'bg-gray-400',
};

const HistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    scale: number;
    turma: string | null;
    showNotification: (msg: string, type: 'success' | 'error') => void;
}> = ({ isOpen, onClose, scale, turma, showNotification }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [historyData, setHistoryData] = useState<HistoryRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Estados para Busca por Tema
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [allRecords, setAllRecords] = useState<HistoryRecord[]>([]);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [autoFetchCount, setAutoFetchCount] = useState(0);

    // Efeito para debounce da busca
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(prev => {
                if (prev !== searchTerm) setAutoFetchCount(0);
                return searchTerm;
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Função para carregar lote de histórico
    const loadHistoryBatch = async (isManualLoadMore = false) => {
        if (!turma || !db || (fetchingMore && isManualLoadMore)) return;
        
        setIsSearching(true);
        if (isManualLoadMore) setFetchingMore(true);

        try {
            // Simplificamos a query para evitar a exigência de índices compostos manuais.
            // O Firestore exige índices para queries com range/order em múltiplos campos ou no ID.
            // Buscamos apenas pela turma e ordenamos em memória no cliente.
            let q = query(
                collection(db, 'historico_dss'),
                where('turma', '==', turma),
                limit(200) // Carregamos um volume maior para ordenar em memória
            );

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setHasMore(false);
            } else {
                // Ordenar em memória (descendente por dataISO)
                const newRecords = snapshot.docs
                    .map(doc => doc.data() as HistoryRecord)
                    .sort((a, b) => b.dataISO.localeCompare(a.dataISO));
                
                setAllRecords(newRecords);
                setHasMore(false); // Como buscamos 200 de uma vez para ordenar em memória, tratamos como lote único
            }
        } catch (error) {
            console.error('Erro ao buscar lote de histórico:', error);
            // Evitar notificação de erro intrusiva na busca contínua, log no console é suficiente
        } finally {
            setIsSearching(false);
            setFetchingMore(false);
        }
    };

    // Carregar primeiro lote ao abrir ou mudar turma
    React.useEffect(() => {
        if (isOpen && turma) {
            setAllRecords([]);
            setLastVisible(null);
            setHasMore(true);
            setAutoFetchCount(0);
            loadHistoryBatch();
        }
    }, [isOpen, turma]);

    // Resultados filtrados pelo tema
    const filteredResults = useMemo(() => {
        if (!debouncedSearch.trim()) return [];
        const searchTerms = debouncedSearch.toLowerCase().split(' ').filter(t => t.trim().length > 0);
        
        return allRecords.filter(rec => {
            // Coletar todos os textos pesquisáveis do dia (assuntos e responsáveis)
            const searchableTexts: string[] = [];
            
            rec.registros7H?.forEach(r => {
                if (r.assunto) searchableTexts.push(r.assunto.toLowerCase());
                if (r.name) searchableTexts.push(r.name.toLowerCase());
            });
            
            rec.registros6H?.forEach(r => {
                if (r.assunto) searchableTexts.push(r.assunto.toLowerCase());
                if (r.name) searchableTexts.push(r.name.toLowerCase());
            });

            // Um registro é válido se TODAS as palavras da busca (AND logic)
            // forem encontradas em ALGUM dos textos do dia (assuntos ou nomes)
            return searchTerms.every(term => 
                searchableTexts.some(text => text.includes(term))
            );
        });
    }, [allRecords, debouncedSearch]);

    // Busca automática profunda (Auto-fetch)
    React.useEffect(() => {
        if (
            debouncedSearch.trim() && 
            filteredResults.length === 0 && 
            hasMore && 
            !fetchingMore && 
            autoFetchCount < 4
        ) {
            setAutoFetchCount(prev => prev + 1);
            loadHistoryBatch(true);
        }
    }, [debouncedSearch, filteredResults.length, hasMore, fetchingMore, autoFetchCount]);

    const handleDateChange = async (dateValue: string) => {
        setSelectedDate(dateValue);
        setHistoryData(null);
        setNotFound(false);

        if (!dateValue || !turma || !db) return;

        setLoading(true);
        try {
            const docId = `${turma}_${dateValue}`;
            const docRef = doc(db, 'historico_dss', docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setHistoryData(docSnap.data() as HistoryRecord);
                setNotFound(false);
            } else {
                setHistoryData(null);
                setNotFound(true);
            }
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            showNotification('Erro ao buscar histórico.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Separar funcionários por turno
    const { team7H, team6H } = useMemo(() => {
        if (!historyData) return { team7H: [], team6H: [] };
        return {
            team7H: historyData.r.filter(emp => emp.turno !== '6H'),
            team6H: historyData.r.filter(emp => emp.turno === '6H'),
        };
    }, [historyData]);

    const generateExportText = () => {
        if (!historyData) return '';

        let report = `HISTÓRICO DSS - TURMA ${historyData.turma}\n`;
        report += `Data: ${historyData.data}\n`;
        report += `─────────────────────────────────\n\n`;

        report += `RESUMO GERAL\n`;
        report += `Total de Funcionários: ${historyData.totalFuncionarios}\n`;
        report += `Presentes (DSS + Bem/Mal): ${historyData.totalPresentes}\n`;
        report += `Ausentes: ${historyData.totalAusentes}\n`;
        report += `Pendentes: ${historyData.totalPendentes}\n`;
        if (historyData.totalMal > 0) report += `Estou Mal: ${historyData.totalMal}\n`;
        report += `\n`;

        // Registros DSS 7H
        report += `REGISTROS DSS (TURNO 7H)\n`;
        if (historyData.registros7H.length > 0) {
            historyData.registros7H.forEach(reg => {
                report += `Assunto: ${reg.assunto || 'NÃO INFORMADO'}\n`;
                if (reg.name) report += `Responsável: ${reg.name} (Matrícula: ${reg.matricula || '---'})\n`;
            });
        } else {
            report += `Nenhum registro encontrado.\n`;
        }
        report += `\n`;

        // Registros DSS 6H
        if (turma !== 'CCG' && historyData.registros6H.length > 0) {
            report += `REGISTROS DSS (TURNO 6H)\n`;
            historyData.registros6H.forEach(reg => {
                report += `Assunto: ${reg.assunto || 'NÃO INFORMADO'}\n`;
                if (reg.name) report += `Responsável: ${reg.name} (Matrícula: ${reg.matricula || '---'})\n`;
            });
            report += `\n`;
        }

        const formatTeam = (team: HistoryEmployee[], turnoLabel: string) => {
            report += `EQUIPE TURNO ${turnoLabel}\n`;
            const statuses: { key: string; label: string }[] = [
                { key: 'BEM', label: 'STATUS: "ASS.DSS + ESTOU BEM"' },
                { key: 'MAL', label: '"ESTOU MAL"' },
                { key: 'AUS', label: 'AUSENTES' },
                { key: 'PEN', label: 'PENDENTES' },
            ];
            statuses.forEach(({ key, label }) => {
                const filtered = team.filter(e => e.s === key);
                report += `${label}\n`;
                report += filtered.length > 0
                    ? filtered.map(e => `${e.n} (Matrícula: ${e.m})`).join('\n')
                    : 'Nenhum';
                report += `\n\n`;
            });
        };

        formatTeam(team7H, '7H');
        if (turma !== 'CCG' && team6H.length > 0) {
            formatTeam(team6H, '6H');
        }

        return report;
    };

    const handleCopy = () => {
        const text = generateExportText();
        navigator.clipboard.writeText(text);
        showNotification('Histórico copiado para a área de transferência!', 'success');
    };

    const baseFileName = `historico-dss-${historyData?.turma || 'turma'}-${selectedDate}`;

    const handleExportTxt = () => {
        const text = generateExportText();
        exportToTxt(text, baseFileName);
        showNotification('Histórico baixado em TXT!', 'success');
    };

    const handleExportDoc = () => {
        const text = generateExportText();
        exportToDoc(text, baseFileName);
        showNotification('Histórico baixado em DOC!', 'success');
    };

    const handleExportExcel = () => {
        if (!historyData) return;
        const formattedData = historyData.r.map(e => ({
            "NOME": e.n,
            "MATRÍCULA": e.m,
            "TURNO": e.turno || '7H',
            "STATUS": e.s === 'BEM' ? "ASS.DSS + BEM" : e.s === 'MAL' ? "ESTOU MAL" : e.s === 'AUS' ? "AUSENTE" : "PENDENTE"
        }));
        exportToExcel(formattedData, baseFileName);
        showNotification('Histórico baixado em Excel!', 'success');
    };

    const handleExportPng = async () => {
        await exportToPng('history-capture-area', baseFileName);
        showNotification('Histórico salvo como Imagem!', 'success');
    };

    const handleExportPdf = async () => {
        await exportToPdf('history-capture-area', baseFileName);
        showNotification('Histórico salvo em PDF!', 'success');
    };

    if (!isOpen) return null;

    // Formatar data para exibição
    const formattedDate = selectedDate
        ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
        : '';

    const renderEmployeeGroup = (employees: HistoryEmployee[], turnoLabel: string) => {
        if (employees.length === 0) return null;

        const grouped = {
            BEM: employees.filter(e => e.s === 'BEM'),
            MAL: employees.filter(e => e.s === 'MAL'),
            AUS: employees.filter(e => e.s === 'AUS'),
            PEN: employees.filter(e => e.s === 'PEN'),
        };

        return (
            <div className="mt-4">
                <div className="text-xs font-bold text-white bg-gray-600 dark:bg-gray-500 px-3 py-1 rounded-full w-fit mb-3">
                    TURNO {turnoLabel} — {employees.length} colaboradores
                </div>
                <div className="space-y-2">
                    {Object.entries(grouped).map(([status, emps]) => {
                        if (emps.length === 0) return null;
                        const config = STATUS_CONFIG[status];
                        return (
                            <div key={status} className={`${config.bg} border ${config.border} rounded-xl p-3`}>
                                <div className={`flex items-center gap-1.5 mb-2 ${config.color} font-bold text-[10px] uppercase tracking-wide`}>
                                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status]} ${status === 'MAL' ? 'animate-pulse' : ''}`}></span>
                                    {config.label} ({emps.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {emps.map((emp, i) => (
                                        <span
                                            key={`${emp.m}-${i}`}
                                            className={`text-[10px] px-2 py-1 rounded border ${config.border} ${config.color} font-medium bg-white/50 dark:bg-black/20`}
                                            title={`Matrícula: ${emp.m}${emp.t ? ` | Horário: ${emp.t}` : ''}`}
                                        >
                                            {emp.n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Histórico DSS" scale={scale} size="md">
            <div className="w-full">
                {/* Seletor de Data e Busca por Tema */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por tema (ex: Segurança, EPI...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                    
                    {!searchTerm && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                            <CustomDatePicker 
                                selectedDate={selectedDate} 
                                onChange={handleDateChange} 
                                maxDate={new Date().toISOString().split('T')[0]} 
                            />
                        </div>
                    )}
                </div>

                {/* Lista de Resultados da Busca por Tema */}
                {searchTerm && (
                    <div className="space-y-3 mb-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                {(isSearching || searchTerm !== debouncedSearch) ? 'Buscando...' : `${filteredResults.length} resultados encontrados`}
                            </h3>
                            {(isSearching || searchTerm !== debouncedSearch) && (
                                <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredResults.map((rec) => {
                                const searchTerms = debouncedSearch.toLowerCase().split(' ').filter(t => t.trim().length > 0);
                                const isMatch = (assunto: string) => {
                                    if (!assunto) return false;
                                    const text = assunto.toLowerCase();
                                    return searchTerms.every(term => text.includes(term));
                                };
                                const match7H = rec.registros7H?.some(r => isMatch(r.assunto));
                                const match6H = rec.registros6H?.some(r => isMatch(r.assunto));
                                const matchedAssunto = rec.registros7H?.find(r => isMatch(r.assunto))?.assunto || rec.registros6H?.find(r => isMatch(r.assunto))?.assunto || rec.registros7H?.[0]?.assunto || rec.registros6H?.[0]?.assunto || 'Tema não informado';

                                return (
                                <button
                                    key={rec.dataISO}
                                    onClick={() => {
                                        setHistoryData(rec);
                                        setSelectedDate(rec.dataISO);
                                        setSearchTerm(''); // Limpa busca ao selecionar
                                    }}
                                    className="flex flex-col items-start p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">
                                            {new Date(rec.dataISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {match7H && (
                                                <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">7H</span>
                                            )}
                                            {match6H && (
                                                <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">6H</span>
                                            )}
                                            <span className="text-[10px] font-medium text-gray-400">{rec.turma}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {matchedAssunto}
                                    </span>
                                </button>
                                );
                            })}

                            {!isSearching && filteredResults.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum tema encontrado neste período.</p>
                                </div>
                            )}

                            {hasMore && (
                                <button
                                    onClick={() => loadHistoryBatch(true)}
                                    disabled={fetchingMore}
                                    className="w-full py-3 mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {fetchingMore ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                            BUSCANDO NO PASSADO... {autoFetchCount > 0 ? `(AUTO ${autoFetchCount}/4)` : ''}
                                        </>
                                    ) : (
                                        'NÃO ENCONTROU? BUSCAR MAIS ANTIGOS (2025...)'
                                    )}
                                </button>
                            )}
                        </div>
                        
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-4"></div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center gap-3 py-10">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Buscando histórico...</span>
                    </div>
                )}

                {/* Não encontrado */}
                {notFound && !loading && !searchTerm && (
                    <div className="text-center py-10">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                        </div>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary font-medium">
                            Nenhum registro encontrado para esta data.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            O histórico só inclui dias em que houve limpeza automática.
                        </p>
                    </div>
                )}

                {/* Resultados */}
                {historyData && !loading && (
                    <div id="history-capture-area" className="space-y-4 bg-light-card dark:bg-dark-card pt-1 px-4">
                        {/* Data formatada */}
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize border-b border-gray-200 dark:border-gray-700 pb-2">
                            {formattedDate}
                        </div>

                        {/* Registro DSS Cards */}
                        <div className="flex gap-3">
                            {/* 7H Card */}
                            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-left relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <SubjectIcon className="w-12 h-12 text-blue-600" />
                                </div>
                                <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO 7H</div>
                                <div className="mb-2 relative z-10">
                                    <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">
                                        {historyData.registros7H.length > 0 ? historyData.registros7H[0].assunto || 'NÃO INFORMADO' : 'NÃO INFORMADO'}
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">
                                        {historyData.registros7H.length > 0 && historyData.registros7H[0].name ? historyData.registros7H[0].name : '---'}
                                    </span>
                                </div>
                            </div>

                            {/* 6H Card (somente se não for CCG) */}
                            {turma !== 'CCG' && (
                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 text-left relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShiftIcon className="w-12 h-12 text-orange-600" />
                                    </div>
                                    <div className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO 6H</div>
                                    <div className="mb-2 relative z-10">
                                        <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">
                                            {historyData.registros6H.length > 0 ? historyData.registros6H[0].assunto || 'NÃO INFORMADO' : 'NÃO INFORMADO'}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">
                                            {historyData.registros6H.length > 0 && historyData.registros6H[0].name ? historyData.registros6H[0].name : '---'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">{historyData.totalPresentes}</span>
                                <span className="text-[8px] uppercase text-gray-500 font-bold tracking-tight">Presentes</span>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">{historyData.totalMal}</span>
                                <span className="text-[8px] uppercase text-red-500/80 font-bold tracking-tight">Mal</span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{historyData.totalAusentes}</span>
                                <span className="text-[8px] uppercase text-amber-500/80 font-bold tracking-tight">Ausentes</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 flex flex-col items-center justify-center opacity-80 shadow-sm">
                                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{historyData.totalPendentes}</span>
                                <span className="text-[8px] uppercase text-gray-500 font-bold tracking-tight">Pendentes</span>
                            </div>
                        </div>

                        {/* Listas de funcionários */}
                        {renderEmployeeGroup(team7H, '7H')}
                        {turma !== 'CCG' && renderEmployeeGroup(team6H, '6H')}

                        {/* Botões de exportação */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleCopy}
                                className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition flex items-center justify-center gap-2 shadow-md text-sm"
                            >
                                <FileTextIcon className="w-4 h-4" />
                                COPIAR
                            </button>
                            <div className="w-full">
                                <ExportDropdown
                                    onExportTxt={handleExportTxt}
                                    onExportPng={handleExportPng}
                                    onExportPdf={handleExportPdf}
                                    onExportDoc={handleExportDoc}
                                    onExportExcel={handleExportExcel}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Estado inicial (sem data selecionada) */}
                {!selectedDate && !loading && !searchTerm && (
                    <div className="text-center py-10">
                        <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary font-medium">
                            Selecione uma data acima para consultar o histórico.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default HistoryModal;
