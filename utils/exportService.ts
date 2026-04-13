import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

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

export const exportToPdf = async (elementId: string, filename: string) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        // Apply temporary padding
        const originalPadding = element.style.padding;
        element.style.padding = '16px';

        const dataUrl = await htmlToImage.toPng(element, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#f8fafc',
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
                margin: '0',
            }
        });

        // Revert padding
        element.style.padding = originalPadding;

        // Calculate dimensions
        // The image is generated at pixelRatio: 2, so width/height are 2x the element sizes
        const imgProps = { width: element.offsetWidth, height: element.offsetHeight };
        
        const pdf = new jsPDF({
            orientation: imgProps.width > imgProps.height ? 'l' : 'p',
            unit: 'px',
            format: [imgProps.width, imgProps.height] 
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
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
