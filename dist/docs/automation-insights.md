# Automation Insights

Automation Insights is designed to help teams drill down into systemic testing issues. Instead of looking at individual run failures, this page identifies patterns that affect your entire test suite.

## The Three Pillars of Insight

### 1. Flaky Tests
Flaky tests are tests that fail or pass intermittently without any code changes. This section highlights the most unstable tests in your suite.
- **Impact**: Flaky tests reduce trust in your automation.
- **Action**: You can view the `Flakiness Factor` of specific tests, review their failure history, and assign them for review or maintenance.

### 2. New Failures
This metric focuses on regression—tests that consistently passed before but have suddenly started failing in recent runs.
- **Impact**: High probability of a newly introduced defect or a broken environmental dependency.
- **Action**: Quickly isolate exactly when the test started failing and trace it back to the corresponding code commit or deployment.

### 3. Infrastructure Issues
Failures that are often caused by the testing environment, network timeouts, or third-party service outages rather than application bugs.
- **Impact**: Wasted triage time on non-application issues.
- **Action**: The platform categorizes errors (e.g., `TimeoutException`, `502 Bad Gateway`) to help you escalate issues to the DevOps or Platform teams effectively.

## Interactive Drilling
Clicking on any insight category will automatically filter your test view, allowing you to instantly examine the test cases contributing to that specific issue.
