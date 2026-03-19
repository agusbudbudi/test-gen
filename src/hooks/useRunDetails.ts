import { useEffect, useState } from 'react';
import axios from 'axios';
import { Run } from '@/stores/dashboardStore';

const API_BASE = '/api/dashboard';

export function useRunDetails(runId?: string, initialRun?: Run) {
  const [run, setRun] = useState<Run | null>(initialRun || null);
  const [loading, setLoading] = useState(!initialRun);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRun() {
      if (!runId || initialRun) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/runs/${encodeURIComponent(runId)}`);
        if (!isMounted) return;
        setRun(response.data.run || null);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRun();

    return () => {
      isMounted = false;
    };
  }, [runId, initialRun]);

  return { run: initialRun || run, loading: !initialRun && loading, error };
}
