import React, { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRunDetails } from "@/hooks/useRunDetails";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Search,
  Filter,
  Play,
  LayoutDashboard,
  Layers,
  ListChecks,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { StatCard } from "@/components/DashboardAutomation/StatCard";
import { TestDetailView } from "@/components/DashboardAutomation/TestDetailView";
import {
  DurationDistributionTooltip,
  SeverityTrendTooltip,
} from "@/components/DashboardAutomation/DashboardTooltips";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

const RunDetailsPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { runCache } = useDashboardData();
  const cachedRun = runId ? runCache.get(runId) : undefined;
  const { run, loading, error } = useRunDetails(runId || "", cachedRun);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"summary" | "suites" | "tests">(
    (searchParams.get("tab") as any) || "summary"
  );
  const [testSearch, setTestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "all");
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<number>>(new Set());
  const [expandedTestGroups, setExpandedTestGroups] = useState<Set<string>>(new Set());

  // Handle deep linking for specific test
  React.useEffect(() => {
    if (run && searchParams.get("testName")) {
      const targetName = searchParams.get("testName");
      const found = run.tests?.find((t: any) => t.name === targetName);
      if (found) {
        setSelectedTest(found);
        // Also expand the group if it's in suites view? 
        // Actually the tests tab already shows them by story/feature/suite.
        // Expanding group:
        const group = found.story || found.feature || found.suite || found.parentSuite || "Other Tests";
        setExpandedTestGroups(new Set([group]));
      }
    }
  }, [run, searchParams]);

  const toggleSuite = (i: number) => {
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleTestGroup = (groupName: string) => {
    setExpandedTestGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">
            Run not found or failed to load data.
          </p>
        </div>
        <button
          onClick={() => navigate("/automation/runs")}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-400 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} /> <span className="text-xs font-bold font-black uppercase">Back to Runs</span>
        </button>
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
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/automation/runs")}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Run Details:{" "}
              <span className="text-primary font-mono">{run.runId}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Executed {dayjs(run.createdAt).format("MMMM DD, YYYY HH:mm")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {(
            [
              {
                key: "summary",
                label: "Summary",
                icon: <LayoutDashboard size={15} />,
              },
              { key: "suites", label: "Suites", icon: <Layers size={15} /> },
              {
                key: "tests",
                label: "Test by Status",
                icon: <ListChecks size={15} />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "summary" &&
        (() => {
          const s = run.summary;
          const tests = run.tests || [];
          const failRate = s.total
            ? Number(((s.failed + (s.broken || 0)) / s.total) * 100)
            : 0;
          const passFailData = [
            { name: "Pass", value: s.passRate, color: "#10b981" },
            { name: "Fail", value: failRate, color: "#ef4444" },
          ];

          // Duration Distribution
          const maxSec = Math.max(
            0,
            ...tests.map((t: any) => Number((t.duration || 0) / 1000)),
          );
          const bucketSize = 5;
          const bucketCount = Math.min(60, Math.ceil(maxSec / bucketSize) || 1);
          const durationDist = Array.from({ length: bucketCount }, (_, i) => {
            const min = i * bucketSize,
              max = min + bucketSize;
            const matching = tests.filter((t: any) => {
              const sec = Number((t.duration || 0) / 1000);
              return i === bucketCount - 1
                ? sec >= min
                : sec >= min && sec < max;
            });
            return {
              range: i === bucketCount - 1 ? `>= ${min}s` : `${min}-${max}s`,
              count: matching.length,
              tests: matching.map((t: any) => t.name || "Unnamed"),
            };
          });

          // Severity Breakdown
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
          const sevMap = new Map<string, any>();
          tests.forEach((t: any) => {
            const rawSev = (t.severity || "unknown").toLowerCase();
            if (!sevMap.has(rawSev))
              sevMap.set(rawSev, {
                severity: rawSev.charAt(0).toUpperCase() + rawSev.slice(1),
                passed: 0,
                failed: 0,
                broken: 0,
                skipped: 0,
              });
            const entry = sevMap.get(rawSev);
            const status = (t.status || "unknown").toLowerCase();
            if (status === "passed") entry.passed++;
            else if (status === "failed") entry.failed++;
            else if (status === "broken") entry.broken++;
            else if (status === "skipped") entry.skipped++;
          });
          const sevData = Array.from(sevMap.values()).sort((a, b) => {
            const ia = sevOrder.indexOf(a.severity.toLowerCase()),
              ib = sevOrder.indexOf(b.severity.toLowerCase());
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          });

          return (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              {/* Stat Cards + Doughnut */}
              <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <StatCard
                      icon={<ClipboardList className="w-5 h-5" />}
                      label="Total"
                      value={s.total}
                      color="brand"
                    />
                    <StatCard
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      label="Passed"
                      value={s.passed}
                      color="teal"
                    />
                    <StatCard
                      icon={<XCircle className="w-5 h-5" />}
                      label="Failed"
                      value={s.failed}
                      color="red"
                    />
                    <StatCard
                      icon={<AlertTriangle className="w-5 h-5" />}
                      label="Broken"
                      value={s.broken || 0}
                      color="yellow"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    <StatCard
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      label="Pass Rate"
                      value={`${s.passRate}%`}
                      color="teal"
                    />
                    <StatCard
                      icon={<XCircle className="w-5 h-5" />}
                      label="Failure %"
                      value={`${failRate.toFixed(1)}%`}
                      color="red"
                    />
                    <StatCard
                      icon={<Clock className="w-5 h-5" />}
                      label="Duration"
                      value={formatDuration(s.duration)}
                      color="brand"
                    />
                  </div>
                </div>
                {/* Doughnut */}
                <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 lg:w-72 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Pass vs Failure
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={passFailData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          stroke="none"
                        >
                          {passFailData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2">
                      {passFailData.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {item.name} {item.value.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Duration Distribution */}
                <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                    Duration Distribution
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none mb-4">
                    Test counts segmented by execution time
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={durationDist}
                      barSize={22}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Severity Breakdown */}
                <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                    Severity Breakdown
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-none mb-4">
                    Segmented test status across priority levels
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={sevData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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
                      <Bar dataKey="passed" stackId="sev" fill="#10b981" />
                      <Bar dataKey="failed" stackId="sev" fill="#ef4444" />
                      <Bar dataKey="broken" stackId="sev" fill="#f59e0b" />
                      <Bar
                        dataKey="skipped"
                        stackId="sev"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

      {activeTab === "suites" &&
        (() => {
          const tests = run.tests || [];
          const suites = run.suites || [];

          const statusDot = (status: string) => {
            const s = (status || "").toLowerCase();
            const color =
              s === "passed"
                ? "bg-emerald-500"
                : s === "failed"
                  ? "bg-rose-500"
                  : s === "broken"
                    ? "bg-amber-500"
                    : "bg-slate-400";
            return (
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`}
              />
            );
          };

          return (
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300 flex flex-col h-[calc(100vh-180px)]">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 z-20 shadow-sm">
                    <tr className="bg-white/95 dark:bg-surface-card/95 backdrop-blur border-b border-slate-100 dark:border-border-brand">
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8"></th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">
                        <div className="flex items-center gap-2">
                          Suite Name
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-[9px] font-black text-slate-500 dark:text-slate-400">
                            {suites.length}
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Total
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Passed
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Failed
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Broken
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Duration
                      </th>
                      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                        Pass Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suites.map((suite: any, i: number) => {
                      const isExpanded = expandedSuites.has(i);
                      // Match tests to this suite
                      const suiteTests = tests.filter(
                        (t: any) =>
                          (t.parentSuite || t.suiteName || "") ===
                            (suite.suite || suite.parentSuite || "") ||
                          (t.suite || "") === (suite.suite || ""),
                      );
                      const duration =
                        suite.duration ??
                        suiteTests.reduce(
                          (acc: number, t: any) => acc + (t.duration || 0),
                          0,
                        );
                      const broken =
                        suite.broken ??
                        suiteTests.filter(
                          (t: any) =>
                            (t.status || "").toLowerCase() === "broken",
                        ).length;
                      const passRate = suite.total
                        ? ((suite.passed / suite.total) * 100).toFixed(1)
                        : "0.0";

                      return (
                        <React.Fragment key={i}>
                          <tr
                            className={cn(
                              "border-b border-slate-50 dark:border-border-brand/30 cursor-pointer transition-colors",
                              isExpanded
                                ? "bg-primary/5 dark:bg-primary/10"
                                : "hover:bg-slate-50/50 dark:hover:bg-primary/5",
                            )}
                            onClick={() => toggleSuite(i)}
                          >
                            <td className="px-4 py-3 text-slate-400">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  {suite.suite}
                                </span>
                                {suite.parentSuite && (
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {suite.parentSuite}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center">
                              {suite.total}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                              {suite.passed}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                              {suite.failed}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-400 text-center">
                              {broken}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">
                              {formatDuration(duration)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div
                                className={cn(
                                  "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                                  Number(passRate) >= 90
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : Number(passRate) >= 70
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "bg-rose-500/10 text-rose-600",
                                )}
                              >
                                {passRate}%
                              </div>
                            </td>
                          </tr>

                          {/* Expanded test rows */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div className="bg-slate-50/50 dark:bg-surface-dark/30 border-b border-slate-100 dark:border-border-brand">
                                  {suiteTests.length === 0 ? (
                                    <div className="px-10 py-3 text-[11px] text-slate-400 italic">
                                      No individual test data available for this
                                      suite.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-100 dark:border-border-brand/50">
                                          <th className="pl-12 pr-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            Test Name
                                          </th>
                                          <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Duration
                                          </th>
                                          <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                            Status
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {suiteTests.map(
                                          (t: any, ti: number) => {
                                            const st = (
                                              t.status || "unknown"
                                            ).toLowerCase();
                                            const badge =
                                              st === "passed"
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : st === "failed"
                                                  ? "bg-rose-500/10 text-rose-600"
                                                  : st === "broken"
                                                    ? "bg-amber-500/10 text-amber-600"
                                                    : "bg-slate-200/50 text-slate-500";
                                            return (
                                              <tr
                                                key={ti}
                                                className="border-b border-slate-100/50 dark:border-border-brand/20 hover:bg-white dark:hover:bg-surface-card/50 transition-colors"
                                              >
                                                <td className="pl-12 pr-4 py-2.5">
                                                  <div className="flex items-start gap-2">
                                                    {statusDot(t.status)}
                                                    <div className="flex flex-col">
                                                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                                                        {t.name ||
                                                          "Unnamed test"}
                                                      </span>
                                                      {(t.fullName ||
                                                        t.path) && (
                                                        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-400 font-mono">
                                                          <FolderOpen className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                                                          <span className="break-all">
                                                            {t.fullName ||
                                                              t.path}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                  <span className="text-[11px] font-bold text-slate-500">
                                                    {(
                                                      (t.duration || 0) / 1000
                                                    ).toFixed(2)}
                                                    s
                                                  </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                  <span
                                                    className={cn(
                                                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                                      badge,
                                                    )}
                                                  >
                                                    {st}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          },
                                        )}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      {activeTab === "tests" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>
            <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full">
              {(() => {
                const getCount = (status: string) => {
                  if (!run?.tests) return 0;
                  if (status === "all") return run.tests.length;
                  return run.tests.filter((t: any) => t.status === status).length;
                };

                return ["all", "passed", "failed", "broken", "skipped"].map(
                  (status) => {
                    const count = getCount(status);
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5",
                          statusFilter === status
                            ? "bg-primary text-white"
                            : "bg-white dark:bg-surface-dark text-slate-500 border border-slate-200 dark:border-border-brand hover:border-primary/50",
                        )}
                      >
                        {status}
                        {count > 0 && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] leading-none",
                            statusFilter === status ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  }
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)]">
            <div className="lg:col-span-5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-sidebar-bg z-10">
                    <tr className="border-b border-slate-100 dark:border-border-brand">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-3/4">
                        Test
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right w-1/4">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-border-brand/30">
                    {(() => {
                      const filteredTests = run.tests?.filter(
                        (t) =>
                          (statusFilter === "all" || t.status === statusFilter) &&
                          (t.name || "").toLowerCase().includes(testSearch.toLowerCase())
                      ) || [];

                      if (filteredTests.length === 0) {
                        return (
                          <tr>
                            <td colSpan={2} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">No tests found</p>
                                <p className="text-[11px] opacity-70">
                                  We couldn't find any test cases matching your search and filter criteria.
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const groupedTests = filteredTests.reduce((acc: any, t: any) => {
                        const group = t.story || t.feature || t.suite || t.parentSuite || "Other Tests";
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(t);
                        return acc;
                      }, {});

                      return Object.entries(groupedTests)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([groupName, suiteTests]: [string, any]) => {
                          const isExpanded = testSearch.trim() !== "" || expandedTestGroups.has(groupName);
                          const sortedTests = [...suiteTests].sort((a: any, b: any) => 
                            (a.name || "").localeCompare(b.name || "")
                          );

                          const passed = sortedTests.filter((t: any) => t.status === "passed").length;
                          const failed = sortedTests.filter((t: any) => t.status === "failed").length;
                          const broken = sortedTests.filter((t: any) => t.status === "broken").length;
                          const skipped = sortedTests.filter((t: any) => t.status === "skipped").length;

                          return (
                            <React.Fragment key={groupName}>
                              <tr 
                                className="bg-slate-50/50 dark:bg-surface-dark/50 border-y border-slate-100 dark:border-border-brand cursor-pointer hover:bg-slate-100/50 dark:hover:bg-primary/5 transition-colors"
                                onClick={() => toggleTestGroup(groupName)}
                              >
                                <td colSpan={2} className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">
                                      {groupName}
                                    </span>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                      {passed > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-black text-emerald-600">
                                          Passed: {passed}
                                        </span>
                                      )}
                                      {failed > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-[9px] font-black text-rose-600">
                                          Failed: {failed}
                                        </span>
                                      )}
                                      {broken > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-black text-amber-600">
                                          Broken: {broken}
                                        </span>
                                      )}
                                      {skipped > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-[9px] font-black text-slate-500 dark:text-slate-400">
                                          Skipped: {skipped}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && sortedTests.map((test: any, i: number) => (
                                <tr
                                  key={`${groupName}-${i}`}
                                  onClick={() => setSelectedTest(test)}
                                  className={cn(
                                    "hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors cursor-pointer group",
                                    selectedTest?.name === test.name
                                      ? "bg-primary/5 dark:bg-primary/10"
                                      : "",
                                  )}
                                >
                                  <td className="pl-10 pr-4 py-3 border-l-2 border-transparent group-hover:border-primary/20">
                                    <div className="flex flex-col min-w-0">
                                      <span
                                        className={cn(
                                          "text-[11px] font-bold leading-tight truncate",
                                          selectedTest?.name === test.name
                                            ? "text-primary"
                                            : "text-slate-700 dark:text-slate-200",
                                        )}
                                      >
                                        {test.name}
                                      </span>
                                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono mt-0.5 opacity-80">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDuration(test.duration || 0)}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <span
                                      className={cn(
                                        "inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-surface-card",
                                        test.status === "passed"
                                          ? "bg-emerald-500"
                                          : test.status === "failed"
                                            ? "bg-rose-500"
                                            : test.status === "broken"
                                              ? "bg-amber-500"
                                              : "bg-slate-500",
                                      )}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-y-auto">
              <TestDetailView test={selectedTest} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stack = ({
  children,
  gap = 1,
  className = "",
}: {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}) => (
  <div className={cn("flex flex-col", `gap-${gap}`, className)}>{children}</div>
);

export default RunDetailsPage;
