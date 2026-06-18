export type LlmProvider = 'openai' | 'gemini' | 'groq' | 'mistral' | 'openrouter'

export interface LlmModelOption {
  id: string
  label: string
  provider: LlmProvider
  group: string
  free?: boolean
}

export const DEFAULT_LLM_MODEL = 'gemini-2.0-flash'

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  // Google Gemini — free tier via AI Studio
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash (free tier)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash (free tier)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash (free tier)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite (free tier, stricter limits)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash (free tier)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },
  {
    id: 'gemini-1.5-flash-8b',
    label: 'Gemini 1.5 Flash 8B (free tier)',
    provider: 'gemini',
    group: 'Google Gemini',
    free: true,
  },

  // Groq — free tier, OpenAI-compatible (recommended if Gemini quota is exhausted)
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant (Groq, free — good fallback)',
    provider: 'groq',
    group: 'Groq',
    free: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B (Groq, free tier)',
    provider: 'groq',
    group: 'Groq',
    free: true,
  },
  {
    id: 'gemma2-9b-it',
    label: 'Gemma 2 9B (Groq, free tier)',
    provider: 'groq',
    group: 'Groq',
    free: true,
  },

  // OpenRouter — free models
  {
    id: 'google/gemma-2-9b-it:free',
    label: 'Gemma 2 9B (OpenRouter, free)',
    provider: 'openrouter',
    group: 'OpenRouter',
    free: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    label: 'Llama 3.2 3B (OpenRouter, free)',
    provider: 'openrouter',
    group: 'OpenRouter',
    free: true,
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    label: 'Phi-3 Mini (OpenRouter, free)',
    provider: 'openrouter',
    group: 'OpenRouter',
    free: true,
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    label: 'Qwen 2 7B (OpenRouter, free)',
    provider: 'openrouter',
    group: 'OpenRouter',
    free: true,
  },

  // Mistral — free tier on La Plateforme
  {
    id: 'open-mistral-nemo',
    label: 'Mistral Nemo (free tier)',
    provider: 'mistral',
    group: 'Mistral',
    free: true,
  },
  {
    id: 'mistral-small-latest',
    label: 'Mistral Small',
    provider: 'mistral',
    group: 'Mistral',
  },

  // OpenAI
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini (fast, low cost)',
    provider: 'openai',
    group: 'OpenAI',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o (balanced)',
    provider: 'openai',
    group: 'OpenAI',
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    provider: 'openai',
    group: 'OpenAI',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'openai',
    group: 'OpenAI',
  },
  {
    id: 'gpt-4.1-nano',
    label: 'GPT-4.1 Nano (fastest)',
    provider: 'openai',
    group: 'OpenAI',
  },
]

export const LLM_MODEL_GROUPS = [...new Set(LLM_MODEL_OPTIONS.map((option) => option.group))].map(
  (name) => ({
    name,
    models: LLM_MODEL_OPTIONS.filter((option) => option.group === name),
  }),
)

const MODEL_BY_ID = new Map(LLM_MODEL_OPTIONS.map((option) => [option.id, option]))

export function normalizeLlmModel(model: string | null | undefined) {
  const trimmed = model?.trim()
  return trimmed || DEFAULT_LLM_MODEL
}

export function getLlmModelOption(model: string) {
  return MODEL_BY_ID.get(normalizeLlmModel(model))
}

export function getLlmProvider(model: string): LlmProvider {
  const option = getLlmModelOption(model)
  if (option) return option.provider

  const id = normalizeLlmModel(model)
  if (id.startsWith('gemini-')) return 'gemini'
  if (id.startsWith('gpt-')) return 'openai'
  if (id.startsWith('llama-') || id.startsWith('gemma2-') || id.startsWith('mixtral-')) {
    return 'groq'
  }
  if (id.startsWith('mistral-') || id.startsWith('open-mistral-')) return 'mistral'
  if (id.includes('/') || id.endsWith(':free')) return 'openrouter'

  return 'openai'
}

export function getApiKeyHint(provider: LlmProvider) {
  switch (provider) {
    case 'gemini':
      return 'Google AI Studio key — free tier at aistudio.google.com/apikey (quotas are per model; try Groq if you hit limits)'
    case 'groq':
      return 'Groq key (gsk_…) — free tier at console.groq.com'
    case 'openrouter':
      return 'OpenRouter key (sk-or-…) — free models at openrouter.ai'
    case 'mistral':
      return 'Mistral API key — free tier at console.mistral.ai'
    default:
      return 'OpenAI key (sk-…) — platform.openai.com'
  }
}

export const LLM_PROVIDER_KEY_LABELS: Record<LlmProvider, string> = {
  openai: 'OpenAI API key',
  gemini: 'Google AI Studio API key',
  groq: 'Groq API key',
  mistral: 'Mistral API key',
  openrouter: 'OpenRouter API key',
}

export const LLM_PROVIDER_PLACEHOLDERS: Record<LlmProvider, string> = {
  openai: 'sk-…',
  gemini: 'AIza…',
  groq: 'gsk_…',
  mistral: 'Paste Mistral key',
  openrouter: 'sk-or-…',
}

export function isAllowedLlmModel(model: string) {
  const normalized = normalizeLlmModel(model)
  if (MODEL_BY_ID.has(normalized)) return true

  return (
    /^gemini-[\w.-]+$/.test(normalized) ||
    /^gpt-[\w.-]+$/.test(normalized) ||
    /^llama-[\w.-]+$/.test(normalized) ||
    /^gemma2-[\w.-]+$/.test(normalized) ||
    /^mistral-[\w.-]+$/.test(normalized) ||
    /^open-mistral-[\w.-]+$/.test(normalized) ||
    /^[\w.-]+\/[\w.-]+(:free)?$/.test(normalized)
  )
}
