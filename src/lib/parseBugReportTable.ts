export function parseBugReportTable(gptResponse: string): string[][] {
  const lines = gptResponse
    .trim()
    .split('\n')
    .filter((line) => line.includes('|') && !/^[-| ]+$/.test(line))

  const table: string[][] = []

  lines.forEach((line, index) => {
    const columns = line
      .split('|')
      .map((col) => col.trim())
      .filter((col, i, arr) => {
        // Handle first and last empty segments if line starts/ends with |
        if (i === 0 && col === '') return false
        if (i === arr.length - 1 && col === '') return false
        return true
      })

    if (index === 0) {
      // Header
      table.push(columns.slice(0, 3))
    } else {
      // Data
      if (columns.length < 3) return
      table.push([
        columns[0],
        columns[1], // We'll handle description formatting in the UI component
        columns[2]
      ])
    }
  })

  return table
}
