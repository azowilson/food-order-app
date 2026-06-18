import { FOOD_MENU } from '../data/seedData'

export function extractFoodItems(text: string): string[] {
  const lower = text.toLowerCase()
  const found = FOOD_MENU.filter((item) => lower.includes(item))
  return [...new Set(found)].sort((a, b) => b.length - a.length)
}
