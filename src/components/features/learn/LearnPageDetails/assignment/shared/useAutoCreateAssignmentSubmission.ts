'use client'

import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { createAssignmentSubmission } from '@/lib/api/learn/assignmentDetailActionsApi'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

/**
 * Whether a submission should be auto-created the moment the learner opens the
 * page. Mirrors the legacy LMS: once the schedule window is open, every
 * non-evaluation assignment gets a submission row without any explicit click.
 * Evaluations are excluded — they gate creation behind the integrity pledge.
 */
export function shouldAutoCreateSubmission(
  detail: AssignmentDetailPayload,
): boolean {
  if (detail.restriction) return false
  if (detail.assignmentKind === 'evaluation') return false
  if (detail.phase === 'before') return false
  return detail.footer.meta.submissionId == null
}

/**
 * Auto-create the assignment submission on load (GAP #1 parity with legacy
 * LMS). Best-effort: a failure (e.g. a 409 race or a section-enrollment 403)
 * is swallowed because the learner can still start manually from the footer.
 */
export function useAutoCreateAssignmentSubmission(
  detail: AssignmentDetailPayload,
): void {
  const router = useRouter()
  const attemptedRef = useRef<number | null>(null)
  const eligible = shouldAutoCreateSubmission(detail)

  useEffect(() => {
    if (!eligible) return
    if (attemptedRef.current === detail.id) return
    attemptedRef.current = detail.id

    void (async () => {
      try {
        await createAssignmentSubmission(detail.id)
        await router.invalidate()
      } catch {
        // Best-effort auto-start; ignore and let the learner start manually.
      }
    })()
  }, [eligible, detail.id, router])
}
