import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CaretRight, SignOut } from '@phosphor-icons/react'

import { fetchProfileOverview } from '@/lib/api/profile/profileApi'
import { DEFAULT_PROFILE_TAB } from '@/components/features/profile/profileTabsConfig'
import type { NavItem } from '@/lib/navigation/navItemConfig'
import { useAppNavItems } from '@/lib/navigation/useAppNavItems'
import { hidesMasaiOnlyFeatures } from '@/utils/portal'
import { cn } from '@/lib/utils'
import { profileSettingsExtraItems } from './profileSettingsConfig'

const REFER_PROMO_IMAGE =
  'https://masai-website-images.s3.ap-south-1.amazonaws.com/Group_f647b8c854.svg'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

/** One tappable row: icon · label · caret, matching the old LMS card list. */
function SettingsRow({
  item,
  label,
  onSelect,
  className,
}: {
  item: NavItem
  /** Overrides `item.label` (e.g. "Sign out" reads "Log Out" on this page). */
  label?: string
  onSelect: (item: NavItem) => void
  className?: string
}) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      data-testid={`profile-settings-item-${item.id}`}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted',
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-brand [&_svg]:size-6">
        {Icon ? <Icon /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
        {label ?? item.label ?? item.id}
      </span>
      {(item.notificationCount ?? 0) > 0 ? (
        <span className="flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold leading-5 text-danger-foreground">
          {item.notificationCount! > 99 ? '99+' : item.notificationCount}
        </span>
      ) : null}
      <CaretRight className="size-6 shrink-0 text-foreground-muted" />
    </button>
  )
}

/**
 * Profile & Settings — the new-LMS port of the old LMS `/profile-settings`
 * page, the destination of the mobile bottom nav's "More" tab. On mobile the
 * desktop navbar (avatar dropdown + trailing icon cluster) is hidden, so this
 * page is the only route to My Profile, My Programs, Bookmarks, Level up and
 * sign-out.
 *
 * Rows come from `useAppNavItems` wherever an equivalent nav item exists —
 * gating and handlers (logout, Level up SSO, Refer & Earn redirect) are never
 * re-implemented here. Page-only rows live in `profileSettingsConfig`.
 *
 * Reference: `experience-ui/apps/student-experience/src/pages/profile/ProfileSettingsPage.tsx`.
 */
export function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { user, tier1, rightItems, tertiaryItems } = useAppNavItems()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfileOverview,
    staleTime: 2 * 60 * 1000,
  })

  const handleSelect = (item: NavItem) => {
    if (item.type === 'internal-link') {
      void navigate({ to: item.to, search: {} })
      return
    }
    if (item.type === 'external-link') {
      window.open(item.href, '_blank', 'noopener,noreferrer')
      return
    }
    item.onClick()
  }

  const byId = new Map(
    [...tertiaryItems, ...rightItems].map((item) => [item.id, item]),
  )
  // MasaiVerse eligibility is already resolved for the navbar — a Tier 1
  // MasaiVerse tab means this student has access.
  const extras = profileSettingsExtraItems({
    hideMasaiOnlyFeatures: hidesMasaiOnlyFeatures(),
    showMasaiVerse: tier1.some((item) => item.id === 'masaiverse'),
  })

  const referItem = byId.get('refer')
  const signOutItem = byId.get('sign-out')

  // Same order as the old LMS list.
  const rows = [
    byId.get('courses'),
    byId.get('bookmarks'),
    extras.masaiverse,
    byId.get('report-bug'),
    extras.privacyPolicy,
    extras.practiceInterview,
    byId.get('levelup'),
    extras.productUpdates,
  ].filter((item): item is NavItem => Boolean(item))

  const displayName = profile?.name ?? user.name
  const avatarSrc = profile?.avatarUrl ?? user.profileImageUrl ?? null
  const subtitle = profile?.phone ?? profile?.email ?? null

  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-5"
      data-testid="profile-settings-page"
    >
      <h1 className="mb-5 text-center text-base font-medium text-foreground md:text-left md:text-2xl md:font-bold">
        Profile &amp; Settings
      </h1>

      <div className="flex flex-col gap-3">
        {/* User card → full profile */}
        <button
          type="button"
          onClick={() =>
            void navigate({
              to: '/profile',
              search: { tab: DEFAULT_PROFILE_TAB },
            })
          }
          data-testid="profile-settings-profile-card"
          className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-muted"
        >
          <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted text-lg font-semibold text-foreground">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="size-full rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span aria-hidden="true">{initials(displayName)}</span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-foreground">
              {displayName}
            </span>
            {subtitle ? (
              <span className="mt-1 block truncate text-xs leading-4 text-foreground-muted">
                {subtitle}
              </span>
            ) : null}
          </span>
          <CaretRight className="size-6 shrink-0 text-foreground-muted" />
        </button>

        {/* Refer & Earn promo — same gradient CTA the old page shows */}
        {referItem?.type === 'action' ? (
          <button
            type="button"
            onClick={() => referItem.onClick()}
            data-testid="profile-settings-item-refer"
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-t from-[#9061F9] to-[#314395] px-4 py-4 text-left transition-opacity hover:opacity-95"
          >
            <span className="flex items-center gap-3">
              <img src={REFER_PROMO_IMAGE} alt="" className="size-7 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-[22px] text-white">
                  Refer &amp; Earn
                </span>
                <span className="mt-1 block text-xs leading-[18px] text-white/90">
                  Refer and earn up to ₹15,000 for each friend who enrolls!
                </span>
              </span>
              <CaretRight className="size-6 shrink-0 text-white" />
            </span>
          </button>
        ) : null}

        {rows.map((item) => (
          <SettingsRow key={item.id} item={item} onSelect={handleSelect} />
        ))}

        {signOutItem ? (
          <SettingsRow
            item={{ ...signOutItem, icon: SignOut }}
            label="Log Out"
            onSelect={handleSelect}
          />
        ) : null}
      </div>
    </div>
  )
}
