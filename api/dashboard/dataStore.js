import { Run } from './models/Run.js';
import connectDB from './db.js';

export class DataStore {
  constructor() {
    // We no longer need the local filePath
  }

  async load() {
    await connectDB();
    return await Run.find().sort({ createdAt: -1 }).lean();
  }

  async getRuns(filters = {}) {
    await connectDB();
    const query = {};
    if (filters.runId) query.runId = filters.runId;
    
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) {
        query.createdAt.$gte = new Date(filters.from).toISOString();
      }
      if (filters.to) {
        query.createdAt.$lte = new Date(filters.to).toISOString();
      }
    }

    return await Run.find(query).sort({ createdAt: -1 }).lean();
  }

  async getLatestRun() {
    await connectDB();
    return await Run.findOne().sort({ createdAt: -1 }).lean();
  }

  async getRunById(runId) {
    await connectDB();
    return await Run.findOne({ runId }).lean();
  }

  async getTrendData(limit = 30) {
    await connectDB();
    const runs = await Run.find()
      .select('runId createdAt summary')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return runs;
  }

  async getSuiteBreakdown(limit = 10) {
    const latest = await this.getLatestRun();
    if (!latest) return [];
    return latest.suites.slice(0, limit);
  }

  async getTestDetails(runId, status) {
    const run = await this.getRunById(runId);
    if (!run) return [];
    return run.tests.filter((test) => {
      if (!status) return true;
      return test.status === status;
    });
  }

  async save(runData) {
    await connectDB();
    try {
      // Find and update if runId exists, otherwise create new
      // { upsert: true, new: true }
      await Run.findOneAndUpdate(
        { runId: runData.runId },
        { 
          ...runData,
          createdAt: runData.createdAt || new Date().toISOString()
        },
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error('Failed to save to MongoDB:', error.message);
      return false;
    }
  }

  async clear() {
    await connectDB();
    try {
      await Run.deleteMany({});
      return true;
    } catch (error) {
      console.error('Failed to clear MongoDB collection:', error.message);
      return false;
    }
  }
}

export function aggregateStatusBuckets(runs) {
  const buckets = [];
  const byDay = new Map();

  runs.forEach((run) => {
    const day = new Date(run.createdAt).toISOString().split('T')[0];
    if (!byDay.has(day)) {
      byDay.set(day, { day, total: 0, failed: 0, broken: 0, passed: 0 });
    }
    const bucket = byDay.get(day);
    bucket.total += run.summary?.total || 0;
    bucket.failed += run.summary?.failed || 0;
    bucket.broken += run.summary?.broken || 0;
    bucket.passed += run.summary?.passed || 0;
  });

  for (const value of byDay.values()) {
    buckets.push(value);
  }

  return buckets.sort((a, b) => new Date(a.day) - new Date(b.day));
}
