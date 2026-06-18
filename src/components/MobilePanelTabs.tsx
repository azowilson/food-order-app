import { Archive, MessageSquare, UtensilsCrossed } from 'lucide-react'

export type MobilePanel = 'chat' | 'order' | 'history'

interface MobilePanelTabsProps {
  panel: MobilePanel
  onChange: (panel: MobilePanel) => void
  orderCount: number
  archived?: boolean
  historyCount?: number
}

export function MobilePanelTabs({
  panel,
  onChange,
  orderCount,
  archived = false,
  historyCount = 0,
}: MobilePanelTabsProps) {
  const hasPastOrders = historyCount > 0

  const tabs: {
    id: MobilePanel
    label: string
    icon: typeof MessageSquare
    badge?: number
  }[] = archived
    ? [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'history', label: 'Past orders', icon: Archive, badge: historyCount },
      ]
    : hasPastOrders
      ? [
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'order', label: 'Order', icon: UtensilsCrossed, badge: orderCount },
          { id: 'history', label: 'Past orders', icon: Archive, badge: historyCount },
        ]
      : [
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'order', label: 'Order', icon: UtensilsCrossed, badge: orderCount },
        ]

  return (
    <nav
      className="safe-bottom flex shrink-0 border-t border-border bg-white md:hidden"
      aria-label="Chat panels"
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const active = panel === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
              active ? 'text-wa-green' : 'text-ink-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="absolute right-[calc(50%-1.25rem)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wa-green px-1 text-[10px] font-semibold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
