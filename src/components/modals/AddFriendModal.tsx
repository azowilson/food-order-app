import { useState } from 'react'
import { X } from 'lucide-react'
import { DEMO_USERNAMES } from '../../data/users'

interface AddFriendModalProps {
  onClose: () => void
  onAdd: (username: string) => Promise<string | null>
}

export function AddFriendModal({ onClose, onAdd }: AddFriendModalProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await onAdd(username.trim())
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Add friend</h2>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Enter their username to add them. Try:{' '}
          {DEMO_USERNAMES.join(', ')}
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
            {error}
          </p>
        )}

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="mb-4 w-full rounded-lg border border-border bg-wa-panel px-4 py-3 text-sm outline-none focus:border-wa-green/50"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:bg-wa-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-wa-green px-4 py-2 text-sm font-medium text-white hover:bg-wa-green-dark disabled:opacity-50"
          >
            Add friend
          </button>
        </div>
      </form>
    </div>
  )
}
