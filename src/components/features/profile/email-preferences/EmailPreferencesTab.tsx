import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/features/profile/shared/ConfirmDialog'
import {
  ProfileCardListSkeleton,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { EMAIL_PREFERENCE_DEFINITIONS } from '@/components/features/profile/email-preferences/emailPreferencesConfig'
import { updateEmailPreferencesRequest } from '@/lib/api/profile/profileApi'
import {
  PROFILE_QUERY_KEYS,
  profileEmailPreferencesQuery,
} from '@/query/profile/profileQueries'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'
import type {
  EmailPreferenceKey,
  EmailPreferences,
} from '@/server/api/profile/profile.types'

interface PendingToggle {
  key: EmailPreferenceKey
  label: string
  nextValue: boolean
}

export function EmailPreferencesTab() {
  const [pending, setPending] = useState<PendingToggle | null>(null)
  const queryClient = useQueryClient()

  const {
    data: preferences,
    isLoading,
    isError,
  } = useQuery(profileEmailPreferencesQuery(true))

  const mutation = useMutation({
    mutationFn: (patch: Partial<EmailPreferences>) =>
      updateEmailPreferencesRequest(patch),
    // Reflect the confirmed choice immediately, then reconcile with the server.
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_QUERY_KEYS.emailPreferences, updated)
      setPending(null)
    },
    onError: () => setPending(null),
  })

  return (
    <ProfileTabPanel testId="profile-email-preferences-panel">
      <h3 className="type-h6 text-foreground">Email Preferences</h3>
      <p className="mt-1 type-b2-regular text-foreground-muted">
        Choose which email notifications you want to receive.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ProfileCardListSkeleton
            rows={6}
            testId="profile-email-preferences-skeleton"
          />
        ) : isError || !preferences ? (
          <ProfileErrorState
            testId="profile-email-preferences-error"
            message="We couldn't load your preferences. Please refresh and try again."
          />
        ) : (
          <ul className="flex flex-col">
            {EMAIL_PREFERENCE_DEFINITIONS.map((definition, index) => {
              const isEnabled = preferences[definition.key]
              const isLast = index === EMAIL_PREFERENCE_DEFINITIONS.length - 1

              return (
                <li
                  key={definition.key}
                  data-testid={`profile-email-preference-${definition.key}`}
                  style={
                    {
                      '--dash-delay': `${Math.min(index, 8) * 0.04}s`,
                    } as React.CSSProperties
                  }
                  className={`animate-dash-row-in flex items-center justify-between gap-4 py-4 ${
                    isLast ? '' : 'border-b border-border'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="type-b2-md text-foreground">
                      {definition.label}
                    </p>
                    <p className="mt-0.5 type-caption text-foreground-subtle">
                      {definition.description}
                    </p>
                  </div>

                  <Switch
                    checked={isEnabled}
                    disabled={mutation.isPending}
                    className="shrink-0"
                    aria-label={`${definition.label} email notifications`}
                    data-testid={`profile-email-preference-toggle-${definition.key}`}
                    onCheckedChange={(nextValue) => {
                      pushProfileEvent('email_preference_toggle_open', {
                        preference: definition.key,
                        next_value: nextValue,
                      })
                      setPending({
                        key: definition.key,
                        label: definition.label,
                        nextValue,
                      })
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        testId="profile-email-preference-dialog"
        title={
          pending
            ? `${pending.nextValue ? 'Enable' : 'Disable'} email notifications for ${pending.label}?`
            : ''
        }
        description={
          pending
            ? pending.nextValue
              ? `You will start receiving email notifications about ${pending.label.toLowerCase()}.`
              : `You will no longer receive email notifications about ${pending.label.toLowerCase()}.`
            : undefined
        }
        confirmLabel={pending?.nextValue ? 'Enable' : 'Disable'}
        tone={pending?.nextValue ? 'warning' : 'danger'}
        isConfirming={mutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          pushProfileEvent('email_preference_toggle_confirm', {
            preference: pending.key,
            next_value: pending.nextValue,
          })
          mutation.mutate({ [pending.key]: pending.nextValue })
        }}
      />
    </ProfileTabPanel>
  )
}
