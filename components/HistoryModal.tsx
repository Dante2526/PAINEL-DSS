import React, { useState, useMemo, useCallback } from 'react';
import Modal from './Modal';
import CustomDatePicker from './CustomDatePicker';
import { FileTextIcon, SubjectIcon, ShiftIcon, PdfIcon, ExcelIcon, DocIcon } from './icons';
import type { HistoryRecord, HistoryEmployee, Administrator, PdfReportData } from '../types';
import { db } from '../firebase';
import { luminaDb } from '../luminaFirebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, startAfter, startAt, endAt, QueryDocumentSnapshot, DocumentData, documentId, addDoc } from 'firebase/firestore';
import { exportToPng, exportToPdf, exportToDoc, exportToExcel, exportToTxt, exportToZip, generateDocBlob, generateExcelBlob, generatePdfBlob } from '../utils/exportService';
import { SearchIcon } from './icons';
import { jsPDF } from 'jspdf';
import ExportDropdown from './ExportDropdown';
import { getShiftLabel, getMainShiftLabel } from '../utils/turmaUtils';

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
    onBack?: () => void;
    scale: number;
    turma: string | null;
    showNotification: (msg: string, type: 'success' | 'error') => void;
    currentLiveHistory?: HistoryRecord | null;
    adminEmail?: string;
    administrators?: Administrator[];
    is6HActive?: boolean;
}> = ({ isOpen, onClose, onBack, scale, turma, showNotification, currentLiveHistory, adminEmail, administrators, is6HActive = true }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [historyData, setHistoryData] = useState<HistoryRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Estados para envio ao Lumina
    const [isLuminaPanelOpen, setIsLuminaPanelOpen] = useState(false);
    const [luminaEvents, setLuminaEvents] = useState<{ id: string; title: string; category: string; timeLeft: number }[]>([]);
    const [loadingLuminaEvents, setLoadingLuminaEvents] = useState(false);
    const [selectedLuminaEventId, setSelectedLuminaEventId] = useState<string | null>(null);
    const [sendingToLumina, setSendingToLumina] = useState(false);

    // Mapear turma do DSS para classId do Lumina
    const luminaClassId = useMemo(() => {
        if (!turma) return null;
        const map: Record<string, string> = {
            'A': 'Turma A', 'B': 'Turma B', 'C': 'Turma C', 'D': 'Turma D', 
            'A_CG': 'Turma A', 'B_CG': 'Turma B', 'C_CG': 'Turma A', 'D_CG': 'Turma D', 
            'A_CCP_CG': 'Turma A', 'B_CCP_CG': 'Turma B', 'C_CCP_CG': 'Turma C', 'D_CCP_CG': 'Turma D',
            'ESTAGIO': 'Estágio'
        };
        return map[turma] || `Turma ${turma}`;
    }, [turma]);

    const fetchLuminaEvents = async () => {
        if (!luminaDb) {
            showNotification('Conexão com o Lumina não configurada.', 'error');
            return;
        }
        setLoadingLuminaEvents(true);
        setIsLuminaPanelOpen(true);
        try {
            const snap = await getDocs(collection(luminaDb, 'eventos'));
            const now = Date.now();
            const events = snap.docs
                .map(d => {
                    const data = d.data();
                    const expDate = data.expirationDate ? new Date(data.expirationDate).getTime() : 0;
                    const timeLeft = Math.max(0, Math.floor((expDate - now) / 1000));
                    return { id: d.id, title: data.title || 'Sem título', category: data.category || 'Geral', timeLeft };
                })
                .filter(e => e.timeLeft > 0)
                .sort((a, b) => a.timeLeft - b.timeLeft);
            setLuminaEvents(events);
        } catch (e) {
            console.error(e);
            showNotification('Erro ao buscar eventos do Lumina.', 'error');
        } finally {
            setLoadingLuminaEvents(false);
        }
    };

    const handleSendToLumina = async () => {
        if (!historyData || !selectedLuminaEventId || !luminaClassId) return;
        if (!luminaDb) {
            showNotification('Conexão com o Lumina não disponível.', 'error');
            return;
        }

        setSendingToLumina(true);
        try {
            // Gerar PDF em memória usando jsPDF
            const pdfData: PdfReportData = {
                turma: historyData.turma,
                dataFormatada: historyData.data,
                registros7H: historyData.registros7H,
                registros6H: historyData.registros6H,
                employees: historyData.r,
                totalFuncionarios: historyData.totalFuncionarios,
                totalPresentes: historyData.totalPresentes,
                totalAusentes: historyData.totalAusentes,
                totalMal: historyData.totalMal,
                totalPendentes: historyData.totalPendentes,
                mainShiftLabel,
                shiftLabel,
            };

            const pdfBlob = await generatePdfBlob(pdfData);
            const fileName = `DSS_${historyData.turma}_${historyData.dataISO || selectedDate}.pdf`;
            const sizeKB = `${(pdfBlob.size / 1024).toFixed(0)} KB`;

            // Converter Blob para base64 data URL (evita CORS do Firebase Storage)
            const base64Url = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(pdfBlob);
            });

            // Salvar diretamente no Firestore do Lumina (sem Storage, sem CORS)
            await addDoc(collection(luminaDb, 'evidencia'), {
                subjectId: selectedLuminaEventId,
                classId: luminaClassId,
                files: [{ name: fileName, size: sizeKB, type: 'pdf', url: base64Url }],
                uploadedBy: (() => {
                    const admin = administrators?.find(a => a.email === adminEmail);
                    return admin ? admin.name : `PAINEL DSS - Turma ${historyData.turma}`;
                })(),
                uploadedAt: Date.now(),
            });

            showNotification(`Evidência enviada para o Lumina (${luminaClassId})!`, 'success');
            setIsLuminaPanelOpen(false);
            setSelectedLuminaEventId(null);
        } catch (e) {
            console.error(e);
            showNotification('Erro ao enviar evidência para o Lumina.', 'error');
        } finally {
            setSendingToLumina(false);
        }
    };



    const shiftLabel = useMemo(() => {
        return getShiftLabel(historyData ? historyData.turma : turma);
    }, [turma, historyData]);

    const mainShiftLabel = useMemo(() => {
        return getMainShiftLabel(historyData ? historyData.turma : turma);
    }, [turma, historyData]);

    // Estados para Busca por Tema e Multi-Turma por Data
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSearchTurmas, setSelectedSearchTurmas] = useState<string[]>(turma ? [turma] : []);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isExportingZip, setIsExportingZip] = useState(false);
    const [selectedRecordsToExport, setSelectedRecordsToExport] = useState<string[]>([]);
    const [allRecords, setAllRecords] = useState<HistoryRecord[]>([]);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [autoFetchCount, setAutoFetchCount] = useState(0);

    // Estados para Multi-turma por Data
    const [dateResults, setDateResults] = useState<HistoryRecord[]>([]);
    const [showDateList, setShowDateList] = useState(false);

    const fetchingMoreRef = React.useRef(fetchingMore);
    const lastVisibleRef = React.useRef(lastVisible);

    React.useEffect(() => { fetchingMoreRef.current = fetchingMore; }, [fetchingMore]);
    React.useEffect(() => { lastVisibleRef.current = lastVisible; }, [lastVisible]);

    const handleDateChange = useCallback(async (dateValue: string, turmasOverride?: string[]) => {
        setSelectedDate(dateValue);
        setHistoryData(null);
        setDateResults([]);
        setShowDateList(false);
        setNotFound(false);

        const turmasToSearch = (turmasOverride && turmasOverride.length > 0)
            ? turmasOverride
            : (selectedSearchTurmas.length > 0 ? selectedSearchTurmas : (turma ? [turma] : []));

        if (!dateValue || !db || turmasToSearch.length === 0) {
            return;
        }

        // 1. Verificar se já temos o registro em cache na memória (allRecords)
        const cachedResults = allRecords.filter(r => r.dataISO === dateValue && turmasToSearch.includes(r.turma));
        if (cachedResults.length > 0 && cachedResults.length === turmasToSearch.length) {
            if (cachedResults.length === 1) {
                setHistoryData(cachedResults[0]);
                setShowDateList(false);
            } else {
                setDateResults(cachedResults);
                setShowDateList(true);
            }
            setNotFound(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const today = new Date();
            const todayISO = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

            let results: HistoryRecord[] = [...cachedResults];
            const missingTurmas = turmasToSearch.filter(t => !cachedResults.some(cr => cr.turma === t));

            if (missingTurmas.length > 0) {
                // Buscar em paralelo apenas as turmas faltantes
                const promises = missingTurmas.map(async (t) => {
                    const docId = `${t}_${dateValue}`;
                    const docRef = doc(db, 'historico_dss', docId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        return docSnap.data() as HistoryRecord;
                    } else if (dateValue === todayISO && t === turma && currentLiveHistory) {
                        return currentLiveHistory;
                    }
                    return null;
                });

                const fetched = (await Promise.all(promises)).filter(Boolean) as HistoryRecord[];
                results = [...results, ...fetched];
            }

            if (results.length === 0) {
                setNotFound(true);
                setHistoryData(null);
                setShowDateList(false);
            } else if (results.length === 1) {
                setHistoryData(results[0]);
                setShowDateList(false);
                setNotFound(false);
            } else {
                setDateResults(results);
                setShowDateList(true);
                setNotFound(false);
            }
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            showNotification('Erro ao buscar histórico.', 'error');
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [turma, selectedSearchTurmas, allRecords, currentLiveHistory, showNotification]);

    // Função para carregar lote de histórico focado na(s) turma(s) selecionada(s)
    const loadHistoryBatch = useCallback(async (isManualLoadMore = false, turmasParaBusca?: string[]) => {
        const turmaFilter = turmasParaBusca ?? (selectedSearchTurmas.length > 0 ? selectedSearchTurmas : (turma ? [turma] : []));
        if (turmaFilter.length === 0 || !db || (fetchingMoreRef.current && isManualLoadMore)) return;
        
        setIsSearching(true);
        if (isManualLoadMore) {
            setFetchingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const fetchLimit = 200; // Limite de registros para a turma selecionada
            const historicoRef = collection(db, 'historico_dss');
            
            let q;
            if (turmaFilter.length === 1) {
                // Busca direta e exclusiva da turma selecionada, ordenada pela data mais recente
                if (isManualLoadMore && lastVisibleRef.current) {
                    q = query(
                        historicoRef,
                        where('turma', '==', turmaFilter[0]),
                        orderBy('dataISO', 'desc'),
                        startAfter(lastVisibleRef.current),
                        limit(fetchLimit)
                    );
                } else {
                    q = query(
                        historicoRef, 
                        where('turma', '==', turmaFilter[0]),
                        orderBy('dataISO', 'desc'),
                        limit(fetchLimit)
                    );
                }
            } else if (turmaFilter.length > 1 && turmaFilter.length <= 30) {
                // Busca direta para as turmas selecionadas, ordenada pela data mais recente
                if (isManualLoadMore && lastVisibleRef.current) {
                    q = query(
                        historicoRef,
                        where('turma', 'in', turmaFilter),
                        orderBy('dataISO', 'desc'),
                        startAfter(lastVisibleRef.current),
                        limit(fetchLimit)
                    );
                } else {
                    q = query(
                        historicoRef, 
                        where('turma', 'in', turmaFilter),
                        orderBy('dataISO', 'desc'),
                        limit(fetchLimit)
                    );
                }
            } else {
                // Fallback: busca global ordenada (turmaFilter.length > 30)
                if (isManualLoadMore && lastVisibleRef.current) {
                    q = query(
                        historicoRef, 
                        orderBy('dataISO', 'desc'),
                        startAfter(lastVisibleRef.current),
                        limit(fetchLimit)
                    );
                } else {
                    q = query(
                        historicoRef, 
                        orderBy('dataISO', 'desc'), 
                        limit(fetchLimit)
                    );
                }
            }
            
            if (!isManualLoadMore) {
                // Reset states for fresh search
                setAllRecords([]);
                setLastVisible(null);
                setHasMore(true);
                setSelectedRecordsToExport([]);
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setHasMore(false);
                if (!isManualLoadMore) {
                    const today = new Date();
                    const todayISO = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                    if (currentLiveHistory && turmaFilter.includes(turma || '')) {
                        setSelectedDate(todayISO);
                        setHistoryData(currentLiveHistory);
                        setNotFound(false);
                    } else {
                        setSelectedDate(todayISO);
                        setHistoryData(null);
                        setNotFound(true);
                    }
                }
            } else {
                // Filtrar pelas turmas selecionadas e ordenar (descendente por dataISO)
                const newRecords = snapshot.docs
                    .map(doc => doc.data() as HistoryRecord)
                    .filter(rec => !!rec.dataISO && turmaFilter.includes(rec.turma))
                    .sort((a, b) => b.dataISO.localeCompare(a.dataISO));
                
                setAllRecords(prev => isManualLoadMore ? [...prev, ...newRecords] : newRecords);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === fetchLimit);

                // Selecionar automaticamente o dia mais recente do banco de dados
                if (!isManualLoadMore) {
                    if (newRecords.length > 0) {
                        const mostRecentForTurma = newRecords.find(r => r.turma === turma);
                        const mostRecent = mostRecentForTurma || newRecords[0];
                        
                        setSelectedDate(mostRecent.dataISO);
                        setHistoryData(mostRecent);
                        setShowDateList(false);
                        setNotFound(false);
                    } else {
                        const today = new Date();
                        const todayISO = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                        if (currentLiveHistory && turmaFilter.includes(turma || '')) {
                            setSelectedDate(todayISO);
                            setHistoryData(currentLiveHistory);
                            setNotFound(false);
                        } else {
                            setSelectedDate(todayISO);
                            setHistoryData(null);
                            setNotFound(true);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao buscar lote de histórico:', error);
            setHasMore(false);
        } finally {
            setIsSearching(false);
            setFetchingMore(false);
            setLoading(false);
        }
    }, [turma, currentLiveHistory]);

    // Função disparada ao clicar em buscar ou dar Enter
    const handleSearchSubmit = useCallback(() => {
        if (debouncedSearch !== searchTerm) {
            setDebouncedSearch(searchTerm);
            setAllRecords([]);
            setHasMore(true);
            setLastVisible(null);
            setSelectedRecordsToExport([]);
            if (!searchTerm.trim()) {
                loadHistoryBatch(false, selectedSearchTurmas);
            }
        }
    }, [debouncedSearch, searchTerm, selectedSearchTurmas, loadHistoryBatch]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.trim() === '') {
            setDebouncedSearch('');
            setAllRecords([]);
            setHasMore(true);
            setLastVisible(null);
            setSelectedRecordsToExport([]);
            loadHistoryBatch(false, selectedSearchTurmas);
        }
    }, [selectedSearchTurmas, loadHistoryBatch]);

    // Carregar primeiro lote ao abrir ou mudar turma
    React.useEffect(() => {
        if (isOpen && turma) {
            setSelectedDate('');
            setSearchTerm('');
            setDebouncedSearch('');
            setHistoryData(null);
            setNotFound(false);
            setAllRecords([]);
            setLastVisible(null);
            setHasMore(true);
            setAutoFetchCount(0);
            setSelectedSearchTurmas([turma]);
            loadHistoryBatch(false, [turma]);
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

    // Busca automática profunda (Auto-fetch) para varrer TODO o banco se houver busca
    React.useEffect(() => {
        if (
            debouncedSearch.trim() && 
            hasMore && 
            !fetchingMore
        ) {
            // Se tem busca ativa, não para até hasMore ser false (varre todo o banco)
            loadHistoryBatch(true, selectedSearchTurmas);
        }
    }, [debouncedSearch, hasMore, fetchingMore, selectedSearchTurmas, loadHistoryBatch]);

    // Separar funcionários por turno
    const { team7H, team6H } = useMemo(() => {
        if (!historyData) return { team7H: [], team6H: [] };
        return {
            team7H: historyData.r.filter(emp => emp.turno !== '6H'),
            team6H: historyData.r.filter(emp => emp.turno === '6H'),
        };
    }, [historyData]);

    const generateRecordText = (record: HistoryRecord) => {
        const dataExibicao = (record.data || '').split('/').map((s, i) => i === 2 && s.length > 2 ? s.slice(-2) : s).join('/');

        let report = `RESUMO GERAL - TURMA ${record.turma} - ${dataExibicao}\n`;
        report += `• Total de Funcionários: ${record.totalFuncionarios}\n`;
        report += `• Presentes (DSS + Bem/Mal): ${record.totalPresentes}\n`;
        report += `• Pendentes: ${record.totalPendentes}\n`;
        report += `• Ausentes: ${record.totalAusentes}\n\n`;

        const rTeam7H = record.r.filter(e => e.turno !== '6H');
        const rTeam6H = record.r.filter(e => e.turno === '6H');

        const formatTeam = (team: HistoryEmployee[], turnoLabel: string) => {
            report += `EQUIPE TURNO ${turnoLabel}\n`;
            const statuses: { key: string; label: string }[] = [
                { key: 'BEM', label: 'STATUS: "ASS.DSS + ESTOU BEM"' },
                { key: 'MAL', label: 'STATUS "ESTOU MAL"' },
                { key: 'PEN', label: 'PENDENTES' },
                { key: 'AUS', label: 'AUSENTES' },
            ];
            statuses.forEach(({ key, label }) => {
                const filtered = team.filter(e => e.s === key);
                report += `${label}\n`;
                report += filtered.length > 0
                    ? filtered.map(e => `• ${e.n} (Matrícula: ${e.m})`).join('\n')
                    : 'Nenhum';
                report += `\n\n`;
            });
        };

        formatTeam(rTeam7H, mainShiftLabel);
        if (is6HActive && turma !== 'ESTAGIO' && rTeam6H.length > 0) {
            formatTeam(rTeam6H, shiftLabel);
        }

        // Registros DSS
        report += `REGISTROS DSS (TURNO ${mainShiftLabel})\n`;
        if (record.registros7H && record.registros7H.length > 0) {
            record.registros7H.forEach(reg => {
                report += `• Assunto: ${reg.assunto || 'NÃO PREENCHIDO'}\n`;
                if (reg.name) report += `  Responsável: ${reg.name} (Matrícula: ${reg.matricula || '---'})\n`;
            });
        } else {
            report += `Nenhum registro encontrado.\n`;
        }
        report += `\n`;

        if (is6HActive && turma !== 'ESTAGIO' && record.registros6H && record.registros6H.length > 0) {
            report += `REGISTROS DSS (TURNO ${shiftLabel})\n`;
            record.registros6H.forEach(reg => {
                report += `• Assunto: ${reg.assunto || 'NÃO PREENCHIDO'}\n`;
                if (reg.name) report += `  Responsável: ${reg.name} (Matrícula: ${reg.matricula || '---'})\n`;
            });
            report += `\n`;
        }

        return report;
    };

    const generateExportText = () => {
        if (!historyData) return '';
        return generateRecordText(historyData);
    };

    const handleExportAllZip = async (format: 'TXT' | 'PDF' | 'DOC' | 'EXCEL') => {
        const recordsToDownload = selectedRecordsToExport.length > 0 
            ? filteredResults.filter(rec => selectedRecordsToExport.includes(`${rec.turma}_${rec.dataISO}`))
            : filteredResults;

        if (recordsToDownload.length === 0) return;
        
        setIsExportingZip(true);
        showNotification(format === 'EXCEL' ? `Gerando planilha agrupada, aguarde...` : `Gerando arquivos ${format}, aguarde...`, 'success');

        try {
            if (format === 'EXCEL' && recordsToDownload.length > 1) {
                const pdfDataList: PdfReportData[] = recordsToDownload.map(rec => ({
                    turma: rec.turma,
                    dataFormatada: rec.data,
                    registros7H: rec.registros7H || [],
                    registros6H: rec.registros6H || [],
                    employees: rec.r,
                    totalFuncionarios: rec.totalFuncionarios,
                    totalPresentes: rec.totalPresentes,
                    totalAusentes: rec.totalAusentes,
                    totalMal: rec.totalMal,
                    totalPendentes: rec.totalPendentes,
                    mainShiftLabel: getMainShiftLabel(rec.turma),
                    shiftLabel: getShiftLabel(rec.turma),
                    is6HActive,
                }));
                const blob = generateExcelBlob(pdfDataList);
                const safeSearchTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
                const filename = `relatorios-agrupados-${turma || 'busca'}-${safeSearchTerm}.xlsx`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification(`Planilha agrupada baixada com sucesso!`, 'success');
                setIsExportingZip(false);
                setIsExportMenuOpen(false);
                return;
            }

            const filesToZip = await Promise.all(recordsToDownload.map(async (rec) => {
                const dataStr = (rec.data || rec.dataISO || 'data').replace(/\//g, '-');
                const baseName = `historico-${rec.turma}-${dataStr}`;
                
                if (format === 'TXT') {
                    return { name: `${baseName}.txt`, content: generateRecordText(rec) };
                } else if (format === 'DOC') {
                    return { name: `${baseName}.doc`, content: generateDocBlob(generateRecordText(rec)) };
                } else {
                    const pdfData: PdfReportData = {
                        turma: rec.turma,
                        dataFormatada: rec.data,
                        registros7H: rec.registros7H || [],
                        registros6H: rec.registros6H || [],
                        employees: rec.r,
                        totalFuncionarios: rec.totalFuncionarios,
                        totalPresentes: rec.totalPresentes,
                        totalAusentes: rec.totalAusentes,
                        totalMal: rec.totalMal,
                        totalPendentes: rec.totalPendentes,
                        mainShiftLabel: getMainShiftLabel(rec.turma),
                        shiftLabel: getShiftLabel(rec.turma),
                        is6HActive,
                    };
                    
                    if (format === 'PDF') {
                        return { name: `${baseName}.pdf`, content: await generatePdfBlob(pdfData) };
                    } else { // EXCEL
                        return { name: `${baseName}.xlsx`, content: generateExcelBlob(pdfData) };
                    }
                }
            }));

            if (filesToZip.length === 1) {
                const singleFile = filesToZip[0];
                const fileBlob = typeof singleFile.content === 'string' 
                    ? new Blob([singleFile.content], { type: 'text/plain;charset=utf-8' }) 
                    : singleFile.content;
                const url = URL.createObjectURL(fileBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = singleFile.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification(`Arquivo baixado com sucesso!`, 'success');
            } else {
                const safeSearchTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
                const zipFilename = `historicos-busca-${turma}-${safeSearchTerm}`;
                await exportToZip(filesToZip, zipFilename);
                showNotification(`${filesToZip.length} resultados compactados em ZIP!`, 'success');
            }
        } catch (e) {
            console.error(e);
            showNotification('Erro ao gerar o arquivo ZIP.', 'error');
        } finally {
            setIsExportingZip(false);
            setIsExportMenuOpen(false);
        }
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
        const pdfData: PdfReportData = {
            turma: historyData.turma,
            dataFormatada: historyData.data,
            registros7H: historyData.registros7H,
            registros6H: historyData.registros6H,
            employees: historyData.r,
            totalFuncionarios: historyData.totalFuncionarios,
            totalPresentes: historyData.totalPresentes,
            totalAusentes: historyData.totalAusentes,
            totalMal: historyData.totalMal,
            totalPendentes: historyData.totalPendentes,
            mainShiftLabel,
            shiftLabel,
            is6HActive,
        };
        exportToExcel(pdfData, baseFileName);
        showNotification('Histórico baixado em Excel!', 'success');
    };

    const handleExportPng = async () => {
        await exportToPng('history-capture-area', baseFileName);
        showNotification('Histórico salvo como Imagem!', 'success');
    };

    const handleExportPdf = async () => {
        if (!historyData) return;
        const pdfData: PdfReportData = {
            turma: historyData.turma,
            dataFormatada: historyData.data,
            registros7H: historyData.registros7H,
            registros6H: historyData.registros6H,
            employees: historyData.r,
            totalFuncionarios: historyData.totalFuncionarios,
            totalPresentes: historyData.totalPresentes,
            totalAusentes: historyData.totalAusentes,
            totalMal: historyData.totalMal,
            totalPendentes: historyData.totalPendentes,
            mainShiftLabel,
            shiftLabel,
            is6HActive,
        };
        await exportToPdf(pdfData, baseFileName);
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
        <Modal isOpen={isOpen} onClose={onClose} onBack={onBack} title="Histórico DSS" scale={scale} size="md">
            <div className="w-full">
                {/* Seletor de Data e Busca por Tema */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            placeholder="BUSCAR TEMA (EX: EPI)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                            className="w-full pl-10 pr-24 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 font-medium"
                            style={{ fontSize: '16px', textTransform: 'uppercase' }}
                        />
                        {searchTerm.trim() && debouncedSearch !== searchTerm && (
                            <button
                                onClick={handleSearchSubmit}
                                className="absolute inset-y-1.5 right-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center shadow-sm"
                            >
                                BUSCAR
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-2 mt-1 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-full text-center mb-1 uppercase tracking-wider">
                            {searchTerm ? 'Buscar também nas turmas:' : 'Filtrar por turmas:'}
                        </span>
                        {['A', 'B', 'C', 'D', 'A_CG', 'B_CG', 'C_CG', 'D_CG', 'A_CCP_CG', 'B_CCP_CG', 'C_CCP_CG', 'D_CCP_CG'].map(t => {
                            const isSelected = selectedSearchTurmas.includes(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        let nextTurmas;
                                        if (isSelected) {
                                            if (selectedSearchTurmas.length === 1) return;
                                            nextTurmas = selectedSearchTurmas.filter(x => x !== t);
                                        } else {
                                            nextTurmas = [...selectedSearchTurmas, t];
                                        }
                                        setSelectedSearchTurmas(nextTurmas);
                                        loadHistoryBatch(false, nextTurmas);
                                    }}
                                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full border transition-all uppercase tracking-wider ${
                                        isSelected
                                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    TURMA {t.replace('_', ' ')}
                                </button>
                            );
                        })}
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
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                {isSearching ? 'Buscando...' : (searchTerm !== debouncedSearch ? '' : `${filteredResults.length} resultados encontrados`)}
                            </h3>
                            <div className="flex items-center gap-3">
                                {isSearching && (
                                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                )}
                                {filteredResults.length > 1 && !(isSearching || searchTerm !== debouncedSearch) && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                            disabled={isExportingZip || filteredResults.length === 0}
                                            className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold uppercase hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                            title="Baixar resultados selecionados ou todos os encontrados"
                                        >
                                            {isExportingZip ? (
                                                <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                            ) : (
                                                <FileTextIcon className="w-3 h-3" />
                                            )}
                                            {isExportingZip ? 'GERANDO...' : (selectedRecordsToExport.length > 0 ? `BAIXAR ${selectedRecordsToExport.length} SELECIONADOS` : 'BAIXAR TODOS')}
                                        </button>
                                        
                                        {isExportMenuOpen && (
                                            <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex flex-col py-1">
                                                    <button onClick={() => handleExportAllZip('PDF')} className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors">
                                                        <PdfIcon className="w-5 h-5 text-red-500" />
                                                        Documento PDF
                                                    </button>
                                                    <div className="h-px bg-gray-200 dark:bg-dark-hover my-1 mx-2"></div>
                                                    <button onClick={() => handleExportAllZip('EXCEL')} className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors">
                                                        <ExcelIcon className="w-5 h-5 text-green-600" />
                                                        Planilha Excel
                                                    </button>
                                                    <button onClick={() => handleExportAllZip('DOC')} className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors">
                                                        <DocIcon className="w-5 h-5 text-blue-500" />
                                                        Word (DOC)
                                                    </button>
                                                    <div className="h-px bg-gray-200 dark:bg-dark-hover my-1 mx-2"></div>
                                                    <button onClick={() => handleExportAllZip('TXT')} className="px-4 py-3 text-left text-sm font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-800 dark:text-gray-200 transition-colors">
                                                        <FileTextIcon className="w-5 h-5 text-gray-500" />
                                                        Texto (TXT)
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                const matchedAssunto = rec.registros7H?.find(r => isMatch(r.assunto))?.assunto || rec.registros6H?.find(r => isMatch(r.assunto))?.assunto || rec.registros7H?.[0]?.assunto || rec.registros6H?.[0]?.assunto || 'Tema não preenchido';

                                const recId = `${rec.turma}_${rec.dataISO}`;
                                const isSelected = selectedRecordsToExport.includes(recId);

                                return (
                                <div 
                                    key={recId} 
                                    className={`relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-xl transition-all text-left group ${
                                        isSelected 
                                            ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/50 shadow-sm' 
                                            : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                                    }`}
                                >
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRecordsToExport(prev => 
                                                prev.includes(recId) ? prev.filter(id => id !== recId) : [...prev, recId]
                                            );
                                        }}
                                        className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-all"
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400'}`}>
                                            {isSelected && (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setHistoryData(rec);
                                            setSelectedDate(rec.dataISO);
                                            setSearchTerm(''); // Limpa busca ao selecionar
                                            setSelectedRecordsToExport([]); // Limpa a seleção ao abrir
                                        }}
                                        className="flex-1 flex flex-col items-start focus:outline-none"
                                    >
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">
                                                {new Date(rec.dataISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {match7H && (
                                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{mainShiftLabel}</span>
                                                )}
                                                {match6H && is6HActive && (
                                                    <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{shiftLabel}</span>
                                                )}
                                                <span className="text-[10px] font-medium text-gray-400">{rec.turma}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 text-left group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {typeof matchedAssunto === 'string' ? matchedAssunto.trim() : matchedAssunto}
                                        </span>
                                    </button>
                                </div>
                                );
                            })}

                            {!isSearching && filteredResults.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum tema encontrado neste período.</p>
                                </div>
                            )}

                            {hasMore && !searchTerm && (
                                <button
                                    onClick={() => loadHistoryBatch(true, selectedSearchTurmas)}
                                    disabled={fetchingMore}
                                    className="w-full py-3 mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {fetchingMore ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                            BUSCANDO MAIS REGISTROS...
                                        </>
                                    ) : (
                                        'CARREGAR MAIS ANTIGOS (2025...)'
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

                {/* Lista de resultados multi-turma por data */}
                {showDateList && !loading && dateResults.length > 0 && !searchTerm && (
                    <div className="space-y-3 mb-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                {dateResults.length} {dateResults.length === 1 ? 'resultado encontrado' : 'turmas encontradas'} nesta data
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {dateResults.map((rec) => {
                                const recId = `${rec.turma}_${rec.dataISO}`;
                                const matchedAssunto = rec.registros7H?.[0]?.assunto || rec.registros6H?.[0]?.assunto || 'Tema não preenchido';
                                const has7H = (rec.registros7H?.length ?? 0) > 0;
                                const has6H = (rec.registros6H?.length ?? 0) > 0;

                                return (
                                    <button
                                        key={recId}
                                        type="button"
                                        onClick={() => {
                                            setHistoryData(rec);
                                            setShowDateList(false);
                                        }}
                                        className="relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm rounded-xl transition-all text-left group w-full"
                                    >
                                        <div className="flex-1 flex flex-col items-start">
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">
                                                    {new Date(rec.dataISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {has7H && (
                                                        <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            {getMainShiftLabel(rec.turma)}
                                                        </span>
                                                    )}
                                                    {has6H && is6HActive && (
                                                        <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            {getShiftLabel(rec.turma)}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                        TURMA {rec.turma.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {typeof matchedAssunto === 'string' ? matchedAssunto.trim() : matchedAssunto}
                                            </span>
                                            <div className="flex gap-3 mt-1.5">
                                                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">✓ {rec.totalPresentes} pres.</span>
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">✗ {rec.totalAusentes} aus.</span>
                                                <span className="text-[10px] text-gray-400 font-bold">⏳ {rec.totalPendentes} pend.</span>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                );
                            })}
                        </div>
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
                            {selectedSearchTurmas.length === 1
                                ? 'Nenhum registro encontrado para esta data.'
                                : 'Nenhum registro encontrado para as turmas selecionadas nesta data.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            O histórico só inclui dias em que houve limpeza automática.
                        </p>
                    </div>
                )}

                {/* Resultados */}
                {historyData && !loading && (
                    <div className="space-y-4">
                        {dateResults.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setHistoryData(null);
                                    setShowDateList(true);
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-1 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Voltar para os resultados desta data ({dateResults.length} turmas)</span>
                            </button>
                        )}
                        <div id="history-capture-area" className="space-y-4 bg-light-card dark:bg-dark-card pt-1 px-4">
                            {/* Data formatada */}
                            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize border-b border-gray-200 dark:border-gray-700 pb-2 text-center flex items-center justify-center gap-2">
                                <span>{formattedDate}</span>
                                {historyData.turma && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase">
                                        TURMA {historyData.turma.replace('_', ' ')}
                                    </span>
                                )}
                            </div>

                        {/* Registro DSS Cards */}
                        <div className="flex gap-3">
                            {/* 7H Card */}
                            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-center relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <SubjectIcon className="w-12 h-12 text-blue-600" />
                                </div>
                                <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full w-fit mb-2 mx-auto">TURNO {mainShiftLabel}</div>
                                <div className="mb-2 relative z-10">
                                    <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold text-center">Tema DSS</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight text-center">
                                        {historyData.registros7H.length > 0 ? historyData.registros7H[0].assunto || 'NÃO PREENCHIDO' : 'NÃO PREENCHIDO'}
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold text-center">Responsável</span>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate block text-center">
                                        {historyData.registros7H.length > 0 && historyData.registros7H[0].name ? historyData.registros7H[0].name : '---'}
                                    </span>
                                </div>
                            </div>

                            {/* 6H Card (somente se não for C_CG e estiver ativo) */}
                            {is6HActive && turma !== 'ESTAGIO' && (
                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 text-center relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShiftIcon className="w-12 h-12 text-orange-600" />
                                    </div>
                                    <div className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full w-fit mb-2 mx-auto">TURNO {shiftLabel}</div>
                                    <div className="mb-2 relative z-10">
                                        <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold text-center">Tema DSS</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight text-center">
                                            {historyData.registros6H.length > 0 ? historyData.registros6H[0].assunto || 'NÃO PREENCHIDO' : 'NÃO PREENCHIDO'}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold text-center">Responsável</span>
                                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate block text-center">
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
                        {renderEmployeeGroup(team7H, mainShiftLabel)}
                        {is6HActive && turma !== 'ESTAGIO' && renderEmployeeGroup(team6H, shiftLabel)}

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
                                {(() => {
                                    const isMultiSelect = selectedRecordsToExport.length > 0;
                                    return (
                                        <ExportDropdown
                                            label={isMultiSelect ? (selectedRecordsToExport.length === 1 ? 'BAIXAR SELECIONADO' : 'BAIXAR TODOS') : 'BAIXAR'}
                                            onExportTxt={isMultiSelect ? () => handleExportAllZip('TXT') : handleExportTxt}
                                            onExportPng={handleExportPng} // PNG só funciona pro DOM atual
                                            onExportPdf={isMultiSelect ? () => handleExportAllZip('PDF') : handleExportPdf}
                                            onExportDoc={isMultiSelect ? () => handleExportAllZip('DOC') : handleExportDoc}
                                            onExportExcel={isMultiSelect ? () => handleExportAllZip('EXCEL') : handleExportExcel}
                                            disabled={isMultiSelect && isExportingZip}
                                        />
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Botão enviar ao Lumina */}
                        <button
                            onClick={fetchLuminaEvents}
                            className="w-full mt-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            ENVIAR EVIDÊNCIA AO LUMINA
                        </button>

                        {/* Painel de seleção de evento do Lumina */}
                        {isLuminaPanelOpen && (
                            <div className="mt-3 border border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-bold text-sm">Selecione o Evento no Lumina</p>
                                        <p className="text-violet-200 text-[10px] mt-0.5">Evidência será enviada para: <strong>{luminaClassId}</strong></p>
                                    </div>
                                    <button
                                        onClick={() => { setIsLuminaPanelOpen(false); setSelectedLuminaEventId(null); }}
                                        className="text-violet-200 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 space-y-2 max-h-52 overflow-y-auto">
                                    {loadingLuminaEvents ? (
                                        <div className="flex items-center justify-center py-6 gap-2">
                                            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-violet-600">Buscando eventos...</span>
                                        </div>
                                    ) : luminaEvents.length === 0 ? (
                                        <p className="text-center text-sm text-gray-500 py-4">Nenhum evento ativo encontrado no Lumina.</p>
                                    ) : (
                                        luminaEvents.map(ev => {
                                            const isSelected = selectedLuminaEventId === ev.id;
                                            const h = Math.floor(ev.timeLeft / 3600);
                                            const m = Math.floor((ev.timeLeft % 3600) / 60);
                                            const d = Math.floor(ev.timeLeft / 86400);
                                            const timeStr = d > 0 ? `${d}d ${h % 24}h` : `${h}h ${m}min`;
                                            return (
                                                <button
                                                    key={ev.id}
                                                    onClick={() => setSelectedLuminaEventId(ev.id)}
                                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/50'
                                                            : 'border-transparent bg-white dark:bg-gray-800/60 hover:border-violet-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{ev.title}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{ev.category}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">⏱ {timeStr}</span>
                                                            {isSelected && (
                                                                <div className="mt-1 flex justify-end">
                                                                    <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-3 border-t border-violet-100 dark:border-violet-800 bg-white dark:bg-gray-900">
                                    <button
                                        onClick={handleSendToLumina}
                                        disabled={!selectedLuminaEventId || sendingToLumina}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        {sendingToLumina ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Enviando PDF...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Confirmar Envio
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
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
