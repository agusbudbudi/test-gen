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
  Zap,
  Search,
  Filter,
  Play,
  LayoutDashboard,
  Layers,
  ListChecks,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { ExecutionSummary } from "@/components/DashboardAutomation/ExecutionSummary";
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
  const { runCache, runs } = useDashboardData();
  const cachedRun = runId ? runCache.get(runId) : undefined;
  const { run, loading, error } = useRunDetails(runId || "", cachedRun);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "summary" | "suites" | "tests" | "media"
  >((searchParams.get("tab") as any) || "summary");
  const [testSearch, setTestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("filter") || "all",
  );
  const [suiteSearch, setSuiteSearch] = useState("");
  const [suiteStatusFilter, setSuiteStatusFilter] = useState("all");
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<number>>(new Set());
  const [expandedTestGroups, setExpandedTestGroups] = useState<Set<string>>(
    new Set(),
  );

  const newFailuresSet = useMemo(() => {
    if (!run || !runs || runs.length < 2) return new Set<string>();

    const sortedRuns = [...runs].sort((a, b) => 
      dayjs(b.createdAt as string).valueOf() - dayjs(a.createdAt as string).valueOf()
    );
    
    const currentIndex = sortedRuns.findIndex(r => r.runId === run.runId);
    if (currentIndex === -1 || currentIndex === sortedRuns.length - 1) return new Set<string>();
    
    const prevRun = sortedRuns[currentIndex + 1];
    const currentFailNames = new Set<string>(
      run.tests
        ?.filter((t: any) => t.status === "failed")
        .map((t: any) => t.name as string) || [],
    );
    const prevFailNames = new Set<string>(
      prevRun.tests
        ?.filter((t: any) => t.status === "failed")
        .map((t: any) => t.name as string) || [],
    );

    const newFails = new Set<string>();
    currentFailNames.forEach(name => {
      if (!prevFailNames.has(name)) newFails.add(name);
    });
    return newFails;
  }, [run, runs]);

  // Handle deep linking for specific test
  React.useEffect(() => {
    if (run && searchParams.get("testName")) {
      const targetName = searchParams.get("testName");
      const found = run.tests?.find((t: any) => t.name === targetName);
      if (found) {
        setSelectedTest(found);
        const group =
          found.story ||
          found.feature ||
          found.suite ||
          found.parentSuite ||
          "Other Tests";
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

  // Aggregate all screenshots from failures
  const failureMedia = useMemo(() => {
    if (!run?.tests) return [];
    return run.tests
      .filter((t: any) => t.status !== "passed" && t.attachments)
      .flatMap((t: any) =>
        t.attachments
          .filter((att: any) => att.type?.startsWith("image/"))
          .map((att: any) => ({
            ...att,
            testName: t.name,
            testStatus: t.status,
          })),
      );
  }, [run]);

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
          <ArrowLeft size={18} />{" "}
          <span className="text-xs font-bold font-black uppercase">
            Back to Runs
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/automation/runs")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span className="opacity-40 uppercase text-[10px] tracking-widest font-black">
                  Run Details
                </span>
                <span className="text-primary font-mono text-base bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  {run.runId}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col md:items-end px-2 md:px-0">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <Clock size={12} className="opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Executed On
              </span>
            </div>
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {dayjs(run.createdAt).format("MMMM DD, YYYY")}
              <span className="mx-1.5 opacity-20">|</span>
              {dayjs(run.createdAt).format("HH:mm")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
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
              {
                key: "media",
                label: "Media",
                icon: <ImageIcon size={15} />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
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

      <div className="min-h-[600px]">
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
            const bucketCount = Math.min(
              60,
              Math.ceil(maxSec / bucketSize) || 1,
            );
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

              const handleInsightClick = (type: "flaky" | "newFailures" | "infraIssues") => {
                setActiveTab("tests");
                if (type === "infraIssues") {
                  setStatusFilter("broken");
                } else {
                  setStatusFilter(type);
                }
                // Scroll to tests section
                const element = document.getElementById("tests-section-header");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              };

              return (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  {/* Stat Cards + Doughnut */}
                  <ExecutionSummary
                    summary={s}
                    failureRate={failRate}
                    formatDuration={formatDuration}
                    passFailData={passFailData}
                    statusFilter={statusFilter === "all" ? null : statusFilter}
                    setStatusFilter={(filter) => setStatusFilter(filter || "all")}
                    insights={{
                      flaky: run.tests?.filter((t: any) => t.flaky).length || 0,
                      newFailures: newFailuresSet.size,
                      infraIssues: run.summary.broken || 0,
                    }}
                    onInsightClick={handleInsightClick}
                  />

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
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search suite or test case..."
                        value={suiteSearch}
                        onChange={(e) => setSuiteSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full">
                    {(() => {
                      const getCount = (status: string) => {
                        if (!run?.tests) return 0;
                        if (status === "all") return run.tests.length;
                        return run.tests.filter((t: any) => t.status === status)
                          .length;
                      };

                      return [
                        "all",
                        "passed",
                        "failed",
                        "broken",
                        "skipped",
                      ].map((status) => {
                        const count = getCount(status);
                        return (
                          <button
                            key={status}
                            onClick={() => setSuiteStatusFilter(status)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5",
                              suiteStatusFilter === status
                                ? "bg-primary text-white"
                                : "bg-white dark:bg-surface-dark text-slate-500 border border-slate-200 dark:border-border-brand hover:border-primary/50",
                            )}
                          >
                            {status}
                            {count > 0 && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] leading-none",
                                  suiteStatusFilter === status
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-230px)]">
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
                        {suites
                          .filter((suite: any) => {
                            const searchLower = suiteSearch.toLowerCase();
                            const matchesSuiteSearch = (suite.suite || "")
                              .toLowerCase()
                              .includes(searchLower);

                            const sTests = tests.filter(
                              (t: any) =>
                                (t.parentSuite || t.suiteName || "") ===
                                  (suite.suite || suite.parentSuite || "") ||
                                (t.suite || "") === (suite.suite || ""),
                            );

                            const matchesTestNameSearch = sTests.some((t: any) =>
                              (t.name || "").toLowerCase().includes(searchLower),
                            );

                            if (!matchesSuiteSearch && !matchesTestNameSearch)
                              return false;

                            if (suiteStatusFilter === "all") return true;

                            return sTests.some(
                              (t: any) => t.status === suiteStatusFilter,
                            );
                          })
                          .map((suite: any, i: number) => {
                            const searchLower = suiteSearch.toLowerCase();
                            const matchesSuiteSearch =
                              suiteSearch.trim() !== "" &&
                              (suite.suite || "")
                                .toLowerCase()
                                .includes(searchLower);

                            const isExpanded =
                              suiteSearch.trim() !== "" ||
                              expandedSuites.has(i);

                            const suiteTests = tests.filter((t: any) => {
                              const isFromSuite =
                                (t.parentSuite || t.suiteName || "") ===
                                  (suite.suite || suite.parentSuite || "") ||
                                (t.suite || "") === (suite.suite || "");
                              const matchesStatus =
                                suiteStatusFilter === "all" ||
                                t.status === suiteStatusFilter;

                              if (!isFromSuite || !matchesStatus) return false;

                              // If no search query, show all in suite
                              if (suiteSearch.trim() === "") return true;

                              // If suite name matches, show all tests in this suite
                              if (matchesSuiteSearch) return true;

                              // Otherwise, only show tests that match the search keyword
                              return (t.name || "")
                                .toLowerCase()
                                .includes(searchLower);
                            });
                            const duration =
                              suite.duration ??
                              suiteTests.reduce(
                                (acc: number, t: any) =>
                                  acc + (t.duration || 0),
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

                                {isExpanded && (
                                  <tr>
                                    <td colSpan={8} className="p-0">
                                      <div className="bg-slate-50/50 dark:bg-surface-dark/30 border-b border-slate-100 dark:border-border-brand">
                                        {suiteTests.length === 0 ? (
                                          <div className="px-10 py-3 text-[11px] text-slate-400 italic">
                                            No individual test data available
                                            for this suite.
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
                                                            <span
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const group =
                                                                  t.story ||
                                                                  t.feature ||
                                                                  t.suite ||
                                                                  t.parentSuite ||
                                                                  "Other Tests";
                                                                setExpandedTestGroups(
                                                                  (prev) => {
                                                                    const next =
                                                                      new Set(
                                                                        prev,
                                                                      );
                                                                    next.add(
                                                                      group,
                                                                    );
                                                                    return next;
                                                                  },
                                                                );
                                                                setSelectedTest(
                                                                  t,
                                                                );
                                                                setActiveTab(
                                                                  "tests",
                                                                );
                                                              }}
                                                              className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight hover:text-primary hover:underline cursor-pointer transition-all"
                                                            >
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
                                                            (t.duration || 0) /
                                                            1000
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
                                                        {t.flaky && (
                                                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-black text-amber-600 flex items-center gap-0.5">
                                                            <Zap size={8} />{" "}
                                                            FLAKY
                                                          </span>
                                                        )}
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
                    placeholder="Search tests, stories, or features..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full">
                {(() => {
                  const getCount = (status: string) => {
                    if (!run?.tests) return 0;
                    if (status === "all") return run.tests.length;
                    if (status === "flaky")
                      return run.tests.filter((t: any) => t.flaky).length;
                    if (status === "newFailures") return newFailuresSet.size;
                    return run.tests.filter((t: any) => t.status === status)
                      .length;
                  };

                  return [
                    "all",
                    "passed",
                    "failed",
                    "broken",
                    "skipped",
                    "flaky",
                    "newFailures",
                  ].map((status) => {
                    const count = getCount(status);
                    if (count === 0 && status !== "all") return null;

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
                        {status === "newFailures" ? "New Failures" : status}
                        {count > 0 && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] leading-none",
                              statusFilter === status
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)]">
              <div className="lg:col-span-12 xl:col-span-5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden flex flex-col">
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
                        const filteredTests =
                          run.tests?.filter((t: any) => {
                            const searchLower = testSearch.toLowerCase();
                            const matchesStatus =
                              statusFilter === "all" ||
                              (statusFilter === "flaky"
                                ? t.flaky
                                : statusFilter === "newFailures"
                                  ? newFailuresSet.has(t.name)
                                  : t.status === statusFilter);
                            const matchesName = (t.name || "")
                              .toLowerCase()
                              .includes(searchLower);
                            const matchesStory = (t.story || "")
                              .toLowerCase()
                              .includes(searchLower);
                            const matchesFeature = (t.feature || "")
                              .toLowerCase()
                              .includes(searchLower);

                            return (
                              matchesStatus &&
                              (matchesName || matchesStory || matchesFeature)
                            );
                          }) || [];

                        if (filteredTests.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-16 text-center text-slate-500 dark:text-slate-400"
                              >
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                    No tests found
                                  </p>
                                  <p className="text-[11px] opacity-70">
                                    We couldn't find any test cases matching
                                    your search and filter criteria.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const groupedTests = filteredTests.reduce(
                          (acc: any, t: any) => {
                            const group =
                              t.story ||
                              t.feature ||
                              t.suite ||
                              t.parentSuite ||
                              "Other Tests";
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(t);
                            return acc;
                          },
                          {},
                        );

                        return Object.entries(groupedTests)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([groupName, suiteTests]: [string, any]) => {
                            const isExpanded =
                              testSearch.trim() !== "" ||
                              expandedTestGroups.has(groupName);
                            const sortedTests = [...suiteTests].sort(
                              (a: any, b: any) =>
                                (a.name || "").localeCompare(b.name || ""),
                            );

                            const passed = sortedTests.filter(
                              (t: any) => t.status === "passed",
                            ).length;
                            const failed = sortedTests.filter(
                              (t: any) => t.status === "failed",
                            ).length;
                            const broken = sortedTests.filter(
                              (t: any) => t.status === "broken",
                            ).length;
                            const skipped = sortedTests.filter(
                              (t: any) => t.status === "skipped",
                            ).length;

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
                                {isExpanded &&
                                  sortedTests.map((test: any, i: number) => (
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
                                            {test.flaky && (
                                              <span className="ml-1 px-1 py-0.25 rounded bg-amber-500/10 text-[8px] font-black text-amber-600 flex items-center gap-0.5 border border-amber-500/20">
                                                <Zap size={7} /> FLAKY
                                              </span>
                                            )}
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
                          });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-y-auto">
                <TestDetailView test={selectedTest} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {failureMedia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {failureMedia.map((media: any, idx: number) => {
                  const src = media.source?.startsWith("http")
                    ? media.source
                    : `/api/allure-results/${media.source}`;

                  return (
                    <div
                      key={idx}
                      className="group bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col"
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-sidebar-bg">
                        <img
                          src={src}
                          alt={media.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          onClick={() => window.open(src, "_blank")}
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                              media.testStatus === "failed"
                                ? "bg-rose-500/80 text-white"
                                : "bg-amber-500/80 text-white",
                            )}
                          >
                            {media.testStatus}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-2">
                            {media.testName}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {media.name || "Screenshot Attachment"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const found = run.tests?.find(
                              (t: any) => t.name === media.testName,
                            );
                            if (found) {
                              setSelectedTest(found);
                              setActiveTab("tests");
                            }
                          }}
                          className="w-full py-2 bg-slate-50 dark:bg-surface-dark hover:bg-primary hover:text-white text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          View Test Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-surface-dark border border-dashed border-slate-200 dark:border-border-brand rounded-2xl space-y-4 text-center">
                <div className="w-16 h-16 bg-white dark:bg-sidebar-bg rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-sm">
                  <ImageIcon size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    No Media Found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[280px]">
                    No screenshots or recordings were captured for this run's
                    failures.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("tests")}
                  className="mt-2 text-[10px] font-black uppercase text-primary hover:underline"
                >
                  View Test List
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunDetailsPage;
