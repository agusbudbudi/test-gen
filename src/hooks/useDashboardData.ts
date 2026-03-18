import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api/dashboard';

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

export function useDashboardData() {
  const [latest, setLatest] = useState<Run | null>(null);
  const [trend, setTrend] = useState<Run[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [statusBuckets, setStatusBuckets] = useState<any[]>([]);
  const [durationTrend, setDurationTrend] = useState<any[]>([]);
  const [categoriesTrend, setCategoriesTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [runCache, setRunCache] = useState<Map<string, Run>>(new Map());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchData() {
      try {
        const [
          latestRes,
          trendRes,
          suitesRes,
          runsRes,
          statusRes,
          durationRes,
          categoriesRes,
        ] = await Promise.all([
          axios.get(`${API_BASE}/runs/latest`),
          axios.get(`${API_BASE}/metrics/trend`),
          axios.get(`${API_BASE}/metrics/suites`),
          axios.get(`${API_BASE}/runs`),
          axios.get(`${API_BASE}/metrics/status-buckets`),
          axios.get(`${API_BASE}/metrics/duration-trend`),
          axios.get(`${API_BASE}/metrics/categories-trend`),
        ]);

        if (!isMounted) return;
        setLatest(latestRes.data.run || null);
        setTrend(trendRes.data.trend || []);
        setSuites(suitesRes.data.suites || []);
        const runList = runsRes.data.runs || [];
        setRuns(runList);
        setRunCache((prev) => {
          const next = new Map(prev);
          runList.forEach((run: Run) => {
            next.set(run.runId, run);
          });
          if (latestRes.data.run) {
            next.set(latestRes.data.run.runId, latestRes.data.run);
          }
          return next;
        });
        setStatusBuckets(statusRes.data.buckets || []);
        setDurationTrend(durationRes.data.durations || []);
        setCategoriesTrend(categoriesRes.data.categories || []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    latest,
    trend,
    suites,
    runs,
    statusBuckets,
    durationTrend,
    categoriesTrend,
    runCache,
    loading,
    error,
    clearHistory: async () => {
      try {
        await axios.delete(`${API_BASE}/runs`);
        setLatest(null);
        setTrend([]);
        setSuites([]);
        setRuns([]);
        setStatusBuckets([]);
        setDurationTrend([]);
        setCategoriesTrend([]);
        setRunCache(new Map());
        return true;
      } catch (err) {
        console.error("Failed to clear history:", err);
        return false;
      }
    },
  };
}
