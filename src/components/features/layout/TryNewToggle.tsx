'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { setNewLmsPagesPreference } from '@/lib/api/profile/profileApi'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { isMigratedRoute } from '@/utils/migratedRoutes'

/**
 * "Try New" navbar switch. Persists the per-user opt-in for the migrated pages
 * (shared with the old LMS). When the user turns it OFF while on one of those
 * pages we immediately hand off to the old LMS at the same path; turning it ON
 * simply refreshes route context (this page already lives on the new LMS).
 */
export function TryNewToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter()
  const { pathname, search } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.searchStr,
    }),
  })
  const [enabled, setEnabled] = useState(initialEnabled)

  const { mutate, isPending } = useMutation({
    mutationFn: setNewLmsPagesPreference,
    onSuccess: (value) => {
      setEnabled(value)
      // Turned OFF on a migrated page → the old LMS now owns it: hand off now.
      if (!value && isMigratedRoute(pathname)) {
        const oldUiUrl = getOldStudentUiUrlForPath(`${pathname}${search}`)
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

  function handleChange(next: boolean) {
    if (isPending) return
    // Optimistically reflect the flip; the mutation reconciles / reverts.
    setEnabled(next)
    mutate(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Try the new experience"
      title="Try New"
      disabled={isPending}
      onClick={() => handleChange(!enabled)}
      className="flex items-center gap-2 disabled:opacity-60"
    >
      <span className="text-sm font-semibold text-foreground max-md:hidden">
        Try New
      </span>
      <span
        className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          enabled ? 'bg-brand' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-[18px] rounded-full bg-surface shadow-sm ring-0 transition-transform duration-200 ${
            enabled ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
