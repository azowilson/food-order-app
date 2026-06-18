import type { AggregatedIngredient, OrderProgressStage } from '../types'

export function ingredientKey(name: string) {
  return name.toLowerCase().trim()
}

export function sortShoppingList(
  items: AggregatedIngredient[],
  checkedOrder: string[],
): AggregatedIngredient[] {
  const checkedSet = new Set(checkedOrder)
  const unchecked = items.filter((item) => !checkedSet.has(ingredientKey(item.name)))

  const checked = checkedOrder
    .map((key) => items.find((item) => ingredientKey(item.name) === key))
    .filter((item): item is AggregatedIngredient => item !== undefined)

  const orphanedChecked = items.filter(
    (item) =>
      checkedSet.has(ingredientKey(item.name)) &&
      !checked.some((c) => ingredientKey(c.name) === ingredientKey(item.name)),
  )

  return [...unchecked, ...checked, ...orphanedChecked]
}

export function syncCheckedItems(
  checked: string[],
  shoppingList: AggregatedIngredient[],
): string[] {
  const validKeys = new Set(shoppingList.map((item) => ingredientKey(item.name)))
  return checked.filter((key) => validKeys.has(key))
}

export function applyShoppingCheckProgress(
  checkedCount: number,
  totalCount: number,
  progressStage: OrderProgressStage,
  progressUpdatedAt: Date,
  wasChecked: boolean,
): {
  progressStage: OrderProgressStage
  progressUpdatedAt: Date
} {
  if (wasChecked || totalCount === 0) {
    return { progressStage, progressUpdatedAt }
  }

  const now = new Date()
  const allChecked = checkedCount === totalCount

  let nextStage = progressStage

  if (checkedCount > 0 && progressStage === 'confirmed') {
    nextStage = 'buying-ingredients'
  }

  if (allChecked && nextStage === 'buying-ingredients') {
    nextStage = 'preparing'
  }

  if (nextStage !== progressStage) {
    return { progressStage: nextStage, progressUpdatedAt: now }
  }

  return { progressStage, progressUpdatedAt }
}
