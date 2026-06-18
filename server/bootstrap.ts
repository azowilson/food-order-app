import { sqlAll, sqlGet, sqlRun } from './sql.js'
import { getUserById } from './db.js'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export async function getFriends(userId: string): Promise<string[]> {
  const rows = await sqlAll<{ username: string }>(
    `
    SELECT u.username FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ?
    ORDER BY u.display_name
  `,
    userId,
  )
  return rows.map((r) => r.username)
}

export async function getBootstrap(userId: string) {
  const user = (await getUserById(userId))!
  const friends = await getFriends(userId)

  const chatRows = await sqlAll<{
    id: string
    type: 'group' | 'direct'
    name: string
    archived: number
    archived_at: string | null
    last_message: string
    last_message_at: string
  }>(
    `
    SELECT c.* FROM chats c
    JOIN chat_members cm ON cm.chat_id = c.id
    WHERE cm.user_id = ?
    ORDER BY c.archived ASC, c.last_message_at DESC
  `,
    userId,
  )

  const chats = await Promise.all(
    chatRows.map(async (chat) => {
      const members = await sqlAll<{ username: string }>(
        `
      SELECT u.username FROM chat_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.chat_id = ?
    `,
        chat.id,
      )

      let displayName = chat.name
      if (chat.type === 'direct') {
        const other = members.find((m) => m.username !== user.username)
        if (other) {
          const otherUser = await sqlGet<{ display_name: string }>(
            'SELECT display_name FROM users WHERE username = ?',
            other.username,
          )
          if (otherUser) displayName = otherUser.display_name
        }
      }

      return {
        id: chat.id,
        type: chat.type,
        name: displayName,
        memberUsernames: members.map((m) => m.username),
        archived: Boolean(chat.archived),
        archivedAt: chat.archived_at ?? undefined,
        lastMessage: chat.last_message,
        time: formatTime(chat.last_message_at),
        unread: 0,
      }
    }),
  )

  const chatSessions: Record<string, unknown> = {}

  for (const chat of chats) {
    const messages = await sqlAll<{
      id: string
      text: string
      food_items_json: string
      is_system: number
      created_at: string
      display_name: string | null
      initials: string | null
      author_user_id: string | null
    }>(
      `
      SELECT m.*, u.display_name, u.initials, u.id as author_user_id
      FROM messages m
      LEFT JOIN users u ON u.id = m.author_id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `,
      chat.id,
    )

    const orderState = await sqlGet<{
      order_items_json: string
      active_order_json: string | null
      completed_orders_json: string
    }>('SELECT * FROM chat_order_state WHERE chat_id = ?', chat.id)

    chatSessions[chat.id] = {
      messages: messages.map((m) => ({
        id: m.id,
        author: m.is_system ? 'System' : (m.display_name ?? 'Unknown'),
        authorInitials: m.is_system ? 'SY' : (m.initials ?? '??'),
        isSelf: m.author_user_id === userId,
        time: formatTime(m.created_at),
        text: m.text,
        foodItems: JSON.parse(m.food_items_json) as string[],
        system: Boolean(m.is_system),
      })),
      orderItems: JSON.parse(orderState?.order_items_json ?? '[]'),
      activeOrder: orderState?.active_order_json
        ? JSON.parse(orderState.active_order_json)
        : null,
      completedOrders: JSON.parse(orderState?.completed_orders_json ?? '[]'),
      viewingHistoryOrderId: null,
    }
  }

  return { friends, chats, chatSessions }
}

export async function ensureChatAccess(chatId: string, userId: string) {
  const row = await sqlGet('SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?', chatId, userId)
  return Boolean(row)
}

export async function saveChatOrderState(
  chatId: string,
  orderItems: unknown,
  activeOrder: unknown | null,
  completedOrders: unknown,
) {
  await sqlRun(
    `
    INSERT INTO chat_order_state (chat_id, order_items_json, active_order_json, completed_orders_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(chat_id) DO UPDATE SET
      order_items_json = excluded.order_items_json,
      active_order_json = excluded.active_order_json,
      completed_orders_json = excluded.completed_orders_json
  `,
    chatId,
    JSON.stringify(orderItems),
    activeOrder ? JSON.stringify(activeOrder) : null,
    JSON.stringify(completedOrders),
  )
}

export async function updateChatMeta(chatId: string, lastMessage: string) {
  await sqlRun(
    `UPDATE chats SET last_message = ?, last_message_at = datetime('now') WHERE id = ?`,
    lastMessage,
    chatId,
  )
}

export async function getChatMemberCount(chatId: string) {
  const row = await sqlGet<{ c: number }>(
    'SELECT COUNT(*) as c FROM chat_members WHERE chat_id = ?',
    chatId,
  )
  return row?.c ?? 0
}

export async function getMemberDisplayNames(chatId: string): Promise<string[]> {
  const rows = await sqlAll<{ display_name: string }>(
    `
    SELECT u.display_name FROM chat_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.chat_id = ?
  `,
    chatId,
  )
  return rows.map((r) => r.display_name)
}
