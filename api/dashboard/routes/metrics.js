import { Router } from 'express';
import { aggregateStatusBuckets } from '../dataStore.js';

export function metricsRouter(store) {
  const router = Router();

  router.get('/trend', async (req, res) => {
    try {
      const limit = Number(req.query.limit || 30);
      const data = await store.getTrendData(limit);
      res.json({ trend: data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load trend data' });
    }
  });

  router.get('/suites', async (req, res) => {
    try {
      const limit = Number(req.query.limit || 10);
      const suites = await store.getSuiteBreakdown(limit);
      res.json({ suites });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load suite breakdown' });
    }
  });

  router.get('/status-buckets', async (req, res) => {
    try {
      const limit = Number(req.query.limit || 30);
      const runs = await store.getTrendData(limit);
      const buckets = aggregateStatusBuckets(runs);
      res.json({ buckets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load status buckets' });
    }
  });

  router.get('/duration-trend', async (req, res) => {
    try {
      const limit = Number(req.query.limit || 10);
      const runs = await store.getTrendData(limit);
      const durations = runs.map((run) => ({
        runId: run.runId,
        createdAt: run.createdAt,
        duration: run.summary?.duration || 0,
      }));
      res.json({ durations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load duration trend' });
    }
  });

  router.get('/categories-trend', async (req, res) => {
    try {
      const limit = Number(req.query.limit || 10);
      const runs = await store.getTrendData(limit);
      const categories = runs.map((run) => ({
        runId: run.runId,
        createdAt: run.createdAt,
        failed: run.summary?.failed || 0,
        broken: run.summary?.broken || 0,
        passed: run.summary?.passed || 0,
      }));
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load categories trend' });
    }
  });

  return router;
}
