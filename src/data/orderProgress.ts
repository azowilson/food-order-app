import type { OrderProgressStage } from '../types'

export const ORDER_PROGRESS_STEPS: {
  id: OrderProgressStage
  label: string
  description: string
}[] = [
  {
    id: 'confirmed',
    label: 'Order confirmed',
    description: 'The group order is locked in and recipes are ready.',
  },
  {
    id: 'buying-ingredients',
    label: 'Buying ingredients',
    description: 'Someone is picking up items from the shopping list.',
  },
  {
    id: 'preparing',
    label: 'Preparing dishes',
    description: 'Recipes are underway in the kitchen.',
  },
  {
    id: 'finished',
    label: 'Finish cooking',
    description: 'All dishes are ready to serve.',
  },
]

export const FOOD_ESTIMATED_COST: Record<string, number> = {
  'pad thai': 14,
  'vegetarian pad thai': 12,
  'green curry': 22,
  'spring rolls': 10,
  'mango sticky rice': 9,
  'tom yum soup': 16,
  'papaya salad': 8,
  'fried rice': 11,
  satay: 15,
  'massaman curry': 24,
  'bubble tea': 6,
}

export function getFoodCost(food: string): number {
  return FOOD_ESTIMATED_COST[food.toLowerCase()] ?? 12
}

export function formatCost(amount: number) {
  return `$${amount.toFixed(0)}`
}

export function getProgressIndex(stage: OrderProgressStage) {
  return ORDER_PROGRESS_STEPS.findIndex((step) => step.id === stage)
}

export function getNextProgressStage(
  stage: OrderProgressStage,
): OrderProgressStage | null {
  const index = getProgressIndex(stage)
  const next = ORDER_PROGRESS_STEPS[index + 1]
  return next?.id ?? null
}

export function getProgressPercent(stage: OrderProgressStage) {
  const index = getProgressIndex(stage)
  return Math.round(((index + 1) / ORDER_PROGRESS_STEPS.length) * 100)
}
