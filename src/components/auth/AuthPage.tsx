import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<string | null>
  onRegister: (
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<string | null>
}

export function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err =
      mode === 'login'
        ? await onLogin(username, password)
        : await onRegister(username, password, displayName || undefined)
    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div className="safe-top safe-bottom h-full overflow-y-auto bg-wa-bg p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto my-4 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white sm:my-0">
        <div className="bg-wa-green px-6 py-8 text-center text-white sm:px-8 sm:py-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">BiteChat</h1>
          <p className="mt-2 text-sm text-white/80">
            Order food together with AI-powered chat
          </p>
        </div>

        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-sm font-medium ${
              mode === 'login' ? 'border-b-2 border-wa-green text-wa-green' : 'text-ink-muted'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-sm font-medium ${
              mode === 'register'
                ? 'border-b-2 border-wa-green text-wa-green'
                : 'text-ink-muted'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
          {error && (
            <p className="rounded-lg bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          {mode === 'register' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Display name
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How friends see you"
                className="w-full rounded-lg border border-border bg-wa-panel px-4 py-3 text-sm text-ink outline-none focus:border-wa-green/50"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg border border-border bg-wa-panel px-4 py-3 text-sm text-ink outline-none focus:border-wa-green/50"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-wa-panel px-4 py-3 text-sm text-ink outline-none focus:border-wa-green/50"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-wa-green py-3 text-sm font-semibold text-white transition hover:bg-wa-green-dark disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {mode === 'login' && (
            <p className="text-center text-xs text-ink-muted">
              Demo: maya / demo123 (seeded on first server start)
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
