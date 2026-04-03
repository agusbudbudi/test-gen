export interface ChatPayload {
  model: string
  messages: { role: string; content: string }[]
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
  stream?: boolean
  provider?: string
}

export async function fetchChat(payload: ChatPayload, apiKey?: string) {
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

export async function fetchChatStream(
  payload: ChatPayload, 
  apiKey: string | undefined, 
  onChunk: (text: string) => void
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, stream: true }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.details || 'Failed to start stream')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No reader found on response')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log('Stream finished.');
      break
    }

    const chunkStr = decoder.decode(value, { stream: true })
    buffer += chunkStr
    
    // SSE uses double newlines to separate messages, but we should also handle single newlines for safety
    const parts = buffer.split('\n')
    // Keep the last partial line in the buffer
    buffer = parts.pop() || ''

    for (const part of parts) {
      const line = part.trim()
      if (!line || line === 'data: [DONE]') continue

      if (line.startsWith('data: ')) {
        const jsonStr = line.replace(/^data: /, '').trim()
        if (!jsonStr) continue

        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            onChunk(content)
          }
        } catch (e) {
          // If JSON is incomplete, it might have been split across a single newline
          // We'll put it back into the buffer for the next iteration
          buffer = line + '\n' + buffer
          break
        }
      }
    }
  }
}
