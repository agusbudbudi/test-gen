import { create } from 'zustand'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  error: string | null
  checkAuth: () => Promise<void>
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  error: null,

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me')
      set({ status: res.ok ? 'authenticated' : 'unauthenticated' })
    } catch {
      set({ status: 'unauthenticated' })
    }
  },

  login: async (password: string) => {
    set({ error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        set({ error: data.error || 'Login failed' })
        return false
      }
      set({ status: 'authenticated', error: null })
      return true
    } catch {
      set({ error: 'Network error, please try again' })
      return false
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ status: 'unauthenticated' })
    }
  },
}))

// A 401 from requireAuth (marked with X-Session-Required, unlike upstream
// Jira/OpenAI 401s the proxies pass through) means the session expired or was
// invalidated, e.g. SESSION_SECRET rotated: drop back to the login screen
// instead of leaving every page failing behind a stale "logged in" UI.
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const res = await originalFetch(input, init)
    if (res.status === 401 && res.headers.get('X-Session-Required') === '1') {
      useAuthStore.setState({ status: 'unauthenticated' })
    }
    return res
  }
}
