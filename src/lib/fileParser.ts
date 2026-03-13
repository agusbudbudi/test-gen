
import * as XLSX from 'xlsx'

export interface ParsedTestCase {
  [key: string]: string | number
}

export const parseFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return reject(new Error('Failed to read file content'))

        let content = ''

        if (extension === 'csv' || extension === 'tsv') {
          content = data as string
        } else if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convert to CSV as it's a good intermediate format for LLM to review
          content = XLSX.utils.sheet_to_csv(worksheet)
        } else {
          return reject(new Error('Unsupported file format'))
        }

        resolve(content)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)

    if (extension === 'csv' || extension === 'tsv') {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}

/**
 * Specifically parses a file into a structured array of record-like objects
 */
export const parseFileToTable = async (file: File): Promise<string[][]> => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return reject(new Error('Failed to read file content'))

        let table: string[][] = []

        if (extension === 'csv' || extension === 'tsv') {
          const workbook = XLSX.read(data, { type: 'string' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          table = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        } else if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          table = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        } else {
          return reject(new Error('Unsupported file format'))
        }

        resolve(table)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)

    if (extension === 'csv' || extension === 'tsv') {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}
