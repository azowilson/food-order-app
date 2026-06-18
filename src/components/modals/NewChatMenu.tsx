import { UserPlus, Users, X } from 'lucide-react'
import { getUserDisplayName } from '../../data/users'

interface NewChatMenuProps {
  friends: string[]
  onClose: () => void
  onNewGroup: () => void
  onNewDirect: (friendUsername: string) => void
  onAddFriend: () => void
}

export function NewChatMenu({
  friends,
  onClose,
  onNewGroup,
  onNewDirect,
  onAddFriend,
}: NewChatMenuProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="safe-bottom w-full max-w-sm rounded-t-2xl bg-white p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-muted hover:bg-wa-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewGroup}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-wa-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/15 text-terracotta">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">New group</p>
            <p className="text-xs text-ink-muted">Order food with multiple friends</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onAddFriend}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-wa-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wa-green/15 text-wa-green">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Add friend</p>
            <p className="text-xs text-ink-muted">Find someone by username</p>
          </div>
        </button>

        {friends.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 px-1 text-xs font-medium text-ink-muted">Message a friend</p>
            {friends.map((friend) => (
              <button
                key={friend}
                type="button"
                onClick={() => onNewDirect(friend)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-wa-hover"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wa-green/15 text-xs font-semibold text-wa-green">
                  {getUserDisplayName(friend).slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm text-ink">{getUserDisplayName(friend)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
