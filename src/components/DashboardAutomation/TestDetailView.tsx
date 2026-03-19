import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Info,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

interface TestDetailViewProps {
  test: any;
}

// ----- Recursive Step Item Component -----
const StepItem = ({
  step,
  depth = 0,
  formatDuration,
}: {
  step: any;
  depth?: number;
  formatDuration: (ms: number) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubSteps = step.steps && step.steps.length > 0;
  const statusColor =
    step.status === "passed"
      ? "bg-emerald-500"
      : step.status === "skipped"
        ? "bg-slate-400"
        : "bg-rose-500";
  const statusTextColor =
    step.status === "passed"
      ? "text-emerald-600"
      : step.status === "skipped"
        ? "text-slate-400"
        : "text-rose-600";
  const statusBg =
    step.status === "passed"
      ? "bg-emerald-500/10"
      : step.status === "skipped"
        ? "bg-slate-500/10"
        : "bg-rose-500/10";

  return (
    <div
      className={cn(
        "group",
        depth > 0 &&
          "ml-4 border-l border-slate-100 dark:border-border-brand/30 pl-3",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 py-1.5 rounded-lg px-2 -mx-2 hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors",
          hasSubSteps && "cursor-pointer",
        )}
        onClick={() => hasSubSteps && setExpanded(!expanded)}
      >
        {/* Status dot */}
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
            statusColor,
          )}
        />

        {/* Toggle icon */}
        {hasSubSteps ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 shrink-0 mt-1 text-slate-400" />
          ) : (
            <ChevronRight className="w-3 h-3 shrink-0 mt-1 text-slate-400" />
          )
        ) : (
          <span className="w-3" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight break-words">
              {step.name}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold tabular-nums shrink-0 lowercase tracking-normal px-1 py-0.5 rounded",
                statusBg,
                statusTextColor,
              )}
            >
              {step.duration != null ? formatDuration(step.duration) : "—"}
            </span>
          </div>

          {/* Error detail */}
          {step.statusDetails?.message && (
            <p className="mt-1 text-[10px] text-rose-500 dark:text-rose-400 font-mono leading-tight break-all">
              {step.statusDetails.message}
            </p>
          )}

          {/* Parameters */}
          {step.parameters && step.parameters.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {step.parameters.map((p: any, i: number) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono text-slate-500 dark:text-slate-400"
                >
                  {p.name}: <span className="text-primary">{p.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub-steps */}
      {hasSubSteps && expanded && (
        <div className="mt-1 space-y-0.5">
          {step.steps.map((sub: any, i: number) => (
            <StepItem
              key={i}
              step={sub}
              depth={depth + 1}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ----- Execution Steps Section Component -----
const sectionMeta: Record<string, { label: string; color: string }> = {
  setUp: {
    label: "Set Up",
    color:
      "text-sky-600 border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/20",
  },
  testBody: {
    label: "Test Body",
    color:
      "text-violet-600 border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20",
  },
  tearDown: {
    label: "Tear Down",
    color:
      "text-slate-500 border-slate-200 dark:border-border-brand bg-slate-50 dark:bg-surface-dark",
  },
};

const ExecutionStepsSection = ({
  executionInfo,
  formatDuration,
}: {
  executionInfo: any;
  formatDuration: (ms: number) => string;
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(["testBody"]),
  );

  const toggle = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Execution Steps
      </h3>
      <div className="space-y-2">
        {["setUp", "testBody", "tearDown"].map((section) => {
          const steps = executionInfo[section] || [];
          if (steps.length === 0) return null;
          const meta = sectionMeta[section];
          const isOpen = expandedSections.has(section);
          const totalDuration = steps.reduce(
            (acc: number, s: any) => acc + (s.duration ?? 0),
            0,
          );
          const failedCount = steps.filter(
            (s: any) => s.status !== "passed" && s.status !== "skipped",
          ).length;

          return (
            <div
              key={section}
              className={cn("border rounded-xl overflow-hidden", meta.color)}
            >
              {/* Section Header */}
              <button
                onClick={() => toggle(section)}
                className="w-full flex items-center justify-between px-3 py-2 gap-2"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {meta.label}
                  </span>
                  <span className="text-[9px] font-bold opacity-60">
                    {steps.length} step{steps.length !== 1 ? "s" : ""}
                  </span>
                  {failedCount > 0 && (
                    <span className="px-1 py-0.5 text-[9px] font-black bg-rose-500/10 text-rose-600 rounded">
                      {failedCount} failed
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold opacity-60 lowercase tracking-normal shrink-0">
                  {formatDuration(totalDuration)}
                </span>
              </button>

              {/* Steps List */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-0.5 border-t border-inherit bg-white dark:bg-surface-card">
                  {steps.map((step: any, i: number) => (
                    <StepItem
                      key={i}
                      step={step}
                      depth={0}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TestDetailView = ({ test }: TestDetailViewProps) => {
  if (!test) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-16 h-16 bg-slate-50 dark:bg-surface-dark rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-border-brand/50">
          <Info className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Select a test
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 max-w-[200px]">
            Choose a test from the list on the left to see full execution
            details, errors, and attachments.
          </p>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (!ms) return "0ms";
    if (ms < 1000) return `${ms}ms`;
    const totalS = Math.floor(ms / 1000);
    const m = Math.floor(totalS / 60);
    const s = totalS % 60;
    const remainder = ms % 1000;

    if (m > 0) {
      return remainder > 0 ? `${m}m ${s}s ${remainder}ms` : `${m}m ${s}s`;
    }
    return remainder > 0 ? `${s}s ${remainder}ms` : `${s}s`;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {test.name}
              </h2>
              {(test.filePath || test.fullName) && (
                <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 mt-1">
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                  <span className="text-[11px] font-mono leading-relaxed break-all">
                    {test.filePath || test.fullName}
                  </span>
                </div>
              )}
            </div>
            <div
              className={cn(
                "shrink-0 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
                test.status === "passed"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : test.status === "failed"
                    ? "bg-rose-500/10 text-rose-600"
                    : test.status === "broken"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-slate-500/10 text-slate-600",
              )}
            >
              {test.status}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="lowercase tracking-normal">
                {formatDuration(test.duration)}
              </span>
            </div>
            {test.severity && (
              <div className="flex items-center gap-1.5 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{test.severity}</span>
              </div>
            )}
            {test.owner && (
              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                <span>Owner: {test.owner}</span>
              </div>
            )}
            {test.tags && test.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {test.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded border border-primary/20 dark:border-primary/30 text-primary bg-primary/10 dark:bg-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {test.description && (
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl whitespace-pre-wrap">
              {test.description}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-border-brand/30" />

        {/* Status Details (Error) */}
        {test.statusDetails &&
          (test.statusDetails.message || test.statusDetails.trace) && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Failure Details
              </h3>
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4 overflow-hidden">
                <p className="text-xs font-mono font-medium text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-all leading-relaxed">
                  {test.statusDetails.message || "No error message provided."}
                </p>
                {test.statusDetails.trace && (
                  <details className="mt-4 group">
                    <summary className="text-[9px] font-black text-rose-400 dark:text-rose-600 cursor-pointer list-none flex items-center gap-1 hover:text-rose-500">
                      <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                      VIEW STACK TRACE
                    </summary>
                    <pre className="mt-3 p-3 bg-white dark:bg-sidebar-bg/50 rounded-lg text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-x-auto border border-rose-100/50 dark:border-border-brand/20">
                      {test.statusDetails.trace}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

        {/* Parameters */}
        {test.parameters && test.parameters.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Parameters
            </h3>
            <div className="border border-slate-200 dark:border-border-brand rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-sidebar-bg border-b border-slate-200 dark:border-border-brand">
                  <tr>
                    <th className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 w-1/3">
                      Name
                    </th>
                    <th className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border-brand/50">
                  {test.parameters.map((p: any, i: number) => (
                    <tr key={i} className="bg-white dark:bg-surface-card">
                      <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {p.name || `Param ${i + 1}`}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-mono text-[11px] break-all">
                        {p.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Execution Info / Steps */}
        {test.executionInfo &&
          ["setUp", "testBody", "tearDown"].some(
            (s) => (test.executionInfo[s] || []).length > 0,
          ) && (
            <ExecutionStepsSection
              executionInfo={test.executionInfo}
              formatDuration={formatDuration}
            />
          )}

        {/* Attachments */}
        {test.attachments && test.attachments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Paperclip className="w-3 h-3" />
              Attachments ({test.attachments.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {test.attachments.map((att: any, idx: number) => {
                const src = att.source?.startsWith("http")
                  ? att.source
                  : `/api/allure-results/${att.source}`;
                const isImage = att.type?.startsWith("image/");

                if (isImage) {
                  return (
                    <a
                      key={idx}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-slate-200 dark:border-border-brand hover:border-primary/60 transition-all group"
                    >
                      <img
                        src={src}
                        alt={att.name || `Attachment ${idx + 1}`}
                        className="w-full object-cover max-h-80 group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                      <div className="px-3 py-2 bg-slate-50 dark:bg-surface-dark flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                          {att.name || "Screenshot"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {att.type}
                        </span>
                      </div>
                    </a>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-border-brand rounded-xl hover:border-primary/50 group transition-all"
                  >
                    <div className="w-8 h-8 bg-white dark:bg-sidebar-bg rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary border border-slate-100 dark:border-border-brand transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        {att.name || "Unnamed Attachment"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                        {att.type}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
