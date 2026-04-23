import { drizzle } from 'drizzle-orm/mysql2'
import { ensureSecrets } from '@/secrets'

await ensureSecrets()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}
// console on error
export const db = drizzle(databaseUrl, {
  logger: true,
})