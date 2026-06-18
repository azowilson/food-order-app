import { Archive, ArrowLeft, User, Users } from 'lucide-react'
import { getMemberDisplayNames } from '../../data/users'
import type { Chat } from '../../types'

interface ChatHeaderProps {
  chat: Chat
  archived?: boolean
  onBack?: () => void
}

export function ChatHeader({ chat, archived, onBack }: ChatHeaderProps) {
  const members = getMemberDisplayNames(chat.memberUsernames)

  return (
    <header className="safe-top flex items-center justify-between gap-2 border-b border-border bg-wa-panel px-3 py-2.5 sm:px-5 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-wa-hover md:hidden"
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10 ${
            chat.type === 'group'
              ? 'bg-terracotta/15 text-terracotta'
              : 'bg-wa-green/15 text-wa-green'
          }`}
        >
          {chat.type === 'group' ? (
            <Users className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{chat.name}</h2>
          <p className="truncate text-xs text-ink-muted">
            {chat.type === 'group' ? members.join(', ') : 'Direct chat'}
          </p>
        </div>
      </div>
      {archived ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:px-3 sm:text-xs">
          <Archive className="h-3.5 w-3.5" />
          <span className="sm:inline">Archived</span>
        </div>
      ) : (
        <div className="shrink-0 rounded-full border border-sage/30 bg-sage-soft px-2.5 py-1 text-[11px] font-medium text-sage sm:px-3 sm:text-xs">
          <span className="hidden sm:inline">Ordering open</span>
          <span className="sm:hidden">Open</span>
        </div>
      )}
    </header>
  )
}
