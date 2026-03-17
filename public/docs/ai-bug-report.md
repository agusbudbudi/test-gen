# Bug Report Generator

Convert messy observation notes or logs into professional, structured bug reports ready for Jira.

## Overview
Generating good bug reports is time-consuming. This tool takes your unstructured findings and formats them into a standardized report including **Steps to Reproduce**, **Expected vs Actual Results**, and **Severity Assessment**.

## How to Use

### 1. Enter Bug Details
- Paste your messy notes, logs, or a recording transcript into the text area.
- Don't worry about formatting; the AI will handle the structure.

### 2. Generate Report
- Click **Generate Bug Report**. The result will be displayed in a structured table.

### 3. Smart Copy for Jira
- Click **Smart Copy** to see a dropdown of options:
    - **Copy with Header**: Best for pasting into a new Jira description (ProseMirror format).
    - **Copy without Header**: Just the data rows, useful for updating existing tables.
- The clipboard will contain a rich HTML table that maintains its structure when pasted into Jira or Confluence.

### 4. Direct Jira Export
- If you have [Jira Integration](/settings?tab=jira) configured, click **Export to Jira**.
- A modal will appear allowing you to select the **Issue Type** (e.g., Bug, Task) and **Link Type** (optional).
- Once exported, a success banner will provide a direct link to the new Jira ticket.

## Features
- **Categorization**: Automatically identifies the impacted area and severity.
- **Standardization**: Ensures every bug report follows the same professional template.
- **Integration**: Saves time by creating the Jira ticket for you.
