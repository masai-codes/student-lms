/** Plaintext password matching DEV_PASSWORD_BCRYPT — local dev / test seeds only. */
export const DEV_PASSWORD_PLAINTEXT = 'password'

/** Bcrypt hash for DEV_PASSWORD_PLAINTEXT (local dev only). */
export const DEV_PASSWORD_BCRYPT =
  '$2a$12$QW35QDkcHSMAtEEGZMwAF.B7MzGYy1OaZU09wmb9l2kGC2SBMJAOO'

export const DEFAULT_ADMIN_EMAIL = 'admin@example.com'
export const DEFAULT_STUDENT_EMAIL = 'student@example.com'

export const DEFAULT_BATCH_NAME = 'FT-MOCK-1'
export const DEFAULT_SECTION_NAME = 'FT-MOCK-1-SEC-A'

export const DEFAULT_ZOOM_LINK = 'https://us06web.zoom.us/j/89929641190'

/** Tables never truncated during seed reset. */
export const PRESERVED_TABLES = ['_prisma_migrations'] as const
