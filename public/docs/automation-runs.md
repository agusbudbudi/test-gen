# Automation Runs

The Automation Runs page provides a detailed, searchable history of all your test executions. It is your primary tool for tracking down specific test failures and reviewing historical performance.

## Run History Table
This view lists all your test executions. For each run, you can see:
- **Run ID**: A unique identifier for the execution.
- **Status**: Whether the run Passed, Failed, or was Aborted.
- **Environment**: Details like `Production`, `Staging`, or `QA`.
- **Duration & Trigger**: How long the run took, and whether it was triggered manually or via a CI pipeline.
- **Pass/Fail Breakdown**: Exact counts of passed, failed, flaky, and skipped tests within the run.

## Filtering and Search
You can filter the run history based on Status, Environment, or Date ranges. Use the search bar to find specific runs by their ID or associated tag (e.g., `#release-v2.0`).

## Run Details
Clicking on any run opens a comprehensive **Run Details** view:
- **Test Case Execution**: A categorized list of every test case in the run.
- **Failure Context**: For failed tests, you can view the stack trace and access attached screenshots or logs on the **Media** tab.
- **AI Root Cause Analysis**: For difficult failures, trigger the AI Analyzer to get an explanation of the error and potential remediation steps.
