import { drizzle } from 'drizzle-orm/mysql2'
import { useRuntimeConfig } from 'nitro/runtime-config'

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (_db) return _db

  const config = useRuntimeConfig()

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables')
  }

  _db = drizzle(config.databaseUrl)
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})
