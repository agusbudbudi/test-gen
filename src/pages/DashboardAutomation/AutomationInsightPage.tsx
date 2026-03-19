import React, { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Sparkles,
  Lightbulb,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Zap,
  RefreshCw,
  Bug,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { useUIStore } from "@/stores/uiStore";
import { fetchChat } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const AutomationInsightPage = () => {
  const navigate = useNavigate();
  const {
    latest,
    trend,
    suites,
    statusBuckets,
    loading,
    error,
    syncData,
    isSyncing,
  } = useDashboardData();
  const { aiInsights, aiSuggestions, aiAssessment, aiRootCause, setAIResults } =
    useDashboardStore();
  const { apiKey, selectedModel } = useUIStore();
  const toast = useToast();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "insights" | "suggestions" | "assessment" | "rootCause"
  >("insights");

  // These are now handled by the store, but I keep the local names for minimal diff
  const insights = aiInsights;
  const suggestions = aiSuggestions;
  const assessment = aiAssessment;
  const rootCause = aiRootCause;

  // Calculate top failing tests from latest run
  const topFailingTests = useMemo(() => {
    if (!latest || !latest.tests) return [];
    return [...latest.tests]
      .filter((t) => t.status === "failed" || t.status === "broken")
      .sort((a, b) => (b.duration || 0) - (a.duration || 0)) // Just sorting by duration for now as a proxy for "impact"
      .slice(0, 3);
  }, [latest]);

  const generateAIInsights = async () => {
    if (!apiKey) {
      setAiError("OpenAI API Key is missing. Please set it in Settings.");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const dashboardSummary = {
        latestRun: latest?.summary,
        topFailingSuites: suites
          .slice(0, 5)
          .map((s) => ({ name: s.suite, failed: s.failed, passed: s.passed })),
        recentTrend: trend
          .slice(0, 7)
          .map((r) => ({ date: r.createdAt, passRate: r.summary.passRate })),
        dailyBreakdown: statusBuckets.slice(-7),
        failures: latest?.tests
          ?.filter((t: any) => t.status === "failed" || t.status === "broken")
          .slice(0, 5) // Send top 5 failures with stack traces
          .map((t: any) => ({
            name: t.name,
            suite: t.suite,
            error:
              t.statusDetails?.message ||
              t.error?.message ||
              t.error ||
              "No error message provided",
            stack:
              t.statusDetails?.trace ||
              t.error?.stack ||
              "No stack trace provided",
          })),
      };

      const prompt = `
        As a world-class Senior QA Automation Architect and Data Scientist, analyze this test automation dashboard data. 
        Your goal is to provide deep, actionable intelligence that goes beyond surface-level metrics.

        DATA:
        ${JSON.stringify(dashboardSummary, null, 2)}

        FORMAT YOUR RESPONSE USING THE DELIMITERS BELOW. 
        USE RICH GITHUB-FLAVORED MARKDOWN (Bold, Lists, Tables, Emojis).

        ===INSIGHTS===
        Provide a strategic narrative analysis. 
        - Highlight the most significant trend (e.g., "Stability is improving across core suites but regressing in Checkout").
        - Identify potential "Hidden Risks" (e.g., "Pass rate is high, but average duration is spiking").
        - Use professional, punchy language and strategic emojis (e.g. 📈, ⚠️, 🚀).

        ===SUGGESTIONS===
        Provide 3-5 high-impact, actionable recommendations. 
        - Format each suggestion with a bold title and a short explanation.
        - Example: "**Refactor Flaky Checkout Suite:** The Login sequence is failing intermittently due to timeout issues..."
        - Use emojis for each point (e.g. 🛠️, 🧪, ⚡).

        ===ASSESSMENT===
        Provide a structured "QA Health Scorecard".
        - Start with a "Health Score" (e.g., "### healthScore: 85/100").
        - Categorize the risk level (Low, Medium, High, Critical).
        - Provide a Markdown Table with columns: Category, Status, Observation.
        - End with a one-sentence "**Architect's Verdict**".

        ===ROOTCAUSE===
        Provide a deep dive into the provided failures.
        - Group identical/similar errors together 🔍.
        - Explain the likely "True Root Cause" (e.g., Environment issue, API timeout, Code regression, Flaky selector) 💡.
        - For each group, provide a clear "Recommended Action" for the engineer 🛠️.
      `;

      const response = await fetchChat(
        {
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: "You are a Senior QA Automation Architect.",
            },
            { role: "user", content: prompt },
          ],
        },
        apiKey,
      );

      const content = response.choices[0].message.content;

      const insightsMatch = content.match(
        /===INSIGHTS===\s*([\s\S]*?)(?====SUGGESTIONS===|===ASSESSMENT===|$)/,
      );
      const suggestionsMatch = content.match(
        /===SUGGESTIONS===\s*([\s\S]*?)(?====INSIGHTS===|===ASSESSMENT===|$)/,
      );
      const assessmentMatch = content.match(
        /===ASSESSMENT===\s*([\s\S]*?)(?====INSIGHTS===|===SUGGESTIONS===|===ROOTCAUSE===|$)/,
      );
      const rootCauseMatch = content.match(
        /===ROOTCAUSE===\s*([\s\S]*?)(?====INSIGHTS===|===SUGGESTIONS===|===ASSESSMENT===|$)/,
      );

      setAIResults({
        insights: insightsMatch
          ? insightsMatch[1].trim()
          : "Failed to generate insights.",
        suggestions: suggestionsMatch
          ? suggestionsMatch[1].trim()
          : "Failed to generate suggestions.",
        assessment: assessmentMatch
          ? assessmentMatch[1].trim()
          : "Failed to generate assessment.",
        rootCause: rootCauseMatch
          ? rootCauseMatch[1].trim()
          : "No root cause analysis generated.",
      });

      toast.success("AI Analysis generated successfully!");
    } catch (err: any) {
      const msg =
        err.message || "An unexpected error occurred during AI generation.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
          Analyzing Data...
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
            System Initialization Failed
          </h3>
          <p className="text-xs font-medium italic mt-0.5 opacity-80">
            Unable to synchronize with the automation dashboard.{" "}
            {error?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Automation Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-8">
            Data-driven intelligence and AI-powered recommendations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => syncData()}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50",
              isSyncing && "animate-pulse",
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Data"}
          </button>

          <button
            onClick={generateAIInsights}
            disabled={aiLoading}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50",
              "btn-ai-hollow text-slate-800 dark:text-white shadow-sm hover:scale-[1.02] active:scale-95",
            )}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary" />
            )}
            {insights ? "Regenerate Analysis" : "Run AI Analysis"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="xl:col-span-2 space-y-8">
          {/* AI Panel */}
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden">
            <div className="flex gap-1 px-4 pt-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("insights")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                  activeTab === "insights"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <Sparkles size={14} />
                Insights
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px",
                  activeTab === "suggestions"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <Lightbulb size={14} />
                Suggestions
              </button>
              <button
                onClick={() => setActiveTab("assessment")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px",
                  activeTab === "assessment"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <ClipboardCheck size={14} />
                Assessment
              </button>
              <button
                onClick={() => setActiveTab("rootCause")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                  activeTab === "rootCause"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <Bug size={14} />
                Root Cause
              </button>
            </div>

            <div className="p-6 min-h-[300px] relative">
              {aiLoading && (
                <div className="absolute inset-0 bg-white/20 dark:bg-surface-card/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
                    Analyzing Data...
                  </p>
                </div>
              )}

              {aiError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-tight">
                    {aiError}
                  </p>
                </div>
              )}

              {!insights && !aiLoading && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/[0.03] via-primary/[0.03] to-amber-500/[0.03] p-4 md:p-8">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
                    <div className="w-12 h-12 bg-white dark:bg-sidebar-bg rounded-full shadow-sm border border-slate-100 dark:border-border-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                      Unlock Strategic AI Insights
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                      Transform raw test results into actionable intelligence.
                      Our AI architect analyzes trends and identifies hidden
                      risks to optimize your release quality.
                    </p>

                    <button
                      onClick={generateAIInsights}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all",
                        "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95",
                        "relative overflow-hidden group/btn",
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate AI Analysis
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    </button>

                    <div className="mt-6 flex items-center gap-4 grayscale opacity-50">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Trend Analysis
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Risk Detection
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-primary" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Smart Suggestions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="prose prose-slate dark:prose-invert max-w-none">
                {activeTab === "insights" && insights && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 mb-4"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {insights}
                    </ReactMarkdown>
                  </div>
                )}
                {activeTab === "suggestions" && suggestions && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 mb-4"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li
                            className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {suggestions}
                    </ReactMarkdown>
                  </div>
                )}
                {activeTab === "assessment" && assessment && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h3: ({ node, ...props }) => (
                          <div className="flex items-center gap-3 mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3
                              className="text-lg font-bold text-primary m-0"
                              {...props}
                            />
                          </div>
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-hidden border border-slate-200 dark:border-border-brand rounded-xl mb-4">
                            <table
                              className="min-w-full divide-y divide-slate-200 dark:divide-border-brand m-0"
                              {...props}
                            />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead
                            className="bg-slate-50 dark:bg-surface-dark"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-border-brand/50"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {assessment}
                    </ReactMarkdown>
                  </div>
                )}
                {activeTab === "rootCause" && rootCause && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 mb-4"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li
                            className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
                            {...props}
                          />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="text-xs italic border-l-4 border-primary/20 pl-4 py-1 text-slate-500 my-4"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {rootCause}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Failing Suites */}
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Failing Suites Snapshot
                </h3>
                <div className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded text-[10px] font-bold uppercase">
                  Critical
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={suites}
                    layout="vertical"
                    margin={{ left: -10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                      opacity={0.3}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="suite"
                      type="category"
                      fontSize={9}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    />
                    <Bar
                      dataKey="failed"
                      fill="#f43f5e"
                      name="Failed"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="broken"
                      fill="#fbbf24"
                      name="Broken"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Stability Trend
                </h3>
                <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold uppercase">
                  Active
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statusBuckets}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="day"
                      fontSize={9}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={9}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#f43f5e",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      name="Failed"
                    />
                    <Line
                      type="monotone"
                      dataKey="passed"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#10b981",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      name="Passed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="flex flex-col gap-8">
          {/* Top Failing Tests */}
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest">
                Impactful Failures
              </h3>
            </div>

            <div className="space-y-4">
              {topFailingTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    All clear
                  </p>
                </div>
              ) : (
                topFailingTests.map((test, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      latest &&
                      navigate(
                        `/automation/runs/${latest.runId}?tab=tests&testName=${encodeURIComponent(test.name)}`,
                      )
                    }
                    className="group p-4 bg-slate-50 dark:bg-sidebar-bg border border-slate-100 dark:border-border-brand rounded-xl hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                          {test.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">
                          {test.suite || "Unknown Suite"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1 shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/50 dark:border-border-brand/50">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">
                          {formatDuration(test.duration)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                          test.status === "failed"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {test.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() =>
                latest &&
                navigate(
                  `/automation/runs/${latest.runId}?tab=tests&filter=failed`,
                )
              }
              className="w-full mt-6 py-3 border border-slate-200 dark:border-border-brand rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-primary/5 transition-all"
            >
              View All Failures
            </button>
          </div>

          {/* Productivity Tip */}
          <div className="bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <Sparkles className="w-12 h-12 text-indigo-500/5 absolute -top-2 -right-2 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                  <Lightbulb
                    size={14}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Pro Tip
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
                Tests failing more than 3 times a day in different runs are
                likely flaky or environmental.
              </p>
              <button
                onClick={() => navigate("/documentation/flaky-tests")}
                className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group/btn"
              >
                Read Best Practices
                <ChevronRight className="w-3 h-3 translate-x-0 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationInsightPage;
