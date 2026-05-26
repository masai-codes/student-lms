'use client'

import { useRouter } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import {
  createAssessPlatformUrl,
  createAssignmentSubmission,
  fetchAssessPlatformViewUrl,
  updateSubmissionCompletion,
} from '@/lib/api/learn/assignmentDetailActionsApi'
import type { AssignmentFooterActionKind } from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function useAssignmentFooterActions(detail: AssignmentDetailPayload) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingKind, setPendingKind] =
    useState<AssignmentFooterActionKind | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshDetail = useCallback(async () => {
    await router.invalidate()
  }, [router])

  const resolveSubmissionId = useCallback(async (): Promise<number> => {
    if (detail.footer.meta.submissionId != null) {
      return detail.footer.meta.submissionId
    }
    const created = await createAssignmentSubmission(detail.id)
    return created.id
  }, [detail.footer.meta.submissionId, detail.id])

  const runAssessPlatformFlow = useCallback(
    async (kind: AssignmentFooterActionKind) => {
      setLoading(true)
      setErrorMessage(null)
      try {
        const existingLink = detail.footer.meta.assessPlatformLink
        if (
          existingLink &&
          (kind === 'continue-assessment' || kind === 'practice-assessment')
        ) {
          openInNewTab(existingLink)
          setModalOpen(false)
          return
        }

        const submissionId = await resolveSubmissionId()
        const { url } = await createAssessPlatformUrl({
          assignmentId: detail.id,
          submissionId,
          platform: detail.footer.meta.platform,
        })
        openInNewTab(url)
        setModalOpen(false)
        await refreshDetail()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Something went wrong'
        setErrorMessage(message)
      } finally {
        setLoading(false)
        setPendingKind(null)
      }
    },
    [
      detail.footer.meta.assessPlatformLink,
      detail.footer.meta.platform,
      detail.id,
      refreshDetail,
      resolveSubmissionId,
    ],
  )

  const handleAction = useCallback(
    async (kind: AssignmentFooterActionKind) => {
      setErrorMessage(null)

      if (
        kind === 'start-assessment' ||
        kind === 'continue-assessment' ||
        kind === 'practice-assessment'
      ) {
        setPendingKind(kind)
        setModalOpen(true)
        return
      }

      if (kind === 'toggle-completion') {
        const submissionId = detail.footer.meta.submissionId
        if (submissionId == null) {
          setErrorMessage('No submission found for this assignment.')
          return
        }
        const action = detail.footer.actions.find((a) => a.kind === kind)
        const markComplete =
          action?.label.trim().toLowerCase() === 'mark as completed'
        setLoading(true)
        try {
          await updateSubmissionCompletion({
            submissionId,
            completed: Boolean(markComplete),
          })
          await refreshDetail()
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not update submission',
          )
        } finally {
          setLoading(false)
        }
        return
      }

      if (kind === 'show-submission') {
        const submissionId = detail.footer.meta.submissionId
        if (submissionId == null) {
          setErrorMessage('No submission found for this assignment.')
          return
        }
        setLoading(true)
        try {
          const { url } = await fetchAssessPlatformViewUrl(submissionId)
          openInNewTab(url)
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Could not open submission on Assessment Platform',
          )
        } finally {
          setLoading(false)
        }
      }
    },
    [detail.footer.actions, detail.footer.meta.submissionId, refreshDetail],
  )

  const confirmModal = useCallback(() => {
    if (pendingKind == null) return
    void runAssessPlatformFlow(pendingKind)
  }, [pendingKind, runAssessPlatformFlow])

  return {
    modalOpen,
    setModalOpen,
    loading,
    errorMessage,
    handleAction,
    confirmModal,
  }
}
