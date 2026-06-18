import { useState } from 'react'
import { useTouchInteraction } from '../hooks/useTouchInteraction'
import { ArrowRight, Loader2, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { zoneLabels } from '../data/seedData'
import type { OrderItem, OrderZone } from '../types'
import { FOOD_DRAG_TYPE, type DragFoodPayload } from './DraggableFoodToken'

interface OrderBoardProps {
  items: OrderItem[]
  onAddItem: (payload: DragFoodPayload, zone: OrderZone) => void
  onRemoveItem: (id: string) => void
  onClearBoard: () => void
  onSubmit: () => void
  submitting?: boolean
  className?: string
}

const zones: OrderZone[] = ['my-plate', 'shared-pool', 'extras']

function DropZone({
  zone,
  items,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveItem,
  touchMode,
}: {
  zone: OrderZone
  items: OrderItem[]
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onRemoveItem: (id: string) => void
  touchMode: boolean
}) {
  const meta = zoneLabels[zone]

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-3 transition ${
        isDragOver
          ? 'border-terracotta bg-terracotta-soft/80'
          : 'border-border bg-white/60'
      }`}
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-ink">{meta.title}</h3>
        <p className="text-[11px] text-ink-muted">{meta.hint}</p>
      </div>

      {items.length === 0 ? (
        <div
          className={`rounded-lg border border-dashed py-6 text-center text-xs ${
            isDragOver ? 'border-terracotta/40 text-terracotta' : 'border-border/80 text-ink-muted'
          }`}
        >
          {touchMode ? 'Tap highlighted food in chat to add here' : 'Drop food items here'}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize text-ink">{item.food}</p>
                <p className="text-[11px] text-ink-muted">from {item.fromAuthor}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="shrink-0 rounded p-1 text-ink-muted opacity-100 transition hover:bg-cream-dark hover:text-terracotta md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Remove ${item.food}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function OrderBoard({
  items,
  onAddItem,
  onRemoveItem,
  onClearBoard,
  onSubmit,
  submitting = false,
  className = '',
}: OrderBoardProps) {
  const touchMode = useTouchInteraction()
  const [dragOverZone, setDragOverZone] = useState<OrderZone | null>(null)

  function parsePayload(e: React.DragEvent): DragFoodPayload | null {
    const raw = e.dataTransfer.getData(FOOD_DRAG_TYPE)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DragFoodPayload
    } catch {
      return null
    }
  }

  function handleDragOver(e: React.DragEvent, zone: OrderZone) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverZone(zone)
  }

  function handleDrop(e: React.DragEvent, zone: OrderZone) {
    e.preventDefault()
    setDragOverZone(null)
    const payload = parsePayload(e)
    if (payload) onAddItem(payload, zone)
  }

  const myItems = items.filter((i) => i.zone === 'my-plate')
  const sharedItems = items.filter((i) => i.zone === 'shared-pool')
  const extraItems = items.filter((i) => i.zone === 'extras')

  const zoneItems: Record<OrderZone, OrderItem[]> = {
    'my-plate': myItems,
    'shared-pool': sharedItems,
    extras: extraItems,
  }

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-border bg-cream-dark/40 md:w-80 md:border-l ${className}`}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-terracotta" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Order board</h2>
            <p className="text-[11px] text-ink-muted">
              {touchMode
                ? 'Tap + food tags in chat, then pick a zone'
                : 'Drag from chat into zones'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {zones.map((zone) => (
          <DropZone
            key={zone}
            zone={zone}
            items={zoneItems[zone]}
            isDragOver={dragOverZone === zone}
            onDragOver={(e) => handleDragOver(e, zone)}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, zone)}
            onRemoveItem={onRemoveItem}
            touchMode={touchMode}
          />
        ))}
      </div>

      <div className="border-t border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-ink-muted">
          <span>{items.length} items queued</span>
          <span>{myItems.length} for you</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={items.length === 0 || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage py-2.5 text-sm font-medium text-white transition hover:bg-sage/90 disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating order…
            </>
          ) : (
            <>
              Submit group order
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClearBoard}
          disabled={items.length === 0 || submitting}
          className="mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs text-ink-muted transition hover:text-terracotta disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear board
        </button>
      </div>
    </aside>
  )
}

export { type DragFoodPayload }
