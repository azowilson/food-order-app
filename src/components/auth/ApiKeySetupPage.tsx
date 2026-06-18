import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Sparkles } from 'lucide-react'
import { api } from '../../api/client'

interface ApiKeySetupPageProps {
  onComplete: () => void
  onSkip: () => void
}

interface ModelOption {
  id: string
  label: string
  provider: string
  free?: boolean
}

interface ModelGroup {
  name: string
  models: ModelOption[]
}

const FALLBACK_GROUPS: ModelGroup[] = [
  {
    name: 'Google Gemini',
    models: [{ id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (free tier)', provider: 'gemini', free: true }],
  },
]

export function ApiKeySetupPage({ onComplete, onSkip }: ApiKeySetupPageProps) {
  const [apiKey, setApiKey] = useState('')
  const [llmModel, setLlmModel] = useState('gemini-2.0-flash')
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>(FALLBACK_GROUPS)
  const [providerHints, setProviderHints] = useState<Record<string, string>>({})
  const [providerKeyLabels, setProviderKeyLabels] = useState<Record<string, string>>({})
  const [providerPlaceholders, setProviderPlaceholders] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        if (data.llmModelGroups.length > 0) setModelGroups(data.llmModelGroups)
        setLlmModel(data.user.llmModel || 'gemini-2.0-flash')
        setProviderHints(data.providerHints ?? {})
        setProviderKeyLabels(data.providerKeyLabels ?? {})
        setProviderPlaceholders(data.providerPlaceholders ?? {})
      })
      .catch(() => {})
  }, [])

  const selectedModel = useMemo(
    () =>
      modelGroups.flatMap((group) => group.models).find((option) => option.id === llmModel) as
        | ModelOption
        | undefined,
    [modelGroups, llmModel],
  )
  const selectedProvider = selectedModel?.provider ?? 'gemini'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.setLlmKey(apiKey.trim(), llmModel)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkip() {
    try {
      await api.skipLlmSetup()
      onSkip()
    } catch {
      onSkip()
    }
  }

  return (
    <div className="safe-top safe-bottom h-full overflow-y-auto bg-wa-bg p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto my-4 w-full max-w-lg rounded-2xl border border-border bg-white p-6 sm:my-0 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-wa-green/15 text-wa-green">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Enable AI food detection</h1>
            <p className="text-sm text-ink-muted">Optional — you can skip and use basic matching</p>
          </div>
        </div>

        <div className="mb-6 space-y-3 rounded-xl bg-wa-panel p-4 text-sm text-ink-muted">
          <p>With a free key from Google Gemini, Groq, or OpenRouter, BiteChat can:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Analyze messages and extract food items intelligently</li>
            <li>Generate recipes and shopping lists for new dishes</li>
            <li>Understand natural language like &quot;something spicy and cheap&quot;</li>
          </ul>
          <p className="text-xs">
            Your key is stored on the server and never sent back to the browser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">LLM model</span>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-wa-green/50"
            >
              {modelGroups.map((group) => (
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
              {providerKeyLabels[selectedProvider] ?? 'API key for selected provider'}
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerPlaceholders[selectedProvider] ?? 'Paste your API key'}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-wa-green/50"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              {providerHints[selectedProvider] ?? 'Use a key from your chosen provider.'}
              {selectedModel?.free ? ' This model has a free tier.' : ''}
            </p>
          </label>

          <button
            type="submit"
            disabled={!apiKey.trim() || submitting}
            className="w-full rounded-lg bg-wa-green py-3 text-sm font-semibold text-white hover:bg-wa-green-dark disabled:opacity-40"
          >
            Save and continue
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2 text-sm text-ink-muted hover:text-wa-green"
          >
            Skip for now — use app without AI
          </button>
        </form>
      </div>
    </div>
  )
}
