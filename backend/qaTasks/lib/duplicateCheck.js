// Finds which of the target titles already exist as children of the parent,
// so the create step can skip them and stay idempotent.
// Ported from qa-tools/src/duplicateCheck.js.

export async function findExistingTitles(jiraClient, parentKey) {
  // Fetches every child and leaves matching to matchExisting's exact title
  // compare. A `summary ~ "QA -"` filter here silently matched nothing (Jira
  // text search doesn't treat the "-" literally), which let re-runs create
  // duplicates.
  const jql = `parent = "${parentKey}"`;
  const result = await jiraClient.searchIssues(jql, ["summary"]);
  const issues = result?.issues || [];
  return issues.map((issue) => ({
    key: issue.key,
    title: (issue.fields?.summary || "").trim(),
  }));
}

export function matchExisting(targetTitle, existingIssues) {
  return existingIssues.find((issue) => issue.title === targetTitle.trim()) ?? null;
}
