import { drizzle } from 'drizzle-orm/mysql2'




const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}
// console on error
export const db = drizzle(databaseUrl, {
  logger: true,
})