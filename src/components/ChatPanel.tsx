import type { ChatMessage } from '../types'
import { MessageBody } from './DraggableFoodToken'

const avatarColors = [
  'bg-terracotta/15 text-terracotta',
  'bg-sage/15 text-sage',
  'bg-stone-200 text-stone-600',
  'bg-amber-100 text-amber-800',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

interface ChatMessageBubbleProps {
  message: ChatMessage
  showAuthor: boolean
  usedFoods: Set<string>
  readOnly?: boolean
  onAddToZone?: (payload: import('./DraggableFoodToken').DragFoodPayload, zone: import('../types').OrderZone) => void
}

export function ChatMessageBubble({
  message,
  showAuthor,
  usedFoods,
  readOnly = false,
  onAddToZone,
}: ChatMessageBubbleProps) {
  if (message.system) {
    return (
      <div className="flex justify-center py-1">
        <p className="max-w-md rounded-lg bg-white/80 px-3 py-1.5 text-center text-xs text-ink-muted">
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`flex gap-3 ${message.isSelf ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!message.isSelf && (
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            showAuthor ? avatarColor(message.author) : 'invisible'
          }`}
          aria-hidden={!showAuthor}
        >
          {message.authorInitials}
        </div>
      )}

      <div
        className={`max-w-[min(520px,85%)] ${message.isSelf ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {showAuthor && !message.isSelf && (
          <span className="mb-1 text-xs font-medium text-ink-muted">
            {message.author}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm text-ink ${
            message.isSelf
              ? 'rounded-tr-md bg-bubble-self'
              : 'rounded-tl-md border border-border/80 bg-bubble-other'
          }`}
        >
          {readOnly || message.foodItems.length === 0 ? (
            <span className="leading-relaxed">{message.text}</span>
          ) : (
            <MessageBody
              text={message.text}
              foodItems={message.foodItems}
              messageId={message.id}
              author={message.author}
              usedFoods={usedFoods}
              onAddToZone={onAddToZone}
            />
          )}
        </div>
        <span
          className={`mt-1 text-[11px] text-ink-muted ${message.isSelf ? 'text-right' : 'text-left'}`}
        >
          {message.time}
        </span>
      </div>
    </div>
  )
}

interface ChatPanelProps {
  messages: ChatMessage[]
  usedFoods: Set<string>
  composer: React.ReactNode | null
  archived?: boolean
  onAddToZone?: (payload: import('./DraggableFoodToken').DragFoodPayload, zone: import('../types').OrderZone) => void
  className?: string
}

export function ChatPanel({
  messages,
  usedFoods,
  composer,
  archived = false,
  onAddToZone,
  className = '',
}: ChatPanelProps) {
  return (
    <section className={`flex min-w-0 flex-1 flex-col bg-wa-chat-bg ${className}`}>
      {!archived && (
        <div className="border-b border-border/80 bg-white/60 px-3 py-2 sm:px-5 sm:py-2.5">
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-wa-green">Tip:</span>{' '}
            <span className="md:hidden">
              Tap <span className="font-medium text-terracotta">+ food tags</span> in messages to
              add them — then check the Order tab.
            </span>
            <span className="hidden md:inline">
              Drag highlighted food from messages into the order board, or click a tag to pick a
              zone.
            </span>
          </p>
        </div>
      )}

      {archived && (
        <div className="border-b border-border/80 bg-white/60 px-3 py-2 sm:px-5 sm:py-2.5">
          <p className="text-xs text-ink-muted">
            This chat is archived. Messages are read-only — open past orders on the
            <span className="hidden md:inline"> right</span>
            <span className="md:hidden"> Past orders tab</span>.
          </p>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
        {messages.map((message, index) => {
          const prev = messages[index - 1]
          const showAuthor = Boolean(
            !message.system && (!prev || prev.author !== message.author || prev.system),
          )
          return (
            <ChatMessageBubble
              key={message.id}
              message={message}
              showAuthor={showAuthor}
              usedFoods={usedFoods}
              readOnly={archived}
              onAddToZone={onAddToZone}
            />
          )
        })}
      </div>

      {composer}
    </section>
  )
}
