import { createHash } from 'node:crypto'

const MOCK_HASH_PREFIX = 'mock-sha256$'
const LEGACY_BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/

// Temporary replacement for bcryptjs while isolating runtime issues.
export async function hashPassword(password: string): Promise<string> {
  return `${MOCK_HASH_PREFIX}${createHash('sha256').update(password).digest('hex')}`
}

export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  return storedPassword === (await hashPassword(password))
}

export function isLegacyBcryptHash(storedPassword: string): boolean {
  return LEGACY_BCRYPT_PREFIX.test(storedPassword)
}
