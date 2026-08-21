/**
 * Base URL of the public, server-rendered badge landing page
 * (`<base>/badge/<shareKey>`), which is hosted by experience-api because it
 * needs OG/Twitter meta tags for LinkedIn and WhatsApp embeds.
 *
 * `EXPERIENCE_API_BASE_URL` may or may not include a trailing `/graphql`; both
 * shapes are in use across environments, so strip it either way.
 */
export function resolveBadgeLandingBaseUrl(): string | null {
  const base = process.env.EXPERIENCE_API_BASE_URL?.trim()
  if (!base) return null
  return base.replace(/\/graphql\/?$/, '').replace(/\/$/, '')
}
