import { Check } from 'lucide-react'
import type { AggregatedIngredient } from '../types'
import { ingredientKey, sortShoppingList } from '../utils/shoppingList'

interface ShoppingListProps {
  items: AggregatedIngredient[]
  checkedItems: string[]
  onToggleItem: (key: string) => void
  readOnly?: boolean
}

export function ShoppingList({
  items,
  checkedItems,
  onToggleItem,
  readOnly = false,
}: ShoppingListProps) {
  const sorted = sortShoppingList(items, checkedItems)
  const checkedCount = checkedItems.length
  const totalCount = items.length
  const allChecked = totalCount > 0 && checkedCount === totalCount

  return (
    <div className="flex min-h-0 flex-col md:flex-1 md:overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">
            {readOnly
              ? 'Items picked up for this order'
              : allChecked
                ? 'All ingredients picked up'
                : 'Check off items as you shop'}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              allChecked
                ? 'bg-sage-soft text-sage'
                : 'bg-cream-dark text-ink-muted'
            }`}
          >
            {checkedCount}/{totalCount}
          </span>
        </div>
        {totalCount > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-sage transition-all duration-300"
              style={{ width: `${Math.round((checkedCount / totalCount) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <ul className="space-y-1">
          {sorted.map((item) => {
            const key = ingredientKey(item.name)
            const isChecked = checkedItems.includes(key)

            return (
              <li key={key}>
                {readOnly ? (
                  <div
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 ${
                      isChecked
                        ? 'border-border/60 bg-cream-dark/40'
                        : 'border-border bg-white'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isChecked
                          ? 'border-sage bg-sage text-white'
                          : 'border-border bg-white'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isChecked ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isChecked ? 'text-ink-muted/70 line-through' : 'text-ink-muted'
                        }`}
                      >
                        {item.amounts.join(' + ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleItem(key)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                      isChecked
                        ? 'border-border/60 bg-cream-dark/40'
                        : 'border-border bg-white hover:border-sage/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        isChecked
                          ? 'border-sage bg-sage text-white'
                          : 'border-border bg-white'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium transition ${
                          isChecked ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs transition ${
                          isChecked ? 'text-ink-muted/70 line-through' : 'text-ink-muted'
                        }`}
                      >
                        {item.amounts.join(' + ')}
                      </p>
                    </div>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
