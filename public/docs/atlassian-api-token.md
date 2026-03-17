# Creating Atlassian API Token

To enable Jira and Confluence integrations, you need an Atlassian API Token. This token allows the AI Test Generator to securely communicate with your Atlassian account.

## Step-by-Step Guide

### 1. Access Atlassian Security Settings
- Log in to your Atlassian account.
- Go to the **API Tokens** management page directly via this link: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
- Alternatively, you can navigate there by clicking your profile avatar at the top right -> **Manage account** -> **Security** -> **Create and manage API tokens**.

### 2. Create a New Token
- Click the **Create API token** button.
- A modal will appear asking for a label. Enter something descriptive like `AI Test Generator` or `Personal Project`.
- Click **Create**.

### 3. Copy and Secure Your Token
- Your new API token will be displayed.
- **IMPORTANT**: Copy the token immediately using the **Copy** button. Atlassian will not show this token again once you close the window.
- Store it in a secure location if you plan to use it elsewhere.

### 4. Configure in AI Test Generator
- Open the [Settings](/settings) page in the AI Test Generator.
- Go to the **Jira Integration** or **Confluence** tab.
- Paste the copied token into the **API Token** field.
- Fill in your **Atlassian Email** and **Jira/Confluence Domain**.
- Click **Save Settings**.

## Troubleshooting
- **Permission Denied**: Ensure your Atlassian account has access to the specific Jira project or Confluence space you are trying to use.
- **Invalid Token**: Double-check that you copied the full token and didn't include any extra spaces.
- **Expired Token**: If you suspect your token is compromised or no longer working, you can delete it from the Atlassian Security page and create a new one.

> [!TIP]
> One API token works for both Jira and Confluence features as long as they are on the same Atlassian site.
