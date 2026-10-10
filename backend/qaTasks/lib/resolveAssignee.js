// Resolves the assignee (email or accountId) or falls back to the user
// whose Jira credentials are in use.
// Ported from qa-tools/src/resolveAssignee.js — unchanged.
export async function resolveAssigneeAccountId(jiraClient, assigneeArg) {
  if (!assigneeArg) {
    const me = await jiraClient.getMyself();
    return me.accountId;
  }

  if (assigneeArg.includes("@")) {
    const user = await jiraClient.findUserByEmail(assigneeArg);
    if (!user) {
      throw new Error(`No Jira user found for email "${assigneeArg}".`);
    }
    return user.accountId;
  }

  // Assume it's already an accountId.
  return assigneeArg;
}
