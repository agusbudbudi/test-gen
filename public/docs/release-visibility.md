# Release Visibility

Track your sprint progress and automatically detect functional impact areas using AI.

## Overview
The **Release Visibility** tool queries Jira for tickets that are "Ready to Deploy" in a specific sprint and uses AI to categorize them by functional area. It also generates suggested "Demo Flows" to help with release walkthroughs.

## How to Use

### 1. Set Query Filters
- **Sprint Name / ID**: Enter the name of the sprint you want to track (e.g., `Sprint 24`).
- **Assigned Email**: Enter the email(s) of the assignees. You can input multiple emails separated by commas to see a combined view.

### 2. Search Tickets
- Click **Search Tickets**. The system will fetch all matching tickets that satisfy the "Ready to Deploy" criteria.

### 3. AI Analysis
- For each ticket found, the AI will automatically:
    - **Detect Area**: Identify which functional module is impacted (e.g., `Authentication`, `Checkout`, `UI/UX`).
    - **Suggest Demo Flow**: Create a step-by-step flow for demonstrating the change during a release sync or demo.

### 4. Review & Export
- **Grouped View**: Tickets are grouped by assignee for better visibility.
- **Copy to Spreadsheet**: Click this button to copy the results in a Tab-Separated Value (TSV) format, which can be pasted directly into Excel or Google Sheets.

## Why Use This?
- **Automated Reporting**: No more manual collection of ticket statuses for release notes.
- **Impact Assessment**: Quickly see which parts of the system are changing.
- **Demo Readiness**: Get instant ideas on how to demonstrate new features or bug fixes.
