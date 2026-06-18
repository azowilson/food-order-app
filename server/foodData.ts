export const FOOD_MENU = [
  'pad thai',
  'vegetarian pad thai',
  'green curry',
  'spring rolls',
  'mango sticky rice',
  'tom yum soup',
  'papaya salad',
  'fried rice',
  'satay',
  'massaman curry',
  'bubble tea',
]

export const STATIC_RECIPES: Record<
  string,
  {
    foodKey: string
    title: string
    servings: number
    prepTime: string
    ingredients: { name: string; amount: string }[]
    steps: string[]
  }
> = {
  'pad thai': {
    foodKey: 'pad thai',
    title: 'Pad Thai',
    servings: 2,
    prepTime: '25 min',
    ingredients: [
      { name: 'Rice noodles', amount: '200 g' },
      { name: 'Shrimp or tofu', amount: '150 g' },
      { name: 'Eggs', amount: '2' },
      { name: 'Bean sprouts', amount: '1 cup' },
      { name: 'Tamarind paste', amount: '2 tbsp' },
      { name: 'Fish sauce', amount: '2 tbsp' },
      { name: 'Palm sugar', amount: '1 tbsp' },
      { name: 'Roasted peanuts', amount: '3 tbsp' },
      { name: 'Garlic', amount: '3 cloves' },
      { name: 'Lime', amount: '1' },
    ],
    steps: [
      'Soak rice noodles in warm water until pliable, then drain.',
      'Stir-fry garlic in hot oil until fragrant. Add protein and cook through.',
      'Add noodles, tamarind, fish sauce, and palm sugar. Toss on high heat.',
      'Fold in bean sprouts and peanuts. Serve with lime wedges.',
    ],
  },
  'vegetarian pad thai': {
    foodKey: 'vegetarian pad thai',
    title: 'Vegetarian Pad Thai',
    servings: 2,
    prepTime: '25 min',
    ingredients: [
      { name: 'Rice noodles', amount: '200 g' },
      { name: 'Firm tofu', amount: '200 g' },
      { name: 'Bean sprouts', amount: '1 cup' },
      { name: 'Tamarind paste', amount: '2 tbsp' },
      { name: 'Soy sauce', amount: '2 tbsp' },
      { name: 'Palm sugar', amount: '1 tbsp' },
      { name: 'Roasted peanuts', amount: '3 tbsp' },
      { name: 'Lime', amount: '1' },
    ],
    steps: [
      'Press and cube tofu. Pan-fry until golden.',
      'Soak noodles, then stir-fry with tofu, tamarind, soy sauce, and palm sugar.',
      'Toss with bean sprouts. Finish with peanuts and lime juice.',
    ],
  },
  'green curry': {
    foodKey: 'green curry',
    title: 'Green Curry',
    servings: 4,
    prepTime: '35 min',
    ingredients: [
      { name: 'Green curry paste', amount: '3 tbsp' },
      { name: 'Coconut milk', amount: '400 ml' },
      { name: 'Chicken thigh', amount: '400 g' },
      { name: 'Thai eggplant', amount: '2' },
      { name: 'Fish sauce', amount: '2 tbsp' },
      { name: 'Thai basil', amount: '1 cup' },
    ],
    steps: [
      'Fry curry paste in coconut cream until aromatic.',
      'Add chicken and remaining coconut milk; simmer.',
      'Season with fish sauce and basil. Serve with rice.',
    ],
  },
  'spring rolls': {
    foodKey: 'spring rolls',
    title: 'Fresh Spring Rolls',
    servings: 8,
    prepTime: '30 min',
    ingredients: [
      { name: 'Rice paper wrappers', amount: '8' },
      { name: 'Rice vermicelli', amount: '100 g' },
      { name: 'Shrimp or tofu', amount: '200 g' },
      { name: 'Fresh mint', amount: '1 bunch' },
      { name: 'Hoisin-peanut dipping sauce', amount: '1 cup' },
    ],
    steps: [
      'Cook vermicelli and protein; slice vegetables.',
      'Soften rice paper and roll with fillings.',
      'Serve with dipping sauce.',
    ],
  },
  'mango sticky rice': {
    foodKey: 'mango sticky rice',
    title: 'Mango Sticky Rice',
    servings: 4,
    prepTime: '45 min',
    ingredients: [
      { name: 'Glutinous rice', amount: '2 cups' },
      { name: 'Coconut milk', amount: '400 ml' },
      { name: 'Palm sugar', amount: '1/3 cup' },
      { name: 'Ripe mango', amount: '2' },
    ],
    steps: [
      'Steam sticky rice until tender.',
      'Fold in sweetened coconut milk and rest.',
      'Serve with sliced mango.',
    ],
  },
  'tom yum soup': {
    foodKey: 'tom yum soup',
    title: 'Tom Yum Soup',
    servings: 4,
    prepTime: '30 min',
    ingredients: [
      { name: 'Chicken stock', amount: '1 L' },
      { name: 'Lemongrass', amount: '2 stalks' },
      { name: 'Galangal', amount: '4 slices' },
      { name: 'Shrimp', amount: '300 g' },
      { name: 'Lime juice', amount: '3 tbsp' },
      { name: 'Fish sauce', amount: '2 tbsp' },
    ],
    steps: [
      'Simmer aromatics in stock for 10 minutes.',
      'Add mushrooms and shrimp until cooked.',
      'Season with fish sauce and lime juice.',
    ],
  },
  'papaya salad': {
    foodKey: 'papaya salad',
    title: 'Green Papaya Salad',
    servings: 4,
    prepTime: '20 min',
    ingredients: [
      { name: 'Green papaya', amount: '1 medium' },
      { name: 'Cherry tomatoes', amount: '1 cup' },
      { name: 'Roasted peanuts', amount: '3 tbsp' },
      { name: 'Fish sauce', amount: '2 tbsp' },
      { name: 'Lime juice', amount: '3 tbsp' },
    ],
    steps: [
      'Shred papaya and pound with garlic and chilies.',
      'Add tomatoes and season with fish sauce and lime.',
      'Top with peanuts.',
    ],
  },
  'fried rice': {
    foodKey: 'fried rice',
    title: 'Thai Fried Rice',
    servings: 3,
    prepTime: '20 min',
    ingredients: [
      { name: 'Day-old jasmine rice', amount: '3 cups' },
      { name: 'Eggs', amount: '2' },
      { name: 'Mixed vegetables', amount: '1 cup' },
      { name: 'Fish sauce', amount: '2 tbsp' },
    ],
    steps: [
      'Scramble eggs and set aside.',
      'Stir-fry rice with vegetables and fish sauce.',
      'Return eggs to wok and serve.',
    ],
  },
  satay: {
    foodKey: 'satay',
    title: 'Chicken Satay',
    servings: 6,
    prepTime: '40 min',
    ingredients: [
      { name: 'Chicken thigh', amount: '500 g' },
      { name: 'Coconut milk', amount: '1/2 cup' },
      { name: 'Turmeric', amount: '1 tsp' },
      { name: 'Peanut sauce', amount: '1 cup' },
    ],
    steps: [
      'Marinate chicken strips with coconut milk and spices.',
      'Grill on skewers until charred.',
      'Serve with peanut sauce.',
    ],
  },
  'massaman curry': {
    foodKey: 'massaman curry',
    title: 'Massaman Curry',
    servings: 4,
    prepTime: '50 min',
    ingredients: [
      { name: 'Massaman curry paste', amount: '3 tbsp' },
      { name: 'Coconut milk', amount: '400 ml' },
      { name: 'Beef chuck', amount: '500 g' },
      { name: 'Potato', amount: '2' },
      { name: 'Roasted peanuts', amount: '1/3 cup' },
    ],
    steps: [
      'Brown beef and fry curry paste in coconut milk.',
      'Simmer until tender with potato and peanuts.',
    ],
  },
  'bubble tea': {
    foodKey: 'bubble tea',
    title: 'Thai Milk Bubble Tea',
    servings: 2,
    prepTime: '20 min',
    ingredients: [
      { name: 'Black tea leaves', amount: '2 tbsp' },
      { name: 'Tapioca pearls', amount: '1/2 cup' },
      { name: 'Condensed milk', amount: '3 tbsp' },
      { name: 'Ice', amount: '2 cups' },
    ],
    steps: [
      'Cook tapioca pearls and steep strong tea.',
      'Combine with milk over ice and serve.',
    ],
  },
}

export function fallbackExtractFood(text: string): string[] {
  const lower = text.toLowerCase()
  const found = FOOD_MENU.filter((item) => lower.includes(item))
  return [...new Set(found)].sort((a, b) => b.length - a.length)
}
