import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar")
        return
    }
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

    XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export const exportToPDF = (
    title: string,
    headers: string[],
    dataRows: any[][],
    fileName: string
) => {
    if (!dataRows || dataRows.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    const doc = new jsPDF()

    // Title
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // Subtitle / Date
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-MX')}`, 14, 22)

    autoTable(doc, {
        startY: 28,
        head: [headers],
        body: dataRows,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] } // Matching #1F2937
    })

    doc.save(`${fileName}.pdf`)
}
