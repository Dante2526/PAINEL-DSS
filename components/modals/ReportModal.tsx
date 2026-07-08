import React, { useMemo } from 'react';
import Modal from '../Modal';
import { SubjectIcon, ShiftIcon, FileTextIcon } from '../icons';
import { getShiftLabel, getMainShiftLabel } from '../../utils/turmaUtils';
import ExportDropdown from '../ExportDropdown';
import { exportToPng, exportToPdf, exportToDoc, exportToExcel, exportToTxt } from '../../utils/exportService';
import { logAuditEvent } from '../../services/auditService';
import { Employee, PdfReportData } from '../../types';

export const ReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
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
    is6HActive?: boolean;
}> = ({ isOpen, onClose, onBack, employees, showNotification, scale, subject7H, responsible7H, matricula7H, subject6H, responsible6H, matricula6H, adminEmail, turma, is6HActive = true }) => {
    // Generate text for Clipboard/File functions
    const generateReport = () => {
        const team7H = employees.filter(e => e.turno !== '6H');
        const team6H = employees.filter(e => e.turno === '6H');

        const totalEmployees = employees.length;
        const totalPresent = employees.filter(e => e.bem || e.assDss || e.mal).length;
        const totalAusente = employees.filter(e => e.ausente).length;
        const totalPending = employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.ausente).length;

        const dataExibicao = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '/');

        let report = `RESUMO GERAL - TURMA ${turma} - ${dataExibicao}\n`;
        report += `• Total de Funcionários: ${totalEmployees}\n`;
        report += `• Presentes (DSS + Bem/Mal): ${totalPresent}\n`;
        report += `• Pendentes: ${totalPending}\n`;
        report += `• Ausentes: ${totalAusente}\n\n`;

        const shiftLabel = getShiftLabel(turma);
        const mainShiftLabel = getMainShiftLabel(turma);

        const getStatusList = (team: Employee[]) => {
            const bem = team.filter(e => e.bem || e.assDss);
            const mal = team.filter(e => e.mal);
            const ausente = team.filter(e => e.ausente);
            const pending = team.filter(e => !e.bem && !e.assDss && !e.mal && !e.ausente);

            let section = `STATUS: "ASS.DSS + ESTOU BEM"\n`;
            section += bem.length > 0 ? bem.map(e => `• ${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nSTATUS "ESTOU MAL"\n`;
            section += mal.length > 0 ? mal.map(e => `• ${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nPENDENTES\n`;
            section += pending.length > 0 ? pending.map(e => `• ${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';
            section += `\n\nAUSENTES\n`;
            section += ausente.length > 0 ? ausente.map(e => `• ${e.name} (Matrícula: ${e.matricula})`).join('\n') : 'Nenhum';

            return section;
        };

        report += `EQUIPE TURNO ${mainShiftLabel}\n`;
        report += getStatusList(team7H);
        report += `\n\n`;

        if (is6HActive && turma !== 'C_CG' && turma !== 'ESTAGIO' && team6H.length > 0) {
            report += `EQUIPE TURNO ${shiftLabel}\n`;
            report += getStatusList(team6H);
            report += `\n\n`;
        }

        report += `REGISTROS DSS (TURNO ${mainShiftLabel})\n`;
        report += `• Assunto: ${subject7H || 'NÃO PREENCHIDO'}`;
        if (responsible7H) {
            report += `\n  Responsável: ${responsible7H} (Matrícula: ${matricula7H || '---'})\n`;
        } else {
            report += `\n`;
        }

        if (is6HActive && turma !== 'C_CG' && turma !== 'ESTAGIO') {
            report += `\nREGISTROS DSS (TURNO ${shiftLabel})\n`;
            report += `• Assunto: ${subject6H || 'NÃO PREENCHIDO'}`;
            if (responsible6H) {
                report += `\n  Responsável: ${responsible6H} (Matrícula: ${matricula6H || '---'})\n`;
            } else {
                report += `\n`;
            }
        }

        return report;
    };

    const reportText = generateReport();

    // Stats for Visual Display (Keep this simple for the modal visual)
    const visualStats = useMemo(() => ({
        total: employees.length,
        present: employees.filter(e => e.bem || e.assDss || e.mal).length,
        ausenteCount: employees.filter(e => e.ausente).length,
        missingCount: employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.ausente).length,
        malCount: employees.filter(e => e.mal).length,
        malList: employees.filter(e => e.mal),
        ausenteList: employees.filter(e => e.ausente),
    }), [employees]);

    const handleCopy = () => {
        navigator.clipboard.writeText(reportText);
        showNotification('Relatório copiado para a área de transferência!', 'success');
        logAuditEvent(adminEmail, 'REPORT_COPY', 'Relatório copiado para área de transferência', turma);
        onClose();
    };

    const baseFileName = `relatorio-dss-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;

    const handleExportTxt = () => {
        exportToTxt(reportText, baseFileName);
        showNotification('Relatório baixado em TXT!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório baixado como arquivo TXT', turma);
        onClose();
    };

    const handleExportDoc = () => {
        exportToDoc(reportText, baseFileName);
        showNotification('Relatório baixado em DOC!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório baixado como arquivo DOC', turma);
        onClose();
    };

    const handleExportExcel = () => {
        const dataFormatada = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '/');

        const excelData: PdfReportData = {
            turma: turma || '?',
            dataFormatada: dataFormatada,
            totalFuncionarios: employees.length,
            totalPresentes: visualStats.present,
            totalPendentes: visualStats.missingCount,
            totalAusentes: visualStats.ausenteCount,
            totalMal: visualStats.malCount,
            employees: employees.map(e => ({
                n: e.name,
                m: e.matricula,
                s: e.bem || e.assDss ? 'BEM' : e.mal ? 'MAL' : e.ausente ? 'AUS' : 'PEN',
                turno: e.turno || '7H'
            })),
            registros7H: [{
                assunto: subject7H || 'NÃO PREENCHIDO',
                name: responsible7H || '',
                matricula: matricula7H || ''
            }],
            registros6H: [{
                assunto: subject6H || 'NÃO PREENCHIDO',
                name: responsible6H || '',
                matricula: matricula6H || ''
            }],
            mainShiftLabel: getMainShiftLabel(turma),
            shiftLabel: getShiftLabel(turma),
        };

        exportToExcel(excelData, baseFileName);
        showNotification('Relatório baixado em Excel!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório baixado como Excel estruturado', turma);
        onClose();
    };

    const handleExportPng = async () => {
        await exportToPng('report-capture-area', baseFileName);
        showNotification('Relatório salvo como Imagem!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório salvo como imagem PNG', turma);
        onClose();
    };

    const handleExportPdf = async () => {
        const dataFormatada = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '/'); // Garante formato DD/MM/YY

        const pdfData: PdfReportData = {
            turma: turma || '?',
            dataFormatada: dataFormatada,
            totalFuncionarios: employees.length,
            totalPresentes: visualStats.present,
            totalPendentes: visualStats.missingCount,
            totalAusentes: visualStats.ausenteCount,
            totalMal: visualStats.malCount,
            employees: employees.map(e => ({
                n: e.name,
                m: e.matricula,
                s: e.bem || e.assDss ? 'BEM' : e.mal ? 'MAL' : e.ausente ? 'AUS' : 'PEN',
                turno: e.turno || '7H'
            })),
            registros7H: [{
                assunto: subject7H || 'NÃO PREENCHIDO',
                name: responsible7H || '',
                matricula: matricula7H || ''
            }],
            registros6H: [{
                assunto: subject6H || 'NÃO PREENCHIDO',
                name: responsible6H || '',
                matricula: matricula6H || ''
            }],
            mainShiftLabel: getMainShiftLabel(turma),
            shiftLabel: getShiftLabel(turma),
        };

        await exportToPdf(pdfData, baseFileName);
        showNotification('Relatório salvo em PDF!', 'success');
        logAuditEvent(adminEmail, 'REPORT_DOWNLOAD', 'Relatório baixado como PDF estruturado', turma);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={onBack} title="Relatório Diário" scale={scale}>
            {/* Visual Report Container */}
            <div id="report-capture-area" className="w-full mb-6 bg-light-card dark:bg-dark-card pt-1 px-4">
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
                        <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO {getMainShiftLabel(turma)}</div>
                        <div className="mb-2 relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">{subject7H || 'NÃO PREENCHIDO'}</span>
                        </div>
                        <div className="relative z-10">
                            <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">{responsible7H || '---'}</span>
                        </div>
                    </div>

                    {/* 6H Card */}
                    {is6HActive && turma !== 'C_CG' && turma !== 'ESTAGIO' && (
                        <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 text-left relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShiftIcon className="w-12 h-12 text-orange-600" />
                            </div>
                            <div className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full w-fit mb-2">TURNO {getShiftLabel(turma)}</div>
                            <div className="mb-2 relative z-10">
                                <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Tema DSS</span>
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">{subject6H || 'NÃO PREENCHIDO'}</span>
                            </div>
                            <div className="relative z-10">
                                <span className="text-[9px] uppercase text-gray-500 dark:text-gray-400 block font-bold">Responsável</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate block">{responsible6H || '---'}</span>
                            </div>
                        </div>
                    )}
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
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{visualStats.ausenteCount}</span>
                        <span className="text-[8px] uppercase text-amber-500/80 font-bold tracking-tight">Ausentes</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 flex flex-col items-center justify-center opacity-80 shadow-sm">
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{visualStats.missingCount}</span>
                        <span className="text-[8px] uppercase text-gray-500 font-bold tracking-tight">Pendentes</span>
                    </div>
                </div>

                {/* Compact Issues Lists */}
                {(visualStats.malList.length > 0 || visualStats.ausenteList.length > 0) && (
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
                        {visualStats.ausenteList.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Ausentes
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {visualStats.ausenteList.map(e => (
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
        </Modal>
    );
};
export default ReportModal;
