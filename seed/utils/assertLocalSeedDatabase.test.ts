import { describe, expect, it } from 'vitest'

import { assertLocalSeedDatabase } from './assertLocalSeedDatabase'

describe('assertLocalSeedDatabase', () => {
  it('passes when DATABASE_URL contains localhost', () => {
    const previousDatabaseUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/student_lms_test'

    expect(() => assertLocalSeedDatabase()).not.toThrow()

    process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('throws when DATABASE_URL points to non-localhost host', () => {
    const previousDatabaseUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'mysql://user:pass@prod-db.internal:3306/student_lms'

    expect(() => assertLocalSeedDatabase()).toThrow(/DATABASE_URL contains "localhost"/)

    process.env.DATABASE_URL = previousDatabaseUrl
  })
})
