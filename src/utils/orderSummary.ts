import { getRecipeForFood } from '../data/recipes'
import type {
  AggregatedIngredient,
  OrderItem,
  OrderSummaryData,
  Recipe,
} from '../types'

function normalizeFood(food: string) {
  return food.toLowerCase().trim()
}

export function buildOrderSummary(items: OrderItem[]): OrderSummaryData {
  const uniqueFoods = [...new Set(items.map((item) => normalizeFood(item.food)))]

  const recipes: Recipe[] = uniqueFoods
    .map((foodKey) => getRecipeForFood(foodKey))
    .filter((recipe): recipe is Recipe => recipe !== null)

  const shoppingList = aggregateIngredients(recipes)

  return {
    submittedAt: new Date(),
    items,
    recipes,
    shoppingList,
  }
}

function aggregateIngredients(recipes: Recipe[]): AggregatedIngredient[] {
  const map = new Map<string, Set<string>>()

  for (const recipe of recipes) {
    for (const { name, amount } of recipe.ingredients) {
      const key = name.toLowerCase()
      if (!map.has(key)) {
        map.set(key, new Set())
      }
      map.get(key)!.add(amount)
    }
  }

  return [...map.entries()]
    .map(([key, amounts]) => ({
      name: recipes
        .flatMap((r) => r.ingredients)
        .find((i) => i.name.toLowerCase() === key)!.name,
      amounts: [...amounts],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function formatOrderCount(items: OrderItem[]) {
  const unique = new Set(items.map((i) => normalizeFood(i.food)))
  return { dishes: unique.size, totalItems: items.length }
}
