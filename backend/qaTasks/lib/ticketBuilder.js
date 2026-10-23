// Builds the 7 standard QA ticket titles and their Jira create-issue fields.
// Titles must use the parent's summary verbatim (no paraphrasing).
// Ported from qa-tools/src/ticketBuilder.js, plus the Sandbox Test Execution and
// Automation Script Development tickets.

export const TICKET_DEFS = [
  { key: "create-test-case", prefix: "QA - Create Test Case" },
  { key: "sandbox-test-execution", prefix: "QA - Sandbox Test Execution" },
  { key: "staging-test-execution", prefix: "QA - Staging Test Execution" },
  { key: "pre-release-test-execution", prefix: "QA - Pre-Release Test Execution" },
  { key: "production-test-execution", prefix: "QA - Production Test Execution" },
  { key: "uat", prefix: "QA - UAT" },
  { key: "automation-script-development", prefix: "QA - Automation Script Development" },
];

export function buildTargetTitles(parentTitle) {
  return TICKET_DEFS.map((def) => ({
    ...def,
    title: `${def.prefix} ${parentTitle}`,
  }));
}

export function buildBaseFields({
  projectKey,
  issueTypeId,
  title,
  parentKey,
  label,
  assigneeAccountId,
}) {
  return {
    project: { key: projectKey },
    issuetype: { id: issueTypeId },
    summary: title,
    parent: { key: parentKey },
    labels: [label],
    assignee: { id: assigneeAccountId },
    // Intentionally omitted: description. Leaving the key out keeps the
    // ticket description empty without sending a value Jira's ADF field
    // would reject.
  };
}
