import { Router } from 'express';

export function runsRouter(store) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { from, to, runId } = req.query;
      
      // If filtering, we always query DB for accuracy
      if (from || to || runId) {
        const filters = {};
        if (from) filters.from = Number(new Date(from));
        if (to) filters.to = Number(new Date(to));
        if (runId) filters.runId = runId;

        const runs = await store.getRuns(filters);
        return res.json({ runs });
      }

      // Default (no filters): Try cache first
      const cache = await store.getCache('dashboard_metrics');
      if (cache && cache.data && cache.data.runs) {
        return res.json({ runs: cache.data.runs, cached: true });
      }

      // Fallback to DB
      const runs = await store.getRuns();
      res.json({ runs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve runs' });
    }
  });

  router.delete('/', async (req, res) => {
    try {
      await store.clear();
      res.json({ ok: true, message: 'All run history cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear run history' });
    }
  });

  router.get('/latest', async (req, res) => {
    try {
      // Try cache first
      const cache = await store.getCache('dashboard_metrics');
      if (cache && cache.data && cache.data.latest) {
        return res.json({ run: cache.data.latest, cached: true });
      }

      const latest = await store.getLatestRun();
      if (!latest) {
        return res.status(404).json({ error: 'No runs available' });
      }
      res.json({ run: latest });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch latest run' });
    }
  });

  router.get('/all', async (req, res) => {
    try {
      let cache = await store.getCache('dashboard_metrics');
      
      // If no cache yet, trigger first sync
      if (!cache || !cache.data) {
        console.log('[Cache] Initializing cache on /all request...');
        const freshData = await store.syncDashboardCache();
        return res.json({ ...freshData, cached: false });
      }

      res.json({ ...cache.data, cached: true });
    } catch (error) {
      console.error('[Cache] Error fetching all metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  router.post('/sync', async (req, res) => {
    try {
      const freshData = await store.syncDashboardCache();
      res.json({ ok: true, data: freshData });
    } catch (error) {
      console.error('[Sync] Error:', error);
      res.status(500).json({ error: 'Failed to synchronize dashboard data' });
    }
  });

  router.get('/:runId/tests', async (req, res) => {
    try {
      const { runId } = req.params;
      const { status } = req.query;
      const tests = await store.getTestDetails(runId, status);
      res.json({ tests });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test details' });
    }
  });

  router.get('/:runId', async (req, res) => {
    try {
      const { runId } = req.params;
      const run = await store.getRunById(runId);
      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }
      res.json({ run });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch run' });
    }
  });

  return router;
}
