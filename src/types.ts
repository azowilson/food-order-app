export type OrderZone = 'my-plate' | 'shared-pool' | 'extras'

export interface User {
  id: string
  username: string
  displayName: string
  initials: string
  hasLlmKey: boolean
  llmSetupSkipped: boolean
  llmModel: string
}

export type ChatType = 'group' | 'direct'

export interface Chat {
  id: string
  type: ChatType
  name: string
  memberUsernames: string[]
  archived: boolean
  archivedAt?: string
  lastMessage: string
  time: string
  unread: number
}

export interface ChatMessage {
  id: string
  author: string
  authorInitials: string
  isSelf: boolean
  time: string
  text: string
  foodItems: string[]
  system?: boolean
}

export interface OrderItem {
  id: string
  food: string
  fromMessageId: string
  fromAuthor: string
  zone: OrderZone
}

export interface Ingredient {
  name: string
  amount: string
}

export interface Recipe {
  foodKey: string
  title: string
  servings: number
  prepTime: string
  ingredients: Ingredient[]
  steps: string[]
}

export interface AggregatedIngredient {
  name: string
  amounts: string[]
}

export interface OrderSummaryData {
  submittedAt: Date
  items: OrderItem[]
  recipes: Recipe[]
  shoppingList: AggregatedIngredient[]
}

export type OrderProgressStage =
  | 'confirmed'
  | 'buying-ingredients'
  | 'preparing'
  | 'finished'

export interface ChangeProposal {
  id: string
  proposedBy: string
  replaceFood: string
  replaceWith: string
  reason: string
  votes: Record<string, 'approve' | 'reject'>
  status: 'open' | 'approved' | 'rejected'
  createdAt: Date
}

export interface ActiveOrder {
  summary: OrderSummaryData
  progressStage: OrderProgressStage
  progressUpdatedAt: Date
  proposals: ChangeProposal[]
  checkedShoppingItems: string[]
}

export interface CompletedOrder {
  id: string
  completedAt: Date
  order: ActiveOrder
}

export interface ChatSession {
  messages: ChatMessage[]
  orderItems: OrderItem[]
  activeOrder: ActiveOrder | null
  completedOrders: CompletedOrder[]
  viewingHistoryOrderId: string | null
}

export interface AppData {
  friends: string[]
  chats: Chat[]
  chatSessions: Record<string, ChatSession>
}

/** @deprecated Use Chat */
export type Group = Chat
