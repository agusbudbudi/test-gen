import { useState, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useToastStore } from "@/stores/toastStore";
import { useResultStore } from "@/stores/resultStore";
import { fetchChatStream } from "@/lib/api";

export interface JiraTicketData {
  url: string;
  summary: string;
  description: string;
}

export function useACAnalyzer() {
  const [generating, setGenerating] = useState(false);

  const { jiraUrl, jiraEmail, jiraToken, apiKey, anthropicApiKey, aiProvider, selectedModel } = useUIStore();
  const addToast = useToastStore((state) => state.addToast);

  const {
    acAnalyzerResult: result,
    setAcAnalyzerResult: setResult,
    acAnalyzerUrl: url,
    setAcAnalyzerUrl: setUrl,
    acAnalyzerContext: additionalContext,
    setAcAnalyzerContext: setAdditionalContext,
  } = useResultStore();

  const extractJiraKey = (url: string): string | null => {
    if (!url) return null;
    const match =
      url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/i) ||
      url.match(/^([A-Z0-9]+-[0-9]+)$/i);
    return match ? match[1].toUpperCase() : null;
  };

  const fetchJiraDetails = async (
    url: string,
  ): Promise<JiraTicketData | null> => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      addToast(
        "Please configure Jira settings first (Settings → Jira Integration).",
        "warning",
      );
      return null;
    }

    const key = extractJiraKey(url);
    if (!key) {
      addToast(`Invalid Jira URL provided: ${url}`, "error");
      return null;
    }

    try {
      const res = await fetch(
        `/api/jira/issue/${key}?jiraUrl=${encodeURIComponent(jiraUrl)}&email=${encodeURIComponent(jiraEmail)}&token=${encodeURIComponent(jiraToken)}`,
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.details?.errorMessages
          ? errData.details.errorMessages.join(", ")
          : errData?.error || `HTTP ${res.status}`;
        addToast(`Failed to fetch ${key}: ${msg}`, "error");
        return null;
      }

      const data = await res.json();
      const summary = data.fields?.summary || "";
      let description = "";
      const descField = data.fields?.description;
      if (descField) {
        if (typeof descField === "string") {
          description = descField;
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
          description = descField.content.map(extractText).join("").trim();
        }
      }
      return { url, summary, description };
    } catch (err: any) {
      addToast(`Network error for ${url}: ${err.message}`, "error");
      return null;
    }
  };

  const analyzeAC = useCallback(
    async (inputUrl: string) => {
      if (!inputUrl.trim()) {
        addToast("Please provide a Jira ticket URL.", "warning");
        return;
      }

      const activeApiKey = aiProvider === 'anthropic' ? anthropicApiKey : apiKey;
      if (!activeApiKey) {
        addToast(
          "API Key is missing! Please set it in the sidebar.",
          "warning",
        );
        return;
      }

      setGenerating(true);
      setResult("");

      try {
        const ticketData = await fetchJiraDetails(inputUrl);

        if (!ticketData) {
          setGenerating(false);
          return;
        }

        // Handle empty or very short descriptions
        const isShortDescription = !ticketData.description || ticketData.description.trim().length < 20;
        if (isShortDescription) {
          addToast(
            "The Jira description is very short or empty. The AI will try its best, but providing more context in the ticket is recommended.",
            "warning",
          );
        }

        const systemPrompt = `You are a Senior QA Engineer and Test Architect.
Your task is to analyze the Acceptance Criteria (AC) from the provided Jira ticket and provide a comprehensive assessment from a QA point of view.

### ANALYZE THE FOLLOWING JIRA TICKET:
- **Project/Key**: ${extractJiraKey(ticketData.url)}
- **Summary**: ${ticketData.summary}
- **Description/AC**:
${ticketData.description || "(No description provided)"}
${additionalContext ? `\n- **Additional User Context**:\n${additionalContext}` : ""}

---

### REQUIRED OUTPUT FORMAT:

# 🔍 AI Acceptance Criteria Analysis — ${extractJiraKey(ticketData.url)}
---

## 📌 1. QA Assessment Overview
[Provide a high-level assessment of the requirements. Are they clear? Feasible? Testable?]

---

## 💡 2. Suggestions & Improvements
[Provide suggestions to improve the AC. Are any requirements ambiguous? Suggest better wording or clearer constraints.]

---

## 🕳️ 3. Missing Scenarios & Gaps
[Identify what's NOT covered. Consider edge cases, negative flows, security, performance, or accessibility gaps.]

---

## 🧱 4. Impacted Areas
[Identify potential impacts on other parts of the system or existing features.]

---

## 📉 5. Effort & Estimation
Use the following format for estimations:
| Metric | Estimation |
| :--- | :--- |
| **Story Points** | [1, 2, 3, 5, 8, or 13] |
| **Story Point Rationale** | [Provide a brief 1-sentence justification for the estimation] |
| **Total Test Cases** | [Estimated count] |
| **QA Test Case Creation Effort** | [Estimated time, e.g., 4h or 1d] |
| **QA Execution Effort** | [Estimated time, e.g., 4h or 1d] |

---

## 🛠️ 6. Technical Testing Notes
[Provide granular technical tips for testing. Identify specific components, potential DB tables to check, API endpoints, or environment dependencies mentioned or implied by the ticket.]

---

**Tone**: Professional, analytical, and highly detailed.
**Format**: Standard Markdown. DO NOT wrap in markdown code blocks.
`;

        let fullResult = "";
        let hasSkippedMarkdownBlock = false;

        await fetchChatStream(
          {
            model: selectedModel,
            messages: [{ role: "user", content: systemPrompt }],
            ...(selectedModel.startsWith("o") ? {} : { temperature: 0.2 }),
            stream: true,
            provider: aiProvider,
          },
          activeApiKey,
          (chunk) => {
            fullResult += chunk;

            let displayResult = fullResult;
            if (!hasSkippedMarkdownBlock) {
              if (displayResult.startsWith("```markdown")) {
                displayResult = displayResult.replace(/^```markdown\n?/, "");
                hasSkippedMarkdownBlock = true;
              } else if (displayResult.startsWith("```")) {
                displayResult = displayResult.replace(/^```\n?/, "");
                hasSkippedMarkdownBlock = true;
              }
            }
            setResult(displayResult);
          },
        );

        const finalResult = fullResult.replace(/```$/, "").trim();
        setResult(finalResult);

        addToast("AC Analysis completed successfully!", "success");
      } catch (error: any) {
        console.error("Analysis failed:", error);
        addToast(error.message || "Failed to analyze AC", "error");
      } finally {
        setGenerating(false);
      }
    },
    [apiKey, anthropicApiKey, aiProvider, jiraUrl, jiraEmail, jiraToken, selectedModel, addToast, setResult],
  );

  return {
    analyzeAC,
    generating,
    result,
    url,
    setUrl,
    additionalContext,
    setAdditionalContext,
  };
}
