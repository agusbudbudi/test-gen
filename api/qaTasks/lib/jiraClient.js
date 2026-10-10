// Thin Jira REST API v3 client with basic-auth and retry/backoff for 429/5xx.
// Ported from qa-tools/src/jiraClient.js. Non-idempotent requests (POST) are
// only retried on 429, where Jira guarantees nothing was processed; a 5xx or
// dropped connection may mean the issue was already created, so retrying
// could create duplicates.

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

export class JiraApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "JiraApiError";
    this.status = status;
    this.body = body;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class JiraClient {
  constructor({ baseUrl, email, apiToken, logger }) {
    this.baseUrl = baseUrl;
    this.authHeader =
      "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");
    this.logger = logger;
  }

  async request(path, { method = "GET", body, query } = {}) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
      }
    }

    const idempotent = method === "GET";

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let res;
      try {
        res = await fetch(url, {
          method,
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (networkErr) {
        lastError = networkErr;
        if (idempotent && attempt < MAX_ATTEMPTS) {
          await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
          continue;
        }
        throw new JiraApiError(
          `Network error calling Jira (${method} ${path}): ${networkErr.message}`
        );
      }

      if (res.status === 429 || (idempotent && res.status >= 500)) {
        const retryAfter = res.headers.get("retry-after");
        const delay = retryAfter
          ? Number(retryAfter) * 1000
          : BASE_DELAY_MS * 2 ** (attempt - 1);
        if (attempt < MAX_ATTEMPTS) {
          this.logger?.warn(
            `Jira ${method} ${path} returned ${res.status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS})`
          );
          await sleep(delay);
          continue;
        }
      }

      const text = await res.text();
      const json = text ? safeJsonParse(text) : null;

      if (!res.ok) {
        throw new JiraApiError(
          `Jira API error ${res.status} on ${method} ${path}: ${summarizeError(json) || text}`,
          { status: res.status, body: json ?? text }
        );
      }

      return json;
    }

    throw lastError ?? new JiraApiError(`Jira request failed after ${MAX_ATTEMPTS} attempts`);
  }

  get(path, query) {
    return this.request(path, { method: "GET", query });
  }

  post(path, body) {
    return this.request(path, { method: "POST", body });
  }

  async getMyself() {
    return this.get("/rest/api/3/myself");
  }

  async findUserByEmail(email) {
    const users = await this.get("/rest/api/3/user/search", { query: email });
    return users?.[0] ?? null;
  }

  async getIssueSummary(issueKey) {
    return this.get(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
      fields: "summary",
    });
  }

  async getCreateMetaIssueTypes(projectKey) {
    return this.get(
      `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes`
    );
  }

  async getCreateMetaFields(projectKey, issueTypeId) {
    return this.get(
      `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes/${encodeURIComponent(
        issueTypeId
      )}`
    );
  }

  // Jira Cloud removed GET/POST /rest/api/3/search (HTTP 410) in favor of
  // /rest/api/3/search/jql, which pages via nextPageToken instead of
  // startAt/total. See https://developer.atlassian.com/changelog/#CHANGE-2046
  async searchIssues(jql, fields = ["summary"]) {
    const issues = [];
    let nextPageToken;

    for (let page = 0; page < 5; page++) {
      const result = await this.get("/rest/api/3/search/jql", {
        jql,
        fields: fields.join(","),
        maxResults: 50,
        nextPageToken,
      });
      issues.push(...(result.issues || []));
      if (result.isLast !== false || !result.nextPageToken) break;
      nextPageToken = result.nextPageToken;
    }

    return { issues };
  }

  async createIssue(fields) {
    return this.post("/rest/api/3/issue", { fields });
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function summarizeError(json) {
  if (!json) return null;
  const parts = [];
  if (Array.isArray(json.errorMessages) && json.errorMessages.length) {
    parts.push(json.errorMessages.join("; "));
  }
  if (json.errors && Object.keys(json.errors).length) {
    parts.push(
      Object.entries(json.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join("; ")
    );
  }
  return parts.join(" | ") || null;
}
