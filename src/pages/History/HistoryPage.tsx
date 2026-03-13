import { useRef, useEffect, useState } from 'react'
import { History as HistoryIcon, Trash2, User, Bot, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useHistoryStore } from '@/stores/historyStore'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import ResultTable from '@/components/ResultTable/ResultTable'

const ChatBubble = ({ entry, index, onDelete }: any) => {
  const isUser = entry.type === 'prompt'
  const date = new Date(entry.createdAt).toLocaleString()
  const [isExpanded, setIsExpanded] = useState(false)

  // Determine if content is long enough to need expansion
  const isLongContent = isUser && typeof entry.content === 'string' && entry.content.length > 100

  return (
    <div className={cn(
      "flex w-full gap-4 animate-fade-in",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
      )}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[90%] group",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Header/Label */}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
          {isUser ? 'Prompt / Input' : 'AI TestGen Result'}
        </span>

        {/* Bubble */}
        <div className={cn(
          "p-5 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border bg-white dark:bg-slate-800",
          isUser 
            ? "rounded-tr-none border-slate-200 dark:border-slate-700/50" 
            : "rounded-tl-none border-slate-200 dark:border-slate-700/50"
        )}>
          {entry.type === 'prompt' ? (
            <div className="space-y-3">
              <div className={cn(
                "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed transition-all duration-300",
                !isExpanded && isLongContent && "line-clamp-3"
              )}>
                {entry.content}
              </div>
              
              {isLongContent && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors mt-2"
                >
                  {isExpanded ? (
                    <>Lihat Sedikit <ChevronUp size={14} /></>
                  ) : (
                    <>Lihat Selengkapnya <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          ) : entry.type === 'review' ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Review Summary</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{entry.content.summary}"</p>
              </div>

              {entry.content.improvedVersion && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Improved Version</p>
                  <div className="overflow-x-auto min-w-[300px] md:min-w-[600px] border border-slate-100 dark:border-slate-800 rounded-xl">
                    <ResultTable 
                      headers={['Status', 'No', 'Section', 'Case Type', 'Title', 'Precondition', 'Step', 'Expected Result']}
                      rows={(() => {
                        try {
                          const parsed = JSON.parse(entry.content.improvedVersion)
                          const rows = Array.isArray(parsed) ? parsed.map((r: any) => [
                            String(r.Status || ''),
                            String(r.No || ''),
                            String(r.Section || ''),
                            String(r['Case Type'] || ''),
                            String(r.Title || ''),
                            String(r.Precondition || ''),
                            String(r.Step || ''),
                            String(r['Expected Result'] || '')
                          ]) : []
                          return !isExpanded && rows.length > 1 ? [rows[0]] : rows
                        } catch (e) {
                          return []
                        }
                      })()}
                    />
                  </div>
                  
                  {(() => {
                    try {
                      const parsed = JSON.parse(entry.content.improvedVersion)
                      return Array.isArray(parsed) && parsed.length > 1
                    } catch (e) { return false }
                  })() && (
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors mt-1 px-1"
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp size={14} /></>
                      ) : (
                        <>Show All Improvements <ChevronDown size={14} /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto min-w-[300px] md:min-w-[600px] transition-all duration-300">
                <ResultTable 
                  headers={entry.type === 'bug_result' 
                    ? ['Summary', 'Description', 'Severity & Retest Result']
                    : ['No', 'Section', 'Case Type', 'Title', 'Precondition', 'Step', 'Expected Result']
                  }
                  rows={(() => {
                    const rows = Array.isArray(entry.content) ? entry.content : []
                    return !isExpanded && rows.length > 1 ? [rows[0]] : rows
                  })()}
                />
              </div>
              
              {Array.isArray(entry.content) && entry.content.length > 1 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors mt-2"
                >
                  {isExpanded ? (
                    <>Lihat Sedikit <ChevronUp size={14} /></>
                  ) : (
                    <>Lihat Selengkapnya <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Actions */}
        <div className="flex items-center gap-3 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock size={12} />
            {date}
          </div>
          <button 
            onClick={() => onDelete(index)}
            className="text-slate-300 hover:text-red-500 transition-colors hover-scale"
            title="Delete from history"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

const HistoryPage = () => {
  const historyEntries = useHistoryStore((state) => state.historyEntries)
  const deleteEntry = useHistoryStore((state) => state.deleteEntry)
  const clearHistory = useHistoryStore((state) => state.clearHistory)
  const toast = useToast()
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [historyEntries])

  const handleDelete = (index: number) => {
    deleteEntry(index)
    toast.success('Entry deleted.')
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory()
      toast.info('History cleared.')
    }
  }

  return (
    <div className="h-[calc(110vh-120px)] flex flex-col space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            🕰️ History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review and manage your past generation results.
          </p>
        </div>
        
        {historyEntries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover-scale"
          >
            <Trash2 size={18} />
            Clear All
          </button>
        )}
      </div>

      {/* History List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-0 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
      >
        {historyEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400">
              <HistoryIcon size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No history yet</h3>
              <p className="text-sm text-slate-500">Your generations and prompts will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="flex-1" /> {/* Spacer to push content to bottom */}
            <div className="mx-auto w-full space-y-6">
              {historyEntries.map((entry, idx) => (
                <ChatBubble 
                  key={entry.createdAt + idx} 
                  entry={entry} 
                  index={idx} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
