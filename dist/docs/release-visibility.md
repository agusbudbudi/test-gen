# Release Visibility

Track your sprint progress and automatically detect functional impact areas using AI.

## Overview
The **Release Visibility** tool queries Jira for tickets in a specific sprint and uses AI to categorize them by functional area. It also generates suggested "Demo Flows" to help with release walkthroughs. You can filter by multiple statuses such as "To Do", "In Progress", "In Review", "Ready to Test", "Ready to Deploy", and "Done".

## How to Use

### 1. Set Query Filters
- **Sprint Name / ID**: Enter the name of the sprint you want to track (e.g., `Sprint 24`).
- **Assigned Email**: Enter the email(s) of the assignees. You can input multiple emails separated by commas to see a combined view.
- **Statuses**: Select one or more statuses to include in your query. The tool defaults to "Ready to Deploy" but can be customized to your needs.

### 2. Search Tickets
- Click **Search Tickets**. The system will fetch all matching tickets. The AI analysis is now **batched** for improved performance and efficiency.

### 3. AI Analysis & Manual Overrides
- For each ticket found, the AI will automatically:
    - **Detect Area**: Identify the impacted functional module.
    - **Suggest Demo Flow**: Create a step-by-step flow for demonstrating the change.
- **Manual Edit**: Click the **Edit** icon (pencil) to manually override the AI detections if they are not perfectly accurate. Click **Save** (disk) to commit or **Cancel** (X) to discard changes.
- **Refresh AI**: Click the **Refresh** icon on any row to re-run the AI analysis for that specific ticket.

### 4. Review & Export
- **Grouped View**: Tickets are grouped by assignee for better visibility.
- **Persistent State**: The tool automatically remembers your last used sprint, assignee, and status selections so you don't have to re-enter them.
- **Copy to Spreadsheet**: Click this button to copy the results in a Tab-Separated Value (TSV) format (including your manual edits) for easy pasting into Excel or Google Sheets.

## Why Use This?
- **Automated Reporting**: No more manual collection of ticket statuses for release notes.
- **Impact Assessment**: Quickly see which parts of the system are changing. No more truncated titles—long ticket names now wrap properly.
- **Demo Readiness**: Get instant ideas on how to demonstrate new features or bug fixes.
- **Data Persistence**: Your work state is preserved between sessions for a smoother workflow.
