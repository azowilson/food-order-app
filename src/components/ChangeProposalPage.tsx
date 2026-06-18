import { ArrowLeft } from 'lucide-react'
import { ChangeProposalPanel } from './ChangeProposalPanel'
import type { ChangeProposal, Chat } from '../types'

interface ChangeProposalPageProps {
  chat: Chat
  orderFoods: string[]
  proposals: ChangeProposal[]
  currentUserDisplayName?: string
  onBack: () => void
  onCreateProposal: (proposal: {
    replaceFood: string
    replaceWith: string
    reason: string
  }) => void
  onVote: (proposalId: string, vote: 'approve' | 'reject', voter: string) => void
}

export function ChangeProposalPage({
  chat,
  orderFoods,
  proposals,
  currentUserDisplayName,
  onBack,
  onCreateProposal,
  onVote,
}: ChangeProposalPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <header className="safe-top flex items-center gap-3 border-b border-border bg-white/80 px-3 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-ink-muted transition hover:border-terracotta/40 hover:text-terracotta"
          aria-label="Back to order"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-ink">Propose a change</h2>
          <p className="text-xs text-ink-muted">Suggest dish swaps and vote with the group</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <ChangeProposalPanel
          chat={chat}
          orderFoods={orderFoods}
          proposals={proposals}
          currentUserDisplayName={currentUserDisplayName}
          onCreateProposal={onCreateProposal}
          onVote={onVote}
        />
      </div>
    </div>
  )
}
