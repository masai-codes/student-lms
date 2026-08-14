'use client'

import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Megaphone } from 'lucide-react'
import { HandWaving } from '@phosphor-icons/react'

import { formatGreetingName } from '@/components/features/dashboard/shared/greeting'
import {
  NextActionBanner,
  useNextActionBannerView,
} from '@/components/features/layout/NextActionBanner'
import { TryNewToggle } from '@/components/features/layout/TryNewToggle'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTryNewCtaVisible } from '@/hooks/useTryNewCtaVisible'
import { useAppNavItems } from '@/lib/navigation/useAppNavItems'
import { IndependenceDayDecor } from '@/components/navbar/independence-day-decor'
import { hidesMasaiOnlyFeatures } from '@/utils/portal'
import { isIndependenceDayUiEnabled } from '@/utils/independenceDayUi'

/**
 * Mobile-only sticky top header for the dashboard home. On mobile the desktop
 * `AppNavbar` is hidden (`max-lg:hidden`), so the greeting and its trailing
 * actions — announcements (megaphone) and the onboarding guided tour ("?") —
 * would otherwise have no home on small screens. This mirrors those navbar
 * actions and keeps the onboarding entry reachable on mobile.
 */
export default function AppMobileHeader() {
  const { user, rightItems, navigate: navItemsNavigate } = useAppNavItems()
  const navigate = useNavigate()
  const showTryNew = useTryNewCtaVisible()

  // Same announcements signal the desktop navbar renders — no separate query.
  const announcements = rightItems.find((item) => item.id === 'announcements')
  const unreadCount = announcements?.notificationCount ?? 0

  // The next-action pill ("Lecture has started" etc.) used to live above the
  // bottom tab bar; on mobile it now takes the greeting's place at the top
  // whenever there's an active event, falling back to the greeting otherwise.
  const nextAction = useNextActionBannerView()

  const hideMasaiExtras = hidesMasaiOnlyFeatures()

  // Opens the onboarding guided tour on the dashboard (see AppNavbar's "?").
  const handleGuidedTourClick = useCallback(() => {
    void navigate({ to: '/', search: { guidedTour: 'open' } })
  }, [navigate])

  const handleAnnouncementsClick = useCallback(() => {
    if (announcements?.type === 'internal-link') {
      void navItemsNavigate({ to: announcements.to, search: {} })
      return
    }
    void navigate({ to: '/announcements', search: { page: 1 } })
  }, [announcements, navItemsNavigate, navigate])

  return (
    <header
      data-testid="app-mobile-header"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 overflow-hidden rounded-b-2xl bg-surface px-4 py-4 shadow-sm lg:hidden"
    >
      {isIndependenceDayUiEnabled() ? <IndependenceDayDecor /> : null}
      {nextAction ? (
        <div className="min-w-0 flex-1">
          <NextActionBanner className="max-w-full" />
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-lg font-medium text-foreground-muted">Welcome</p>
          <h1
            className="truncate text-2xl font-bold text-foreground"
            title={user.name}
          >
            {formatGreetingName(user.name)} <span aria-hidden="true">👋</span>
          </h1>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        {showTryNew && !user.hideSwitchOption ? (
          <TryNewToggle initialEnabled={user.newLmsPagesEnabled} />
        ) : null}
        <ThemeToggle size="mobile" />
        <button
          type="button"
          onClick={handleAnnouncementsClick}
          aria-label="Announcements"
          className="relative flex size-10 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          data-testid="app-mobile-header-announcements"
        >
          <Megaphone className="size-7 -scale-x-100" />
          {unreadCount > 0 ? (
            <span
              className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-danger-foreground"
              data-testid="app-mobile-header-unread-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
        {hideMasaiExtras ? null : (
          <button
            type="button"
            onClick={handleGuidedTourClick}
            aria-label="Onboarding steps"
            className="flex size-10 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            data-testid="app-mobile-header-guided-tour"
          >
            <HandWaving className="size-7" />
          </button>
        )}
      </div>
    </header>
  )
}
