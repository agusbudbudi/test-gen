import { JiraApiError } from "./jiraClient.js";

// Jira metadata's `required: true` is known to be incomplete for some
// projects (e.g. REIN), which enforce extra fields via workflow validators
// at create time instead. Rather than hardcoding those fields, this
// attempts a create with the base fields, and if Jira's 400 response names
// specific missing fields that we have configured defaults for, fills those
// in and retries exactly once.
// Ported from qa-tools/src/createWithRetry.js — unchanged.
export async function createTicketWithRetry(jiraClient, baseFields, fieldDefaults) {
  try {
    const created = await jiraClient.createIssue(baseFields);
    return { created, filledFromDefaults: [] };
  } catch (err) {
    if (!(err instanceof JiraApiError) || err.status !== 400) {
      throw err;
    }

    const missingFieldIds = Object.keys(err.body?.errors || {});
    const fillable = missingFieldIds.filter((id) => id in fieldDefaults);

    if (fillable.length === 0) {
      throw err;
    }

    const retryFields = { ...baseFields };
    for (const fieldId of fillable) {
      retryFields[fieldId] = fieldDefaults[fieldId];
    }

    const created = await jiraClient.createIssue(retryFields);
    return { created, filledFromDefaults: fillable };
  }
}
