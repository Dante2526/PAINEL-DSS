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
        // Determinar dados: se primeiro arg é objeto, usar diretamente; senão, usar reportData
        const data = typeof _elementIdOrData === 'object' ? _elementIdOrData : reportData;
        
        if (!data) {
            // Fallback: exportar como screenshot se não receber dados estruturados
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

        // ═══════════════════════════════════════════
        // CABEÇALHO
        // ═══════════════════════════════════════════
        pdf.setFillColor(30, 41, 59); // slate-800
        pdf.rect(0, 0, pageWidth, 28, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`RELATÓRIO DSS — TURMA ${data.turma}`, margin, 12);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(data.dataFormatada, margin, 20);
        
        y = 36;

        // ═══════════════════════════════════════════
        // REGISTROS DSS (TEMA + RESPONSÁVEL)
        // ═══════════════════════════════════════════
        const drawRegistroCard = (turnoLabel: string, turnoColor: number[], registros: { assunto: string; name: string; matricula: string }[]) => {
            checkPageBreak(28);
            
            // Badge do turno
            pdf.setFillColor(turnoColor[0], turnoColor[1], turnoColor[2]);
            pdf.roundedRect(margin, y, 22, 5, 2, 2, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`TURNO ${turnoLabel}`, margin + 11, y + 3.5, { align: 'center' });
            y += 8;

            if (registros.length === 0) {
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(9);
                pdf.setTextColor(156, 163, 175);
                pdf.text('Nenhum registro de assunto encontrado.', margin + 2, y);
                y += 7;
            } else {
                registros.forEach(reg => {
                    checkPageBreak(14);
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7);
                    pdf.setTextColor(107, 114, 128);
                    pdf.text('TEMA DSS', margin + 2, y);
                    y += 4;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(17, 24, 39);
                    const assuntoLines = pdf.splitTextToSize(reg.assunto || 'NÃO INFORMADO', contentWidth - 4);
                    pdf.text(assuntoLines, margin + 2, y);
                    y += assuntoLines.length * 4.5;
                    
                    if (reg.name) {
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(8);
                        pdf.setTextColor(107, 114, 128);
                        pdf.text(`Responsável: ${reg.name} (Mat: ${reg.matricula || '---'})`, margin + 2, y);
                        y += 5;
                    }
                    y += 2;
                });
            }
            y += 2;
        };

        const mainLabel = data.mainShiftLabel || '7H';
        const secLabel = data.shiftLabel || '6H';

        drawRegistroCard(mainLabel, [59, 130, 246], data.registros7H); // blue-500
        if (data.turma !== 'CCG' && data.registros6H.length > 0) {
            drawRegistroCard(secLabel, [249, 115, 22], data.registros6H); // orange-500
        }

        // ═══════════════════════════════════════════
        // RESUMO GERAL (caixas lado a lado)
        // ═══════════════════════════════════════════
        checkPageBreak(24);

        // Linha separadora
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 5;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('RESUMO GERAL', margin, y);
        y += 6;

        const boxW = (contentWidth - 6) / 4;
        const boxH = 14;
        const stats = [
            { label: 'Presentes', value: String(data.totalPresentes), color: [22, 163, 74] },    // green-600
            { label: 'Mal', value: String(data.totalMal), color: [220, 38, 38] },                 // red-600
            { label: 'Ausentes', value: String(data.totalAusentes), color: [217, 119, 6] },       // amber-600
            { label: 'Pendentes', value: String(data.totalPendentes), color: [107, 114, 128] },   // gray-500
        ];

        stats.forEach((stat, i) => {
            const x = margin + i * (boxW + 2);
            pdf.setFillColor(248, 250, 252); // slate-50
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
            pdf.text(stat.value, x + boxW / 2, y + 7, { align: 'center' });

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(6);
            pdf.setTextColor(107, 114, 128);
            pdf.text(stat.label.toUpperCase(), x + boxW / 2, y + 12, { align: 'center' });
        });
        y += boxH + 8;

        // ═══════════════════════════════════════════
        // EQUIPES POR TURNO
        // ═══════════════════════════════════════════
        const statusConfig: Record<string, { label: string; color: number[]; bgColor: number[] }> = {
            BEM: { label: 'ASS.DSS + ESTOU BEM', color: [22, 101, 52], bgColor: [240, 253, 244] },
            MAL: { label: 'ESTOU MAL', color: [153, 27, 27], bgColor: [254, 242, 242] },
            AUS: { label: 'AUSENTES', color: [146, 64, 14], bgColor: [255, 251, 235] },
            PEN: { label: 'PENDENTES', color: [75, 85, 99], bgColor: [249, 250, 251] },
        };

        const drawTeam = (emps: { n: string; m: string; s: string; turno: string }[], turnoLabel: string) => {
            if (emps.length === 0) return;
            
            checkPageBreak(16);
            
            // Separador
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 5;
            
            // Badge do turno
            pdf.setFillColor(75, 85, 99); // gray-600
            pdf.roundedRect(margin, y, 45, 5, 2, 2, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`TURNO ${turnoLabel} — ${emps.length} colaboradores`, margin + 22.5, y + 3.5, { align: 'center' });
            y += 9;

            const statusOrder = ['BEM', 'MAL', 'AUS', 'PEN'];
            statusOrder.forEach(statusKey => {
                const filtered = emps.filter(e => e.s === statusKey);
                if (filtered.length === 0) return;

                const config = statusConfig[statusKey];
                checkPageBreak(12);

                // Header do status
                pdf.setFillColor(config.bgColor[0], config.bgColor[1], config.bgColor[2]);
                pdf.roundedRect(margin, y, contentWidth, 5, 1, 1, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(7);
                pdf.setTextColor(config.color[0], config.color[1], config.color[2]);
                pdf.text(`● ${config.label} (${filtered.length})`, margin + 2, y + 3.5);
                y += 7;

                // Nomes em colunas
                const colWidth = contentWidth / 2;
                filtered.forEach((emp, idx) => {
                    checkPageBreak(5);
                    const col = idx % 2;
                    const x = margin + col * colWidth + 4;
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(55, 65, 81);
                    
                    const nameText = `${emp.n} (${emp.m})`;
                    const truncated = nameText.length > 45 ? nameText.substring(0, 42) + '...' : nameText;
                    pdf.text(truncated, x, y);
                    
                    if (col === 1 || idx === filtered.length - 1) {
                        y += 4;
                    }
                });
                y += 3;
            });
        };

        const team7H = data.employees.filter(e => e.turno !== '6H');
        const team6H = data.employees.filter(e => e.turno === '6H');

        drawTeam(team7H, mainLabel);
        if (data.turma !== 'CCG' && team6H.length > 0) {
            drawTeam(team6H, secLabel);
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
