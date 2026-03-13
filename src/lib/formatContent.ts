/**
 * Formats bug report description text with icons and bold styling.
 * Supports "Steps to Reproduce", "Actual Result", and "Expected Result".
 */
export function formatDescription(text: string): string {
  if (!text) return "";

  let formatted = text.trim();

  // Replace section headers with rich HTML-like components
  formatted = formatted
    .replace(
      /\*\*Preconditions:\*\*/gi,
      "<strong>🛠️ Preconditions:</strong>"
    )
    .replace(
      /\*\*Test Data:\*\*/gi,
      "<strong>📊 Test Data:</strong>"
    )
    .replace(
      /\*\*Steps to Reproduce:\*\*/gi,
      "<strong>📋 Steps to Reproduce:</strong>"
    )
    .replace(
      /\*\*Step to Reproduce:\*\*/gi,
      "<strong>📋 Steps to Reproduce:</strong>"
    )
    .replace(
      /\*\*Actual Result:\*\*/gi,
      "<strong>❌ Actual Result:</strong>"
    )
    .replace(
      /\*\*Expected Result:\*\*/gi,
      "<strong>✅ Expected Result:</strong>"
    );

  // Handle common Markdown bolding for other fields if needed
  // Note: We use dangerouslySetInnerHTML in the UI, so we return HTML strings.
  
  return formatted;
}
