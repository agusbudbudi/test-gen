import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(__dirname, "..", "config");

const DEFAULTS = {
  issueType: "Testing Task",
  // Replaces the AI-skill-era "AI-Created" label now that this runs as a
  // plain tool, not an AI session.
  label: "QA-Tool-Created",
  // Field defaults keyed by Jira custom field ID, used ONLY when Jira's
  // create-issue call rejects with a 400 naming that specific field
  // (workflow validators that createmeta doesn't report as required).
  fieldDefaults: {},
};

const PLACEHOLDER_MARKER = "REPLACE_WITH_";

// Drops field defaults still holding REPLACE_WITH_* placeholders, so a create
// that needs them fails with Jira's original "field is required" error
// instead of a confusing invalid-value error on the retry.
function withoutPlaceholders(projectKey, fieldDefaults) {
  const result = {};
  for (const [fieldId, value] of Object.entries(fieldDefaults)) {
    if (JSON.stringify(value).includes(PLACEHOLDER_MARKER)) {
      console.warn(
        `[qaTasks] config/${projectKey}.json: fieldDefaults.${fieldId} is still a placeholder; ignoring it.`
      );
      continue;
    }
    result[fieldId] = value;
  }
  return result;
}

export async function loadProjectConfig(projectKey) {
  const filePath = path.join(CONFIG_DIR, `${projectKey}.json`);
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, fieldDefaults: withoutPlaceholders(projectKey, { ...DEFAULTS.fieldDefaults, ...(parsed.fieldDefaults || {}) }) };
  } catch (err) {
    if (err.code === "ENOENT") {
      return { ...DEFAULTS };
    }
    throw new Error(`Failed to load config/${projectKey}.json: ${err.message}`);
  }
}
