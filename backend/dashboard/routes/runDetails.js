import { Router } from 'express';

export function runDetailsRouter(store) {
  const router = Router();

  router.get('/:runId', async (req, res) => {
    try {
      const { runId } = req.params;
      const run = await store.getRunById(runId);
      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }
      res.json({ run });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch run details' });
    }
  });

  return router;
}
