import React, { useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  LayoutDashboard,
  AlertCircle,
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  History,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { ReadinessScoreCard } from "@/components/DashboardAutomation/ReadinessScoreCard";
import { ExecutionSummary } from "@/components/DashboardAutomation/ExecutionSummary";
import {
  ResponsiveContainer,
// ... (omitting some lines for brevity but I should include correct context)
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  PassRateTrendTooltip,
  StatusTrendTooltip,
  DurationTrendTooltip,
  CategoriesTrendTooltip,
  DurationDistributionTooltip,
  SeverityTrendTooltip,
} from "@/components/DashboardAutomation/DashboardTooltips";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const DashboardAutomationPage = () => {
  const {
    latest,
    trend,
    runs,
    loading,
    error,
    durationTrend,
    categoriesTrend,
    syncData,
    isSyncing,
  } = useDashboardData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  // Debugging: Log filter changes
  React.useEffect(() => {
    if (statusFilter) {
      console.log("[Dashboard] Active status filter:", statusFilter);
    }
  }, [statusFilter]);

  const formatDuration = (ms: number) => {
    if (!ms || ms === 0) return "0s";
    if (ms < 1000) return `${ms}ms`;
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Data processing for charts
  const dashboardData = useMemo(() => {
    if (!latest)
      return {
        failureRate: 0,
        passFailData: [],
        durationDistribution: [],
        severityStatusData: [],
        statusTrendData: [],
        durationTrendData: [],
        categoriesTrendData: [],
        readinessScore: 0,
        readinessBreakdown: {
          passRate: 0,
          criticalPenalty: 0,
          brokenPenalty: 0,
          flakyPenalty: 0,
          trendBonus: 0,
        },
        trendStatus: "stable" as const,
      };

    const s = latest.summary;
    const failRate = s.total
      ? Number(((s.failed + s.broken) / s.total) * 100)
      : 0;

    const pfData = [
      { name: "Pass", value: s.passRate, color: "#10b981" },
      { name: "Fail", value: failRate, color: "#ef4444" },
    ];

    // Duration Distribution (5s buckets)
    const tests = latest.tests || [];
    const maxSec = Math.max(
      0,
      ...tests.map((t: any) => Number((t.duration || 0) / 1000)),
    );
    const bucketSize = 5;
    const bucketCount = Math.min(60, Math.ceil(maxSec / bucketSize) || 1);

    const durDist = Array.from({ length: bucketCount }, (_, i) => {
      const min = i * bucketSize;
      const max = min + bucketSize;
      const matching = tests.filter((t: any) => {
        const s = Number((t.duration || 0) / 1000);
        return i === bucketCount - 1 ? s >= min : s >= min && s < max;
      });
      return {
        range: i === bucketCount - 1 ? `>= ${min}s` : `${min}-${max}s`,
        count: matching.length,
        tests: matching.map((t: any) => t.name || "Unnamed test"),
      };
    });

    // Severity Status Data
    const sevOrder = [
      "blocker",
      "critical",
      "major",
      "normal",
      "minor",
      "trivial",
      "low",
      "medium",
      "high",
      "unknown",
    ];
    const sevMap = new Map();
    tests.forEach((t: any) => {
      const rawSev = (t.severity || "unknown").toLowerCase();
      if (!sevMap.has(rawSev)) {
        sevMap.set(rawSev, {
          severity: rawSev.charAt(0).toUpperCase() + rawSev.slice(1),
          passed: 0,
          failed: 0,
          broken: 0,
          skipped: 0,
        });
      }
      const entry = sevMap.get(rawSev);
      const status = (t.status || "unknown").toLowerCase();
      if (status === "passed") entry.passed++;
      else if (status === "failed") entry.failed++;
      else if (status === "broken") entry.broken++;
      else if (status === "skipped") entry.skipped++;
    });
    const sevData = Array.from(sevMap.values()).sort((a, b) => {
      const ia = sevOrder.indexOf(a.severity.toLowerCase());
      const ib = sevOrder.indexOf(b.severity.toLowerCase());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    // Trends processing
    const stData = [...trend]
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        runId: r.runId,
        createdAt: r.createdAt,
        passed: r.summary?.passed || 0,
        failed: r.summary?.failed || 0,
        broken: r.summary?.broken || 0,
      }));

    const dtData = [...durationTrend]
      .slice(0, 10)
      .reverse()
      .map((d) => ({
        ...d,
        durationMinutes: Number((d.duration / 60000).toFixed(2)),
      }));

    const catTrend = [...categoriesTrend]
      .slice(0, 10)
      .reverse()
      .map((c) => ({
        createdAt: c.createdAt,
        "Product Defect": c.failed,
        "Test Defect": c.broken,
      }));

    // Readiness Score Calculation
    const criticalPenalty = tests.filter(
      (t: any) =>
        (t.status === "failed" || t.status === "broken") &&
        ["critical", "blocker", "high"].includes((t.severity || "").toLowerCase())
    ).length * 5;

    const brokenPenalty = s.broken * 2;
    const flakyPenalty = tests.filter((t: any) => t.flaky).length * 1;

    // Trend calculation (last 3 vs previous 3)
    let trendBonus = 0;
    let trendStatus: "improving" | "regressing" | "stable" = "stable";

    if (trend.length >= 6) {
      const recentAvg = (trend[0].summary.passRate + trend[1].summary.passRate + trend[2].summary.passRate) / 3;
      const prevAvg = (trend[3].summary.passRate + trend[4].summary.passRate + trend[5].summary.passRate) / 3;

      if (recentAvg > prevAvg + 2) {
        trendBonus = 5;
        trendStatus = "improving";
      } else if (recentAvg < prevAvg - 2) {
        trendBonus = -5;
        trendStatus = "regressing";
      }
    }

    const readinessScore = Math.max(0, Math.min(100, Math.round(s.passRate - criticalPenalty - brokenPenalty - flakyPenalty + trendBonus)));

    return {
      failureRate: failRate,
      passFailData: pfData,
      durationDistribution: durDist,
      severityStatusData: sevData,
      statusTrendData: stData,
      durationTrendData: dtData,
      categoriesTrendData: catTrend,
      readinessScore,
      readinessBreakdown: {
        passRate: s.passRate,
        criticalPenalty,
        brokenPenalty,
        flakyPenalty,
        trendBonus,
      },
      trendStatus,
      insights: {
        flaky: tests.filter((t: any) => t.flaky).length,
        newFailures: (() => {
          if (runs.length < 2) return 0;
          const latestFailNames = new Set(
            runs[0].tests
              ?.filter((t: any) => t.status === "failed")
              .map((t: any) => t.name) || [],
          );
          const prevFailNames = new Set(
            runs[1].tests
              ?.filter((t: any) => t.status === "failed")
              .map((t: any) => t.name) || [],
          );
          let count = 0;
          latestFailNames.forEach((name) => {
            if (!prevFailNames.has(name)) count++;
          });
          return count;
        })(),
        infraIssues: s.broken,
      },
    };
  }, [latest, trend, durationTrend, categoriesTrend, runs]);

  const {
    failureRate,
    passFailData,
    durationDistribution,
    severityStatusData,
    statusTrendData,
    durationTrendData,
    categoriesTrendData,
    readinessScore,
    readinessBreakdown,
    trendStatus,
    insights,
  } = dashboardData;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-black animate-pulse">
          Loading Metrics
        </p>
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
            Offline Mode
          </h3>
          <p className="text-xs font-medium italic mt-0.5 opacity-80">
            Unable to synchronize dashboard data. {error?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cypress Test Automation Results & Insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {latest && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-surface-dark rounded-lg border border-slate-200 dark:border-border-brand">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                Latest: {dayjs(latest.createdAt).format("MMM DD, HH:mm")}
              </span>
            </div>
          )}

          <button
            onClick={() => syncData()}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all disabled:opacity-50",
              isSyncing && "animate-pulse"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Data"}
          </button>
        </div>
      </div>

      {!latest ? (
        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-border-brand/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-surface-dark/10">
          <div className="w-16 h-16 bg-white dark:bg-surface-dark rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              No run data available
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Test results will appear here once you've executed your Cypress
              suites and sent the results to the webhook endpoint.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Release Readiness Hero */}
          <ReadinessScoreCard
            score={readinessScore}
            breakdown={readinessBreakdown}
            trend={trendStatus}
          />

          {/* Summary Section */}
          <ExecutionSummary
            summary={latest.summary}
            failureRate={failureRate}
            formatDuration={formatDuration}
            passFailData={passFailData}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            insights={insights}
            onInsightClick={(type) => {
              const filterValue = type === "infraIssues" ? "broken" : type;
              navigate(`/automation/runs/${latest.runId}?tab=tests&filter=${filterValue}`);
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Duration Distribution - Moved up to fill the row */}
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Duration Distribution
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none">
                    Test counts segmented by execution time
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={durationDistribution}
                  barSize={24}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 9, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 9, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    content={<DurationDistributionTooltip />}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Trend */}
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Severity Breakdown
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none">
                    Segmented test status across priority levels
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={severityStatusData}
                  barGap={12}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="severity"
                    tick={{ fontSize: 9, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 9, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    content={<SeverityTrendTooltip />}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 10,
                      paddingTop: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  />
                  <Bar 
                    dataKey="passed" 
                    stackId="sev" 
                    fill="#10b981" 
                    className="cursor-pointer"
                    onClick={() => {
                      console.log("[Bar] Clicked Passed");
                      setStatusFilter(prev => prev === "passed" ? null : "passed");
                    }}
                  />
                  <Bar 
                    dataKey="failed" 
                    stackId="sev" 
                    fill="#ef4444" 
                    className="cursor-pointer"
                    onClick={() => {
                      console.log("[Bar] Clicked Failed");
                      setStatusFilter(prev => prev === "failed" ? null : "failed");
                    }}
                  />
                  <Bar 
                    dataKey="broken" 
                    stackId="sev" 
                    fill="#f59e0b" 
                    className="cursor-pointer"
                    onClick={() => {
                      console.log("[Bar] Clicked Broken");
                      setStatusFilter(prev => prev === "broken" ? null : "broken");
                    }}
                  />
                  <Bar
                    dataKey="skipped"
                    stackId="sev"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    className="cursor-pointer"
                    onClick={() => {
                      console.log("[Bar] Clicked Skipped");
                      setStatusFilter(prev => prev === "skipped" ? null : "skipped");
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Pass Rate */}
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Historical Pass Rate
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none">
                  Chronological view of pass percentage across recent runs
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={[...trend].reverse()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(val) => dayjs(val).format("MMM DD")}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PassRateTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="summary.passRate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPass)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Execution & Duration Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 h-[380px] flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                Status Execution Trend
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none mb-6">
                Recent run statuses stacked to highlight shifts
              </p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={statusTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="statusPassed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="statusFailed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="100%"
                          stopColor="#ef4444"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="statusBroken"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f59e0b"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f59e0b"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="createdAt"
                      tickFormatter={(v) => dayjs(v).format("MMM DD")}
                      tick={{ fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<StatusTrendTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: 10,
                        paddingTop: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="broken"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="url(#statusBroken)"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stackId="1"
                      stroke="#ef4444"
                      fill="url(#statusFailed)"
                    />
                    <Area
                      type="monotone"
                      dataKey="passed"
                      stackId="1"
                      stroke="#10b981"
                      fill="url(#statusPassed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 h-[380px] flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                Duration Trend
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none mb-6">
                Execution time progression across recent tests
              </p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={durationTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="createdAt"
                      tickFormatter={(v) => dayjs(v).format("MMM DD")}
                      tick={{ fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${Math.round(v)}m`}
                      tick={{ fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DurationTrendTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="durationMinutes"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#8b5cf6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Categories Trend */}
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">
              Categories Trend
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none mb-6">
              Trend of product vs test defects across runs
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categoriesTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(v) => dayjs(v).format("MMM DD")}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<CategoriesTrendTooltip />}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: 10,
                    paddingTop: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                />
                <Bar
                  dataKey="Product Defect"
                  stackId="cat"
                  fill="#ef4444"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Test Defect"
                  stackId="cat"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Run History Table */}
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-border-brand flex items-center justify-between bg-slate-50/50 dark:bg-sidebar-bg/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-tight">
                  Recent Run History
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {statusFilter && (
                  <button
                    onClick={() => setStatusFilter(null)}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
                  >
                    Clear Filter: {statusFilter.toUpperCase()} <XCircle className="w-2.5 h-2.5" />
                  </button>
                )}
                <button
                  onClick={() => navigate("/automation/runs")}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-sidebar-bg/30 border-b border-slate-100 dark:border-border-brand">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                      Run ID
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none text-center">
                      Total
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none text-center">
                      Passed
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none text-center">
                      Failed
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none text-right">
                      Pass Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-border-brand/30">
                  {trend
                    .filter((run) => {
                      if (!statusFilter) return true;
                      if (statusFilter === "passed") return run.summary.passed > 0;
                      if (statusFilter === "failed") return run.summary.failed > 0;
                      if (statusFilter === "broken") return (run.summary.broken || 0) > 0;
                      if (statusFilter === "skipped") return (run.summary.skipped || 0) > 0;
                      return true;
                    })
                    .map((run) => (
                    <tr
                      key={run.runId}
                      onClick={() => navigate(`/automation/runs/${run.runId}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {dayjs(run.createdAt).format("MMM DD, YYYY HH:mm")}
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
                        <div
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                            run.summary.passRate >= 90
                              ? "bg-emerald-500/10 text-emerald-600"
                              : run.summary.passRate >= 70
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600",
                          )}
                        >
                          {run.summary.passRate}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAutomationPage;
