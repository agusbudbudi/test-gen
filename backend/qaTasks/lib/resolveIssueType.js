// Ported from qa-tools/src/resolveIssueType.js — unchanged.

export class IssueTypeNotFoundError extends Error {
  constructor(projectKey, issueTypeName) {
    super(
      `Project "${projectKey}" does not have an issue type named "${issueTypeName}". ` +
        `Pick an alternative — this tool will not silently substitute a different issue type.`
    );
    this.name = "IssueTypeNotFoundError";
  }
}

export async function resolveIssueTypeId(jiraClient, projectKey, issueTypeName) {
  const { issueTypes } = await jiraClient.getCreateMetaIssueTypes(projectKey);
  const match = (issueTypes || []).find(
    (t) => t.name.toLowerCase() === issueTypeName.toLowerCase()
  );
  if (!match) {
    throw new IssueTypeNotFoundError(projectKey, issueTypeName);
  }
  return match.id;
}
