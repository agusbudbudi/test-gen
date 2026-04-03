import 'dotenv/config';
import express from 'express';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { DataStore } from './dashboard/dataStore.js';
import { runsRouter } from './dashboard/routes/runs.js';
import { metricsRouter } from './dashboard/routes/metrics.js';
import { runDetailsRouter } from './dashboard/routes/runDetails.js';
import { linksRouter } from './links/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "50mb" })); // Increased limit for large Cypress test suites

const dashboardStore = new DataStore();

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Proxy endpoint to OpenAI Chat Completions
app.post("/api/chat", async (req, res) => {
  try {
    // Check for API key in header first (from client UI), then fallback to .env
    let apiKey = process.env.OPENAI_API_KEY;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const clientKey = authHeader.split(' ')[1];
      if (clientKey && clientKey.trim() !== '' && clientKey !== 'undefined') {
        apiKey = clientKey;
      }
    }

    if (!apiKey) {
      return res.status(500).json({ error: "Server missing OPENAI_API_KEY. Please set it in .env or via the UI." });
    }

    const payload = req.body || {};
    if (!payload || !payload.model || !Array.isArray(payload.messages)) {
      return res
        .status(400)
        .json({ error: "Invalid payload: expected { model, messages, ... }" });
    }

    // Initialize Provider setup
    const isAnthropic = payload.provider === 'anthropic';
    const cleanPayload = { ...payload };
    delete cleanPayload.provider;

    if (isAnthropic) {
      const anthropicMessages = [];
      let systemPrompt = "";
      for (const m of cleanPayload.messages) {
        if (m.role === 'system') {
          systemPrompt += m.content + "\n";
        } else {
          anthropicMessages.push(m);
        }
      }

      const anthropicPayload = {
        model: cleanPayload.model,
        max_tokens: 8192,
        messages: anthropicMessages,
        ...(systemPrompt ? { system: systemPrompt.trim() } : {}),
        stream: cleanPayload.stream,
        ...(cleanPayload.temperature !== undefined ? { temperature: cleanPayload.temperature } : {})
      };

      if (cleanPayload.stream) {
        console.log('Starting Anthropic stream for model:', cleanPayload.model);
        const r = await axios.post(
          "https://api.anthropic.com/v1/messages",
          anthropicPayload,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01"
            },
            responseType: 'stream',
            timeout: 60000,
          }
        );

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        let buffer = '';
        r.data.on('data', (chunk) => {
          buffer += chunk.toString();
          let parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          
          for (const part of parts) {
            if (part.includes('event: content_block_delta') || part.includes('event: content_block_start')) {
              const dataLine = part.split('\n').find(l => l.startsWith('data: '));
              if (dataLine) {
                try {
                  const dataObj = JSON.parse(dataLine.substring(6));
                  // Extract text from text_delta or message_start content block empty string
                  const text = dataObj.delta?.text || dataObj.content_block?.text || '';
                  if (text) {
                    res.write(`data: ${JSON.stringify({choices:[{delta:{content: text}}]})}\n\n`);
                  }
                } catch(e) {}
              }
            } else if (part.includes('event: message_stop')) {
              res.write(`data: [DONE]\n\n`);
            }
          }
        });

        r.data.on('end', () => {
          res.write(`data: [DONE]\n\n`);
          res.end();
        });

        r.data.on('error', (err) => {
          console.error('Anthropic stream error:', err);
          if (!res.headersSent) {
            res.status(500).end();
          } else {
            res.end();
          }
        });
        return;
      }

      // Non-streaming Anthropic
      const r = await axios.post(
        "https://api.anthropic.com/v1/messages",
        anthropicPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          timeout: 60000,
        }
      );

      return res.status(200).json({
        choices: [
          {
            message: {
              content: r.data.content?.[0]?.text || ''
            }
          }
        ]
      });
    }

    // Handle OpenAI
    // Handle streaming
    if (cleanPayload.stream) {
      console.log('Starting AI stream for model:', cleanPayload.model);
      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        cleanPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: 'stream',
          timeout: 60000,
        }
      );

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in Nginx if any
      
      r.data.on('data', (chunk) => {
        res.write(chunk);
      });

      r.data.on('end', () => {
        res.end();
      });

      r.data.on('error', (err) => {
        console.error('OpenAI stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });
      return;
    }

    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      cleanPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    res.status(r.status).json(r.data);
  } catch (e) {
    if (e.response && e.response.data && typeof e.response.data.on === 'function') {
      // In stream mode, error might be in the stream
      res.status(500).json({ error: "Stream error" });
      return;
    }
    if (e.response) {
      // Forward OpenAI error details if available
      return res.status(e.response.status).json(e.response.data);
    }
    res
      .status(500)
      .json({
        error: "Proxy error",
        details: String(e && e.message ? e.message : e),
      });
  }
});

// Proxy endpoint to create a Jira issue
app.post("/api/jira/issue", async (req, res) => {
  try {
    const { 
      jiraUrl, email, token, projectKey, summary, description,
      linkedIssueKey, linkType, // Optional for linking
      issueType // Optional issue type
    } = req.body || {};

    if (!jiraUrl || !email || !token || !projectKey || !summary) {
      return res.status(400).json({ error: "Missing required fields: jiraUrl, email, token, projectKey, summary" });
    }

    // Build Basic Auth header
    const credentials = Buffer.from(`${email}:${token}`).toString("base64");

    // If description is already an ADF object (has type: 'doc'), use it directly.
    // Otherwise, convert plain-text to ADF.
    let adfDescription = description;
    
    if (!description || typeof description !== 'object' || description.type !== 'doc') {
      adfDescription = {
        version: 1,
        type: "doc",
        content: (String(description || ""))
          .split(/\n+/)
          .filter((line) => line.trim() !== "")
          .map((line) => ({
            type: "paragraph",
            content: [{ type: "text", text: line }],
          })),
      };

      if (adfDescription.content.length === 0) {
        adfDescription.content = [{ type: "paragraph", content: [{ type: "text", text: " " }] }];
      }
    }

    const finalIssueType = issueType || "Feedback";
    const label = `testgen-auto-created-${finalIssueType.toLowerCase()}`;

    const payload = {
      fields: {
        project: { key: projectKey },
        summary,
        description: adfDescription,
        issuetype: { name: finalIssueType },
        labels: [label],
      },
    };

    // Add Issue Linking if requested
    if (linkedIssueKey && linkType) {
      let linkName = "Relates";
      let linkDirection = "outwardIssue";
      
      if (linkType === "blocks") {
        linkName = "Blocks";
        linkDirection = "outwardIssue";
      } else if (linkType === "is blocked by") {
        linkName = "Blocks";
        linkDirection = "inwardIssue";
      } else if (linkType === "relates to") {
        linkName = "Relates";
        linkDirection = "outwardIssue";
      }

      payload.update = {
        issuelinks: [
          {
            add: {
              type: { name: linkName },
              [linkDirection]: { key: linkedIssueKey }
            }
          }
        ]
      };
    }

    const baseUrl = jiraUrl.replace(/\/$/, "");
    const r = await axios.post(`${baseUrl}/rest/api/3/issue`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const issueKey = r.data.key;
    res.status(201).json({
      key: issueKey,
      url: `${baseUrl}/browse/${issueKey}`,
    });
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        error: "Jira API error",
        details: e.response.data,
      });
    }
    res.status(500).json({
      error: "Proxy error",
      details: String(e && e.message ? e.message : e),
      });
  }
});

// Proxy endpoint to GET a Jira issue by key (used by the Jira URL import feature)
app.get("/api/jira/issue/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { jiraUrl, email, token } = req.query;

    if (!jiraUrl || !email || !token) {
      return res.status(400).json({ error: "Missing required query params: jiraUrl, email, token" });
    }

    const credentials = Buffer.from(`${email}:${token}`).toString("base64");
    const baseUrl = String(jiraUrl).replace(/\/$/, "");

    const r = await axios.get(`${baseUrl}/rest/api/3/issue/${key}?fields=summary,description`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      timeout: 15000,
    });

    res.status(200).json(r.data);
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        error: "Jira API error",
        details: e.response.data,
      });
    }
    res.status(500).json({
      error: "Proxy error",
      details: String(e && e.message ? e.message : e),
    });
  }
});

// Proxy endpoint to Search Jira users (to resolve email to accountId)
app.get("/api/jira/user/search", async (req, res) => {
  try {
    const { query, jiraUrl, email, token } = req.query;

    if (!query || !jiraUrl || !email || !token) {
      return res.status(400).json({ error: "Missing required query params: query, jiraUrl, email, token" });
    }

    const credentials = Buffer.from(`${email}:${token}`).toString("base64");
    const baseUrl = String(jiraUrl).replace(/\/$/, "");

    const r = await axios.get(`${baseUrl}/rest/api/3/user/search`, {
      params: { query },
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      timeout: 10000,
    });

    res.status(200).json(r.data);
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        error: "Jira API error",
        details: e.response.data,
      });
    }
    res.status(500).json({
      error: "Proxy error",
      details: String(e && e.message ? e.message : e),
    });
  }
});

// Proxy endpoint to Search Jira issues (used by Release Visibility feature)
app.get("/api/jira/search", async (req, res) => {
  try {
    const { jql, jiraUrl, email, token } = req.query;

    if (!jql || !jiraUrl || !email || !token) {
      return res.status(400).json({ error: "Missing required query params: jql, jiraUrl, email, token" });
    }

    const credentials = Buffer.from(`${email}:${token}`).toString("base64");
    const baseUrl = String(jiraUrl).replace(/\/$/, "");

    const r = await axios.post(`${baseUrl}/rest/api/3/search/jql`, {
      jql,
      fields: ["summary", "status", "assignee", "description", "customfield_10020"],
      maxResults: 50
    }, {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 20000,
    });

    res.status(200).json(r.data);
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        error: "Jira API error",
        details: e.response.data,
      });
    }
    res.status(500).json({
      error: "Proxy error",
      details: String(e && e.message ? e.message : e),
    });
  }
});

// Proxy endpoint to create a Confluence page
app.post("/api/confluence/page", async (req, res) => {
  try {
    const { 
      confluenceUrl, email, token, spaceKey, title, content, parentPageId 
    } = req.body || {};

    if (!confluenceUrl || !email || !token || !spaceKey || !title || !content) {
      return res.status(400).json({ error: "Missing required fields: confluenceUrl, email, token, spaceKey, title, content" });
    }

    const credentials = Buffer.from(`${email}:${token}`).toString("base64");
    const baseUrl = confluenceUrl.replace(/\/$/, "");

    // Prepare payload for Confluence API (v1)
    const payload = {
      type: "page",
      title: title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content, // We expect HTML/XHTML here
          representation: "storage"
        }
      }
    };

    if (parentPageId) {
      payload.ancestors = [{ id: parentPageId }];
    }

    const r = await axios.post(`${baseUrl}/rest/api/content`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      timeout: 15000,
    });

    res.status(201).json({
      id: r.data.id,
      title: r.data.title,
      url: `${baseUrl}${r.data._links.webui}`,
    });
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        error: "Confluence API error",
        details: e.response.data,
      });
    }
    res.status(500).json({
      error: "Proxy error",
      details: String(e && e.message ? e.message : e),
    });
  }
});

// Dashboard Routes
app.use('/api/dashboard/runs', runsRouter(dashboardStore));
app.use('/api/dashboard/metrics', metricsRouter(dashboardStore));
app.use('/api/dashboard/run-details', runDetailsRouter(dashboardStore));
app.use('/api/links', linksRouter);

// Webhook for Cypress results
app.post("/api/dashboard/webhook", async (req, res) => {
  const result = req.body;
  if (!result || !result.runId) {
    return res.status(400).json({ error: "Invalid payload: missing runId" });
  }
  
  const saved = await dashboardStore.save({
    ...result,
    createdAt: result.createdAt || new Date().toISOString()
  });
  
  if (saved) {
    res.status(201).json({ ok: true, runId: result.runId });
  } else {
    res.status(500).json({ error: "Failed to save result" });
  }
});
// Serve Allure Results (Screenshots/Attachments)
const ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || "/Users/agudbudiman/Documents/automation-diricare/healthapp-web-automation/allure-results";
app.use('/api/allure-results', express.static(ALLURE_RESULTS_DIR));

const distDir = path.join(__dirname, "..", "dist");
// Vercel handles static serving via rewrites in vercel.json, 
// but keeping this for local development if needed.
app.use(express.static(distDir));

// Export the app for Vercel Serverless Functions
export default app;

// Keep listen for local standalone running
if (process.env.NODE_ENV !== 'production' && import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`TestGen backend running at http://127.0.0.1:${PORT}`);
  });
}
