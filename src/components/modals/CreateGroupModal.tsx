import { useState } from 'react'
import { X } from 'lucide-react'
import { getUserDisplayName } from '../../data/users'

interface CreateGroupModalProps {
  friends: string[]
  currentUsername: string
  onClose: () => void
  onCreate: (name: string, memberUsernames: string[]) => void
}

export function CreateGroupModal({
  friends,
  currentUsername,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  function toggleMember(username: string) {
    setSelected((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || selected.length === 0) return
    onCreate(name.trim(), [currentUsername, ...selected])
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
        className="safe-bottom flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Create group</h2>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Group name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday lunch crew"
            required
            className="w-full rounded-lg border border-border bg-wa-panel px-4 py-3 text-sm outline-none focus:border-wa-green/50"
          />
        </label>

        <p className="mb-2 text-xs font-medium text-ink-muted">Add members from friends</p>
        <div className="mb-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border sm:max-h-48">
          {friends.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">Add friends first to create a group.</p>
          ) : (
            friends.map((friend) => (
              <label
                key={friend}
                className="flex cursor-pointer items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-wa-hover"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(friend)}
                  onChange={() => toggleMember(friend)}
                  className="h-4 w-4 rounded border-border text-wa-green focus:ring-wa-green/30"
                />
                <span className="text-sm text-ink">{getUserDisplayName(friend)}</span>
                <span className="text-xs text-ink-muted">@{friend}</span>
              </label>
            ))
          )}
        </div>

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
            disabled={!name.trim() || selected.length === 0}
            className="rounded-lg bg-wa-green px-4 py-2 text-sm font-medium text-white hover:bg-wa-green-dark disabled:opacity-40"
          >
            Create group
          </button>
        </div>
      </form>
    </div>
  )
}
