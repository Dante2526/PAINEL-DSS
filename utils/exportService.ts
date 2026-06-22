import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface PdfReportData {
    turma: string;
    dataFormatada: string;
    registros7H: { assunto: string; name: string; matricula: string }[];
    registros6H: { assunto: string; name: string; matricula: string }[];
    employees: { n: string; m: string; s: string; turno: string }[];
    totalFuncionarios: number;
    totalPresentes: number;
    totalAusentes: number;
    totalMal: number;
    totalPendentes: number;
    mainShiftLabel?: string;
    shiftLabel?: string;
}
export const exportToPng = async (elementId: string, filename: string) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        // Apply temporary padding to ensure shadows/borders aren't clipped
        const originalPadding = element.style.padding;
        element.style.padding = '16px';
        
        const dataUrl = await htmlToImage.toPng(element, {
            quality: 1,
            pixelRatio: 3,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#111217' : '#f8fafc',
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
                margin: '0',
            }
        });

        // Revert padding
        element.style.padding = originalPadding;

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Error generating PNG:', error);
        throw error;
    }
};

export const generatePdfBlob = async (data: PdfReportData): Promise<Blob> => {
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
    };

    const mainLabel = data.mainShiftLabel || '7H';
    const secLabel = data.shiftLabel || '6H';

    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, 28, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`RESUMO GERAL - TURMA ${data.turma} - ${data.dataFormatada}`, pageWidth / 2, 18, { align: 'center' });
    y = 36;

    pdf.setDrawColor(200, 210, 220);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    const bullets = [
        `Total de Funcionários: ${data.totalFuncionarios}`,
        `Presentes (DSS + Bem/Mal): ${data.totalPresentes}`,
        `Pendentes: ${data.totalPendentes}`,
        `Ausentes: ${data.totalAusentes}`,
    ];
    bullets.forEach(text => {
        checkPageBreak(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`• ${text}`, margin + 2, y);
        y += 5.5;
    });
    y += 4;

    const team7H = data.employees.filter(e => e.turno !== '6H');
    const team6H = data.employees.filter(e => e.turno === '6H');

    const drawSection = (emps: { n: string; m: string; s: string }[], turnoLabel: string) => {
        if (emps.length === 0) return;
        checkPageBreak(14);
        pdf.setDrawColor(200, 210, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6.5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`EQUIPE TURNO ${turnoLabel}`, margin, y);
        y += 3.5;
        pdf.setDrawColor(200, 210, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;

        const statusGroups: { key: string; label: string; emps: { n: string; m: string; s: string }[] }[] = [
            { key: 'BEM', label: 'STATUS: "ASS.DSS + ESTOU BEM"', emps: emps.filter(e => e.s === 'BEM') },
            { key: 'MAL', label: 'STATUS "ESTOU MAL"',            emps: emps.filter(e => e.s === 'MAL') },
            { key: 'PEN', label: 'PENDENTES',                      emps: emps.filter(e => e.s === 'PEN') },
            { key: 'AUS', label: 'AUSENTES',                       emps: emps.filter(e => e.s === 'AUS') },
        ];
        statusGroups.forEach(group => {
            checkPageBreak(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(30, 41, 59);
            pdf.text(group.label, margin, y);
            y += 5;
            if (group.emps.length === 0) {
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(9);
                pdf.setTextColor(120, 130, 145);
                pdf.text('Nenhum', margin + 4, y);
                y += 5;
            } else {
                group.emps.forEach(emp => {
                    checkPageBreak(5);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`• ${emp.n} (Matrícula: ${emp.m})`, margin + 4, y);
                    y += 4.5;
                });
            }
            y += 3;
        });
    };

    const drawRegistros = (registros: { assunto: string; name: string; matricula: string }[], turnoLabel: string) => {
        checkPageBreak(14);
        pdf.setDrawColor(200, 210, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6.5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`REGISTROS DSS (TURNO ${turnoLabel})`, margin, y);
        y += 3.5;
        pdf.setDrawColor(200, 210, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 5;

        if (registros.length === 0) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9);
            pdf.setTextColor(120, 130, 145);
            pdf.text(`Nenhum registro de assunto encontrado para ${turnoLabel}.`, margin + 2, y);
            y += 6;
        } else {
            registros.forEach(reg => {
                checkPageBreak(14);
                const nameText = reg.name ? `${reg.name} (Matrícula: ${reg.matricula || '---'})` : 'Nome não informado';
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(30, 41, 59);
                pdf.text(`• ${nameText}`, margin + 2, y);
                y += 4.5;
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(9);
                pdf.setTextColor(60, 80, 100);
                const assuntoLines = pdf.splitTextToSize(`Assunto: ${reg.assunto || 'NÃO PREENCHIDO'}`, contentWidth - 8);
                pdf.text(assuntoLines, margin + 6, y);
                y += assuntoLines.length * 4.5 + 2;
            });
        }
        y += 4;
    };

    drawRegistros(data.registros7H, mainLabel);
    if (data.turma !== 'CCG') {
        drawRegistros(data.registros6H, secLabel);
    }
    drawSection(team7H, mainLabel);
    if (data.turma !== 'CCG' && team6H.length > 0) {
        drawSection(team6H, secLabel);
    }

    const footerY = pageHeight - 8;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Painel DSS`, pageWidth / 2, footerY, { align: 'center' });

    return pdf.output('blob');
};

export const exportToPdf = async (_elementIdOrData: string | PdfReportData, filename: string, reportData?: PdfReportData) => {
    try {
        const data = typeof _elementIdOrData === 'object' ? _elementIdOrData : reportData;

        if (!data) {
            const element = document.getElementById(_elementIdOrData as string);
            if (!element) throw new Error('Element not found');
            const dataUrl = await htmlToImage.toPng(element, { quality: 1, pixelRatio: 2, backgroundColor: '#f8fafc' });
            const imgProps = { width: element.offsetWidth, height: element.offsetHeight };
            const pdf = new jsPDF({ orientation: imgProps.width > imgProps.height ? 'l' : 'p', unit: 'px', format: [imgProps.width, imgProps.height] });
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
            pdf.save(`${filename}.pdf`);
            return;
        }

        const blob = await generatePdfBlob(data);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};


export const generateDocBlob = (text: string): Blob => {
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Documento</title></head>
        <body style="font-family: Arial, sans-serif; white-space: pre-wrap; margin: 2rem;">
            ${text.replace(/\n/g, '<br/>')}
        </body>
        </html>
    `;
    return new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
};

export const exportToDoc = (text: string, filename: string) => {
    const blob = generateDocBlob(text);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
};

export const generateExcelBlob = (dataOrArray: PdfReportData | Array<any>): Blob => {
    try {
        const wb = XLSX.utils.book_new();
        let ws: XLSX.WorkSheet;

        if (!Array.isArray(dataOrArray)) {
            const data = dataOrArray as PdfReportData;
            const rows: any[][] = [];

            // 1. Cabeçalho Principal
            rows.push([`RESUMO GERAL - TURMA ${data.turma} - ${data.dataFormatada}`]);
            rows.push([]);

            // 2. Resumo Estatístico
            rows.push(['RESUMO ESTATÍSTICO']);
            rows.push(['Total de Funcionários:', data.totalFuncionarios]);
            rows.push(['Presentes (DSS + Bem/Mal):', data.totalPresentes]);
            rows.push(['Pendentes:', data.totalPendentes]);
            rows.push(['Ausentes:', data.totalAusentes]);
            rows.push([]);

            const mainLabel = data.mainShiftLabel || '7H';
            const secLabel = data.shiftLabel || '6H';

            // 3. Seção Turno Principal
            rows.push([`=== EQUIPE TURNO ${mainLabel} ===`]);
            
            // Registros DSS do Turno Principal
            rows.push(['REGISTROS DSS']);
            if (data.registros7H.length > 0) {
                data.registros7H.forEach(reg => {
                    rows.push(['Assunto:', reg.assunto || 'NÃO PREENCHIDO']);
                    rows.push(['Responsável:', `${reg.name || '---'} (Matrícula: ${reg.matricula || '---'})`]);
                });
            } else {
                rows.push(['Nenhum tema registrado.']);
            }
            rows.push([]);

            // Lista do Turno Principal
            rows.push(['NOME', 'MATRÍCULA', 'TURNO', 'STATUS']);
            const mainTeam = data.employees.filter(e => e.turno !== '6H');
            mainTeam.forEach(e => {
                let statusLabel = e.s === 'BEM' ? 'ASS.DSS + BEM' : e.s === 'MAL' ? 'ESTOU MAL' : e.s === 'AUS' ? 'AUSENTE' : 'PENDENTE';
                rows.push([e.n, e.m, e.turno || '7H', statusLabel]);
            });
            rows.push([]);
            rows.push([]);

            // 4. Seção Turno Secundário (se existir)
            if (data.turma !== 'CCG') {
                const secTeam = data.employees.filter(e => e.turno === '6H');
                if (secTeam.length > 0 || data.registros6H.length > 0) {
                    rows.push([`=== EQUIPE TURNO ${secLabel} ===`]);
                    
                    rows.push(['REGISTROS DSS']);
                    if (data.registros6H.length > 0) {
                        data.registros6H.forEach(reg => {
                            rows.push(['Assunto:', reg.assunto || 'NÃO PREENCHIDO']);
                            rows.push(['Responsável:', `${reg.name || '---'} (Matrícula: ${reg.matricula || '---'})`]);
                        });
                    } else {
                        rows.push(['Nenhum tema registrado.']);
                    }
                    rows.push([]);

                    if (secTeam.length > 0) {
                        rows.push(['NOME', 'MATRÍCULA', 'TURNO', 'STATUS']);
                        secTeam.forEach(e => {
                            let statusLabel = e.s === 'BEM' ? 'ASS.DSS + BEM' : e.s === 'MAL' ? 'ESTOU MAL' : e.s === 'AUS' ? 'AUSENTE' : 'PENDENTE';
                            rows.push([e.n, e.m, e.turno || '6H', statusLabel]);
                        });
                    }
                }
            }

            ws = XLSX.utils.aoa_to_sheet(rows);

            // Ajustar larguras
            ws['!cols'] = [
                { wpx: 300 }, // NOME / Labels
                { wpx: 150 }, // MATRICULA / Valores
                { wpx: 100 }, // TURNO
                { wpx: 150 }, // STATUS
            ];
        } else {
            // Fallback para o modo antigo (array de objetos)
            ws = XLSX.utils.json_to_sheet(dataOrArray);
            ws['!cols'] = [
                { wpx: 200 },
                { wpx: 100 },
                { wpx: 100 },
                { wpx: 150 },
            ];
        }

        XLSX.utils.book_append_sheet(wb, ws, "Relatório");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error) {
        console.error('Error generating Excel blob:', error);
        throw error;
    }
};

export const exportToExcel = (dataOrArray: PdfReportData | Array<any>, filename: string) => {
    try {
        const blob = generateExcelBlob(dataOrArray);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating Excel:', error);
        throw error;
    }
};

export const exportToTxt = (text: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const exportToZip = async (files: { name: string, content: string | Blob }[], zipFilename: string) => {
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        files.forEach(file => {
            if (typeof file.content === 'string') {
                zip.file(file.name, '\uFEFF' + file.content);
            } else {
                zip.file(file.name, file.content);
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${zipFilename}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating ZIP:', error);
        throw error;
    }
};
