import express from "express";

import { JiraClient, JiraApiError } from "./lib/jiraClient.js";
import { loadProjectConfig } from "./lib/projectConfig.js";
import { parseParentLink, InvalidLinkError } from "./lib/parentLink.js";
import { IssueTypeNotFoundError } from "./lib/resolveIssueType.js";
import { previewTickets, executeTickets, ticketDefs } from "./lib/qaTaskEngine.js";
import { notifySlack } from "./lib/slackNotify.js";

export const qaTasksRouter = express.Router();

// Maps a thrown error to an HTTP status + message, mirroring qa-tools'
// src/server.js error handling.
function errorStatusAndMessage(err) {
  if (err instanceof InvalidLinkError || err instanceof IssueTypeNotFoundError) {
    return { status: 400, message: err.message };
  }
  if (err instanceof JiraApiError) {
    // Auth/not-found/validation errors from Jira are the caller's to fix,
    // not a server bug — surface them as 4xx when Jira itself said 4xx.
    const status = err.status && err.status < 500 ? err.status : 502;
    return { status, message: err.message };
  }
  return { status: 500, message: err.message || "Unexpected server error." };
}

// Credentials + parentLink/selectedKeys are supplied per-request from the
// client's Settings → Jira store (test-gen has no server-side Jira
// credentials, unlike the original qa-tools CLI which read them from .env).
function buildJiraContext(body) {
  const { jiraUrl, jiraEmail, jiraToken } = body || {};
  if (!jiraUrl || !jiraEmail || !jiraToken) {
    throw new InvalidLinkError(
      "Missing Jira credentials. Configure Settings → Jira first."
    );
  }

  const baseUrl = String(jiraUrl).trim().replace(/\/+$/, "");
  const env = { jiraBaseUrl: baseUrl };
  const jiraClient = new JiraClient({
    baseUrl,
    email: String(jiraEmail).trim(),
    apiToken: String(jiraToken).trim(),
  });

  return { env, jiraClient };
}

qaTasksRouter.get("/ticket-defs", (req, res) => {
  res.json({ ticketDefs: ticketDefs() });
});

qaTasksRouter.post("/issue-types", async (req, res) => {
  try {
    const { parentLink } = req.body || {};
    if (!parentLink) throw new InvalidLinkError("parentLink is required.");

    const { jiraClient } = buildJiraContext(req.body);
    const { projectKey } = parseParentLink(parentLink);
    const { issueTypes } = await jiraClient.getCreateMetaIssueTypes(projectKey);

    res.json({
      projectKey,
      issueTypes: (issueTypes || [])
        .map((t) => t.name)
        .sort((a, b) => a.localeCompare(b)),
    });
  } catch (err) {
    const { status, message } = errorStatusAndMessage(err);
    res.status(status).json({ error: message });
  }
});

qaTasksRouter.post("/preview", async (req, res) => {
  try {
    const { parentLink, issueType, assignee, selectedKeys } = req.body || {};
    if (!parentLink) throw new InvalidLinkError("parentLink is required.");
    if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
      throw new InvalidLinkError("Select at least one ticket type.");
    }

    const { env, jiraClient } = buildJiraContext(req.body);
    const { projectKey } = parseParentLink(parentLink);
    const projectConfig = await loadProjectConfig(projectKey);

    const preview = await previewTickets({
      jiraClient,
      env,
      projectConfig,
      parentLink,
      issueTypeName: issueType || undefined,
      assigneeArg: assignee || undefined,
      selectedKeys,
    });

    res.json(preview);
  } catch (err) {
    const { status, message } = errorStatusAndMessage(err);
    res.status(status).json({ error: message });
  }
});

qaTasksRouter.post("/create", async (req, res) => {
  try {
    const {
      parentLink,
      issueType,
      assignee,
      selectedKeys,
      slackEnabled,
      slackBotToken,
      slackChannel,
    } = req.body || {};
    if (!parentLink) throw new InvalidLinkError("parentLink is required.");
    if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
      throw new InvalidLinkError("Select at least one ticket type.");
    }

    const { env, jiraClient } = buildJiraContext(req.body);
    const { projectKey } = parseParentLink(parentLink);
    const projectConfig = await loadProjectConfig(projectKey);

    // Re-resolve against live Jira state right before writing, rather than
    // trusting whatever the browser cached from an earlier preview —
    // avoids acting on stale duplicate-check results.
    const preview = await previewTickets({
      jiraClient,
      env,
      projectConfig,
      parentLink,
      issueTypeName: issueType || undefined,
      assigneeArg: assignee || undefined,
      selectedKeys,
    });

    const { results } = await executeTickets({
      jiraClient,
      env,
      projectConfig,
      projectKey: preview.projectKey,
      parentKey: preview.parentKey,
      issueTypeId: preview.issueTypeId,
      assigneeAccountId: preview.assigneeAccountId,
      items: preview.items,
    });

    // Never block the response on Slack — tickets are already created by
    // this point, so a Slack hiccup is reported as a warning, not an error.
    const slack = slackEnabled
      ? await notifySlack({
          botToken: slackBotToken,
          channel: slackChannel,
          parentKey: preview.parentKey,
          parentTitle: preview.parentTitle,
          results,
        })
      : { sent: false, reason: "Slack notifications disabled." };

    res.json({
      parentKey: preview.parentKey,
      parentTitle: preview.parentTitle,
      results,
      slack,
    });
  } catch (err) {
    const { status, message } = errorStatusAndMessage(err);
    res.status(status).json({ error: message });
  }
});
