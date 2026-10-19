// Finds which of the 5 target titles already exist as children of the parent,
// so the create step can skip them and stay idempotent.
// Ported from qa-tools/src/duplicateCheck.js — unchanged.

export async function findExistingTitles(jiraClient, parentKey) {
  const jql = `parent = "${parentKey}" AND summary ~ "QA -"`;
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
