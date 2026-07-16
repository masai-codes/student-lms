import { resolve } from 'node:path'

import dotenv from 'dotenv'

const root = process.cwd()

// Match Vite env precedence: `.env` base, then `.env.local` overrides.
dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local'), override: true })
