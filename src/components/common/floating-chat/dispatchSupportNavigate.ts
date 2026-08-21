export type SupportNavigateCategory =
  | 'lecture'
  | 'assignment'
  | 'resource'
  | 'evaluation'

const SUPPORT_NAVIGATE_CATEGORIES = new Set<SupportNavigateCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

/**
 * Tag on every message posted to an embedding host, so the host can tell our
 * messages apart from other `postMessage` traffic (extensions, analytics, …).
 * Keep in sync with the old LMS (`experience-ui`
 * `src/utils/supportIframeMessages.ts`).
 */
export const SUPPORT_IFRAME_MESSAGE_SOURCE = 'masai-support-iframe'

interface SupportNavigateMessage {
  source: typeof SUPPORT_IFRAME_MESSAGE_SOURCE
  type: 'support-navigate'
  category: SupportNavigateCategory
  entityId: string
  /** In-app path for the entity (`/lectures/123`), when known. */
  href: string | null
}

export function isSupportNavigateCategory(
  category: string,
): category is SupportNavigateCategory {
  return SUPPORT_NAVIGATE_CATEGORIES.has(category as SupportNavigateCategory)
}

function isEmbedded(): boolean {
  return typeof window !== 'undefined' && window.parent !== window
}

/**
 * Origin of the embedding host, taken from the referrer. Falls back to `'*'`
 * when the referrer is stripped — the payload is a category + entity id, so it
 * carries nothing sensitive; the host validates our origin on its side.
 */
function getParentOrigin(): string {
  try {
    if (document.referrer) return new URL(document.referrer).origin
  } catch {
    /* malformed referrer — fall through */
  }
  return '*'
}

/**
 * Notify the host that the student asked to open a learn item.
 *
 * Two transports, because the support page is embedded two ways:
 * - `window` CustomEvent — the LMS mobile app WebView, which shares this
 *   document and opens the native learn screen.
 * - `postMessage` to the parent — the old LMS (`experience-ui`) iframe embeds
 *   (`/support` page and the "Raise a Ticket" drawer). A CustomEvent cannot
 *   cross the iframe boundary, so the host only ever sees this one.
 */
export function dispatchSupportNavigate(input: {
  category: string
  entityId: string | number | null | undefined
  href?: string | null
}): void {
  const { category, entityId, href } = input
  if (!isSupportNavigateCategory(category)) return
  if (entityId == null || entityId === '') return
  if (typeof window === 'undefined') return

  const detail = { category, entityId: String(entityId) }

  window.dispatchEvent(new CustomEvent('support-navigate', { detail }))

  if (!isEmbedded()) return

  const message: SupportNavigateMessage = {
    source: SUPPORT_IFRAME_MESSAGE_SOURCE,
    type: 'support-navigate',
    ...detail,
    href: href ?? null,
  }
  window.parent.postMessage(message, getParentOrigin())
}
