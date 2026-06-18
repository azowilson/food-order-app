import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { getUserById, getUserByUsername } from './db.js'
import { authMiddleware, publicUser, signToken } from './auth.js'
import {
  ensureChatAccess,
  getBootstrap,
  saveChatOrderState,
  updateChatMeta,
} from './bootstrap.js'
import { analyzeMessageForFood, buildOrderSummary } from './ai.js'
import {
  isAllowedLlmModel,
  LLM_MODEL_GROUPS,
  LLM_MODEL_OPTIONS,
  LLM_PROVIDER_KEY_LABELS,
  LLM_PROVIDER_PLACEHOLDERS,
  normalizeLlmModel,
  type LlmProvider,
  getApiKeyHint,
  getLlmProvider,
} from './llmModels.js'
import { callLlm } from './llmClient.js'
import { sqlGet, sqlRun } from './sql.js'

export const apiRouter = Router()

function param(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function readOrderState(chatId: string) {
  return sqlGet<{
    order_items_json: string
    active_order_json: string | null
    completed_orders_json: string
  }>('SELECT * FROM chat_order_state WHERE chat_id = ?', chatId)
}

function llmConfig(user: import('./db.js').DbUser) {
  return {
    apiKey: user.llm_api_key,
    model: user.llm_model,
  }
}

apiRouter.post('/auth/register', async (req, res) => {
  const { username, password, displayName } = req.body as {
    username?: string
    password?: string
    displayName?: string
  }

  if (!username?.trim() || !password || password.length < 6) {
    res.status(400).json({ error: 'Username and password (min 6 chars) required' })
    return
  }

  if (await getUserByUsername(username.trim())) {
    res.status(409).json({ error: 'Username already taken' })
    return
  }

  const name = displayName?.trim() || username.trim()
  const id = crypto.randomUUID()
  await sqlRun(
    `INSERT INTO users (id, username, password_hash, display_name, initials) VALUES (?, ?, ?, ?, ?)`,
    id,
    username.trim().toLowerCase(),
    bcrypt.hashSync(password, 10),
    name,
    initialsFromName(name),
  )

  const user = (await getUserById(id))!
  res.json({ token: signToken(id), user: publicUser(user), appData: await getBootstrap(id) })
})

apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }
  const user = username ? await getUserByUsername(username.trim()) : undefined
  if (!user || !bcrypt.compareSync(password ?? '', user.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }
  res.json({
    token: signToken(user.id),
    user: publicUser(user),
    appData: await getBootstrap(user.id),
  })
})

apiRouter.get('/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: publicUser(req.user!), appData: await getBootstrap(req.user!.id) })
})

apiRouter.get('/settings', authMiddleware, (req, res) => {
  const providers: LlmProvider[] = ['openai', 'gemini', 'groq', 'mistral', 'openrouter']
  res.json({
    user: publicUser(req.user!),
    llmModels: LLM_MODEL_OPTIONS,
    llmModelGroups: LLM_MODEL_GROUPS,
    providerHints: Object.fromEntries(providers.map((p) => [p, getApiKeyHint(p)])),
    providerKeyLabels: LLM_PROVIDER_KEY_LABELS,
    providerPlaceholders: LLM_PROVIDER_PLACEHOLDERS,
  })
})

apiRouter.post('/settings/ai/test', authMiddleware, async (req, res) => {
  const { apiKey, llmModel } = req.body as { apiKey?: string; llmModel?: string }
  const user = req.user!
  const key = apiKey?.trim() || user.llm_api_key
  const model = llmModel ? normalizeLlmModel(llmModel) : user.llm_model

  if (!key) {
    res.status(400).json({ error: 'Enter an API key to test' })
    return
  }
  if (!isAllowedLlmModel(model)) {
    res.status(400).json({ error: 'Unsupported LLM model' })
    return
  }

  try {
    const raw = await callLlm(
      key,
      model,
      'Reply with JSON only: { "ok": true }',
      'connection test',
    )
    JSON.parse(raw)
    res.json({
      ok: true,
      provider: getLlmProvider(model),
      model,
    })
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Connection test failed',
    })
  }
})

apiRouter.patch('/settings/profile', authMiddleware, async (req, res) => {
  const { displayName, currentPassword, newPassword } = req.body as {
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }

  const user = req.user!
  const updates: string[] = []
  const values: unknown[] = []

  if (displayName !== undefined) {
    const name = displayName.trim()
    if (!name) {
      res.status(400).json({ error: 'Display name cannot be empty' })
      return
    }
    updates.push('display_name = ?', 'initials = ?')
    values.push(name, initialsFromName(name))
  }

  if (newPassword !== undefined) {
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' })
      return
    }
    if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect' })
      return
    }
    updates.push('password_hash = ?')
    values.push(bcrypt.hashSync(newPassword, 10))
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No profile changes provided' })
    return
  }

  await sqlRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...values, user.id)
  res.json({ user: publicUser((await getUserById(user.id))!) })
})

apiRouter.put('/settings/ai', authMiddleware, async (req, res) => {
  const { apiKey, removeApiKey, llmModel } = req.body as {
    apiKey?: string
    removeApiKey?: boolean
    llmModel?: string
  }

  const user = req.user!
  let nextKey = user.llm_api_key
  let nextModel = user.llm_model

  if (removeApiKey) {
    nextKey = null
  } else if (apiKey !== undefined) {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      res.status(400).json({ error: 'API key cannot be empty' })
      return
    }
    nextKey = trimmed
  }

  if (llmModel !== undefined) {
    const model = normalizeLlmModel(llmModel)
    if (!isAllowedLlmModel(model)) {
      res.status(400).json({ error: 'Unsupported LLM model' })
      return
    }
    nextModel = model
  }

  await sqlRun(
    `UPDATE users SET llm_api_key = ?, llm_model = ?, llm_setup_skipped = ? WHERE id = ?`,
    nextKey,
    nextModel,
    nextKey ? 0 : user.llm_setup_skipped,
    user.id,
  )

  res.json({ user: publicUser((await getUserById(user.id))!) })
})

apiRouter.put('/auth/llm-key', authMiddleware, async (req, res) => {
  const { apiKey, llmModel } = req.body as { apiKey?: string; llmModel?: string }
  if (!apiKey?.trim()) {
    res.status(400).json({ error: 'API key required' })
    return
  }
  const model = llmModel ? normalizeLlmModel(llmModel) : req.user!.llm_model
  if (!isAllowedLlmModel(model)) {
    res.status(400).json({ error: 'Unsupported LLM model' })
    return
  }
  await sqlRun(
    'UPDATE users SET llm_api_key = ?, llm_model = ?, llm_setup_skipped = 0 WHERE id = ?',
    apiKey.trim(),
    model,
    req.user!.id,
  )
  res.json({ user: publicUser((await getUserById(req.user!.id))!) })
})

apiRouter.delete('/auth/llm-key', authMiddleware, async (req, res) => {
  await sqlRun('UPDATE users SET llm_api_key = NULL WHERE id = ?', req.user!.id)
  res.json({ user: publicUser((await getUserById(req.user!.id))!) })
})

apiRouter.post('/auth/skip-llm-setup', authMiddleware, async (req, res) => {
  await sqlRun('UPDATE users SET llm_setup_skipped = 1 WHERE id = ?', req.user!.id)
  res.json({ user: publicUser((await getUserById(req.user!.id))!) })
})

apiRouter.get('/bootstrap', authMiddleware, async (req, res) => {
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/friends', authMiddleware, async (req, res) => {
  const { username } = req.body as { username?: string }
  const friend = username ? await getUserByUsername(username.trim()) : undefined
  if (!friend) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  if (friend.id === req.user!.id) {
    res.status(400).json({ error: 'You cannot add yourself' })
    return
  }
  await sqlRun(
    'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)',
    req.user!.id,
    friend.id,
  )
  await sqlRun(
    'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)',
    friend.id,
    req.user!.id,
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/group', authMiddleware, async (req, res) => {
  const { name, memberUsernames } = req.body as {
    name?: string
    memberUsernames?: string[]
  }
  if (!name?.trim() || !memberUsernames?.length) {
    res.status(400).json({ error: 'Group name and members required' })
    return
  }

  const chatId = crypto.randomUUID()
  await sqlRun(`INSERT INTO chats (id, type, name, last_message) VALUES (?, 'group', ?, ?)`, chatId, name.trim(), `${req.user!.display_name} created the group`)

  await sqlRun('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', chatId, req.user!.id)
  for (const uname of memberUsernames) {
    const member = await getUserByUsername(uname)
    if (member) {
      await sqlRun('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', chatId, member.id)
    }
  }

  await sqlRun('INSERT INTO chat_order_state (chat_id) VALUES (?)', chatId)
  await sqlRun(
    `INSERT INTO messages (id, chat_id, author_id, text, is_system) VALUES (?, ?, NULL, ?, 1)`,
    crypto.randomUUID(),
    chatId,
    `${req.user!.display_name} created "${name.trim()}". Drag food from chat to start an order.`,
  )

  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/direct', authMiddleware, async (req, res) => {
  const { friendUsername } = req.body as { friendUsername?: string }
  const friend = friendUsername ? await getUserByUsername(friendUsername.trim()) : undefined
  if (!friend) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const existing = await sqlGet<{ id: string }>(
    `SELECT c.id FROM chats c
       JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = ?
       JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = ?
       WHERE c.type = 'direct' LIMIT 1`,
    req.user!.id,
    friend.id,
  )

  if (!existing) {
    const chatId = crypto.randomUUID()
    await sqlRun(`INSERT INTO chats (id, type, name, last_message) VALUES (?, 'direct', ?, ?)`, chatId, friend.display_name, 'Say hi and plan lunch')
    await sqlRun('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', chatId, req.user!.id)
    await sqlRun('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', chatId, friend.id)
    await sqlRun('INSERT INTO chat_order_state (chat_id) VALUES (?)', chatId)
  }

  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/messages', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  const { text } = req.body as { text?: string }

  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  if (!text?.trim()) {
    res.status(400).json({ error: 'Message text required' })
    return
  }

  const foodItems = await analyzeMessageForFood(text.trim(), llmConfig(req.user!))
  await sqlRun(
    `INSERT INTO messages (id, chat_id, author_id, text, food_items_json) VALUES (?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    chatId,
    req.user!.id,
    text.trim(),
    JSON.stringify(foodItems),
  )

  await updateChatMeta(chatId, `You: ${text.trim().slice(0, 40)}${text.length > 40 ? '…' : ''}`)
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/order-items', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  const { food, messageId, fromAuthor, zone } = req.body as Record<string, string>

  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  const items = JSON.parse(full?.order_items_json ?? '[]') as unknown[]
  items.push({
    id: crypto.randomUUID(),
    food,
    fromMessageId: messageId,
    fromAuthor,
    zone,
  })

  await saveChatOrderState(
    chatId,
    items,
    full?.active_order_json ? JSON.parse(full.active_order_json) : null,
    JSON.parse(full?.completed_orders_json ?? '[]'),
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.delete('/chats/:chatId/order-items/:itemId', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  const itemId = param(req.params.itemId)
  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  const items = (JSON.parse(full?.order_items_json ?? '[]') as { id: string }[]).filter(
    (i) => i.id !== itemId,
  )
  await saveChatOrderState(
    chatId,
    items,
    full?.active_order_json ? JSON.parse(full.active_order_json) : null,
    JSON.parse(full?.completed_orders_json ?? '[]'),
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/order-items/clear', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  await saveChatOrderState(
    chatId,
    [],
    full?.active_order_json ? JSON.parse(full.active_order_json) : null,
    JSON.parse(full?.completed_orders_json ?? '[]'),
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/orders/submit', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  const orderItems = JSON.parse(full?.order_items_json ?? '[]') as {
    id: string
    food: string
    fromMessageId: string
    fromAuthor: string
    zone: string
  }[]

  if (orderItems.length === 0) {
    res.status(400).json({ error: 'No items on order board' })
    return
  }

  const summary = await buildOrderSummary(orderItems, llmConfig(req.user!))
  const activeOrder = {
    summary,
    progressStage: 'confirmed',
    progressUpdatedAt: new Date().toISOString(),
    proposals: [],
    checkedShoppingItems: [],
  }

  await saveChatOrderState(
    chatId,
    orderItems,
    activeOrder,
    JSON.parse(full?.completed_orders_json ?? '[]'),
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.patch('/chats/:chatId/orders/active', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  const { activeOrder, orderItems } = req.body as {
    activeOrder?: unknown
    orderItems?: unknown
  }

  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  await saveChatOrderState(
    chatId,
    orderItems ?? JSON.parse(full?.order_items_json ?? '[]'),
    activeOrder ?? null,
    JSON.parse(full?.completed_orders_json ?? '[]'),
  )
  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/orders/complete', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  if (!full?.active_order_json) {
    res.status(400).json({ error: 'No active order' })
    return
  }

  const activeOrder = JSON.parse(full.active_order_json) as Record<string, unknown>
  activeOrder.progressStage = 'finished'
  activeOrder.progressUpdatedAt = new Date().toISOString()

  const completed = JSON.parse(full.completed_orders_json) as unknown[]
  completed.push({
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
    order: activeOrder,
  })

  await saveChatOrderState(chatId, [], null, completed)
  await sqlRun(
    `UPDATE chats SET last_message = ?, last_message_at = datetime('now') WHERE id = ?`,
    'Order completed',
    chatId,
  )

  await sqlRun(
    `INSERT INTO messages (id, chat_id, author_id, text, is_system) VALUES (?, ?, NULL, ?, 1)`,
    crypto.randomUUID(),
    chatId,
    'Order completed and saved to past orders. Keep chatting to plan the next one!',
  )

  res.json(await getBootstrap(req.user!.id))
})

apiRouter.post('/chats/:chatId/orders/back', authMiddleware, async (req, res) => {
  const chatId = param(req.params.chatId)
  if (!(await ensureChatAccess(chatId, req.user!.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const full = await readOrderState(chatId)
  await saveChatOrderState(chatId, [], null, JSON.parse(full?.completed_orders_json ?? '[]'))
  res.json(await getBootstrap(req.user!.id))
})
