# Settings

Configure your AI engine and external integrations to unlock the full power of the AI Test Generator.

## Overview
The **Settings** page is where you manage your API keys and connection details for Jira and Confluence.

## Configuration Tabs

### 1. General Settings
- **OpenAI API Key**: Required for all AI features. Enter your `sk-...` key from the OpenAI platform.
- **AI Model**: Choose which model to use. 
    - `gpt-4o`: Recommended for balance of speed and intelligence.
    - `o1/o3-mini`: Best for complex logic and reasoning.
- **Default Test Case Count**: Set your preferred default number of cases for generation (1-30).

### 2. Jira Integration
Connect to Jira to enable direct URL fetching and bug report exporting.
- **Jira Domain**: Your full Atlassian URL (e.g., `https://yourcompany.atlassian.net`).
- **Atlassian Email**: The email address associated with your Atlassian account.
- **API Token**: Create this in your [Atlassian Security Settings](https://id.atlassian.com/manage-profile/security/api-tokens).
- **Project Key**: The uppercase key of your Jira project (e.g., `QA`, `PROJ`).

### 3. Confluence Integration
Enable direct export of Product Knowledge documents.
- **Confluence Domain & Email**: Same as Jira.
- **Space Key**: The key of the Confluence space where pages should be created.
- **Parent Page ID (Optional)**: If provided, new pages will be created as children of this specific page.

## Data Privacy & Security
- **Local Storage**: All keys and tokens are stored securely in your browser's local storage. They are never sent to our servers.
- **Direct Connection**: The application communicates directly with OpenAI, Jira, and Confluence APIs using the credentials you provide.

## Troubleshooting
- **JQL Errors**: Ensure your Project Key is exactly correct (uppercase).
- **Export Failures**: Check that your API Token has sufficient permissions to create pages or issues in the target space/project.
- **Model Unavailable**: Ensure your OpenAI account has access to the selected model (e.g., GPT-4 requires a paid tier).
