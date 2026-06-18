import { createApp } from './app.js'

const PORT = Number(process.env.PORT ?? 3001)

createApp().then((app) => {
  app.listen(PORT, () => {
    console.log(`BiteChat API running on http://localhost:${PORT}`)
  })
})
