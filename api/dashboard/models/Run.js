import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema({
  name: String,
  status: String,
  duration: Number,
  error: String,
  stack: String,
  suite: String,
  story: String,
  feature: String,
  parentSuite: String,
  filePath: String,
  fullName: String,
  severity: String,
  owner: String,
  tags: [String],
  description: String,
  statusDetails: mongoose.Schema.Types.Mixed,
  parameters: [mongoose.Schema.Types.Mixed],
  executionInfo: mongoose.Schema.Types.Mixed,
  attachments: [mongoose.Schema.Types.Mixed],
  steps: [mongoose.Schema.Types.Mixed],
  screenshots: [String],
  video: String,
  meta: mongoose.Schema.Types.Mixed
});

const SuiteSchema = new mongoose.Schema({
  title: String,
  suite: String,
  parentSuite: String,
  total: Number,
  passed: Number,
  failed: Number,
  broken: Number,
  skipped: Number,
  duration: Number,
  tests: [TestSchema]
});

const RunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  summary: {
    total: Number,
    passed: Number,
    failed: Number,
    broken: Number,
    skipped: Number,
    duration: Number,
    passRate: Number,
    status: String
  },
  suites: [SuiteSchema],
  tests: [TestSchema], // Denormalized for easier querying
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexing for faster lookups
RunSchema.index({ createdAt: -1 });

export const Run = mongoose.models.Run || mongoose.model('Run', RunSchema);
