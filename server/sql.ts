import { createClient, type Client } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let client: Client | null = null

export function getSqlClient(): Client {
  if (client) return client

  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (tursoUrl) {
    client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return client
  }

  const dataDir = process.env.VERCEL
    ? path.join('/tmp', 'bitechat')
    : path.join(__dirname, '..', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  client = createClient({ url: `file:${path.join(dataDir, 'bitechat.db')}` })
  return client
}

export async function sqlExec(sql: string): Promise<void> {
  await getSqlClient().executeMultiple(sql)
}

export async function sqlRun(sql: string, ...args: unknown[]): Promise<void> {
  await getSqlClient().execute({ sql, args })
}

export async function sqlGet<T>(sql: string, ...args: unknown[]): Promise<T | undefined> {
  const result = await getSqlClient().execute({ sql, args })
  if (!result.rows.length) return undefined
  return result.rows[0] as T
}

export async function sqlAll<T>(sql: string, ...args: unknown[]): Promise<T[]> {
  const result = await getSqlClient().execute({ sql, args })
  return result.rows as T[]
}
