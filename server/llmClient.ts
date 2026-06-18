import { getLlmProvider, normalizeLlmModel, type LlmProvider } from './llmModels.js'

const OPENAI_COMPAT_ENDPOINTS: Record<Exclude<LlmProvider, 'gemini'>, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

const MAX_RATE_LIMIT_RETRIES = 2

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryDelayMs(body: string): number | null {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string; details?: { '@type'?: string; retryDelay?: string }[] }
    }

    for (const detail of json.error?.details ?? []) {
      if (detail['@type']?.includes('RetryInfo') && detail.retryDelay) {
        const seconds = Number.parseFloat(detail.retryDelay.replace(/[^\d.]/g, ''))
        if (!Number.isNaN(seconds) && seconds > 0) {
          return Math.min(Math.ceil(seconds * 1000) + 500, 60_000)
        }
      }
    }

    const retryMatch = json.error?.message?.match(/retry in ([\d.]+)s/i)
    if (retryMatch) {
      return Math.min(Math.ceil(Number.parseFloat(retryMatch[1]) * 1000) + 500, 60_000)
    }
  } catch {
    // ignore parse errors
  }

  return null
}

export function formatLlmError(status: number, body: string, provider: string, model?: string) {
  let message = body
  let modelFromError: string | undefined

  try {
    const json = JSON.parse(body) as {
      error?: {
        message?: string
        code?: number
        status?: string
        details?: { violations?: { quotaDimensions?: { model?: string } }[] }[]
      }
      message?: string
    }
    message = json.error?.message ?? json.message ?? body

    for (const detail of json.error?.details ?? []) {
      for (const violation of detail.violations ?? []) {
        if (violation.quotaDimensions?.model) {
          modelFromError = violation.quotaDimensions.model
        }
      }
    }
  } catch {
    // keep raw body
  }

  const modelLabel = modelFromError ?? model

  if (status === 429 || /RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(message)) {
    const modelHint = modelLabel ? ` (${modelLabel})` : ''
    return [
      `Gemini free-tier quota exceeded${modelHint}.`,
      'Each model has its own daily/minute limits — try Gemini 2.0 Flash, switch to Groq (Llama 3.1 8B), or wait and retry.',
      'Chat still works with basic keyword matching until AI is available again.',
    ].join(' ')
  }

  if (status === 401 || status === 403) {
    return `Invalid or unauthorized API key for ${provider}. Check your key in Settings.`
  }

  if (status === 404) {
    return `Model not found for ${provider}${model ? `: ${model}` : ''}. Pick a different model in Settings.`
  }

  const short = message.replace(/\s+/g, ' ').trim().slice(0, 240)
  return `LLM request failed (${provider}): ${short}${message.length > 240 ? '…' : ''}`
}

async function requestWithRateLimitRetry(
  provider: string,
  model: string | undefined,
  request: () => Promise<Response>,
): Promise<Response> {
  let lastResponse: Response | undefined
  let lastBody = ''

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const response = await request()
    if (response.ok) return response

    lastResponse = response
    lastBody = await response.text()

    const shouldRetry =
      response.status === 429 &&
      attempt < MAX_RATE_LIMIT_RETRIES &&
      parseRetryDelayMs(lastBody) !== null

    if (!shouldRetry) break

    const delayMs = parseRetryDelayMs(lastBody) ?? 10_000
    await sleep(delayMs)
  }

  throw new Error(formatLlmError(lastResponse!.status, lastBody, provider, model))
}

async function callOpenAiCompatible(
  provider: Exclude<LlmProvider, 'gemini'>,
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:5173'
    headers['X-Title'] = 'BiteChat'
  }

  const modelId = normalizeLlmModel(model)
  const response = await requestWithRateLimitRetry(provider, modelId, () =>
    fetch(OPENAI_COMPAT_ENDPOINTS[provider], {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    }),
  )

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0]?.message?.content ?? '{}'
}

async function callGemini(
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const modelId = normalizeLlmModel(model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`

  const response = await requestWithRateLimitRetry('gemini', modelId, () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }),
  )

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
}

export async function callLlm(
  apiKey: string,
  model: string | null | undefined,
  system: string,
  user: string,
): Promise<string> {
  const provider = getLlmProvider(model)
  if (provider === 'gemini') {
    return callGemini(apiKey, model ?? '', system, user)
  }
  return callOpenAiCompatible(provider, apiKey, model ?? '', system, user)
}
