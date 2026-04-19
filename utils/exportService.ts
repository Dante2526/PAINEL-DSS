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
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#f8fafc',
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

        // ═══════════════════════════════════════════
        // CABEÇALHO ESCURO (igual ao e-mail)
        // ═══════════════════════════════════════════
        pdf.setFillColor(30, 41, 59);
        pdf.rect(0, 0, pageWidth, 28, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`RESUMO GERAL - TURMA ${data.turma} - ${data.dataFormatada}`, margin, 18);

        y = 36;

        // ═══════════════════════════════════════════
        // LINHA SEPARADORA + BULLETS DE RESUMO
        // ═══════════════════════════════════════════
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

        // ═══════════════════════════════════════════
        // HELPER: Desenhar seção de equipe por turno
        // ═══════════════════════════════════════════
        const team7H = data.employees.filter(e => e.turno !== '6H');
        const team6H = data.employees.filter(e => e.turno === '6H');

        const drawSection = (
            emps: { n: string; m: string; s: string }[],
            turnoLabel: string
        ) => {
            if (emps.length === 0) return;

            checkPageBreak(14);

            // Título da equipe
            pdf.setDrawColor(200, 210, 220);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 6;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.setTextColor(30, 41, 59);
            pdf.text(`EQUIPE TURNO ${turnoLabel}`, margin, y);
            y += 7;
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
                        const line = `• ${emp.n} (Matrícula: ${emp.m})`;
                        pdf.text(line, margin + 4, y);
                        y += 4.5;
                    });
                }
                y += 3;
            });
        };

        drawSection(team7H, mainLabel);
        if (data.turma !== 'CCG' && team6H.length > 0) {
            drawSection(team6H, secLabel);
        }

        // ═══════════════════════════════════════════
        // REGISTROS DSS (TEMAS)
        // ═══════════════════════════════════════════
        const drawRegistros = (
            registros: { assunto: string; name: string; matricula: string }[],
            turnoLabel: string
        ) => {
            checkPageBreak(14);
            pdf.setDrawColor(200, 210, 220);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 6;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.setTextColor(30, 41, 59);
            pdf.text(`REGISTROS DSS (TURNO ${turnoLabel})`, margin, y);
            y += 6;
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
                    const assuntoLines = pdf.splitTextToSize(`Assunto: ${reg.assunto || 'NÃO INFORMADO'}`, contentWidth - 8);
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

        // ═══════════════════════════════════════════
        // RODAPÉ
        // ═══════════════════════════════════════════
        const footerY = pageHeight - 8;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Painel DSS`, pageWidth / 2, footerY, { align: 'center' });

        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

export const exportToDoc = (text: string, filename: string) => {
    // Generate simple HTML template for the DOC
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${filename}</title></head>
        <body style="font-family: Arial, sans-serif; white-space: pre-wrap; margin: 2rem;">
            ${text.replace(/\n/g, '<br/>')}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
};

export const exportToExcel = (data: Array<any>, filename: string) => {
    try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert the JSON data array to a worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Adjust column widths automatically based on content
        const columnWidths = [
            { wpx: 200 }, // NOME
            { wpx: 100 }, // MATRICULA
            { wpx: 100 }, // TURNO
            { wpx: 150 }, // STATUS
        ];
        ws['!cols'] = columnWidths;

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Relatório");
        
        // Write file and trigger download
        XLSX.writeFile(wb, `${filename}.xlsx`);
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
