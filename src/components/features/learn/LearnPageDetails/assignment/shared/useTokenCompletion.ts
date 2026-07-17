'use client'

import { useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { markSubmissionCompletedWithToken } from '@/lib/api/learn/assignmentDetailActionsApi'

/**
 * Extract the Assess Platform return token from the URL search params, but only
 * when the `markAsCompleted` flag is set. Mirrors the legacy LMS deep-link
 * (`?sauToken=<token>&markAsCompleted=true`) used when the platform redirects
 * the learner back after finishing a test. Returns null when the flag is
 * absent or the token is missing/blank.
 */
export function readTokenCompletionParams(
  search: Record<string, unknown>,
): string | null {
  const flag = search.markAsCompleted
  const flagged = flag === true || flag === 'true'
  if (!flagged) return null

  const token = search.sauToken
  return typeof token === 'string' && token.trim() !== '' ? token : null
}

/**
 * Complete the assignment via the Assess Platform return token (GAP #3 parity
 * with legacy LMS). Runs once per distinct token; best-effort, so an invalid or
 * stale token is silently ignored rather than surfaced to the learner.
 */
export function useTokenCompletion(assignmentId: number): void {
  const router = useRouter()
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  })
  const attemptedRef = useRef<string | null>(null)

  useEffect(() => {
    const token = readTokenCompletionParams(search)
    if (token == null) return
    if (attemptedRef.current === token) return
    attemptedRef.current = token

    void (async () => {
      try {
        await markSubmissionCompletedWithToken(assignmentId, token)
        await router.invalidate()
      } catch {
        // Best-effort completion; ignore invalid/stale return tokens.
      }
    })()
  }, [assignmentId, router, search])
}
