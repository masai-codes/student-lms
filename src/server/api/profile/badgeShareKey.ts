import crypto from 'node:crypto'

/**
 * Opaque, HMAC-signed key identifying a `(user, badge_config)` pair for the
 * API's public badge landing page (`{EXPERIENCE_API_BASE_URL}/badge/<key>`),
 * which ships OG/Twitter tags so LinkedIn and WhatsApp render the badge image.
 *
 * The signing scheme must match experience-api's `badgeShareToken.ts` exactly —
 * base64url of `"<userId>.<badgeConfigId>"`, then a 16-char truncated
 * base64url HMAC-SHA256 of the same payload — or the API will reject the key.
 *
 * Returns `null` when no secret is configured, so we ship a text-only share
 * rather than a link that 404s. Deliberately does **not** fall back to
 * experience-api's hardcoded default secret: a wrong signature is worse than no
 * link, because the failure only shows up after the student posts it.
 */

const SIGNATURE_LENGTH = 16

function resolveSecret(): string | null {
  const secret =
    process.env.BADGE_SHARE_SECRET?.trim() || process.env.JWT_SECRET?.trim()
  return secret ? secret : null
}

/** Whether badge share links can be generated in this environment. */
export function canShareBadges(): boolean {
  return resolveSecret() !== null
}

export function createBadgeShareKey(
  userId: number,
  badgeConfigId: number,
): string | null {
  const secret = resolveSecret()
  if (!secret) return null

  const payload = `${userId}.${badgeConfigId}`
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
    .slice(0, SIGNATURE_LENGTH)

  return `${encoded}.${signature}`
}
