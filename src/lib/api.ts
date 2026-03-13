export interface ChatPayload {
  model: string
  messages: { role: string; content: string }[]
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
}

export async function fetchChat(payload: ChatPayload, apiKey?: string) {
  // Use proxy /api/chat if it's set up, otherwise direct to OpenAI
  // The backend already handles the API Key if defined in .env, 
  // but we can also pass it if stored in client.
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.details || 'Failed to fetch from OpenAI')
  }

  return response.json()
}
