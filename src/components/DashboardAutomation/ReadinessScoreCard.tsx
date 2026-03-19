import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/Modal/Modal";

interface ReadinessScoreCardProps {
  score: number;
  breakdown: {
    passRate: number;
    criticalPenalty: number;
    brokenPenalty: number;
    flakyPenalty: number;
    trendBonus: number;
  };
  trend: "improving" | "regressing" | "stable";
}

export const ReadinessScoreCard = ({
  score,
  breakdown,
  trend,
}: ReadinessScoreCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const getStatus = (s: number) => {
    if (s >= 90)
      return {
        label: "Ready for Release",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: <CheckCircle2 className="w-5 h-5" />,
      };
    if (s >= 75)
      return {
        label: "Caution: Risky",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: <AlertTriangle className="w-5 h-5" />,
      };
    return {
      label: "Not Ready",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      icon: <XCircle className="w-5 h-5" />,
    };
  };

  const status = getStatus(score);

  return (
    <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden transition-all duration-300">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Main Score Indicator */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={302}
                strokeDashoffset={302 - (302 * score) / 100}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000 ease-out",
                  status.color,
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-3xl font-black tracking-tighter",
                  status.color,
                )}
              >
                {score}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Score
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                  Release Readiness
                </h3>
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-base font-bold tracking-tight",
                    status.color,
                  )}
                >
                  {status.icon &&
                    React.cloneElement(status.icon as React.ReactElement, {
                      size: 18,
                    })}
                  {status.label}
                </div>
              </div>
              <div
                className={cn(
                  "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                  status.bg,
                  status.color,
                  status.border,
                )}
              >
                {trend === "improving" && <TrendingUp size={10} />}
                {trend === "regressing" && <TrendingDown size={10} />}
                {trend === "stable" && (
                  <TrendingUp size={10} className="opacity-50" />
                )}
                {trend}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-sidebar-bg/50 rounded-lg border border-slate-100 dark:border-border-brand/50">
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                  Base
                </span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  +{breakdown.passRate} pts
                </span>
              </div>
              {breakdown.criticalPenalty > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  <span className="text-[8px] font-bold text-rose-400 uppercase">
                    Critical
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">
                    -{breakdown.criticalPenalty} pts
                  </span>
                </div>
              )}
              {breakdown.brokenPenalty > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  <span className="text-[8px] font-bold text-amber-400 uppercase">
                    Infra
                  </span>
                  <span className="text-[10px] font-bold text-amber-600">
                    -{breakdown.brokenPenalty} pts
                  </span>
                </div>
              )}
              {breakdown.flakyPenalty > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                  <span className="text-[8px] font-bold text-indigo-400 uppercase">
                    Flaky
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">
                    -{breakdown.flakyPenalty} pts
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg border",
                  breakdown.trendBonus >= 0
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
                )}
              >
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase",
                    breakdown.trendBonus >= 0
                      ? "text-emerald-400"
                      : "text-rose-400",
                  )}
                >
                  Trend
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    breakdown.trendBonus >= 0
                      ? "text-emerald-600"
                      : "text-rose-600",
                  )}
                >
                  {breakdown.trendBonus >= 0 ? "+" : ""}
                  {breakdown.trendBonus} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-6 py-3 bg-slate-50 dark:bg-sidebar-bg border-t border-slate-100 dark:border-border-brand/50 flex items-center justify-between group/footer cursor-pointer hover:bg-slate-100 dark:hover:bg-primary/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Detailed Score Methodology
          </span>
        </div>
        <ChevronRight
          size={14}
          className="text-slate-300 group-hover/footer:translate-x-1 transition-transform"
        />
      </button>

      {/* Methodology Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Scoring Methodology"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The Release Readiness Score is a weighted health indicator that
            correlates real-time execution results with historical stability
            trends.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">
                  Pass Rate Base
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  The initial score is equal to the overall pass percentage of
                  the latest automation run.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">
                  Defect Density Penalty
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deducts <span className="font-bold">-5 points</span> for every
                  failed test marked with{" "}
                  <span className="text-rose-500">Critical</span> or{" "}
                  <span className="text-rose-500">Blocker</span> severity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Info size={16} className="text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">
                  Infrastructure Penalty
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deducts <span className="font-bold">-2 points</span> for{" "}
                  <span className="text-amber-500">Broken</span> tests,
                  indicating environmental instability or config errors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">
                  Risk Factor (Flakiness)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deducts <span className="font-bold">-1 point</span> for every
                  test flagged as{" "}
                  <span className="text-indigo-500 font-bold uppercase">
                    Flaky
                  </span>{" "}
                  in recent history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">
                  Trend Corridor
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Awards <span className="font-bold text-emerald-500">+5</span>{" "}
                  or deducts <span className="font-bold text-rose-500">-5</span>{" "}
                  points if recent average pass rate improves/regresses by{" "}
                  <span className="font-bold">2%+</span> against historical
                  norms.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-sidebar-bg/50 border border-slate-100 dark:border-border-brand/50">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
              Final Score Equation
            </h5>
            <div className="font-mono text-[10px] text-center text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-card p-2 rounded-lg border border-slate-100 dark:border-border-brand">
              Score = (PassRate) - (5 × Crit) - (2 × Broken) - (Flaky) ± (Trend)
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
