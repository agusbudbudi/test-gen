import path from 'path';
import { Run } from './models/Run.js';
import connectDB from './db.js';
import { uploadToBlob } from './blobService.js';

const ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || "/Users/agudbudiman/Documents/automation-diricare/healthapp-web-automation/allure-results";

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

  _reconstructSuites(runData) {
    if (!runData.tests || runData.tests.length === 0) return runData.suites || [];

    const suiteMap = new Map();
    
    runData.tests.forEach(test => {
      const key = `${test.parentSuite || ''}|${test.suite || ''}`;
      if (!suiteMap.has(key)) {
        suiteMap.set(key, {
          suite: test.suite,
          parentSuite: test.parentSuite,
          title: test.suite, // For backward compatibility
          total: 0,
          passed: 0,
          failed: 0,
          broken: 0,
          skipped: 0,
          duration: 0,
          tests: []
        });
      }
      const stats = suiteMap.get(key);
      stats.total++;
      if (test.status === 'passed') stats.passed++;
      else if (test.status === 'failed') stats.failed++;
      else if (test.status === 'broken') stats.broken++;
      else if (test.status === 'skipped') stats.skipped++;
      stats.duration += (test.duration || 0);
    });

    return Array.from(suiteMap.values());
  }

  async _processAttachments(runData) {
    if (!process.env.BLOB_READ_WRITE_TOKEN || !runData.tests) return;

    console.log(`[Blob] Checking attachments for Run ${runData.runId}...`);
        for (const test of runData.tests) {
      if (test.attachments && test.attachments.length > 0) {
        for (const att of test.attachments) {
          // Only upload if it's a local filename AND it's an image
          const isImage = att.type?.startsWith("image/");
          if (att.source && !att.source.startsWith("http") && isImage) {
            const localPath = path.join(ALLURE_RESULTS_DIR, att.source);
            const blobUrl = await uploadToBlob(localPath, `allure-results/${att.source}`);
            if (blobUrl) {
              console.log(`[Blob] Updated attachment ${att.name} to ${blobUrl}`);
              att.source = blobUrl;
            }
          }
        }
      }
    }
  }

  async save(runData) {
    await connectDB();
    try {
      // Process attachments (Upload to Vercel Blob if available)
      await this._processAttachments(runData);

      // Reconstruct suites if they are missing names or to ensure consistency
      const suites = this._reconstructSuites(runData);
      
      await Run.findOneAndUpdate(
        { runId: runData.runId },
        { 
          ...runData,
          suites,
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
