import React from 'react'
import { cn } from '@/lib/utils'

interface ResultTableProps {
  headers: string[]
  rows: string[][]
}

const ResultTable: React.FC<ResultTableProps> = ({ headers, rows }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider text-xs">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {rows.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              {row.map((cell, cellIdx) => {
                const isStatus = cell === 'New' || cell === 'Improved'
                
                return (
                  <td 
                    key={cellIdx} 
                    className="px-6 py-4 text-slate-600 dark:text-slate-300 align-top"
                  >
                    {isStatus ? (
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        cell === 'New' 
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" 
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                      )}>
                        {cell}
                      </span>
                    ) : (
                      <div 
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default React.memo(ResultTable)
