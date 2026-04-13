import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export const exportToPng = async (elementId: string, filename: string) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        const canvas = await html2canvas(element, {
            scale: 3, // High definition
            useCORS: true,
            logging: false,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#f8fafc',
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (!clonedElement) return;

                // 1. Force background and remove any external transforms
                clonedElement.style.transform = 'none';
                clonedElement.style.display = 'block';
                clonedElement.style.padding = '12px';

                // 2. Remove overflow:hidden from ALL elements so text doesn't get clipped
                // This is the main culprit for cut-off text in cards
                const allElements = clonedElement.querySelectorAll('*');
                allElements.forEach((el: any) => {
                    const computed = getComputedStyle(el);
                    if (computed.overflow === 'hidden' || computed.overflowX === 'hidden' || computed.overflowY === 'hidden') {
                        // Preserve overflow:hidden only on elements that are purely decorative (absolute icons)
                        const isAbsolute = computed.position === 'absolute';
                        if (!isAbsolute) {
                            el.style.overflow = 'visible';
                            el.style.overflowX = 'visible';
                            el.style.overflowY = 'visible';
                        }
                    }
                });

                // 3. Fix line-clamp issues -- remove the webkit clamp entirely
                const clampedTexts = clonedElement.querySelectorAll('.line-clamp-2, .line-clamp-1, .line-clamp-3');
                clampedTexts.forEach((el: any) => {
                    el.style.display = 'block';
                    el.style.webkitLineClamp = 'unset';
                    el.style.maxHeight = 'none';
                    el.style.overflow = 'visible';
                    el.style.lineHeight = '1.4';
                });

                // 4. Fix truncate (single-line ellipsis) -- show full text
                const truncatedTexts = clonedElement.querySelectorAll('.truncate');
                truncatedTexts.forEach((el: any) => {
                    el.style.overflow = 'visible';
                    el.style.textOverflow = 'clip';
                    el.style.whiteSpace = 'normal';
                });

                // 5. Fix Flex/Grid gaps and overlaps
                const flexContainers = clonedElement.querySelectorAll('.flex');
                flexContainers.forEach((el: any) => {
                    const computed = getComputedStyle(el);
                    if (computed.gap && computed.gap !== 'normal') {
                        el.style.gap = computed.gap;
                    }
                });

                // 6. Make sure the decorative background icons inside cards don't bleed out visually
                const absoluteIcons = clonedElement.querySelectorAll('.absolute');
                absoluteIcons.forEach((el: any) => {
                    el.style.overflow = 'hidden';
                });
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = imgData;
        link.click();
    } catch (error) {
        console.error('Error generating PNG:', error);
        throw error;
    }
};

export const exportToPdf = async (elementId: string, filename: string) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#f8fafc',
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    clonedElement.style.transform = 'none';
                    clonedElement.style.padding = '12px';
                    
                    const clampedTexts = clonedElement.querySelectorAll('.line-clamp-2');
                    clampedTexts.forEach((el: any) => {
                        el.style.display = 'block';
                        el.style.webkitLineClamp = 'unset';
                        el.style.maxHeight = '2.8em';
                    });
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'l' : 'p',
            unit: 'px',
            format: [canvas.width, canvas.height] 
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
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
