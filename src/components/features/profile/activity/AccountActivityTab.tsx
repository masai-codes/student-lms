import { useState } from 'react'
import { Devices } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SessionCard } from '@/components/features/profile/activity/SessionCard'
import { ConfirmDialog } from '@/components/features/profile/shared/ConfirmDialog'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { MasaiButton } from '@/components/ui/masai-button'
import {
  revokeOtherSessionsRequest,
  revokeSessionRequest,
} from '@/lib/api/profile/profileApi'
import {
  PROFILE_QUERY_KEYS,
  profileSessionsQuery,
} from '@/query/profile/profileQueries'
import {
  pushProfileEntityEvent,
  pushProfileEvent,
} from '@/components/features/profile/shared/profileAnalytics'
import type { ProfileSession } from '@/server/api/profile/profile.types'

type PendingAction =
  | { kind: 'one'; session: ProfileSession }
  | { kind: 'all' }
  | null

export function AccountActivityTab() {
  const [pending, setPending] = useState<PendingAction>(null)
  const queryClient = useQueryClient()

  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery(profileSessionsQuery(true))

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: PROFILE_QUERY_KEYS.sessions,
    })

  const revokeOne = useMutation({
    mutationFn: (sessionId: string) => revokeSessionRequest(sessionId),
    onSuccess: () => {
      setPending(null)
      invalidate()
    },
  })

  const revokeAll = useMutation({
    mutationFn: () => revokeOtherSessionsRequest(),
    onSuccess: () => {
      setPending(null)
      invalidate()
    },
  })

  const otherSessionCount = (sessions ?? []).filter((s) => !s.isCurrent).length

  return (
    <ProfileTabPanel testId="profile-activity-panel">
      <p className="type-b2-regular text-foreground-muted">
        Devices and browsers signed in to your account. Sign out of anything you
        don&apos;t recognise.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ProfileCardListSkeleton testId="profile-activity-skeleton" />
        ) : isError ? (
          <ProfileErrorState
            testId="profile-activity-error"
            message="We couldn't load your sessions. Please refresh and try again."
          />
        ) : (sessions ?? []).length === 0 ? (
          <ProfileEmptyState
            testId="profile-activity-empty"
            icon={<Devices size={44} aria-hidden />}
            title="No active sessions"
            description="Sessions appear here once you sign in from a browser or device."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {(sessions ?? []).map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                index={index}
                isRevoking={revokeOne.isPending || revokeAll.isPending}
                onRevoke={(target) => {
                  pushProfileEntityEvent('revoke_open', 'session', target.id, {
                    device: target.device,
                  })
                  setPending({ kind: 'one', session: target })
                }}
              />
            ))}
          </div>
        )}
      </div>

      {otherSessionCount > 0 ? (
        <div className="mt-4 flex justify-end">
          <MasaiButton
            type="secondary"
            ctaText="Sign out of other devices"
            data-testid="profile-activity-revoke-all"
            onClick={() => {
              pushProfileEvent('sessions_revoke_all_open', {
                other_session_count: otherSessionCount,
              })
              setPending({ kind: 'all' })
            }}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={pending?.kind === 'one'}
        testId="profile-session-revoke-dialog"
        title="Sign out of this device?"
        description={
          pending?.kind === 'one'
            ? `${pending.session.device} will need to sign in again.`
            : undefined
        }
        confirmLabel="Sign out"
        tone="danger"
        isConfirming={revokeOne.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind !== 'one') return
          pushProfileEntityEvent(
            'revoke_confirm',
            'session',
            pending.session.id,
          )
          revokeOne.mutate(pending.session.id)
        }}
      />

      <ConfirmDialog
        open={pending?.kind === 'all'}
        testId="profile-sessions-revoke-all-dialog"
        title="Sign out of other devices?"
        description={`This signs out ${otherSessionCount} other ${
          otherSessionCount === 1 ? 'session' : 'sessions'
        }. You'll stay signed in here.`}
        confirmLabel="Sign out others"
        tone="danger"
        isConfirming={revokeAll.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          pushProfileEvent('sessions_revoke_all_confirm', {
            other_session_count: otherSessionCount,
          })
          revokeAll.mutate()
        }}
      />
    </ProfileTabPanel>
  )
}
