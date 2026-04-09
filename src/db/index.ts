import { drizzle } from 'drizzle-orm/mysql2'
import { useRuntimeConfig } from 'nitro/runtime-config'

const config = useRuntimeConfig()

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

export const db = drizzle(config.databaseUrl)
