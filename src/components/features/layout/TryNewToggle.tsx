'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalContent } from '@/components/ui/modal'
import { setNewLmsPagesPreference } from '@/lib/api/profile/profileApi'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { isMigratedRoute } from '@/utils/migratedRoutes'

/**
 * "Try New" navbar switch. Persists the per-user opt-in for the migrated pages
 * (shared with the old LMS). Turning it ON is immediate. Turning it OFF (a
 * switch back to the old LMS) first asks for optional feedback ("why are you
 * switching back?"), which is appended to the users.meta feedback history. On
 * a migrated page we then hand off to the old LMS at the same path.
 */
export function TryNewToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [enabled, setEnabled] = useState(initialEnabled)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      enabled: next,
      feedback: text,
    }: {
      enabled: boolean
      feedback?: string
    }) => setNewLmsPagesPreference(next, text),
    onSuccess: (value) => {
      setEnabled(value)
      setFeedbackOpen(false)
      setFeedback('')
      // Turned OFF on a migrated page → the old LMS now owns it: hand off to the
      // same path (no search — the old LMS regenerates its own query params).
      if (!value && isMigratedRoute(pathname)) {
        const oldUiUrl = getOldStudentUiUrlForPath(pathname)
        if (oldUiUrl) {
          window.location.assign(oldUiUrl)
          return
        }
      }
      // Otherwise refresh route context so guards pick up the new value.
      void router.invalidate()
      toast.success(
        value
          ? 'Switched to the new experience.'
          : 'Switched back to the classic experience.',
      )
    },
    onError: () => {
      toast.error('Could not update your preference. Please try again.')
    },
  })

  function handleClick() {
    if (isPending) return
    if (enabled) {
      // Switching back to old → collect optional feedback first.
      setFeedback('')
      setFeedbackOpen(true)
      return
    }
    // Switching to new → immediate.
    setEnabled(true)
    mutate({ enabled: true })
  }

  function submitSwitchBack() {
    mutate({ enabled: false, feedback: feedback.trim() || undefined })
  }

  const label = enabled ? 'Switch to old' : 'Try New'

  return (
    <>
      <button
        type="button"
        data-tour-target="try-new"
        aria-label={enabled ? 'Switch to the old experience' : 'Try the new experience'}
        title={label}
        disabled={isPending}
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-subtle px-3 py-1.5 text-sm font-semibold text-brand-subtle-foreground transition-colors hover:bg-brand/10 disabled:opacity-60"
      >
        <Sparkles className="size-4" aria-hidden />
        <span>{label}</span>
      </button>

      <Modal
        open={feedbackOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) setFeedbackOpen(false)
        }}
      >
        <ModalContent
          showCloseButton={false}
          className="flex w-full max-w-[440px] flex-col gap-4 rounded-[20px] p-6 shadow-xl"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">
              Switching back to the classic experience?
            </h2>
            <p className="text-sm text-foreground-muted">
              Tell us why (optional) — did you face any issue with the new
              experience?
            </p>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Your feedback helps us improve…"
            className="w-full resize-none rounded-[12px] border border-border bg-surface p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          />
          <div className="mt-1 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isPending) setFeedbackOpen(false)
              }}
              disabled={isPending}
              className="rounded-[10px] border-2 border-info bg-surface px-5 py-2.5 text-sm font-semibold text-info transition-colors hover:bg-info-subtle disabled:opacity-60"
            >
              Close
            </button>
            <button
              type="button"
              onClick={submitSwitchBack}
              disabled={isPending}
              className="rounded-[10px] bg-info px-5 py-2.5 text-sm font-semibold text-info-foreground transition-colors hover:bg-info disabled:opacity-60"
            >
              {isPending ? 'Switching…' : 'Switch to old'}
            </button>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
