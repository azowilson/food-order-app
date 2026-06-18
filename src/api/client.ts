import type { AppData, User } from '../types'

const API_BASE = '/api'
const TOKEN_KEY = 'bitechat_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function dateReviver(_key: string, value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

function parseAppData(raw: AppData): AppData {
  return JSON.parse(JSON.stringify(raw), dateReviver) as AppData
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? 'Request failed')
  }

  return data as T
}

type AuthResponse = { token: string; user: User; appData: AppData }

export const api = {
  register(username: string, password: string, displayName?: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    })
  },

  login(username: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async me() {
    const data = await request<{ user: User; appData: AppData }>('/auth/me')
    return { ...data, appData: parseAppData(data.appData) }
  },

  setLlmKey(apiKey: string, llmModel?: string) {
    return request<{ user: User }>('/auth/llm-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey, llmModel }),
    })
  },

  getSettings() {
    return request<{
      user: User
      llmModels: { id: string; label: string; provider: string; group: string; free?: boolean }[]
      llmModelGroups: { name: string; models: { id: string; label: string; provider: string; group: string; free?: boolean }[] }[]
      providerHints: Record<string, string>
      providerKeyLabels: Record<string, string>
      providerPlaceholders: Record<string, string>
    }>('/settings')
  },

  updateProfile(payload: {
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }) {
    return request<{ user: User }>('/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateAiSettings(payload: { apiKey?: string; removeApiKey?: boolean; llmModel?: string }) {
    return request<{ user: User }>('/settings/ai', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  testAiSettings(payload?: { apiKey?: string; llmModel?: string }) {
    return request<{ ok: boolean; provider: string; model: string }>('/settings/ai/test', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    })
  },

  skipLlmSetup() {
    return request<{ user: User }>('/auth/skip-llm-setup', { method: 'POST' })
  },

  async addFriend(username: string) {
    const data = await request<AppData>('/friends', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
    return parseAppData(data)
  },

  async createGroup(name: string, memberUsernames: string[]) {
    const data = await request<AppData>('/chats/group', {
      method: 'POST',
      body: JSON.stringify({ name, memberUsernames }),
    })
    return parseAppData(data)
  },

  async startDirectChat(friendUsername: string) {
    const data = await request<AppData>('/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ friendUsername }),
    })
    return parseAppData(data)
  },

  async sendMessage(chatId: string, text: string) {
    const data = await request<AppData>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    return parseAppData(data)
  },

  async addOrderItem(
    chatId: string,
    item: { food: string; messageId: string; fromAuthor: string; zone: string },
  ) {
    const data = await request<AppData>(`/chats/${chatId}/order-items`, {
      method: 'POST',
      body: JSON.stringify(item),
    })
    return parseAppData(data)
  },

  async removeOrderItem(chatId: string, itemId: string) {
    const data = await request<AppData>(`/chats/${chatId}/order-items/${itemId}`, {
      method: 'DELETE',
    })
    return parseAppData(data)
  },

  async clearOrderBoard(chatId: string) {
    const data = await request<AppData>(`/chats/${chatId}/order-items/clear`, {
      method: 'POST',
    })
    return parseAppData(data)
  },

  async submitOrder(chatId: string) {
    const data = await request<AppData>(`/chats/${chatId}/orders/submit`, {
      method: 'POST',
    })
    return parseAppData(data)
  },

  async patchActiveOrder(
    chatId: string,
    activeOrder: unknown,
    orderItems?: unknown,
  ) {
    const data = await request<AppData>(`/chats/${chatId}/orders/active`, {
      method: 'PATCH',
      body: JSON.stringify({ activeOrder, orderItems }),
    })
    return parseAppData(data)
  },

  async completeOrder(chatId: string) {
    const data = await request<AppData>(`/chats/${chatId}/orders/complete`, {
      method: 'POST',
    })
    return parseAppData(data)
  },

  async backFromOrder(chatId: string) {
    const data = await request<AppData>(`/chats/${chatId}/orders/back`, {
      method: 'POST',
    })
    return parseAppData(data)
  },

  parseAuthResponse(data: AuthResponse) {
    return {
      ...data,
      appData: parseAppData(data.appData),
    }
  },
}
