import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EditableFieldCard } from '@/components/features/profile/details/EditableFieldCard'
import { ChangePasswordCard } from '@/components/features/profile/details/ChangePasswordCard'
import { ProfileTabPanel } from '@/components/features/profile/shared/ProfileStates'
import { updateProfileRequest } from '@/lib/api/profile/profileApi'
import type { UpdateProfilePayload } from '@/lib/api/profile/profileApi'
import { PROFILE_QUERY_KEYS } from '@/query/profile/profileQueries'
import {
  maxMobileLength,
  mobileHint,
  toDigits,
  validateMobile,
} from '@/lib/profile/validateMobile'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

/** Which card is currently in edit mode; only one at a time. */
type EditingField = 'name' | 'phone' | 'password' | null

const MAX_NAME_LENGTH = 255

function validateName(draft: string): string | undefined {
  const trimmed = draft.trim()
  if (trimmed === '') return 'Please enter your name'
  if (trimmed.length > MAX_NAME_LENGTH) return 'That name is too long'
  return undefined
}

function validatePhone(draft: string): string | undefined {
  return validateMobile(draft).message
}

export function ProfileDetailsTab({ profile }: { profile: ProfileOverview }) {
  const [editing, setEditing] = useState<EditingField>(null)
  const [status, setStatus] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateProfileRequest(payload),
    onSuccess: (_data, payload) => {
      setEditing(null)
      setStatus(
        payload.name !== undefined ? 'Name updated' : 'Phone number updated',
      )
      void queryClient.invalidateQueries({
        queryKey: PROFILE_QUERY_KEYS.overview,
      })
    },
    onError: () => setStatus('Could not save your changes. Please try again.'),
  })

  const isDimmed = (field: Exclude<EditingField, null>) =>
    editing !== null && editing !== field

  return (
    <ProfileTabPanel testId="profile-details-panel">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EditableFieldCard
          fieldKey="name"
          label="Name"
          value={profile.name}
          placeholder="Your full name"
          validate={validateName}
          isEditing={editing === 'name'}
          isSaving={mutation.isPending}
          isDimmed={isDimmed('name')}
          onEdit={() => {
            setStatus(null)
            setEditing('name')
          }}
          onCancel={() => setEditing(null)}
          onSave={(next) => mutation.mutate({ name: next.trim() })}
        />

        <EditableFieldCard
          fieldKey="phone"
          label="Phone number"
          value={profile.phone ?? ''}
          placeholder="Enter your phone number"
          sanitize={(raw) => {
            const digits = toDigits(raw)
            return digits.slice(0, maxMobileLength(digits))
          }}
          hint={(draft) => mobileHint(draft)}
          validate={validatePhone}
          isEditing={editing === 'phone'}
          isSaving={mutation.isPending}
          isDimmed={isDimmed('phone')}
          onEdit={() => {
            setStatus(null)
            setEditing('phone')
          }}
          onCancel={() => setEditing(null)}
          onSave={(next) => mutation.mutate({ secondaryMobile: next })}
        />

        <ChangePasswordCard
          isEditing={editing === 'password'}
          isDimmed={isDimmed('password')}
          onEdit={() => {
            setStatus(null)
            setEditing('password')
          }}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setStatus('Password changed')
          }}
        />
      </div>

      <p
        aria-live="polite"
        data-testid="profile-details-status"
        className="mt-4 min-h-5 type-caption text-foreground-subtle"
      >
        {status ?? ''}
      </p>
    </ProfileTabPanel>
  )
}
