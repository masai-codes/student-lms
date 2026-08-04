import { createFileRoute, redirect } from '@tanstack/react-router'

import type { NotesPreviewSearch } from '@/components/features/notes-preview'
import { NotesPreviewV2 } from '@/components/features/notes-preview'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

/**
 * `/notes-preview-v2` — a standalone, chrome-less WebView page rendered outside
 * the app shell (`(protected)/_layout`), so it carries no navbar, tab bar, or
 * Clarity tracking. It reads `token`/`category`/`contentType`/`entityId` from
 * the URL, exchanges the one-time bootstrap token for a session cookie on load,
 * then fetches and renders the requested lecture/assignment field as markdown.
 */
export const Route = createFileRoute('/notes-preview-v2')({
  validateSearch: (search: Record<string, unknown>): NotesPreviewSearch => ({
    token:
      typeof search.token === 'string' && search.token.length > 0
        ? search.token
        : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    contentType:
      typeof search.contentType === 'string' ? search.contentType : undefined,
    entityId:
      search.entityId != null && String(search.entityId).length > 0
        ? String(search.entityId)
        : undefined,
  }),
  beforeLoad: async ({ location }) => {
    const requestUrl = new URL(location.href, 'http://localhost')
    const token = requestUrl.searchParams.get('token')
    let user = await fetchCurrentUser()

    // Auto-login: when the WebView is opened without a session but carries a
    // `?token=` bootstrap JWT, verifying it persists the session cookie so the
    // content fetch below is authenticated. An invalid token simply leaves the
    // request unauthenticated (the page then shows its empty/error state).
    if (!user && token) {
      user = await bootstrapLoginWithToken({ data: token })
    }

    // One-time bootstrap tokens must not linger in the URL (history, logs,
    // Referer). Strip `token` and send the browser to the clean URL; later
    // param-only URL updates re-run this loader with no token and no redirect.
    if (token) {
      const cleanParams = new URLSearchParams(requestUrl.searchParams)
      cleanParams.delete('token')
      const cleanSearch = cleanParams.toString()
      throw redirect({
        href: `${location.pathname}${
          cleanSearch ? `?${cleanSearch}` : ''
        }`,
        replace: true,
      })
    }

    return { user }
  },
  component: NotesPreviewV2,
})
