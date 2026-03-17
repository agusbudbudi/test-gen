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
  const { jiraUrl, jiraEmail, jiraToken, apiKey, selectedModel } = useUIStore();
  const addToast = useToastStore((state) => state.addToast);

  const queryTickets = async (sprint: string, assignee: string) => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      addToast(
        "Please configure Jira settings first (Settings → Jira Integration).",
        "warning",
      );
      return;
    }

    if (!apiKey) {
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

      // 2. Query Tickets using accountIds
      const jql = `status in ("Ready to Deploy") AND sprint = "${sprint}" AND assignee in (${accountIds.map((id) => `"${id}"`).join(",")})`;
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

      // Process each ticket to detect area
      const processedTickets: Ticket[] = await Promise.all(
        issues.map(async (issue: any) => {
          const key = issue.key;
          const summary = issue.fields?.summary || "";

          // Extract description text
          let descriptionText = "";
          const descField = issue.fields?.description;
          if (descField) {
            if (typeof descField === "string") {
              descriptionText = descField;
            } else if (
              descField.type === "doc" &&
              Array.isArray(descField.content)
            ) {
              const extractText = (node: any): string => {
                if (node.type === "text") return node.text || "";
                if (node.type === "hardBreak") return "\n";
                if (Array.isArray(node.content)) {
                  const text = node.content.map(extractText).join("");
                  return node.type === "paragraph" ? text + "\n" : text;
                }
                return "";
              };
              descriptionText = descField.content
                .map(extractText)
                .join("")
                .trim();
            }
          }

          const status = issue.fields?.status?.name || "Unknown";
          const assigneeEmail =
            issue.fields?.assignee?.emailAddress || "Unassigned";

          // Detect area and demo flow using AI
          let area = "General";
          let demoFlow = "N/A";
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
                    content: `Ticket Key: ${key}\nSummary: ${summary}\nDescription: ${descriptionText.slice(0, 1000)}`,
                  },
                ],
                temperature: 0,
                response_format: { type: "json_object" },
              },
              apiKey,
            );

            const parsed = JSON.parse(
              aiRes.choices?.[0]?.message?.content || "{}",
            );
            area = parsed.area || "General";
            demoFlow = Array.isArray(parsed.demoFlow)
              ? parsed.demoFlow.join("\n")
              : parsed.demoFlow || "N/A";
          } catch (aiErr) {
            console.error("AI Analysis failed for", key, aiErr);
          }

          return {
            key,
            url: `${jiraUrl.replace(/\/$/, "")}/browse/${key}`,
            title: summary,
            area,
            status,
            demoFlow,
            assignee: assigneeEmail,
          };
        }),
      );

      setTickets(processedTickets);
      addToast(
        `Successfully retrieved and analyzed ${processedTickets.length} tickets.`,
        "success",
      );
    } catch (err: any) {
      addToast(`Query failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return { queryTickets, tickets, loading };
}
