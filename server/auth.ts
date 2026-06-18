import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { getUserById } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'bitechat-dev-secret-change-in-production'

if (process.env.VERCEL && !process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set — using an insecure default. Set it in Vercel project settings.')
}

export interface AuthPayload {
  userId: string
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const payload = verifyToken(header.slice(7))
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
  try {
    const user = await getUserById(payload.userId)
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: import('./db.js').DbUser
    }
  }
}

import { normalizeLlmModel } from './llmModels.js'

export function publicUser(user: import('./db.js').DbUser) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    initials: user.initials,
    hasLlmKey: Boolean(user.llm_api_key),
    llmSetupSkipped: Boolean(user.llm_setup_skipped),
    llmModel: normalizeLlmModel(user.llm_model),
  }
}
