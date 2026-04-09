import { drizzle } from 'drizzle-orm/mysql2'
import { useRuntimeConfig } from 'nitro/runtime-config'

const config = useRuntimeConfig()

if (!config.databaseUrl) {
  console.log(config)
  throw new Error(
    `DATABASE_URL is not defined in environment variables. ${JSON.stringify(config)}. ${JSON.stringify(process.env)}`,
  )
}

export const db = drizzle(config.databaseUrl)
