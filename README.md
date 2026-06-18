# BiteChat

WhatsApp-style group and friend chat for planning food orders together. Drag food mentions from messages onto an order board, generate a shopping list and recipes with AI, and track order progress as a group.

**Stack:** React + Vite + Tailwind (frontend), Express + SQLite/libSQL + JWT (backend).

## Local development

```bash
npm install
npm run dev
```

- UI: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001) (proxied through Vite)

The database is stored in `data/bitechat.db` locally. Demo accounts are seeded on first run:

| Username | Password |
|----------|----------|
| maya     | demo123  |
| jordan   | demo123  |
| sam      | demo123  |
| priya    | demo123  |

Copy `.env.example` to `.env` and set `JWT_SECRET` if you want to override the dev default.

## Deploy to Vercel

This project is configured for a full-stack Vercel deployment (static frontend + serverless API).

### 1. Push to GitHub

Connect your repository to [Vercel](https://vercel.com).

### 2. Set environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Long random string for signing auth tokens |
| `TURSO_DATABASE_URL` | Recommended | Turso database URL (`libsql://…`) |
| `TURSO_AUTH_TOKEN` | Recommended | Turso auth token |

Without Turso, the API falls back to a temporary file in `/tmp` on each serverless instance — fine for a quick demo, but **data will not persist** across deploys or cold starts.

### 3. Create a Turso database (recommended)

```bash
# Install Turso CLI: https://docs.turso.tech/cli
turso db create bitechat
turso db show bitechat --url
turso db tokens create bitechat
```

Add the URL and token to Vercel as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

### 4. Deploy

Vercel picks up `vercel.json` automatically:

- `npm run build` → Vite static output in `dist/`
- `api/index.ts` → Express API at `/api/*`
- SPA routes rewrite to `index.html`

After deploy, open your Vercel URL and register a new account (or rely on demo seed if the database is fresh).

### Custom domain

If you use a custom domain, add it to `CLIENT_ORIGIN` (comma-separated) if you serve the frontend from a different origin than the API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Vite dev server |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | API only |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build locally |

## Project layout

```
api/index.ts          Vercel serverless entry
server/               Express API, AI, database
src/                  React frontend
vercel.json           Vercel routing & build config
```
