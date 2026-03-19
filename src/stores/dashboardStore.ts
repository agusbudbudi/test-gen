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

  setData: (data) => set({
    latest: data.latest || null,
    trend: data.trend || [],
    suites: data.suites || [],
    runs: data.runs || [],
    statusBuckets: data.buckets || [],
    durationTrend: data.durations || [],
    categoriesTrend: data.categories || [],
    lastSync: data.lastSync || null,
    isInitialLoaded: true,
  }),

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
