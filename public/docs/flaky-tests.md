# Identifying and Fixing Flaky Tests

Flaky tests are tests that produce both a passing and a failing status without any changes to the code. This inconsistency can erode trust in automation and slow down the release cycle.

## The "3-Fail" Rule
A common industry standard is the **3-Fail Rule**: If a test fails more than 3 times a day across different runs (without a corresponding code regression), it is most likely **flaky** or caused by **environmental instability**.

### Common Causes of Flakiness
1.  **Race Conditions**: Tests finishing before a UI element is ready.
2.  **Environmental Issues**: Intermittent network failures, database latency, or resource exhaustion.
3.  **Data Dependency**: Tests relying on specific state from other tests.
4.  **Hardware Variation**: Tests passing on local machines but failing on CI (lack of resources).

### Strategy for Isolation
- **Quarantine**: If a test is identified as flaky, move it to a quarantined suite to avoid blocking the main CI pipeline.
- **Repeatability**: Run the test many times in a loop (stress test) to capture the failure pattern.
- **Logging**: Enhance test logs and capture screenshots/videos specifically for the failure point.

### Source Links & Best Practices
- [Google Testing Blog: Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
- [Microsoft: Flaky Test Management](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/flaky-test-management)
- [Cypress Guide: Test Retries & Flaky Tests](https://docs.cypress.io/guides/guides/test-retries)
- [Playwright: Trace Viewer for Debugging](https://playwright.dev/docs/trace-viewer)
