import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Activity, Loader2, AlertCircle, History, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { cn } from "@/lib/utils";

const AutomationRunsPage = () => {
  const { runs, loading, error, clearHistory } = useDashboardData();
  const navigate = useNavigate();

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to delete ALL automation run history? This action cannot be undone.")) {
      const success = await clearHistory();
      if (success) {
        alert("Automation history cleared successfully.");
      } else {
        alert("Failed to clear automation history.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl flex items-center gap-4 text-rose-600 dark:text-rose-400">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-tight">
            History Synchronization Failed
          </h3>
          <p className="text-xs font-medium italic mt-0.5 opacity-80">
            Unable to load run history. Please ensure the backend is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Automation Run History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete execution logs of your Cypress automation suites.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          disabled={runs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          Clear All History
        </button>
      </div>

      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-sidebar-bg/50 border-b border-slate-100 dark:border-border-brand">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Run ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Passed</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Failed</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Pass Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-border-brand/30">
              {runs.map((run) => (
                <tr 
                  key={run.runId} 
                  className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/automation/runs/${run.runId}`)}
                >
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {dayjs(run.createdAt).format('MMM DD, YYYY HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                      {run.runId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-200 text-center">
                    {run.summary.total}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                    {run.summary.passed}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                    {run.summary.failed}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={cn(
                      "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                      run.summary.passRate >= 90 ? "bg-emerald-500/10 text-emerald-600" :
                      run.summary.passRate >= 70 ? "bg-amber-500/10 text-amber-600" :
                      "bg-rose-500/10 text-rose-600"
                    )}>
                      {run.summary.passRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                      See Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutomationRunsPage;
