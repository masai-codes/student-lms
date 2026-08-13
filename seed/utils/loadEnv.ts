import { resolve } from 'node:path'

import dotenv from 'dotenv'

const root = process.cwd()

// Match Vite env precedence: `.env` base, `.env.local` overrides it, but a
// variable already set in the shell wins over both (so one-off runs like
// `DATABASE_URL=… npm run db:pull` target exactly the DB they name).
const shellEnv = { ...process.env }

dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local'), override: true })

for (const [key, value] of Object.entries(shellEnv)) {
  process.env[key] = value
}
