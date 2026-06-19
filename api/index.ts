import type { Express, Request, Response } from 'express'
import { createApp } from '../server/app.js'

let app: Express | undefined
let appInit: Promise<Express> | undefined

async function getApp(): Promise<Express> {
  if (app) return app
  if (!appInit) {
    appInit = createApp().then((instance) => {
      app = instance
      return instance
    })
  }
  return appInit
}

export default async function handler(req: Request, res: Response) {
  const expressApp = await getApp()
  return expressApp(req, res)
}
