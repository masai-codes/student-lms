import './seed/utils/loadEnv'
import { defineConfig } from 'drizzle-kit'
import { MANAGED_TABLES } from './src/db/managedTables'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  tablesFilter: [...MANAGED_TABLES],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
