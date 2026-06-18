import { useState } from 'react'
import { ArrowRightLeft, ThumbsDown, ThumbsUp, Vote } from 'lucide-react'
import { FOOD_MENU } from '../data/seedData'
import { getMemberDisplayNames } from '../data/users'
import { formatCost, getFoodCost } from '../data/orderProgress'
import type { ChangeProposal, Chat } from '../types'
import { countVotes, voteThreshold } from '../utils/proposals'

interface ChangeProposalPanelProps {
  chat: Chat
  orderFoods: string[]
  proposals: ChangeProposal[]
  currentUserDisplayName?: string
  onCreateProposal: (proposal: {
    replaceFood: string
    replaceWith: string
    reason: string
  }) => void
  onVote: (proposalId: string, vote: 'approve' | 'reject', voter: string) => void
}

function capitalizeFood(food: string) {
  return food.replace(/\b\w/g, (char) => char.toUpperCase())
}

function ProposalCard({
  proposal,
  memberCount,
  currentUser,
  onVote,
}: {
  proposal: ChangeProposal
  memberCount: number
  memberNames: string[]
  currentUser: string
  onVote: (vote: 'approve' | 'reject') => void
}) {
  const { approve, reject } = countVotes(proposal)
  const threshold = voteThreshold(memberCount)
  const userVote = proposal.votes[currentUser]
  const savings = getFoodCost(proposal.replaceFood) - getFoodCost(proposal.replaceWith)

  const statusStyles = {
    open: 'border-border bg-white',
    approved: 'border-sage/40 bg-sage-soft/50',
    rejected: 'border-terracotta/30 bg-terracotta-soft/40',
  } as const

  const statusLabel = {
    open: 'Voting open',
    approved: 'Approved — order updated',
    rejected: 'Rejected',
  } as const

  return (
    <article className={`rounded-xl border p-3 ${statusStyles[proposal.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-ink-muted">
            {proposal.proposedBy} ·{' '}
            {proposal.createdAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="rounded-md bg-cream-dark px-2 py-0.5 capitalize text-ink">
              {proposal.replaceFood}
            </span>
            <ArrowRightLeft className="h-3.5 w-3.5 text-ink-muted" />
            <span className="rounded-md bg-sage-soft px-2 py-0.5 capitalize text-sage">
              {proposal.replaceWith}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            proposal.status === 'open'
              ? 'bg-cream-dark text-ink-muted'
              : proposal.status === 'approved'
                ? 'bg-sage text-white'
                : 'bg-terracotta/15 text-terracotta'
          }`}
        >
          {statusLabel[proposal.status]}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink">{proposal.reason}</p>

      {savings > 0 && (
        <p className="mt-1 text-xs font-medium text-sage">
          Saves about {formatCost(savings)} per serving vs current dish
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-ink-muted">
          <span className="font-medium text-sage">{approve} approve</span>
          {' · '}
          <span className="font-medium text-terracotta">{reject} reject</span>
          {' · needs '}
          {threshold} to decide
        </div>

        {proposal.status === 'open' && (
          <div className="flex gap-1.5 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => onVote('approve')}
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:flex-none sm:py-1.5 ${
                userVote === 'approve'
                  ? 'bg-sage text-white'
                  : 'border border-border bg-white text-ink hover:border-sage/40'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onVote('reject')}
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:flex-none sm:py-1.5 ${
                userVote === 'reject'
                  ? 'bg-terracotta text-white'
                  : 'border border-border bg-white text-ink hover:border-terracotta/40'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>

      {Object.keys(proposal.votes).length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {Object.entries(proposal.votes).map(([member, vote]) => (
            <li
              key={member}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                vote === 'approve'
                  ? 'bg-sage/15 text-sage'
                  : 'bg-terracotta/10 text-terracotta'
              }`}
            >
              {member}: {vote}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function ChangeProposalPanel({
  chat,
  orderFoods,
  proposals,
  currentUserDisplayName = 'You',
  onCreateProposal,
  onVote,
}: ChangeProposalPanelProps) {
  const [replaceFood, setReplaceFood] = useState(orderFoods[0] ?? '')
  const [replaceWith, setReplaceWith] = useState('')
  const [reason, setReason] = useState('')
  const memberNames = getMemberDisplayNames(chat.memberUsernames)
  const [votingAs, setVotingAs] = useState(currentUserDisplayName)

  const alternativeOptions = FOOD_MENU.filter(
    (food) =>
      food.toLowerCase() !== replaceFood.toLowerCase() &&
      !orderFoods.includes(food.toLowerCase()),
  )

  const openProposals = proposals.filter((p) => p.status === 'open')
  const closedProposals = proposals.filter((p) => p.status !== 'open')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replaceFood || !replaceWith || !reason.trim()) return
    onCreateProposal({ replaceFood, replaceWith, reason: reason.trim() })
    setReason('')
    setReplaceWith('')
  }

  return (
    <section className="rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-terracotta" />
          <div>
            <h3 className="text-sm font-semibold text-ink">Propose a change</h3>
            <p className="text-[11px] text-ink-muted">
              Swap a dish if ingredients feel too expensive — group votes to approve
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-b border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              Replace dish
            </span>
            <select
              value={replaceFood}
              onChange={(e) => {
                setReplaceFood(e.target.value)
                setReplaceWith('')
              }}
              className="w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm capitalize text-ink outline-none focus:border-terracotta/40"
            >
              {orderFoods.map((food) => (
                <option key={food} value={food}>
                  {food} ({formatCost(getFoodCost(food))})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              Suggest instead
            </span>
            <select
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm capitalize text-ink outline-none focus:border-terracotta/40"
            >
              <option value="">Choose alternative...</option>
              {alternativeOptions.map((food) => (
                <option key={food} value={food}>
                  {capitalizeFood(food)} ({formatCost(getFoodCost(food))})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Reason for the group
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Galangal and shrimp are pricey — fried rice is cheaper and still filling"
            className="w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-terracotta/40"
            required
          />
        </label>

        <button
          type="submit"
          disabled={!replaceWith || !reason.trim()}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition hover:bg-terracotta/90 disabled:opacity-40"
        >
          Start group vote
        </button>
      </form>

      <div className="space-y-3 p-4">
        {openProposals.length > 0 && (
          <label className="flex items-center justify-end gap-2">
            <span className="text-xs text-ink-muted">Vote as</span>
            <select
              value={votingAs}
              onChange={(e) => setVotingAs(e.target.value)}
              className="rounded-lg border border-border bg-cream px-2 py-1 text-xs text-ink outline-none focus:border-terracotta/40"
            >
              {memberNames.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </label>
        )}

        {openProposals.length === 0 && closedProposals.length === 0 && (
          <p className="text-sm text-ink-muted">
            No change proposals yet. Flag expensive ingredients and suggest a swap above.
          </p>
        )}

        {openProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            memberCount={chat.memberUsernames.length}
            memberNames={memberNames}
            currentUser={votingAs}
            onVote={(vote) => onVote(proposal.id, vote, votingAs)}
          />
        ))}

        {closedProposals.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Past votes
            </p>
            {closedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                memberCount={chat.memberUsernames.length}
                memberNames={memberNames}
                currentUser={votingAs}
                onVote={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
