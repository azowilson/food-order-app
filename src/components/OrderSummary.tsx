import { useState } from 'react'
import { ArrowLeft, ArrowRightLeft, ChefHat, Clock, ListChecks, Users } from 'lucide-react'
import { ChangeProposalPage } from './ChangeProposalPage'
import { OrderProgressBar } from './OrderProgressBar'
import { formatCost, getFoodCost } from '../data/orderProgress'
import { zoneLabels } from '../data/seedData'
import type { ActiveOrder, Chat } from '../types'
import { ShoppingList } from './ShoppingList'
import { estimateOrderTotal, uniqueOrderFoods } from '../utils/proposals'
import { formatOrderCount } from '../utils/orderSummary'

interface OrderSummaryProps {
  chat: Chat
  activeOrder: ActiveOrder
  readOnly?: boolean
  currentUserDisplayName?: string
  onBack: () => void
  onAdvanceProgress: () => void
  onCreateProposal: (proposal: {
    replaceFood: string
    replaceWith: string
    reason: string
  }) => void
  onVote: (proposalId: string, vote: 'approve' | 'reject', voter: string) => void
  onToggleShoppingItem: (key: string) => void
}

function RecipeCard({
  recipe,
  orderCount,
}: {
  recipe: ActiveOrder['summary']['recipes'][number]
  orderCount: number
}) {
  const cost = getFoodCost(recipe.foodKey)

  return (
    <article className="rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">{recipe.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.prepTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} servings
              </span>
              <span className="font-medium text-ink">{formatCost(cost)} est.</span>
              {orderCount > 1 && (
                <span className="rounded-md bg-terracotta-soft px-2 py-0.5 font-medium text-terracotta">
                  Ordered {orderCount}x
                </span>
              )}
            </div>
          </div>
          <ChefHat className="h-5 w-5 shrink-0 text-terracotta/70" />
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Ingredients
          </h4>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.name}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="text-ink">{ingredient.name}</span>
                <span className="shrink-0 text-ink-muted">{ingredient.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Steps
          </h4>
          <ol className="space-y-2">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-sm text-ink">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-semibold text-sage">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}

export function OrderSummary({
  chat,
  activeOrder,
  readOnly = false,
  currentUserDisplayName,
  onBack,
  onAdvanceProgress,
  onCreateProposal,
  onVote,
  onToggleShoppingItem,
}: OrderSummaryProps) {
  const [showProposalsPage, setShowProposalsPage] = useState(false)
  const { summary, progressStage, progressUpdatedAt, proposals, checkedShoppingItems } =
    activeOrder
  const { dishes, totalItems } = formatOrderCount(summary.items)
  const submittedTime = summary.submittedAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const orderCounts = summary.items.reduce<Record<string, number>>((acc, item) => {
    const key = item.food.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const itemsByZone = summary.items.reduce<Record<string, typeof summary.items>>(
    (acc, item) => {
      if (!acc[item.zone]) acc[item.zone] = []
      acc[item.zone].push(item)
      return acc
    },
    {},
  )

  const orderFoods = uniqueOrderFoods(summary.items)
  const estimatedTotal = estimateOrderTotal(summary.items, getFoodCost)
  const openProposals = proposals.filter((p) => p.status === 'open')

  if (showProposalsPage && !readOnly) {
    return (
      <ChangeProposalPage
        chat={chat}
        orderFoods={orderFoods}
        proposals={proposals}
        currentUserDisplayName={currentUserDisplayName}
        onBack={() => setShowProposalsPage(false)}
        onCreateProposal={onCreateProposal}
        onVote={onVote}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <header className="safe-top flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white/80 px-3 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-ink-muted transition hover:border-terracotta/40 hover:text-terracotta"
            aria-label="Back to chat"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">
              {readOnly ? 'Past order' : 'Order submitted'}
            </h2>
            <p className="truncate text-xs text-ink-muted">
              {chat.name} · {submittedTime}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div className="rounded-full border border-border bg-cream px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:px-3 sm:text-xs">
            {formatCost(estimatedTotal)} est.
          </div>
          <div className="rounded-full border border-sage/30 bg-sage-soft px-2.5 py-1 text-[11px] font-medium text-sage sm:px-3 sm:text-xs">
            {dishes} recipes · {totalItems} items
          </div>
        </div>
      </header>

      <OrderProgressBar
        currentStage={progressStage}
        updatedAt={progressUpdatedAt}
        onAdvance={readOnly ? undefined : onAdvanceProgress}
        canAdvance={!readOnly && progressStage !== 'finished'}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <section className="shrink-0 border-b border-border bg-cream-dark/40">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-sage" />
              <div>
                <h3 className="text-sm font-semibold text-ink">Shopping list</h3>
                <p className="text-[11px] text-ink-muted">
                  Combined ingredients across all recipes
                </p>
              </div>
            </div>
          </div>

          <ShoppingList
            items={summary.shoppingList}
            checkedItems={checkedShoppingItems}
            onToggleItem={onToggleShoppingItem}
            readOnly={readOnly}
          />

          <div className="border-t border-border bg-white px-4 py-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Order breakdown
            </h4>
            <div className="space-y-2">
              {Object.entries(itemsByZone).map(([zone, zoneItems]) => (
                <div key={zone}>
                  <p className="text-[11px] font-medium text-terracotta">
                    {zoneLabels[zone]?.title ?? zone}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {zoneItems.map((item) => (
                      <li key={item.id} className="text-xs capitalize text-ink-muted">
                        {item.food} · {item.fromAuthor}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!readOnly && (
          <div className="border-b border-border bg-white px-3 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setShowProposalsPage(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-terracotta/30 bg-terracotta-soft/50 px-4 py-3 text-sm font-medium text-terracotta transition hover:bg-terracotta-soft"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Propose a change
              {openProposals.length > 0 && (
                <span className="rounded-full bg-terracotta px-2 py-0.5 text-[11px] font-semibold text-white">
                  {openProposals.length} open
                </span>
              )}
            </button>
          </div>
        )}

        <section className="px-3 py-4 sm:px-5 sm:py-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-ink">Recipes</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {readOnly
                ? 'Recipes from this completed order.'
                : 'Updates automatically when the group approves a dish swap.'}
            </p>
          </div>

          <div className="space-y-4">
            {summary.recipes.map((recipe) => (
              <RecipeCard
                key={recipe.foodKey}
                recipe={recipe}
                orderCount={orderCounts[recipe.foodKey] ?? 1}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
