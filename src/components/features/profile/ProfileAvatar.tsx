import { useRef, useState } from 'react'
import { Camera } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadProfilePhoto } from '@/lib/api/dashboard/dashboardApi'
import { PROFILE_QUERY_KEYS } from '@/query/profile/profileQueries'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'

/** Server-side guard is 5 MB; reject early so the user isn't left waiting. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.readAsDataURL(file)
  })
}

/**
 * Header avatar with an upload affordance. The old profile page showed the photo
 * but had no way to change it (the overlay button was commented out), so
 * students had to go through the T0 guided tour to set one.
 */
export function ProfileAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (image: string) => uploadProfilePhoto(image),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({
        queryKey: PROFILE_QUERY_KEYS.overview,
      })
    },
    onError: () => setError('Upload failed. Please try again.'),
  })

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Please choose an image under 5 MB.')
      return
    }
    try {
      mutation.mutate(await readAsDataUrl(file))
    } catch {
      setError('Could not read that image.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-24 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            data-testid="profile-avatar-image"
            className="size-24 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            data-testid="profile-avatar-initials"
            aria-label={name}
            title={name}
            className="flex size-24 items-center justify-center rounded-full border border-border bg-brand-subtle type-h4 text-brand-subtle-foreground"
          >
            {initialsOf(name)}
          </div>
        )}

        <button
          type="button"
          data-testid="profile-avatar-upload-button"
          aria-label="Change profile photo"
          disabled={mutation.isPending}
          onClick={() => {
            pushProfileEvent('avatar_upload_open')
            inputRef.current?.click()
          }}
          className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95 disabled:opacity-60"
        >
          <Camera size={16} weight="fill" aria-hidden />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          data-testid="profile-avatar-file-input"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>

      <p
        aria-live="polite"
        data-testid="profile-avatar-status"
        className="min-h-4 type-caption text-foreground-subtle"
      >
        {mutation.isPending ? 'Uploading…' : (error ?? '')}
      </p>
    </div>
  )
}
