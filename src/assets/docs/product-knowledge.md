# AI Product Knowledge Creator

Synthesize information from multiple Jira tickets into a comprehensive, structured knowledge base.

## Overview

The **AI Product Knowledge Creator** is designed to help teams build a "Source of Truth" by combining Acceptance Criteria and requirements from several related Jira tickets. This is perfect for creating technical documentation, onboarding guides, or feature overviews.

## How to Use

### 1. Identify Source Tickets

- Gather the URLs of the Jira tickets you want to synthesize (e.g., all tickets related to a new "Authentication" feature).

### 2. Input URLs

- Paste the first Jira URL into the input field.
- Click **Add Another Ticket (+)** to add more URLs. You can combine as many tickets as needed.

### 3. Generate Knowledge Base

- Click **Generate Knowledge Base**.
- The AI will:
  - Fetch the details for all provided Jira URLs.
  - Analyze the common themes and logical flow.
  - Structure the information into a professional Markdown document.

### 4. Review & Export

- **Rich Text Table**: The result is displayed as a formatted document.
- **Copy for Confluence**: Click this button to copy the content in a format that maintains its styling (including tables and headers) when pasted into Confluence.
- **Direct Confluence Export**: If [Confluence Integration](/settings?tab=confluence) is configured, click **Export to Confluence** choose a title, and the AI will create the page for you.

## Best Practices

- **Logical Grouping**: Input tickets that belong to the same functional area for a more cohesive document.
- **Reference Headers**: The AI automatically attempts to extract a logical title from the content (e.g., using the first `#` or `##` header).
- **Update Regularly**: As new tickets are completed, you can re-run the synthesis to keep your knowledge base up to date.
