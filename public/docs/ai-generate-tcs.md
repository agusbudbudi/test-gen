# AI Generate Test Cases

Transform your requirements or User Stories into comprehensive, structured test cases in seconds using advanced AI models.

## Overview
The **AI Generate Test Cases** feature is designed to accelerate the testing phase by automatically creating positive, negative, and edge-case scenarios from your input. It supports both manual text entry and direct import from Jira.

## How to Use

### 1. Choose Input Mode
- **Manual Input (AC)**: Paste your User Story and Acceptance Criteria directly into the text fields.
- **Jira URL**: Paste a link to a Jira ticket (e.g., `https://yourcompany.atlassian.net/browse/PROJ-123`). The system will automatically fetch the summary and description for analysis.

### 2. Configure Generation
- **Test Case Count**: Specify how many test cases you want to generate (default is 10).
- **Tags**: Add comma-separated tags (e.g., `Sprint-12`, `Critical`) to be applied to all generated cases.
- **AI Model**: Select your preferred model in [Settings](/settings). High-capability models like `gpt-4o` or `o1` are recommended for complex flows.

### 3. Generate & Review
- Click **Generate Test Cases** to start the process.
- Once generated, the cases will appear in an interactive table.
- Use **Review with AI** to send the results to the [AI Test Case Reviewer](/review) for further refinement.

### 4. Export & Save
- **Export**: Download the results as an Excel file.
- **Copy**: Copy all test cases as a TSV string, perfect for pasting into Google Sheets or Excel.
- **Add to Folder**: Save the generated cases directly into your [Test Management](/test-management) folders.
- **History**: Save the result to your local [History](/history).

## Tips for Best Results
- **Be Specific**: Provide clear Acceptance Criteria for more accurate test steps.
- **Use Templates**: Click **Use Template** on the right sidebar to fill the inputs with predefined structures.
- **Context is King**: Include information about technical constraints or database tables in the prompt details.
