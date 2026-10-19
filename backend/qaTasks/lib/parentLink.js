// Parses a parent Jira ticket link like:
//   https://yourdomain.atlassian.net/browse/PROJ-123
// into { projectKey: "PROJ", parentKey: "PROJ-123" }.
// Query strings and fragments (?atlOrigin=…, #comment-…) are ignored.
// Ported from qa-tools/src/parentLink.js.

export class InvalidLinkError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidLinkError";
  }
}

export function parseParentLink(link) {
  if (!link) {
    throw new InvalidLinkError("Parent ticket link is required.");
  }

  const match = link.match(/\/browse\/([A-Z][A-Z0-9_]*)-(\d+)\/?(?:[?#].*)?$/i);
  if (!match) {
    throw new InvalidLinkError(
      `Could not parse a Jira issue key out of "${link}". ` +
        `Expected something like https://yourdomain.atlassian.net/browse/PROJ-123`
    );
  }

  const projectKey = match[1].toUpperCase();
  const issueNumber = match[2];

  return {
    projectKey,
    parentKey: `${projectKey}-${issueNumber}`,
  };
}
