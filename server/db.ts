import bcrypt from 'bcryptjs'
import { sqlAll, sqlExec, sqlGet, sqlRun } from './sql.js'

let dbReady: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!dbReady) {
    dbReady = initDb()
  }
  return dbReady
}

export async function initDb() {
  await sqlExec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      initials TEXT NOT NULL,
      llm_api_key TEXT,
      llm_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
      llm_setup_skipped INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS friendships (
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('group', 'direct')),
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      last_message TEXT NOT NULL DEFAULT '',
      last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (chat_id, user_id),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      author_id TEXT,
      text TEXT NOT NULL,
      food_items_json TEXT NOT NULL DEFAULT '[]',
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS chat_order_state (
      chat_id TEXT PRIMARY KEY,
      order_items_json TEXT NOT NULL DEFAULT '[]',
      active_order_json TEXT,
      completed_orders_json TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
  `)

  await migrateDb()
  await seedDemoUsers()
}

async function migrateDb() {
  const columns = await sqlAll<{ name: string }>('PRAGMA table_info(users)')
  if (!columns.some((column) => column.name === 'llm_model')) {
    await sqlExec(
      `ALTER TABLE users ADD COLUMN llm_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash'`,
    )
  }

  await sqlExec(`UPDATE chats SET archived = 0, archived_at = NULL WHERE archived = 1`)
}

async function seedDemoUsers() {
  const count = await sqlGet<{ c: number }>('SELECT COUNT(*) as c FROM users')
  if (!count || count.c > 0) return

  const demos = [
    { username: 'maya', password: 'demo123', displayName: 'Maya', initials: 'MY' },
    { username: 'jordan', password: 'demo123', displayName: 'Jordan', initials: 'JO' },
    { username: 'sam', password: 'demo123', displayName: 'Sam', initials: 'SA' },
    { username: 'priya', password: 'demo123', displayName: 'Priya', initials: 'PR' },
  ]

  const ids: Record<string, string> = {}
  for (const demo of demos) {
    const id = crypto.randomUUID()
    ids[demo.username] = id
    await sqlRun(
      `INSERT INTO users (id, username, password_hash, display_name, initials, llm_setup_skipped)
       VALUES (?, ?, ?, ?, ?, 1)`,
      id,
      demo.username,
      bcrypt.hashSync(demo.password, 10),
      demo.displayName,
      demo.initials,
    )
  }

  for (const [a, b] of [
    ['maya', 'jordan'],
    ['maya', 'sam'],
    ['maya', 'priya'],
    ['jordan', 'sam'],
  ]) {
    await sqlRun(
      'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)',
      ids[a],
      ids[b],
    )
    await sqlRun(
      'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)',
      ids[b],
      ids[a],
    )
  }

  await seedOfficeLunchChat(ids)
}

async function seedOfficeLunchChat(ids: Record<string, string>) {
  const chatId = crypto.randomUUID()
  await sqlRun(
    `INSERT INTO chats (id, type, name, last_message, last_message_at)
     VALUES (?, 'group', 'Office Lunch — Thai Friday', 'Maya: green curry sounds good', datetime('now'))`,
    chatId,
  )

  for (const username of ['maya', 'jordan', 'sam', 'priya']) {
    await sqlRun('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)', chatId, ids[username])
  }

  await sqlRun('INSERT INTO chat_order_state (chat_id) VALUES (?)', chatId)

  const messages = [
    {
      author: 'maya',
      text: 'Anyone up for Thai? I could go for pad thai and maybe spring rolls to share.',
      food: ['pad thai', 'spring rolls'],
    },
    {
      author: 'jordan',
      text: 'Yes! I want green curry — medium spice. Also mango sticky rice if they have it.',
      food: ['green curry', 'mango sticky rice'],
    },
    {
      author: 'maya',
      text: 'Pad thai for me too. Sam, are you in?',
      food: ['pad thai'],
    },
    {
      author: 'sam',
      text: 'In. Tom yum soup and papaya salad. Can someone grab extra spring rolls?',
      food: ['tom yum soup', 'papaya salad', 'spring rolls'],
    },
    {
      author: 'priya',
      text: 'Vegetarian pad thai please — no egg. I will skip dessert.',
      food: ['vegetarian pad thai'],
    },
  ]

  for (const msg of messages) {
    await sqlRun(
      `INSERT INTO messages (id, chat_id, author_id, text, food_items_json)
       VALUES (?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      chatId,
      ids[msg.author],
      msg.text,
      JSON.stringify(msg.food),
    )
  }
}

export type DbUser = {
  id: string
  username: string
  password_hash: string
  display_name: string
  initials: string
  llm_api_key: string | null
  llm_model: string
  llm_setup_skipped: number
}

export async function getUserByUsername(username: string): Promise<DbUser | undefined> {
  return sqlGet<DbUser>('SELECT * FROM users WHERE username = ? COLLATE NOCASE', username)
}

export async function getUserById(id: string): Promise<DbUser | undefined> {
  return sqlGet<DbUser>('SELECT * FROM users WHERE id = ?', id)
}
