import { ChefHat, Clock } from 'lucide-react'
import type { CompletedOrder } from '../types'
import { formatOrderCount } from '../utils/orderSummary'

interface OrderHistoryPanelProps {
  completedOrders: CompletedOrder[]
  viewingOrderId: string | null
  onSelectOrder: (id: string) => void
  className?: string
}

export function OrderHistoryPanel({
  completedOrders,
  viewingOrderId,
  onSelectOrder,
  className = '',
}: OrderHistoryPanelProps) {
  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-border bg-cream-dark/40 md:w-80 md:border-l ${className}`}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-terracotta" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Past orders</h2>
            <p className="text-[11px] text-ink-muted">
              Recipes and shopping lists from completed orders
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {completedOrders.length === 0 ? (
          <p className="text-sm text-ink-muted">No completed orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {[...completedOrders].reverse().map((entry) => {
              const { dishes, totalItems } = formatOrderCount(entry.order.summary.items)
              const date = entry.completedAt.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })
              const time = entry.completedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
              const active = viewingOrderId === entry.id

              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelectOrder(entry.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-wa-green/40 bg-sage-soft'
                        : 'border-border bg-white hover:border-wa-green/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">
                        {dishes} dishes · {totalItems} items
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                        <Clock className="h-3 w-3" />
                        {date}
                      </span>
                    </div>
                    <p className="mt-1 text-xs capitalize text-ink-muted">
                      {entry.order.summary.items
                        .map((i) => i.food)
                        .filter((v, idx, arr) => arr.indexOf(v) === idx)
                        .slice(0, 4)
                        .join(', ')}
                      {dishes > 4 ? '…' : ''}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-muted">Completed {time}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
