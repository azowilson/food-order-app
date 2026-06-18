import cors from 'cors'
import express from 'express'
import { ensureDb } from './db.js'
import { apiRouter } from './routes.js'

export async function createApp() {
  await ensureDb()

  const app = express()

  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
  if (process.env.VERCEL_URL) {
    defaultOrigins.push(`https://${process.env.VERCEL_URL}`)
  }
  const configuredOrigins = process.env.CLIENT_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean)
  const allowedOrigins = configuredOrigins?.length ? configuredOrigins : defaultOrigins

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', apiRouter)

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
