const LOCALHOST_TOKEN = 'localhost'

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() ?? ''
}

/**
 * Prevent seed scripts from running against non-local databases.
 */
export function assertLocalSeedDatabase(): void {
  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl || !databaseUrl.toLowerCase().includes(LOCALHOST_TOKEN)) {
    throw new Error(
      'Seed scripts are allowed only when DATABASE_URL contains "localhost". ' +
        'Update DATABASE_URL before running seed or reset commands.',
    )
  }
}
