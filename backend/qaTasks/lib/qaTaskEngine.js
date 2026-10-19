// Shared preview/create logic for the "Create QA Tasks" feature.
// Ported from qa-tools/src/qaTaskEngine.js — Slack notification intentionally
// dropped (test-gen has no Slack integration/settings surface yet).

import { parseParentLink } from "./parentLink.js";
import { resolveIssueTypeId } from "./resolveIssueType.js";
import { resolveAssigneeAccountId } from "./resolveAssignee.js";
import { buildTargetTitles, buildBaseFields, TICKET_DEFS } from "./ticketBuilder.js";
import { findExistingTitles, matchExisting } from "./duplicateCheck.js";
import { createTicketWithRetry } from "./createWithRetry.js";

export function ticketDefs() {
  return TICKET_DEFS.map(({ key, prefix }) => ({ key, prefix }));
}

// Resolves the parent, issue type and assignee, and reports — per selected
// ticket key — whether it would be created or already exists. Makes no
// writes.
export async function previewTickets({
  jiraClient,
  env,
  projectConfig,
  parentLink,
  issueTypeName,
  assigneeArg,
  selectedKeys,
}) {
  const { projectKey, parentKey } = parseParentLink(parentLink);

  const parentIssue = await jiraClient.getIssueSummary(parentKey);
  const parentTitle = parentIssue.fields.summary;

  const effectiveIssueTypeName = issueTypeName || projectConfig.issueType;
  const issueTypeId = await resolveIssueTypeId(jiraClient, projectKey, effectiveIssueTypeName);
  const assigneeAccountId = await resolveAssigneeAccountId(jiraClient, assigneeArg);

  const allTargets = buildTargetTitles(parentTitle);
  const targets = selectedKeys
    ? allTargets.filter((t) => selectedKeys.includes(t.key))
    : allTargets;

  const existingIssues = await findExistingTitles(jiraClient, parentKey);

  const items = targets.map((target) => {
    const existing = matchExisting(target.title, existingIssues);
    return {
      key: target.key,
      title: target.title,
      willCreate: !existing,
      existingKey: existing?.key ?? null,
      existingUrl: existing ? `${env.jiraBaseUrl}/browse/${existing.key}` : null,
    };
  });

  return {
    projectKey,
    parentKey,
    parentTitle,
    issueTypeId,
    assigneeAccountId,
    items,
    toCreateCount: items.filter((i) => i.willCreate).length,
    toSkipCount: items.filter((i) => !i.willCreate).length,
  };
}

// Creates whichever items in `items` (from previewTickets) are marked
// willCreate, skips the rest. `items` is re-validated against live Jira
// state by the caller having just called previewTickets immediately before
// — callers should not let significant time pass between preview and execute.
export async function executeTickets({
  jiraClient,
  env,
  logger,
  projectConfig,
  projectKey,
  parentKey,
  issueTypeId,
  assigneeAccountId,
  items,
}) {
  const results = [];

  for (const item of items) {
    if (!item.willCreate) {
      logger?.info(`Skipped (already exists): ${item.existingKey} — ${item.title}`);
      results.push({
        status: "skipped",
        key: item.existingKey,
        title: item.title,
        url: item.existingUrl,
      });
      continue;
    }

    const baseFields = buildBaseFields({
      projectKey,
      issueTypeId,
      title: item.title,
      parentKey,
      label: projectConfig.label,
      assigneeAccountId,
    });

    const { created, filledFromDefaults } = await createTicketWithRetry(
      jiraClient,
      baseFields,
      projectConfig.fieldDefaults
    );
    if (filledFromDefaults.length > 0) {
      logger?.info(
        `Retried create for "${item.title}" after filling required field(s) from config: ${filledFromDefaults.join(", ")}`
      );
    }
    logger?.info(`Created: ${created.key} — ${item.title}`);
    results.push({
      status: "created",
      key: created.key,
      title: item.title,
      url: `${env.jiraBaseUrl}/browse/${created.key}`,
    });
  }

  return { results };
}
