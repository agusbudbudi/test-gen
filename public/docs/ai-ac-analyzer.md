# AI Acceptance Criteria Analyzer

Get a professional QA assessment of your requirements before development starts. Think of it as a "QA Scientist" reviewing your ticket.

## Overview
The **AI AC Analyzer** helps prevent bugs early in the lifecycle by identifying gaps and ambiguities in your Acceptance Criteria (AC). It also provides effort estimations to help with sprint planning.

## How to Use

### 1. Import from Jira
- Enter the **Jira Ticket URL** you want to analyze.
- The AI will fetch the AC directly from the ticket.

### 2. Add Context (Optional)
- Use the **Additional Context** field to provide extra information that might not be in the ticket, such as:
    - Database tables involved.
    - Specific API endpoints or technical constraints.
    - Business priorities.

### 3. Analyze
- Click **Start Analysis**. The AI will generate a detailed markdown report.

## What's in the Analysis?
- **Impact Analysis**: Which areas of the system are affected by this change?
- **Gaps & Ambiguities**: Are there any "what if" scenarios not covered?
- **Suggested Test Scenarios**: A list of high-level test paths to consider.
- **Effort Estimation**:
    - **Story Points**: AI suggestion based on complexity.
    - **Test Case Count**: Estimated number of test cases needed.
    - **QC Man-hours**: Estimated time to create and execute tests.

## Why Use This?
- **Shift Left**: Identify logic flaws and missing requirements before a single line of code is written.
- **Better Planning**: Use AI-driven estimations as a reference during grooming or planning sessions.
- **Consistency**: Ensure all team members have a clear, shared understanding of the AC.
