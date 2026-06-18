import { fallbackExtractFood, STATIC_RECIPES } from './foodData.js'
import { callLlm } from './llmClient.js'

interface Recipe {
  foodKey: string
  title: string
  servings: number
  prepTime: string
  ingredients: { name: string; amount: string }[]
  steps: string[]
}

interface LlmConfig {
  apiKey: string | null
  model?: string | null
}

export async function analyzeMessageForFood(
  text: string,
  config: LlmConfig,
): Promise<string[]> {
  if (!config.apiKey) return fallbackExtractFood(text)

  try {
    const raw = await callLlm(
      config.apiKey,
      config.model ?? undefined,
      `You extract food dish names from chat messages about ordering food.
Return JSON: { "foodItems": string[] }
Use lowercase normalized dish names. Include partial matches like "pad thai", "green curry".
Only include actual food/drink items the person wants to order. Max 8 items.`,
      text,
    )
    const parsed = JSON.parse(raw) as { foodItems?: string[] }
    const items = (parsed.foodItems ?? [])
      .map((item) => item.toLowerCase().trim())
      .filter(Boolean)
    return items.length > 0 ? [...new Set(items)] : fallbackExtractFood(text)
  } catch {
    return fallbackExtractFood(text)
  }
}

export async function generateRecipeForFood(
  foodKey: string,
  config: LlmConfig,
): Promise<Recipe | null> {
  const staticRecipe = STATIC_RECIPES[foodKey.toLowerCase()]
  if (staticRecipe) return staticRecipe

  if (!config.apiKey) return null

  try {
    const raw = await callLlm(
      config.apiKey,
      config.model ?? undefined,
      `Generate a home-cooking recipe as JSON:
{ "foodKey": string, "title": string, "servings": number, "prepTime": string,
  "ingredients": [{ "name": string, "amount": string }],
  "steps": string[] }
Keep ingredients practical for a grocery run. 4-10 ingredients, 4-6 steps.`,
      `Recipe for: ${foodKey}`,
    )
    const recipe = JSON.parse(raw) as Recipe
    recipe.foodKey = foodKey.toLowerCase()
    return recipe
  } catch {
    return null
  }
}

export function aggregateShoppingList(
  recipes: Recipe[],
): { name: string; amounts: string[] }[] {
  const map = new Map<string, Set<string>>()

  for (const recipe of recipes) {
    for (const { name, amount } of recipe.ingredients) {
      const key = name.toLowerCase()
      if (!map.has(key)) map.set(key, new Set())
      map.get(key)!.add(amount)
    }
  }

  return [...map.entries()]
    .map(([key, amounts]) => ({
      name:
        recipes.flatMap((r) => r.ingredients).find((i) => i.name.toLowerCase() === key)
          ?.name ?? key,
      amounts: [...amounts],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function buildOrderSummary(
  items: {
    id: string
    food: string
    fromMessageId: string
    fromAuthor: string
    zone: string
  }[],
  config: LlmConfig,
) {
  const uniqueFoods = [...new Set(items.map((i) => i.food.toLowerCase().trim()))]
  const recipes: Recipe[] = []

  for (const foodKey of uniqueFoods) {
    const recipe = await generateRecipeForFood(foodKey, config)
    if (recipe) recipes.push(recipe)
    else {
      recipes.push({
        foodKey,
        title: foodKey.replace(/\b\w/g, (c) => c.toUpperCase()),
        servings: 2,
        prepTime: '30 min',
        ingredients: [{ name: 'See chat for details', amount: '1' }],
        steps: ['Prepare according to group preferences discussed in chat.'],
      })
    }
  }

  return {
    submittedAt: new Date().toISOString(),
    items,
    recipes,
    shoppingList: aggregateShoppingList(recipes),
  }
}
