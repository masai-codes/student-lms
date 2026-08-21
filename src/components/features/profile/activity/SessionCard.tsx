import {
  DeviceMobile,
  DeviceTablet,
  Laptop,
  SignOut,
} from '@phosphor-icons/react'
import { MasaiButton } from '@/components/ui/masai-button'
import type { ProfileSession } from '@/server/api/profile/profile.types'

const DEVICE_ICONS = {
  laptop: Laptop,
  tablet: DeviceTablet,
  phone: DeviceMobile,
} as const

/** `sessions.last_activity` is Unix *seconds*. */
function formatLastActive(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SessionCard({
  session,
  index,
  isRevoking,
  onRevoke,
}: {
  session: ProfileSession
  index: number
  isRevoking: boolean
  onRevoke: (session: ProfileSession) => void
}) {
  const Icon = DEVICE_ICONS[session.deviceKind]

  return (
    <div
      data-testid="profile-session-card"
      data-session-id={session.id}
      style={
        {
          '--dash-delay': `${Math.min(index, 8) * 0.05}s`,
        } as React.CSSProperties
      }
      className="animate-dash-row-in flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
        <Icon size={20} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            data-testid="profile-session-device"
            className="min-w-0 break-words type-b2-md text-foreground"
          >
            {session.device}
          </p>
          {session.isCurrent ? (
            <span
              data-testid="profile-session-current-badge"
              className="animate-dash-pop rounded-full bg-success-subtle px-2 py-0.5 type-caption text-success-subtle-foreground"
            >
              This device
            </span>
          ) : null}
        </div>
        <p
          data-testid="profile-session-last-active"
          className="mt-0.5 type-caption text-foreground-subtle"
        >
          Last active {formatLastActive(session.lastActiveAt)}
        </p>
      </div>

      {session.isCurrent ? null : (
        <MasaiButton
          type="secondary"
          size="sm"
          ctaText="Sign out"
          icon={<SignOut size={16} aria-hidden />}
          iconDirection="left"
          disabled={isRevoking}
          data-testid="profile-session-revoke"
          className="shrink-0"
          onClick={() => onRevoke(session)}
        />
      )}
    </div>
  )
}
