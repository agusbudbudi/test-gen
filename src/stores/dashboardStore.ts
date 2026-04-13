import { create } from 'zustand';

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  passRate: number;
  duration: number;
}

export interface Run {
  runId: string;
  createdAt: string;
  summary: RunSummary;
  tests: any[];
  suites: any[];
}

interface DashboardState {
  latest: Run | null;
  trend: Run[];
  suites: any[];
  runs: Run[];
  statusBuckets: any[];
  durationTrend: any[];
  categoriesTrend: any[];
  lastSync: string | null;
  isInitialLoaded: boolean;
  
  // AI Insights Cache
  aiInsights: string;
  aiSuggestions: string;
  aiAssessment: string;
  aiRootCause: string;
  
  // Actions
  setData: (data: any) => void;
  setInitialLoaded: (loaded: boolean) => void;
  setAIResults: (results: { insights?: string; suggestions?: string; assessment?: string; rootCause?: string }) => void;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  latest: null,
  trend: [],
  suites: [],
  runs: [],
  statusBuckets: [],
  durationTrend: [],
  categoriesTrend: [],
  lastSync: null,
  isInitialLoaded: false,
  aiInsights: '',
  aiSuggestions: '',
  aiAssessment: '',
  aiRootCause: '',

  setData: (data) => {
    // runId is an ISO timestamp string (e.g. "2026-04-13T03:40:22.821Z")
    // which sorts correctly lexicographically. createdAt is a human-readable
    // string ("Mon Apr 13 2026...") that CANNOT be sorted as a string.
    const sortLatestFirst = (a: Run, b: Run) =>
      b.runId > a.runId ? 1 : b.runId < a.runId ? -1 : 0;

    const sortByRunId = (a: { runId: string }, b: { runId: string }) =>
      b.runId > a.runId ? 1 : b.runId < a.runId ? -1 : 0;

    const sortedRuns = (data.runs || []).sort(sortLatestFirst);
    const sortedTrend = (data.trend || []).sort(sortLatestFirst);

    // Always derive latest from sorted runs — never trust the cache's pre-computed
    // `latest` field which may have been built with a stale/wrong sort key.
    const derivedLatest = sortedRuns.length > 0 ? sortedRuns[0] : null;

    // Also re-sort the pre-sliced server arrays so chart .reverse() is correct
    const sortedDurations = (data.durations || []).sort(sortByRunId);
    const sortedCategories = (data.categories || []).sort(sortByRunId);

    set({
      latest: derivedLatest,
      trend: sortedTrend,
      suites: data.suites || [],
      runs: sortedRuns,
      statusBuckets: data.buckets || [],
      durationTrend: sortedDurations,
      categoriesTrend: sortedCategories,
      lastSync: data.lastSync || null,
      isInitialLoaded: true,
    });
  },

  setInitialLoaded: (loaded) => set({ isInitialLoaded: loaded }),
  
  setAIResults: (results) => set((state) => ({
    aiInsights: results.insights ?? state.aiInsights,
    aiSuggestions: results.suggestions ?? state.aiSuggestions,
    aiAssessment: results.assessment ?? state.aiAssessment,
    aiRootCause: results.rootCause ?? state.aiRootCause,
  })),

  clearData: () => set({
    latest: null,
    trend: [],
    suites: [],
    runs: [],
    statusBuckets: [],
    durationTrend: [],
    categoriesTrend: [],
    lastSync: null,
    isInitialLoaded: false,
  }),
}));
