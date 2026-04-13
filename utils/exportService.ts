import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export const exportToPng = async (elementId: string, filename: string, scale: number = 2) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        // Temporarily adjust scale if modal is scaled down to prevent blurry images
        const originalTransform = element.style.transform;
        if (originalTransform) element.style.transform = 'none';

        const canvas = await html2canvas(element, {
            scale: scale,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        if (originalTransform) element.style.transform = originalTransform;

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

        const originalTransform = element.style.transform;
        if (originalTransform) element.style.transform = 'none';

        const canvas = await html2canvas(element, {
            scale: 2, // good quality
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1A202C' : '#ffffff',
        });

        if (originalTransform) element.style.transform = originalTransform;

        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions to fit the PDF
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
