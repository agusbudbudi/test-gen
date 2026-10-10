// Sends the "Create QA Tasks" run summary to Slack via chat.postMessage.
// Failure here is reported as a warning and never fails the request —
// tickets have already been created by the time this runs.
// Adapted from qa-tools/src/slackNotify.js (bot-token only, no webhook path).

export async function notifySlack({ botToken, channel, parentKey, parentTitle, results }) {
  if (!botToken || !channel) {
    return { sent: false, reason: "Slack bot token or channel not configured." };
  }

  const text = formatSlackMessage({ parentKey, parentTitle, results });

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, text }),
    });
    const json = await res.json();
    if (!json.ok) {
      return { sent: false, reason: `Slack API error: ${json.error}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: `Slack request failed: ${err.message}` };
  }
}

function formatSlackMessage({ parentKey, parentTitle, results }) {
  const lines = [`*QA tickets for ${parentKey} — ${parentTitle}*`];
  for (const r of results) {
    const status = r.status === "created" ? "Created" : "Already exists";
    lines.push(`• ${status}: <${r.url}|${r.key}> — ${r.title}`);
  }
  return lines.join("\n");
}
