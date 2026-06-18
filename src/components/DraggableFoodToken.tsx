import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import { useTouchInteraction } from '../hooks/useTouchInteraction'
import { zoneLabels } from '../data/seedData'
import type { OrderZone } from '../types'

export interface DragFoodPayload {
  food: string
  messageId: string
  author: string
}

export const FOOD_DRAG_TYPE = 'application/x-bitechat-food'

const zones: OrderZone[] = ['my-plate', 'shared-pool', 'extras']

interface FoodZonePickerProps {
  food: string
  onPick: (zone: OrderZone) => void
  onClose: () => void
  touchMode: boolean
}

function FoodZonePicker({ food, onPick, onClose, touchMode }: FoodZonePickerProps) {
  if (touchMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="safe-bottom w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Add ${food} to order`}
        >
          <p className="mb-1 text-base font-semibold text-ink">Add to order board</p>
          <p className="mb-4 text-sm capitalize text-ink-muted">&ldquo;{food}&rdquo;</p>
          <div className="space-y-2">
            {zones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => onPick(zone)}
                className="flex w-full flex-col rounded-xl border border-border bg-wa-panel px-4 py-3 text-left transition active:bg-wa-hover"
              >
                <span className="text-sm font-medium text-ink">{zoneLabels[zone].title}</span>
                <span className="mt-0.5 text-xs text-ink-muted">{zoneLabels[zone].hint}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2.5 text-sm text-ink-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <span className="absolute left-0 top-full z-30 mt-1 flex min-w-[11rem] flex-col rounded-lg border border-border bg-white py-1 shadow-lg">
      {zones.map((zone) => (
        <button
          key={zone}
          type="button"
          onClick={() => onPick(zone)}
          className="px-3 py-2 text-left text-xs text-ink hover:bg-wa-hover"
        >
          <span className="font-medium">{zoneLabels[zone].title}</span>
          <span className="mt-0.5 block text-[10px] text-ink-muted">{zoneLabels[zone].hint}</span>
        </button>
      ))}
    </span>
  )
}

interface DraggableFoodTokenProps {
  food: string
  messageId: string
  author: string
  used?: boolean
  onAddToZone?: (payload: DragFoodPayload, zone: OrderZone) => void
}

export function DraggableFoodToken({
  food,
  messageId,
  author,
  used = false,
  onAddToZone,
}: DraggableFoodTokenProps) {
  const payload: DragFoodPayload = { food, messageId, author }
  const touchMode = useTouchInteraction()
  const [pickerOpen, setPickerOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!pickerOpen || touchMode) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false)
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [pickerOpen, touchMode])

  function openPicker() {
    if (used || !onAddToZone) return
    setPickerOpen(true)
  }

  function pickZone(zone: OrderZone) {
    onAddToZone?.(payload, zone)
    setPickerOpen(false)
  }

  const tokenClass = `group inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition select-none touch-manipulation ${
    used
      ? 'cursor-default border-border/60 bg-cream-dark/50 text-ink-muted line-through'
      : touchMode
        ? 'cursor-pointer border-terracotta/40 bg-terracotta-soft text-terracotta active:scale-[0.98] active:bg-terracotta/20'
        : 'cursor-grab border-terracotta/25 bg-terracotta-soft text-terracotta active:cursor-grabbing hover:border-terracotta/50'
  }`

  return (
    <>
      <span ref={rootRef} className="relative inline-block align-middle">
        {touchMode ? (
          <button
            type="button"
            disabled={used || !onAddToZone}
            onClick={openPicker}
            className={tokenClass}
            title={used ? 'Already added to order board' : 'Tap to add to order board'}
          >
            {!used && onAddToZone && <Plus className="h-3 w-3 shrink-0 opacity-80" />}
            {food}
          </button>
        ) : (
          <span
            draggable={!used}
            onDragStart={(e) => {
              e.dataTransfer.setData(FOOD_DRAG_TYPE, JSON.stringify(payload))
              e.dataTransfer.effectAllowed = 'copy'
            }}
            onClick={() => {
              if (!used && onAddToZone) setPickerOpen((open) => !open)
            }}
            className={tokenClass}
            title={used ? 'Already added to order board' : 'Drag or click to add to order board'}
          >
            {!used && <GripVertical className="h-3 w-3 opacity-40 group-hover:opacity-70" />}
            {food}
          </span>
        )}

        {pickerOpen && onAddToZone && !touchMode && (
          <FoodZonePicker
            food={food}
            touchMode={false}
            onPick={pickZone}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </span>

      {pickerOpen && onAddToZone && touchMode && (
        <FoodZonePicker
          food={food}
          touchMode
          onPick={pickZone}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}

interface MessageBodyProps {
  text: string
  foodItems: string[]
  messageId: string
  author: string
  usedFoods: Set<string>
  onAddToZone?: (payload: DragFoodPayload, zone: OrderZone) => void
}

export function MessageBody({
  text,
  foodItems,
  messageId,
  author,
  usedFoods,
  onAddToZone,
}: MessageBodyProps) {
  if (foodItems.length === 0) {
    return <span>{text}</span>
  }

  const parts: ReactNode[] = []
  let remaining = text
  const sortedItems = [...foodItems].sort((a, b) => b.length - a.length)

  while (remaining.length > 0) {
    let matched = false
    for (const food of sortedItems) {
      const idx = remaining.toLowerCase().indexOf(food.toLowerCase())
      if (idx !== -1) {
        if (idx > 0) {
          parts.push(remaining.slice(0, idx))
        }
        const actual = remaining.slice(idx, idx + food.length)
        const key = `${messageId}-${food}-${idx}`
        parts.push(
          <DraggableFoodToken
            key={key}
            food={actual}
            messageId={messageId}
            author={author}
            used={usedFoods.has(`${messageId}:${food.toLowerCase()}`)}
            onAddToZone={onAddToZone}
          />,
        )
        remaining = remaining.slice(idx + food.length)
        matched = true
        break
      }
    }
    if (!matched) {
      parts.push(remaining)
      break
    }
  }

  return <span className="leading-relaxed">{parts}</span>
}
