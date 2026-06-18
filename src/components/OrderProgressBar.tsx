import {
  Check,
  ChevronRight,
  Circle,
  ShoppingCart,
  ChefHat,
  Flame,
} from 'lucide-react'
import {
  getNextProgressStage,
  getProgressIndex,
  getProgressPercent,
  ORDER_PROGRESS_STEPS,
} from '../data/orderProgress'
import type { OrderProgressStage } from '../types'

const stageIcons = {
  confirmed: Check,
  'buying-ingredients': ShoppingCart,
  preparing: ChefHat,
  finished: Flame,
} as const

interface OrderProgressBarProps {
  currentStage: OrderProgressStage
  updatedAt: Date
  onAdvance?: () => void
  canAdvance?: boolean
}

export function OrderProgressBar({
  currentStage,
  updatedAt,
  onAdvance,
  canAdvance = false,
}: OrderProgressBarProps) {
  const currentIndex = getProgressIndex(currentStage)
  const percent = getProgressPercent(currentStage)
  const nextStage = getNextProgressStage(currentStage)
  const nextLabel = ORDER_PROGRESS_STEPS.find((step) => step.id === nextStage)?.label

  return (
    <section className="shrink-0 border-b border-border bg-white px-3 py-2.5 sm:px-5 sm:py-4">
      <div className="mb-2 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">Order progress</h3>
          <p className="text-xs text-ink-muted">
            <span className="md:hidden">
              {ORDER_PROGRESS_STEPS[currentIndex]?.label} · step {currentIndex + 1} of{' '}
              {ORDER_PROGRESS_STEPS.length}
            </span>
            <span className="hidden md:inline">
              Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        {canAdvance && nextStage && onAdvance && (
          <button
            type="button"
            onClick={onAdvance}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sage/40 bg-sage-soft px-3 py-2 text-xs font-medium text-sage transition hover:bg-sage/10 sm:w-auto sm:py-1.5"
          >
            Mark: {nextLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-cream-dark sm:mb-4 sm:h-2">
        <div
          className="h-full rounded-full bg-sage transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Mobile: compact pip stepper */}
      <ol className="flex items-center gap-1 md:hidden">
        {ORDER_PROGRESS_STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isComplete
                    ? 'bg-sage text-white'
                    : isCurrent
                      ? 'bg-sage-soft text-sage ring-2 ring-sage/30'
                      : 'bg-cream-dark text-ink-muted'
                }`}
                title={step.label}
              >
                {isComplete ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              {index < ORDER_PROGRESS_STEPS.length - 1 && (
                <span
                  className={`h-0.5 min-w-2 flex-1 rounded-full ${
                    isComplete ? 'bg-sage' : 'bg-cream-dark'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Desktop: full step cards */}
      <ol className="hidden gap-3 md:grid md:grid-cols-4">
        {ORDER_PROGRESS_STEPS.map((step, index) => {
          const Icon = stageIcons[step.id]
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <li
              key={step.id}
              className={`rounded-xl border px-3 py-2.5 transition ${
                isCurrent
                  ? 'border-sage/40 bg-sage-soft'
                  : isComplete
                    ? 'border-border bg-white'
                    : 'border-border/70 bg-cream/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isComplete
                      ? 'bg-sage text-white'
                      : isCurrent
                        ? 'bg-sage-soft text-sage ring-2 ring-sage/30'
                        : 'bg-cream-dark text-ink-muted'
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Icon className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      isUpcoming ? 'text-ink-muted' : 'text-ink'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
