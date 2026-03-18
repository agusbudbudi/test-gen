import { Router } from 'express';

export function runsRouter(store) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { from, to, runId } = req.query;
      const filters = {};

      if (from) filters.from = Number(new Date(from));
      if (to) filters.to = Number(new Date(to));
      if (runId) filters.runId = runId;

      const runs = await store.getRuns(filters);
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
      const latest = await store.getLatestRun();
      if (!latest) {
        return res.status(404).json({ error: 'No runs available' });
      }
      res.json({ run: latest });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch latest run' });
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
