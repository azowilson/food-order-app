import { useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, Sparkles, User } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { User as AppUser } from '../../types'

interface LlmModelOption {
  id: string
  label: string
  provider: string
  group: string
  free?: boolean
}

interface LlmModelGroup {
  name: string
  models: LlmModelOption[]
}

const API_KEY_HINTS: Record<string, string> = {
  openai: 'OpenAI key (sk-…)',
  gemini: 'Google AI Studio key',
  groq: 'Groq key (gsk_…)',
  mistral: 'Mistral API key',
  openrouter: 'OpenRouter key (sk-or-…)',
}

const PROVIDER_HELP: Record<string, string> = {
  openai: 'Get a key at platform.openai.com',
  gemini: 'Free tier at aistudio.google.com/apikey',
  groq: 'Free tier at console.groq.com',
  mistral: 'Free tier at console.mistral.ai',
  openrouter: 'Free models at openrouter.ai',
}

const KEY_LABELS: Record<string, string> = {
  openai: 'OpenAI API key',
  gemini: 'Google AI Studio API key',
  groq: 'Groq API key',
  mistral: 'Mistral API key',
  openrouter: 'OpenRouter API key',
}

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, setUser } = useAuth()
  const [llmModels, setLlmModels] = useState<LlmModelOption[]>([])
  const [llmModelGroups, setLlmModelGroups] = useState<LlmModelGroup[]>([])
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [llmModel, setLlmModel] = useState(user?.llmModel ?? 'gemini-2.0-flash')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAi, setSavingAi] = useState(false)
  const [removingKey, setRemovingKey] = useState(false)
  const [testingAi, setTestingAi] = useState(false)
  const [providerHints, setProviderHints] = useState(PROVIDER_HELP)
  const [providerPlaceholders, setProviderPlaceholders] = useState(API_KEY_HINTS)
  const [providerKeyLabels, setProviderKeyLabels] = useState(KEY_LABELS)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName)
    setLlmModel(user.llmModel)
  }, [user])

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setLlmModels(data.llmModels)
        setLlmModelGroups(data.llmModelGroups)
        setProviderHints(data.providerHints ?? PROVIDER_HELP)
        setProviderPlaceholders(data.providerPlaceholders ?? API_KEY_HINTS)
        setProviderKeyLabels(data.providerKeyLabels ?? KEY_LABELS)
        setUser(data.user)
        setLlmModel(data.user.llmModel)
      })
      .catch(() => {})
  }, [setUser])

  if (!user) return null

  const currentUser = user
  const selectedModel =
    llmModels.find((option) => option.id === llmModel) ??
    llmModelGroups.flatMap((group) => group.models).find((option) => option.id === llmModel)
  const selectedProvider = selectedModel?.provider ?? 'gemini'

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    const nameChanged = displayName.trim() !== currentUser.displayName
    const passwordChanged = Boolean(newPassword || confirmPassword || currentPassword)

    if (!nameChanged && !passwordChanged) {
      setProfileError('No changes to save')
      return
    }

    if (passwordChanged) {
      if (!currentPassword) {
        setProfileError('Enter your current password to change it')
        return
      }
      if (newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        setProfileError('New passwords do not match')
        return
      }
    }

    setSavingProfile(true)
    try {
      const payload: {
        displayName?: string
        currentPassword?: string
        newPassword?: string
      } = {}
      if (nameChanged) payload.displayName = displayName.trim()
      if (passwordChanged) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const { user: updated } = await api.updateProfile(payload)
      applyUserUpdate(updated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setProfileSuccess('Profile updated')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveAi(e: React.FormEvent) {
    e.preventDefault()
    setAiError(null)
    setAiSuccess(null)

    const modelChanged = llmModel !== currentUser.llmModel
    const keyProvided = Boolean(apiKey.trim())

    if (!modelChanged && !keyProvided) {
      setAiError('Choose a model or enter a new API key')
      return
    }

    setSavingAi(true)
    try {
      const payload: { apiKey?: string; llmModel?: string } = {}
      if (keyProvided) payload.apiKey = apiKey.trim()
      if (modelChanged) payload.llmModel = llmModel

      const { user: updated } = await api.updateAiSettings(payload)
      applyUserUpdate(updated)
      setApiKey('')
      setAiSuccess(keyProvided ? 'AI settings saved' : 'Model updated')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to save AI settings')
    } finally {
      setSavingAi(false)
    }
  }

  async function handleTestConnection() {
    setAiError(null)
    setAiSuccess(null)
    setTestingAi(true)
    try {
      const payload: { apiKey?: string; llmModel?: string } = { llmModel }
      if (apiKey.trim()) payload.apiKey = apiKey.trim()
      const result = await api.testAiSettings(payload)
      setAiSuccess(`Connected via ${result.provider} (${result.model})`)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Connection test failed')
    } finally {
      setTestingAi(false)
    }
  }

  async function handleRemoveKey() {
    if (!currentUser.hasLlmKey) return
    if (!window.confirm('Remove your stored API key? Food detection will use basic matching.')) {
      return
    }

    setAiError(null)
    setAiSuccess(null)
    setRemovingKey(true)
    try {
      const { user: updated } = await api.updateAiSettings({ removeApiKey: true })
      applyUserUpdate(updated)
      setApiKey('')
      setAiSuccess('API key removed')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to remove API key')
    } finally {
      setRemovingKey(false)
    }
  }

  function applyUserUpdate(updated: AppUser) {
    setUser(updated)
    setDisplayName(updated.displayName)
    setLlmModel(updated.llmModel)
  }

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <header className="safe-top flex items-center gap-3 border-b border-border bg-wa-panel px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full p-2 text-ink-muted transition hover:bg-wa-hover hover:text-ink"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-ink">Settings</h1>
          <p className="text-xs text-ink-muted">@{currentUser.username}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wa-green/15 text-wa-green">
                <User className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-ink">Profile</h2>
                <p className="text-sm text-ink-muted">Basic account information</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && <Alert tone="error">{profileError}</Alert>}
              {profileSuccess && <Alert tone="success">{profileSuccess}</Alert>}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Username</span>
                <input
                  value={currentUser.username}
                  disabled
                  className="w-full rounded-lg border border-border bg-wa-panel px-4 py-2.5 text-sm text-ink-muted"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Display name
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                />
              </label>

              <div className="rounded-xl border border-border/80 bg-wa-panel/50 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Change password
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-lg bg-wa-green py-2.5 text-sm font-semibold text-white hover:bg-wa-green-dark disabled:opacity-40"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/15 text-terracotta">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-ink">AI settings</h2>
                <p className="text-sm text-ink-muted">API key and model for food detection</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-wa-panel p-3 text-sm text-ink-muted">
              {currentUser.hasLlmKey ? (
                <p>
                  API key is saved on the server. Enter a new key below to replace it, or remove
                  it to use basic keyword matching.
                </p>
              ) : (
                <p>
                  No API key saved. Add one to enable smarter food detection and recipe generation.
                </p>
              )}
            </div>

            <form onSubmit={handleSaveAi} className="space-y-4">
              {aiError && <Alert tone="error">{aiError}</Alert>}
              {aiSuccess && <Alert tone="success">{aiSuccess}</Alert>}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">LLM model</span>
                <select
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                >
                  {(llmModelGroups.length > 0
                    ? llmModelGroups
                    : [{ name: 'Models', models: llmModels.length > 0 ? llmModels : [{ id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'gemini', group: 'Google Gemini', free: true }] }]
                  ).map((group) => (
                    <optgroup key={group.name} label={group.name}>
                      {group.models.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <KeyRound className="h-3.5 w-3.5" />
                  {providerKeyLabels[selectedProvider] ?? 'API key'}
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    currentUser.hasLlmKey
                      ? 'Enter new key to replace…'
                      : providerPlaceholders[selectedProvider] ?? 'API key'
                  }
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-wa-green/50"
                />
                <p className="mt-1.5 text-xs text-ink-muted">
                  {providerHints[selectedProvider] ?? 'Use a key from your chosen provider.'}
                  {selectedModel?.free ? ' This model has a free tier.' : ''}
                </p>
              </label>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingAi || (!apiKey.trim() && !currentUser.hasLlmKey)}
                className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink hover:bg-wa-panel disabled:opacity-40"
              >
                {testingAi ? 'Testing…' : 'Test connection'}
              </button>

              <button
                type="submit"
                disabled={savingAi}
                className="w-full rounded-lg bg-wa-green py-2.5 text-sm font-semibold text-white hover:bg-wa-green-dark disabled:opacity-40"
              >
                {savingAi ? 'Saving…' : 'Save AI settings'}
              </button>

              {currentUser.hasLlmKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  disabled={removingKey}
                  className="w-full rounded-lg border border-terracotta/30 py-2.5 text-sm font-medium text-terracotta hover:bg-terracotta-soft disabled:opacity-40"
                >
                  {removingKey ? 'Removing…' : 'Remove API key'}
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

function Alert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        tone === 'error' ? 'bg-terracotta-soft text-terracotta' : 'bg-wa-green/10 text-wa-green-dark'
      }`}
    >
      {children}
    </p>
  )
}
