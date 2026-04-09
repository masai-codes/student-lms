import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'

if (!process.env.NITRO_DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

export const db = drizzle(process.env.NITRO_DATABASE_URL)
