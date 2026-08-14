import './seed/utils/loadEnv'
import { defineConfig } from 'drizzle-kit'
import { MANAGED_TABLES } from './src/db/managedTables'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  tablesFilter: [...MANAGED_TABLES],
  dbCredentials: {
    // Schema truth is prod: `db:pull` introspects the prod read replica when
    // PROD_READ_ONLY_DATABASE_URL is set, falling back to DATABASE_URL.
    // (Migrations don't go through this file — scripts/migrate.mjs applies
    // them to DATABASE_URL.)
    url: process.env.PROD_READ_ONLY_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
})
