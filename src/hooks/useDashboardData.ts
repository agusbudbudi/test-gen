import { useEffect, useState } from 'react';
import axios from 'axios';
import { useDashboardStore, Run } from '@/stores/dashboardStore';

const API_BASE = '/api/dashboard';

export function useDashboardData() {
  const {
    latest,
    trend,
    suites,
    runs,
    statusBuckets,
    durationTrend,
    categoriesTrend,
    lastSync,
    isInitialLoaded,
    setData,
    clearData: clearStore
  } = useDashboardStore();

  const [loading, setLoading] = useState(!isInitialLoaded);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<any>(null);
  const [runCache, setRunCache] = useState<Map<string, Run>>(new Map());

  // Update local runCache when runs change
  useEffect(() => {
    const next = new Map();
    runs.forEach((run) => next.set(run.runId, run));
    if (latest) next.set(latest.runId, latest);
    setRunCache(next);
  }, [runs, latest]);

  useEffect(() => {
    let isMounted = true;
    
    // If already loaded, don't show loading spinner but still refresh in background if needed
    // For now, if loaded, we skip the initial fetch to make transitions instant
    if (isInitialLoaded) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/runs/all`);
        
        if (!isMounted) return;
        
        setData(res.data);
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
  }, [isInitialLoaded, setData]);

  const syncData = async () => {
    setIsSyncing(true);
    try {
      const res = await axios.post(`${API_BASE}/sync`);
      if (res.data.ok) {
        setData(res.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Manual sync failed:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

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
    isSyncing,
    lastSync,
    error,
    syncData,
    clearHistory: async () => {
      try {
        await axios.delete(`${API_BASE}/runs`);
        clearStore();
        return true;
      } catch (err) {
        console.error("Failed to clear history:", err);
        return false;
      }
    },
  };
}
