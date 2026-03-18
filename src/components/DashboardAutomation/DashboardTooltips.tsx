import React from 'react';
import dayjs from 'dayjs';
import { cn } from "@/lib/utils";

const TooltipContainer = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white dark:bg-sidebar-bg border border-slate-200 dark:border-border-brand rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]", className)}>
    {children}
  </div>
);

const TooltipHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-2 border-b border-slate-100 dark:border-border-brand pb-2">
    <div className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</div>
    {subtitle && <div className="text-[10px] text-slate-400 font-medium">{subtitle}</div>}
  </div>
);

const TooltipRow = ({ label, value, color, unit = "" }: { label: string, value: string | number, color: string, unit?: string }) => (
  <div className="flex items-center justify-between gap-4 py-0.5">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
      {value}{unit}
    </span>
  </div>
);

export const PassRateTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const timestamp = dayjs(label).format("MMM DD, YYYY HH:mm");
  return (
    <TooltipContainer>
      <TooltipHeader title="Pass Rate Trend" subtitle={timestamp} />
      <TooltipRow label="Pass Rate" value={payload[0].value} color="#3b82f6" unit="%" />
    </TooltipContainer>
  );
};

export const StatusTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const timestamp = dayjs(data.createdAt).format("MMM DD, YYYY HH:mm");
  return (
    <TooltipContainer>
      <TooltipHeader title="Status Execution Trend" subtitle={timestamp} />
      <div className="space-y-1 mt-1">
        <TooltipRow label="Passed" value={data.passed ?? data.summary?.passed ?? 0} color="#10b981" />
        <TooltipRow label="Failed" value={data.failed ?? data.summary?.failed ?? 0} color="#ef4444" />
        <TooltipRow label="Broken" value={data.broken ?? data.summary?.broken ?? 0} color="#f59e0b" />
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-border-brand">
         <TooltipRow label="Run ID" value={data.runId} color="transparent" />
      </div>
    </TooltipContainer>
  );
};

export const DurationTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const timestamp = dayjs(data.createdAt).format("MMM DD, YYYY HH:mm");
  
  const formatDuration = (min: number) => {
    const totalSeconds = Math.round(min * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <TooltipContainer>
      <TooltipHeader title="Duration Trend" subtitle={timestamp} />
      <TooltipRow label="Execution Time" value={formatDuration(data.durationMinutes)} color="#8b5cf6" />
    </TooltipContainer>
  );
};

export const CategoriesTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const timestamp = dayjs(label).format("MMM DD, YYYY HH:mm");
  return (
    <TooltipContainer>
      <TooltipHeader title="Categories Trend" subtitle={timestamp} />
      <div className="space-y-1 mt-1">
        {payload.map((item: any, i: number) => (
          <TooltipRow key={i} label={item.name} value={item.value} color={item.color || item.fill} />
        ))}
      </div>
    </TooltipContainer>
  );
};

export const DurationDistributionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const testList = (data.tests || []).slice(0, 10);

  return (
    <TooltipContainer className="max-w-[300px]">
      <TooltipHeader title={`Duration: ${label}`} subtitle={`${data.count} test cases`} />
      {testList.length > 0 && (
        <div className="space-y-0.5 mt-2">
          {testList.map((name: string, i: number) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-primary text-[8px] mt-[3px] shrink-0">•</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                {name}
              </span>
            </div>
          ))}
          {data.tests.length > 10 && (
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">
              + {data.tests.length - 10} more
            </div>
          )}
        </div>
      )}
    </TooltipContainer>
  );
};

export const SeverityTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const visibleItems = payload.filter((item: any) => (item.value || 0) > 0);
  return (
    <TooltipContainer>
      <TooltipHeader title={`Severity: ${data.severity}`} />
      <div className="space-y-1 mt-1">
        {visibleItems.map((item: any, i: number) => (
          <TooltipRow key={i} label={item.name} value={item.value} color={item.color || item.fill} />
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-border-brand">
         <TooltipRow label="Total" value={(data.passed||0)+(data.failed||0)+(data.broken||0)+(data.skipped||0)} color="transparent" />
      </div>
    </TooltipContainer>
  );
};
