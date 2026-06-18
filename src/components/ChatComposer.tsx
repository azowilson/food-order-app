import { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatComposerProps {
  onSend: (text: string, foodItems: string[]) => void
}

export function ChatComposer({ onSend }: ChatComposerProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed, [])
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="safe-bottom border-t border-border bg-white px-3 py-3 sm:px-5 sm:py-4"
    >
      <p className="mb-2 hidden text-[11px] text-ink-muted sm:block">
        Food items are detected by AI when you send (or basic matching without a key).
      </p>
      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          rows={1}
          placeholder="Type what you want to eat..."
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none focus:border-terracotta/40"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta text-white transition hover:bg-terracotta/90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
