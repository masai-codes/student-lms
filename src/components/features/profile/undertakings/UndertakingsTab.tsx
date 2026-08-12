import { useState } from 'react'
import { CaretRight, SealCheck } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UndertakingDialog } from '@/components/features/profile/undertakings/UndertakingDialog'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { acceptUndertakingRequest } from '@/lib/api/profile/profileApi'
import {
  PROFILE_QUERY_KEYS,
  profileUndertakingsQuery,
} from '@/query/profile/profileQueries'
import {
  SigningContextError,
  captureSigningContext,
} from '@/lib/profile/captureSigningContext'
import { pushProfileEntityEvent } from '@/components/features/profile/shared/profileAnalytics'
import type { PendingUndertaking } from '@/server/api/profile/profile.types'

function messageForError(error: unknown): string {
  if (error instanceof SigningContextError) return error.message
  return 'We could not record your acceptance. Please try again.'
}

export function UndertakingsTab() {
  const [active, setActive] = useState<PendingUndertaking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const {
    data: undertakings,
    isLoading,
    isError,
  } = useQuery(profileUndertakingsQuery(true))

  const mutation = useMutation({
    mutationFn: async (undertaking: PendingUndertaking) => {
      // Prompt for location only now, at the point of intent.
      const context = await captureSigningContext()
      return acceptUndertakingRequest({
        sectionId: undertaking.sectionId,
        ...context,
      })
    },
    onSuccess: () => {
      setActive(null)
      setError(null)
      void queryClient.invalidateQueries({
        queryKey: PROFILE_QUERY_KEYS.undertakings,
      })
    },
    onError: (mutationError) => setError(messageForError(mutationError)),
  })

  return (
    <ProfileTabPanel testId="profile-undertakings-panel">
      <h3 className="type-h6 text-foreground">Acknowledgements</h3>
      <p className="mt-1 type-b2-regular text-foreground-muted">
        Documents your programme needs you to read and accept.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ProfileCardListSkeleton
            rows={2}
            testId="profile-undertakings-skeleton"
          />
        ) : isError ? (
          <ProfileErrorState
            testId="profile-undertakings-error"
            message="We couldn't load your acknowledgements. Please refresh and try again."
          />
        ) : (undertakings ?? []).length === 0 ? (
          <ProfileEmptyState
            testId="profile-undertakings-empty"
            icon={<SealCheck size={44} aria-hidden />}
            title="You're all caught up"
            description="Nothing needs your acknowledgement right now. New documents will show up here."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {(undertakings ?? []).map((undertaking, index) => (
              <li key={undertaking.sectionId}>
                <button
                  type="button"
                  data-testid="profile-undertaking-item"
                  data-section-id={undertaking.sectionId}
                  style={
                    {
                      '--dash-delay': `${Math.min(index, 8) * 0.05}s`,
                    } as React.CSSProperties
                  }
                  className="dash-lift animate-dash-row-in flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-brand"
                  onClick={() => {
                    pushProfileEntityEvent(
                      'view',
                      'undertaking',
                      undertaking.sectionId,
                      { section_name: undertaking.sectionName },
                    )
                    setError(null)
                    mutation.reset()
                    setActive(undertaking)
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate type-b2-md text-foreground">
                      {undertaking.sectionName}
                    </p>
                    <p className="mt-0.5 truncate type-caption text-foreground-subtle">
                      {[undertaking.program, undertaking.batchName]
                        .filter(Boolean)
                        .join(' · ') || 'Pending acknowledgement'}
                    </p>
                  </div>
                  <CaretRight
                    size={18}
                    className="shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UndertakingDialog
        undertaking={active}
        isAccepting={mutation.isPending}
        error={error}
        onClose={() => {
          setActive(null)
          setError(null)
          mutation.reset()
        }}
        onAccept={() => {
          if (!active) return
          pushProfileEntityEvent('accept', 'undertaking', active.sectionId)
          setError(null)
          mutation.mutate(active)
        }}
      />
    </ProfileTabPanel>
  )
}
