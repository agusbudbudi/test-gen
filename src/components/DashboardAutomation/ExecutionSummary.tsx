import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Hash,
  Activity,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export interface ExecutionSummaryProps {
  summary: {
    total: number;
    passed: number;
    failed: number;
    broken: number;
    skipped: number;
    passRate: number;
    duration: number;
  };
  failureRate: number;
  formatDuration: (ms: number) => string;
  passFailData: any[];
  statusFilter: string | null;
  setStatusFilter: (filter: string | null) => void;
  insights?: {
    flaky: number;
    newFailures: number;
    infraIssues: number;
  };
  onInsightClick?: (type: "flaky" | "newFailures" | "infraIssues") => void;
}

export const ExecutionSummary = ({
  summary,
  failureRate,
  formatDuration,
  passFailData,
  statusFilter,
  setStatusFilter,
  insights = { flaky: 0, newFailures: 0, infraIssues: 0 },
  onInsightClick,
}: ExecutionSummaryProps) => {
  const avgDuration = summary.duration / (summary.total || 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Primary Health Card */}
      <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 overflow-hidden relative group">
        <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Big Pass Rate Hero */}
          <div className="flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-slate-100 dark:border-border-brand/40 pb-6 md:pb-0 md:pr-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              Run Pass Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-emerald-500">
                {summary.passRate}
              </span>
              <span className="text-xl font-bold text-emerald-500/50">%</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                Stable
              </span>
            </div>
          </div>

          {/* Distribution and Breakdown */}
          <div className="flex-1 w-full space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Execution Health
                </span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {summary.total} Total Tests
                </span>
              </div>

              {/* Stacked Health Bar */}
              <div className="h-3 w-full bg-slate-100 dark:bg-surface-dark rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                  style={{
                    width: `${(summary.passed / summary.total) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-1000 ease-out"
                  style={{
                    width: `${(summary.failed / summary.total) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                  style={{
                    width: `${(summary.broken / summary.total) * 100}%`,
                  }}
                />
              </div>

              {/* Legend / Counts */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="text-slate-900 dark:text-white mr-1">
                      {summary.passed}
                    </span>{" "}
                    Passed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="text-slate-900 dark:text-white mr-1">
                      {summary.failed}
                    </span>{" "}
                    Failed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="text-slate-900 dark:text-white mr-1">
                      {summary.broken}
                    </span>{" "}
                    Broken
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="text-slate-900 dark:text-white mr-1">
                      {summary.skipped}
                    </span>{" "}
                    Skipped
                  </span>
                </div>
              </div>

              {/* Stability & Risk Insights Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-border-brand/30 mt-4 space-y-3">
                <div
                  className="flex items-center justify-between group/insight cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1 -m-1 rounded-md transition-all mb-1"
                  onClick={() => onInsightClick?.("flaky")}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                        insights.flaky > 0
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      <Zap size={10} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Flaky Tests
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tight",
                      insights.flaky > 0
                        ? "text-amber-600"
                        : "text-emerald-600",
                    )}
                  >
                    {insights.flaky > 0
                      ? `${insights.flaky} detected as unstable`
                      : "No unstable tests"}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between group/insight cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1 -m-1 rounded-md transition-all mb-1"
                  onClick={() => onInsightClick?.("newFailures")}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                        insights.newFailures > 0
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      <TrendingUp size={10} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      New Failures
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tight",
                      insights.newFailures > 0
                        ? "text-rose-600"
                        : "text-emerald-600",
                    )}
                  >
                    {insights.newFailures > 0
                      ? `${insights.newFailures} new since last run`
                      : "No new failures"}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between group/insight cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1 -m-1 rounded-md transition-all mb-1"
                  onClick={() => onInsightClick?.("infraIssues")}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                        insights.infraIssues > 0
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      <AlertCircle size={10} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Infrastructure
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tight",
                      insights.infraIssues > 0
                        ? "text-rose-600"
                        : "text-emerald-600",
                    )}
                  >
                    {insights.infraIssues > 0
                      ? `${insights.infraIssues} issues detected`
                      : "No infrastructure issues"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics Card */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">
            Performance & Velocity
          </h3>

          <div className="space-y-5">
            <div className="flex items-center justify-between group/stat">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Total Duration
                  </div>
                  <div className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">
                    {formatDuration(summary.duration)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between group/stat">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/20">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Avg per Test
                  </div>
                  <div className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">
                    {formatDuration(avgDuration)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between group/stat">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20">
                  <XCircle size={16} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Failure Risk
                  </div>
                  <div className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">
                    {failureRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pass vs Failure Pie Chart */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-4 left-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Pass vs Failure
        </div>
        <div className="flex-1 flex flex-col items-center justify-center w-full pt-4">
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={passFailData}
                dataKey="value"
                nameKey="name"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={5}
                stroke="none"
                onClick={(data) => {
                  if (data && data.name) {
                    const status =
                      data.name.toLowerCase() === "pass" ? "passed" : "failed";
                    setStatusFilter(statusFilter === status ? null : status);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                {passFailData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={
                      statusFilter ===
                      (entry.name.toLowerCase() === "pass"
                        ? "passed"
                        : "failed")
                        ? "#fff"
                        : "none"
                    }
                    strokeWidth={2}
                    className="outline-none focus:outline-none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-1">
            {passFailData.map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
                  {item.name} {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
