import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  LogOut,
  MessageSquarePlus,
  MoreVertical,
  Search,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import type { Chat, User } from '../../types'
import { getUserDisplayName } from '../../data/users'
import { AddFriendModal } from '../modals/AddFriendModal'
import { CreateGroupModal } from '../modals/CreateGroupModal'
import { NewChatMenu } from '../modals/NewChatMenu'

interface ChatSidebarProps {
  user: User
  chats: Chat[]
  friends: string[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onLogout: () => void
  onOpenSettings: () => void
  onAddFriend: (username: string) => Promise<string | null>
  onCreateGroup: (name: string, memberUsernames: string[]) => void
  onStartDirectChat: (friendUsername: string) => void
}

function ChatAvatar({ chat }: { chat: Chat }) {
  const label =
    chat.type === 'group'
      ? chat.name
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : chat.name.slice(0, 2).toUpperCase()

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
        chat.archived
          ? 'bg-stone-200 text-stone-500'
          : chat.type === 'group'
            ? 'bg-terracotta/15 text-terracotta'
            : 'bg-wa-green/15 text-wa-green'
      }`}
    >
      {label}
    </div>
  )
}

function ChatListItem({
  chat,
  active,
  onSelect,
}: {
  chat: Chat
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${
        active ? 'bg-wa-hover' : 'hover:bg-wa-hover/70'
      }`}
    >
      <ChatAvatar chat={chat} />
      <div className="min-w-0 flex-1 border-b border-border/60 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-medium text-ink">
            {chat.name}
            {chat.archived && (
              <Archive className="ml-1.5 inline h-3 w-3 text-ink-muted" />
            )}
          </span>
          <span className="shrink-0 text-[11px] text-ink-muted">{chat.time}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-sm text-ink-muted">{chat.lastMessage}</p>
          {!chat.archived && chat.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-wa-green px-1.5 text-[11px] font-medium text-white">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function ChatSidebar({
  user,
  chats,
  friends,
  activeChatId,
  onSelectChat,
  onLogout,
  onOpenSettings,
  onAddFriend,
  onCreateGroup,
  onStartDirectChat,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return chats
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) ||
        chat.lastMessage.toLowerCase().includes(q),
    )
  }, [chats, search])

  const activeChats = filtered.filter((c) => !c.archived)
  const archivedChats = filtered.filter((c) => c.archived)

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-sidebar-menu]')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  return (
    <>
      <aside className="flex h-full w-full flex-col border-r border-border bg-white md:w-[360px] md:shrink-0">
        <header className="safe-top relative flex items-center justify-between bg-wa-panel px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wa-green text-sm font-semibold text-white">
              {user.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{user.displayName}</p>
              <p className="text-xs text-ink-muted">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1" data-sidebar-menu>
            <button
              type="button"
              onClick={() => setShowNewMenu(true)}
              className="rounded-full p-2 text-ink-muted transition hover:bg-wa-hover hover:text-wa-green"
              aria-label="New chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-2 text-ink-muted transition hover:bg-wa-hover"
              aria-label="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-3 top-14 z-20 w-48 rounded-lg border border-border bg-white py-1 sm:right-4">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-wa-hover"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFriend(true)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-wa-hover"
                >
                  <UserPlus className="h-4 w-4" />
                  Add friend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-terracotta hover:bg-wa-hover"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="bg-wa-panel px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none ring-1 ring-border focus:ring-wa-green/40"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto" aria-label="Chats">
          {activeChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              onSelect={() => onSelectChat(chat.id)}
            />
          ))}

          {archivedChats.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Archive className="h-3.5 w-3.5" />
                Archived
              </p>
              {archivedChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  active={chat.id === activeChatId}
                  onSelect={() => onSelectChat(chat.id)}
                />
              ))}
            </div>
          )}
        </nav>

        {friends.length > 0 && (
          <div className="border-t border-border bg-wa-panel px-4 py-2">
            <p className="flex items-center gap-1 text-[11px] font-medium text-ink-muted">
              <Users className="h-3 w-3" />
              {friends.length} friend{friends.length !== 1 ? 's' : ''}:{' '}
              {friends.map(getUserDisplayName).join(', ')}
            </p>
          </div>
        )}
      </aside>

      {showNewMenu && (
        <NewChatMenu
          friends={friends}
          onClose={() => setShowNewMenu(false)}
          onNewGroup={() => {
            setShowNewMenu(false)
            setShowCreateGroup(true)
          }}
          onNewDirect={(friend) => {
            setShowNewMenu(false)
            onStartDirectChat(friend)
          }}
          onAddFriend={() => {
            setShowNewMenu(false)
            setShowAddFriend(true)
          }}
        />
      )}

      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onAdd={onAddFriend}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          friends={friends}
          currentUsername={user.username}
          onClose={() => setShowCreateGroup(false)}
          onCreate={onCreateGroup}
        />
      )}
    </>
  )
}
