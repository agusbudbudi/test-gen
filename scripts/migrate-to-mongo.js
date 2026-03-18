import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import connectDB from '../server/dashboard/db.js';
import { Run } from '../server/dashboard/models/Run.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '../server/dashboard/data/runs.json');

async function migrate() {
  console.log('--- Starting MongoDB Migration ---');
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Source file not found: ${JSON_PATH}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf8');
    const runs = JSON.parse(raw);
    
    if (!Array.isArray(runs)) {
      console.error('JSON data is not an array.');
      process.exit(1);
    }

    console.log(`Found ${runs.length} runs in JSON. Connecting to MongoDB...`);
    await connectDB();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const runData of runs) {
      const existing = await Run.findOne({ runId: runData.runId });
      
      if (existing) {
        console.log(`[Skipped] Run ${runData.runId} already exists in DB.`);
        skippedCount++;
        continue;
      }

      const run = new Run({
        ...runData,
        createdAt: runData.createdAt || new Date().toISOString()
      });

      await run.save();
      console.log(`[Migrated] Run ${runData.runId} saved.`);
      migratedCount++;
    }

    console.log('--- Migration Summary ---');
    console.log(`Total: ${runs.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
