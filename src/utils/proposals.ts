import type { ChangeProposal, OrderItem, OrderSummaryData } from '../types'
import { buildOrderSummary } from './orderSummary'

export function voteThreshold(memberCount: number) {
  return Math.ceil(memberCount / 2)
}

export function countVotes(proposal: ChangeProposal) {
  const votes = Object.values(proposal.votes)
  return {
    approve: votes.filter((vote) => vote === 'approve').length,
    reject: votes.filter((vote) => vote === 'reject').length,
  }
}

export function evaluateProposalStatus(
  proposal: ChangeProposal,
  memberCount: number,
): ChangeProposal['status'] {
  if (proposal.status !== 'open') return proposal.status

  const { approve, reject } = countVotes(proposal)
  const threshold = voteThreshold(memberCount)

  if (approve >= threshold) return 'approved'
  if (reject >= threshold) return 'rejected'
  return 'open'
}

export function applyProposalToItems(
  items: OrderItem[],
  replaceFood: string,
  replaceWith: string,
): OrderItem[] {
  const from = replaceFood.toLowerCase()
  return items.map((item) =>
    item.food.toLowerCase() === from ? { ...item, food: replaceWith } : item,
  )
}

export function rebuildSummaryFromItems(
  items: OrderItem[],
  previous: OrderSummaryData,
): OrderSummaryData {
  const next = buildOrderSummary(items)
  return {
    ...next,
    submittedAt: previous.submittedAt,
  }
}

export function uniqueOrderFoods(items: OrderItem[]) {
  return [...new Set(items.map((item) => item.food.toLowerCase()))]
}

export function estimateOrderTotal(items: OrderItem[], getCost: (food: string) => number) {
  return items.reduce((total, item) => total + getCost(item.food), 0)
}
