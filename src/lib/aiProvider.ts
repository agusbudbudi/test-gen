export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  CLAUDE_SUBSCRIPTION: 'claude-subscription',
} as const

export function requiresClientApiKey(provider: string) {
  return provider !== AI_PROVIDERS.CLAUDE_SUBSCRIPTION
}

export function hasUsableApiKey(provider: string, apiKey: string, anthropicApiKey: string) {
  return !requiresClientApiKey(provider) || !!getActiveApiKey(provider, apiKey, anthropicApiKey)
}

export function getActiveApiKey(provider: string, apiKey: string, anthropicApiKey: string) {
  if (provider === AI_PROVIDERS.CLAUDE_SUBSCRIPTION) return undefined
  return provider === AI_PROVIDERS.ANTHROPIC ? anthropicApiKey : apiKey
}
