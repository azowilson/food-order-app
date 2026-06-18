import { useEffect, useMemo, useState } from 'react'
import { api } from './api/client'
import { ChatComposer } from './components/ChatComposer'
import { ChatPanel } from './components/ChatPanel'
import { ChatHeader } from './components/chat/ChatHeader'
import { ChatSidebar } from './components/chat/ChatSidebar'
import { MobilePanelTabs, type MobilePanel } from './components/MobilePanelTabs'
import { OrderBoard } from './components/OrderBoard'
import { OrderHistoryPanel } from './components/OrderHistoryPanel'
import { OrderSummary } from './components/OrderSummary'
import type { DragFoodPayload } from './components/DraggableFoodToken'
import { SettingsPage } from './components/settings/SettingsPage'
import { getNextProgressStage } from './data/orderProgress'
import type {
  ActiveOrder,
  AppData,
  ChangeProposal,
  ChatSession,
  OrderZone,
} from './types'
import {
  applyProposalToItems,
  evaluateProposalStatus,
  rebuildSummaryFromItems,
} from './utils/proposals'
import {
  applyShoppingCheckProgress,
  syncCheckedItems,
} from './utils/shoppingList'
import { useAuth } from './context/AuthContext'

export function MainApp() {
  const { user, appData, logout, setAppData } = useAuth()
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => appData?.chats.find((c) => !c.archived)?.id ?? appData?.chats[0]?.id ?? null,
  )
  const [viewingHistoryByChat, setViewingHistoryByChat] = useState<Record<string, string | null>>(
    {},
  )
  const [busy, setBusy] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mobileShowList, setMobileShowList] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chat')

  useEffect(() => {
    setMobilePanel('chat')
  }, [activeChatId])

  if (!user || !appData) return null

  const activeChat = appData.chats.find((c) => c.id === activeChatId)
  const session: ChatSession = activeChatId
    ? {
        ...(appData.chatSessions[activeChatId] ?? {
          messages: [],
          orderItems: [],
          activeOrder: null,
          completedOrders: [],
          viewingHistoryOrderId: null,
        }),
        viewingHistoryOrderId: viewingHistoryByChat[activeChatId] ?? null,
      }
    : {
        messages: [],
        orderItems: [],
        activeOrder: null,
        completedOrders: [],
        viewingHistoryOrderId: null,
      }

  const usedFoods = useMemo(() => {
    const set = new Set<string>()
    for (const item of session.orderItems) {
      set.add(`${item.fromMessageId}:${item.food.toLowerCase()}`)
    }
    return set
  }, [session.orderItems])

  const viewingHistoryOrder = session.viewingHistoryOrderId
    ? session.completedOrders.find((o) => o.id === session.viewingHistoryOrderId)
    : null

  const currentUser = user

  async function runApi(call: () => Promise<AppData>) {
    if (busy) return
    setBusy(true)
    try {
      const data = await call()
      setAppData(data)
    } finally {
      setBusy(false)
    }
  }

  function handleSend(text: string, _foodItems: string[]) {
    if (!activeChatId) return
    void runApi(() => api.sendMessage(activeChatId, text))
  }

  function handleAddItem(payload: DragFoodPayload, zone: OrderZone) {
    if (!activeChatId) return
    const key = `${payload.messageId}:${payload.food.toLowerCase()}`
    if (usedFoods.has(key)) return
    void runApi(() =>
      api.addOrderItem(activeChatId, {
        food: payload.food,
        messageId: payload.messageId,
        fromAuthor: payload.author,
        zone,
      }),
    )
    if (window.innerWidth < 768) {
      setMobilePanel('order')
    }
  }

  function handleRemoveItem(id: string) {
    if (!activeChatId) return
    void runApi(() => api.removeOrderItem(activeChatId, id))
  }

  function handleClearBoard() {
    if (!activeChatId) return
    void runApi(() => api.clearOrderBoard(activeChatId))
  }

  function handleSubmitOrder() {
    if (!activeChatId || session.orderItems.length === 0 || submittingOrder) return
    void (async () => {
      setSubmittingOrder(true)
      try {
        const data = await api.submitOrder(activeChatId)
        setAppData(data)
      } finally {
        setSubmittingOrder(false)
      }
    })()
  }

  function handleBackFromSummary() {
    if (!activeChatId) return
    void runApi(() => api.backFromOrder(activeChatId))
  }

  async function persistActiveOrder(activeOrder: ActiveOrder | null, orderItems = session.orderItems) {
    if (!activeChatId) return
    const data = await api.patchActiveOrder(activeChatId, activeOrder, orderItems)
    setAppData(data)
  }

  function handleAdvanceProgress() {
    if (!activeChatId || !session.activeOrder || !activeChat) return
    const nextStage = getNextProgressStage(session.activeOrder.progressStage)
    if (!nextStage) return

    if (nextStage === 'finished') {
      void runApi(() => api.completeOrder(activeChatId))
      return
    }

    const updatedOrder: ActiveOrder = {
      ...session.activeOrder,
      progressStage: nextStage,
      progressUpdatedAt: new Date(),
    }
    void persistActiveOrder(updatedOrder)
  }

  function handleCreateProposal(data: {
    replaceFood: string
    replaceWith: string
    reason: string
  }) {
    if (!activeChatId || !session.activeOrder || !activeChat) return
    const proposal: ChangeProposal = {
      id: crypto.randomUUID(),
      proposedBy: currentUser.displayName,
      replaceFood: data.replaceFood,
      replaceWith: data.replaceWith,
      reason: data.reason,
      votes: {},
      status: 'open',
      createdAt: new Date(),
    }
    void persistActiveOrder({
      ...session.activeOrder,
      proposals: [proposal, ...session.activeOrder.proposals],
    })
  }

  function handleVote(proposalId: string, vote: 'approve' | 'reject', voter: string) {
    if (!activeChatId || !session.activeOrder || !activeChat) return

    let summary = session.activeOrder.summary
    const proposals = session.activeOrder.proposals.map((proposal) => {
      if (proposal.id !== proposalId) return proposal
      const updated: ChangeProposal = {
        ...proposal,
        votes: { ...proposal.votes, [voter]: vote },
      }
      const previousStatus = proposal.status
      updated.status = evaluateProposalStatus(updated, activeChat.memberUsernames.length)
      if (updated.status === 'approved' && previousStatus === 'open') {
        summary = rebuildSummaryFromItems(
          applyProposalToItems(summary.items, updated.replaceFood, updated.replaceWith),
          summary,
        )
      }
      return updated
    })

    const checkedShoppingItems = syncCheckedItems(
      session.activeOrder.checkedShoppingItems,
      summary.shoppingList,
    )

    void persistActiveOrder({
      ...session.activeOrder,
      summary,
      proposals,
      checkedShoppingItems,
    })
  }

  function handleToggleShoppingItem(key: string) {
    if (!activeChatId || !session.activeOrder) return
    const wasChecked = session.activeOrder.checkedShoppingItems.includes(key)
    const checkedShoppingItems = wasChecked
      ? session.activeOrder.checkedShoppingItems.filter((item) => item !== key)
      : [...session.activeOrder.checkedShoppingItems.filter((item) => item !== key), key]

    const { progressStage, progressUpdatedAt } = applyShoppingCheckProgress(
      checkedShoppingItems.length,
      session.activeOrder.summary.shoppingList.length,
      session.activeOrder.progressStage,
      session.activeOrder.progressUpdatedAt,
      wasChecked,
    )

    void persistActiveOrder({
      ...session.activeOrder,
      checkedShoppingItems,
      progressStage,
      progressUpdatedAt,
    })
  }

  async function handleAddFriendAsync(username: string): Promise<string | null> {
    try {
      const data = await api.addFriend(username)
      setAppData(data)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to add friend'
    }
  }

  function handleCreateGroup(name: string, memberUsernames: string[]) {
    void (async () => {
      const data = await api.createGroup(name, memberUsernames)
      setAppData(data)
      const newest = data.chats.find((c) => !c.archived)
      if (newest) handleSelectChat(newest.id)
    })()
  }

  function handleStartDirectChat(friendUsername: string) {
    void (async () => {
      const data = await api.startDirectChat(friendUsername)
      setAppData(data)
      const chatId = `direct-${[currentUser.username, friendUsername].sort().join('-')}`
      if (data.chats.some((c) => c.id === chatId)) handleSelectChat(chatId)
    })()
  }

  function handleViewHistoryOrder(orderId: string) {
    if (!activeChatId) return
    setViewingHistoryByChat((prev) => ({ ...prev, [activeChatId]: orderId }))
  }

  function handleBackFromHistory() {
    if (!activeChatId) return
    setViewingHistoryByChat((prev) => ({ ...prev, [activeChatId]: null }))
  }

  const showActiveOrder = session.activeOrder && activeChat
  const showHistoryOrder = viewingHistoryOrder && activeChat
  const hasPastOrders = session.completedOrders.length > 0
  const isLegacyArchived = Boolean(activeChat?.archived)

  function handleSelectChat(id: string) {
    setActiveChatId(id)
    setMobileShowList(false)
    setMobilePanel('chat')
  }

  function handleBackToList() {
    setMobileShowList(true)
  }

  const sidebarWrapperClass = showSettings
    ? 'hidden h-full shrink-0 md:flex md:w-[360px]'
    : mobileShowList || !activeChatId
      ? 'flex h-full w-full shrink-0 md:w-[360px]'
      : 'hidden h-full shrink-0 md:flex md:w-[360px]'

  const mainWrapperClass =
    showSettings || (activeChatId && !mobileShowList)
      ? 'flex min-w-0 flex-1 flex-col'
      : 'hidden min-w-0 flex-1 flex-col md:flex'

  const showMobileTabs = Boolean(
    activeChat && !showActiveOrder && !showHistoryOrder,
  )

  const sidebarProps = {
    user: currentUser,
    chats: appData.chats,
    friends: appData.friends,
    activeChatId,
    onSelectChat: handleSelectChat,
    onLogout: logout,
    onOpenSettings: () => setShowSettings(true),
    onAddFriend: handleAddFriendAsync,
    onCreateGroup: handleCreateGroup,
    onStartDirectChat: handleStartDirectChat,
  }

  if (showSettings) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className={sidebarWrapperClass}>
          <ChatSidebar
            {...sidebarProps}
            onSelectChat={(id) => {
              setShowSettings(false)
              handleSelectChat(id)
            }}
          />
        </div>
        <main className={mainWrapperClass}>
          <SettingsPage onBack={() => setShowSettings(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className={sidebarWrapperClass}>
        <ChatSidebar {...sidebarProps} />
      </div>

      <main className={`${mainWrapperClass} bg-wa-chat-bg`}>
        {!activeChat ? (
          <div className="hidden flex-1 flex-col items-center justify-center text-ink-muted md:flex">
            <p className="text-lg">BiteChat</p>
            <p className="mt-2 text-sm">Select a chat to start ordering food</p>
          </div>
        ) : showHistoryOrder ? (
          <OrderSummary
            chat={activeChat}
            activeOrder={viewingHistoryOrder.order}
            readOnly
            onBack={handleBackFromHistory}
            onAdvanceProgress={() => {}}
            onCreateProposal={() => {}}
            onVote={() => {}}
            onToggleShoppingItem={() => {}}
          />
        ) : showActiveOrder ? (
          <OrderSummary
            chat={activeChat}
            activeOrder={session.activeOrder!}
            currentUserDisplayName={currentUser.displayName}
            onBack={handleBackFromSummary}
            onAdvanceProgress={handleAdvanceProgress}
            onCreateProposal={handleCreateProposal}
            onVote={handleVote}
            onToggleShoppingItem={handleToggleShoppingItem}
          />
        ) : (
          <>
            <ChatHeader
              chat={activeChat}
              archived={isLegacyArchived}
              onBack={handleBackToList}
            />
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <ChatPanel
                messages={session.messages}
                usedFoods={usedFoods}
                archived={isLegacyArchived}
                onAddToZone={isLegacyArchived ? undefined : handleAddItem}
                className={
                  mobilePanel === 'chat'
                    ? 'flex min-h-0 flex-1 flex-col'
                    : 'hidden min-h-0 flex-1 flex-col md:flex'
                }
                composer={
                  isLegacyArchived || mobilePanel !== 'chat' ? null : (
                    <ChatComposer onSend={handleSend} />
                  )
                }
              />
              {isLegacyArchived ? (
                <OrderHistoryPanel
                  completedOrders={session.completedOrders}
                  viewingOrderId={session.viewingHistoryOrderId}
                  onSelectOrder={handleViewHistoryOrder}
                  className={
                    mobilePanel === 'history'
                      ? 'flex min-h-0 flex-1 flex-col border-t md:border-t-0'
                      : 'hidden min-h-0 flex-1 flex-col md:flex md:border-t-0'
                  }
                />
              ) : (
                <>
                  <OrderBoard
                    items={session.orderItems}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onClearBoard={handleClearBoard}
                    onSubmit={handleSubmitOrder}
                    submitting={submittingOrder}
                    className={
                      mobilePanel === 'order'
                        ? 'flex min-h-0 flex-1 flex-col border-t md:border-t-0'
                        : 'hidden min-h-0 flex-1 flex-col md:flex md:border-t-0'
                    }
                  />
                  {hasPastOrders && (
                    <OrderHistoryPanel
                      completedOrders={session.completedOrders}
                      viewingOrderId={session.viewingHistoryOrderId}
                      onSelectOrder={handleViewHistoryOrder}
                      className={
                        mobilePanel === 'history'
                          ? 'flex min-h-0 flex-1 flex-col border-t md:border-t-0'
                          : 'hidden min-h-0 flex-1 flex-col md:flex md:border-t-0'
                      }
                    />
                  )}
                </>
              )}
            </div>
            {showMobileTabs && (
              <MobilePanelTabs
                panel={mobilePanel}
                onChange={setMobilePanel}
                orderCount={session.orderItems.length}
                archived={isLegacyArchived}
                historyCount={session.completedOrders.length}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
