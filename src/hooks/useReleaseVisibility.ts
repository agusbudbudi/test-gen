import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useToastStore } from "@/stores/toastStore";
import { fetchChat } from "@/lib/api";

export interface Ticket {
  key: string;
  url: string;
  title: string;
  area: string;
  status: string;
  demoFlow: string;
  assignee: string;
}

export function useReleaseVisibility() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { jiraUrl, jiraEmail, jiraToken, apiKey, anthropicApiKey, aiProvider, selectedModel } = useUIStore();
  const addToast = useToastStore((state) => state.addToast);

  const activeApiKey = aiProvider === 'anthropic' ? anthropicApiKey : apiKey;

  const updateTicket = (key: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...updates } : t)),
    );
  };

  const refreshTicketAI = async (ticket: Ticket) => {
    if (!activeApiKey) {
      addToast("API Key is missing!", "warning");
      return;
    }

    updateTicket(ticket.key, { area: "Analyzing...", demoFlow: "Analyzing..." });

    try {
      const aiRes = await fetchChat(
        {
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: `You are a Senior QA Engineer. Analyze the Jira ticket and provide:
1. Area: 2-5 words identifying the specific application module (e.g., "COP - EMR Filter").
2. Demo Flow: minimum 2-3 maximum as much as possible based on the ticket description, shall cover main flows in extremely concise bullet points showing the absolute critical path to demo. Use short phrases (max 10 words per point).

Return your response in JSON format: { "area": "...", "demoFlow": "..." }`,
            },
            {
              role: "user",
              content: `Ticket Key: ${ticket.key}\nSummary: ${ticket.title}`,
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
          provider: aiProvider,
        },
        activeApiKey,
      );

      const content = aiRes.choices?.[0]?.message?.content || "{}";
      const jsonString = content.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(jsonString);
      updateTicket(ticket.key, {
        area: parsed.area || "General",
        demoFlow: Array.isArray(parsed.demoFlow)
          ? parsed.demoFlow.join("\n")
          : parsed.demoFlow || "N/A",
      });
    } catch (aiErr) {
      console.error("AI Analysis failed for", ticket.key, aiErr);
      updateTicket(ticket.key, { area: "Error", demoFlow: "AI analysis failed." });
    }
  };

  const queryTickets = async (sprint: string, assignee: string, statuses: string[] = ["Ready to Deploy"]) => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      addToast(
        "Please configure Jira settings first (Settings → Jira Integration).",
        "warning",
      );
      return;
    }

    if (!activeApiKey) {
      addToast("API Key is missing! Please set it in the sidebar.", "warning");
      return;
    }

    if (!sprint.trim()) {
      addToast("Please enter a sprint name or ID.", "warning");
      return;
    }

    if (!assignee.trim()) {
      addToast("Please enter an assignee name.", "warning");
      return;
    }

    setLoading(true);
    setTickets([]);

    try {
      // 1. Resolve Assignee Emails to AccountIds
      const emailList = assignee
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      
      const accountIds = await Promise.all(
        emailList.map(async (email) => {
          const userRes = await fetch(
            `/api/jira/user/search?query=${encodeURIComponent(email)}&jiraUrl=${encodeURIComponent(jiraUrl)}&email=${encodeURIComponent(jiraEmail)}&token=${encodeURIComponent(jiraToken)}`,
          );

          if (!userRes.ok) {
            const errData = await userRes.json().catch(() => ({}));
            const msg = errData?.details?.errorMessages
              ? errData.details.errorMessages.join(", ")
              : errData?.error || `HTTP ${userRes.status}`;
            throw new Error(`User search failed for ${email}: ${msg}`);
          }

          const users = await userRes.json();
          if (!Array.isArray(users) || users.length === 0) {
            throw new Error(`No Jira user found with email or name: ${email}`);
          }

          const targetUser =
            users.find(
              (u: any) =>
                u.emailAddress?.toLowerCase() === email.toLowerCase() ||
                u.displayName?.toLowerCase() === email.toLowerCase(),
            ) || users[0];

          return targetUser.accountId;
        }),
      );

      console.log(`Resolved emails to accountIds: ${accountIds.join(", ")}`);

      // 2. Query Tickets using accountIds and selected statuses
      const statusJQL = statuses.map((s) => `"${s}"`).join(",");
      const jql = `status in (${statusJQL}) AND sprint = "${sprint}" AND assignee in (${accountIds.map((id) => `"${id}"`).join(",")})`;
      const res = await fetch(
        `/api/jira/search?jql=${encodeURIComponent(jql)}&jiraUrl=${encodeURIComponent(jiraUrl)}&email=${encodeURIComponent(jiraEmail)}&token=${encodeURIComponent(jiraToken)}`,
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.details?.errorMessages
          ? errData.details.errorMessages.join(", ")
          : errData?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      const issues = data.issues || [];

      if (issues.length === 0) {
        addToast("No tickets found matching your query.", "info");
        setTickets([]);
        setLoading(false);
        return;
      }

      // Convert Jira issues to interim format
      const initialTickets: Ticket[] = issues.map((issue: any) => {
        const key = issue.key;
        const summary = issue.fields?.summary || "";
        let descriptionText = "";
        const descField = issue.fields?.description;
        if (descField) {
          if (typeof descField === "string") {
            descriptionText = descField;
          } else if (descField.type === "doc" && Array.isArray(descField.content)) {
            const extractText = (node: any): string => {
              if (node.type === "text") return node.text || "";
              if (node.type === "hardBreak") return "\n";
              if (Array.isArray(node.content)) {
                const text = node.content.map(extractText).join("");
                return node.type === "paragraph" ? text + "\n" : text;
              }
              return "";
            };
            descriptionText = descField.content.map(extractText).join("").trim();
          }
        }

        return {
          key,
          url: `${jiraUrl.replace(/\/$/, "")}/browse/${key}`,
          title: summary,
          area: "Detecting...",
          status: issue.fields?.status?.name || "Unknown",
          demoFlow: "Generating...",
          assignee: issue.fields?.assignee?.displayName || issue.fields?.assignee?.emailAddress || "Unassigned",
          description: descriptionText,
        } as any;
      });

      setTickets(initialTickets);

      // 3. Batch AI Analysis (Process in batches of 5)
      const BATCH_SIZE = 5;
      for (let i = 0; i < initialTickets.length; i += BATCH_SIZE) {
        const batch = initialTickets.slice(i, i + BATCH_SIZE);
        
        try {
          const aiRes = await fetchChat(
            {
              model: selectedModel,
              messages: [
                {
                  role: "system",
                  content: `You are a Senior QA Engineer. Analyze multiple Jira tickets and provide "area" (2-5 words module name) and "demoFlow" (concise bullet points) for each.
Return a JSON object where keys are the Ticket Keys and values are { "area": "...", "demoFlow": "..." }.`,
                },
                {
                  role: "user",
                  content: batch.map(t => `Key: ${t.key}\nSummary: ${t.title}\nDescription: ${(t as any).description?.slice(0, 500)}`).join("\n---\n"),
                },
              ],
              temperature: 0,
              response_format: { type: "json_object" },
              provider: aiProvider,
            },
            activeApiKey,
          );

          const content = aiRes.choices?.[0]?.message?.content || "{}";
          const jsonString = content.replace(/```json\n?|```/g, "").trim();
          const results = JSON.parse(jsonString);
          
          setTickets(prev => prev.map(t => {
            if (results[t.key]) {
              return {
                ...t,
                area: results[t.key].area || "General",
                demoFlow: Array.isArray(results[t.key].demoFlow) 
                  ? results[t.key].demoFlow.join("\n") 
                  : results[t.key].demoFlow || "N/A"
              };
            }
            return t;
          }));
        } catch (batchErr) {
          console.error("Batch AI analysis failed for batch starting at", i, batchErr);
          // Update failed batch tickets to error state
          setTickets(prev => prev.map(t => {
            if (batch.some(bt => bt.key === t.key) && (t.area === "Detecting..." || t.demoFlow === "Generating...")) {
              return { ...t, area: "Error", demoFlow: "AI analysis failed." };
            }
            return t;
          }));
        }
      }

      addToast(
        `Successfully retrieved and analyzed ${initialTickets.length} tickets.`,
        "success",
      );
    } catch (err: any) {
      addToast(`Query failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return { queryTickets, tickets, loading, updateTicket, refreshTicketAI };
}
