import * as XLSX from 'xlsx'

export function exportToExcel(tableData: string[][], fileName: string = 'Test_Cases.xlsx') {
  if (tableData.length <= 1) {
    throw new Error('No data to export')
  }

  // Clean data: Replace <br> with newlines and strip other HTML
  const cleanedData = tableData.map(row => 
    row.map(cell => {
      if (typeof cell !== 'string') return cell
      return cell
        .replace(/<br\s*\/?>/gi, '\n') // Replace <br>, <br/>, <br /> with \n
        .replace(/<[^>]*>/g, '')      // Strip remaining HTML tags
        .trim()
    })
  )

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(cleanedData)

  XLSX.utils.book_append_sheet(wb, ws, 'TestCases')
  XLSX.writeFile(wb, fileName)
}
