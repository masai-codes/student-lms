'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  Megaphone,
  Bookmark,
  Bug,
  Gift,
  GraduationCap,
  Headphones,
  LogOutIcon,
  MessagesSquare,
  Smartphone,
  UserCircle,
} from 'lucide-react'
import type { MouseEventHandler, ReactNode } from 'react'

import type {
  NavbarActionItem,
  NavbarActivation,
  NavbarLinkItem,
  NavbarProfile,
  NavbarProfileMenuItem,
} from '@/components/navbar'
import { fetchAnnouncementUnreadCount } from '@/lib/api/announcement/announcementApi'
import { Navbar } from '@/components/navbar'
import { NavbarTrailingActions } from '@/components/navbar/navbar-trailing-actions'
import { LevelUpIcon } from '@/components/common/LevelUpIcon'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import {
  LEARN_TIER2_PROGRAM_SLOT_ID,
  LEARN_TIER2_TABS_SLOT_ID,
} from '@/components/features/layout/learnTier2Slots'
import { TryNewToggle } from '@/components/features/layout/TryNewToggle'
import { useTryNewCtaVisible } from '@/hooks/useTryNewCtaVisible'
import { isMigratedRoute } from '@/utils/migratedRoutes'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { getBugReportFormUrl } from '@/utils/bugReportFormUrl'
import { logout } from '@/server/auth/logout'
import {
  getOldStudentUiUrlForPath,
  getPostLogoutRedirectUrl,
} from '@/utils/authRedirect'
import { fetchLevelupSso } from '@/utils/levelupSso'
import { fetchReferralLmsLoginRedirectUrl } from '@/utils/referralLmsLogin'
import { getAuthBranding } from '@/utils/authBranding'
import {
  hidesMasaiOnlyFeatures,
  isIHubPortal,
  isMasaiPortal,
} from '@/utils/portal'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const MASAI_LOGO =
  'https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg'
// Light-on-dark Masai wordmark for dark themes (the default logo is dark ink,
// invisible on a dark navbar).
const MASAI_LOGO_DARK =
  'https://cdn.masaischool.com/masai-website/masai_dark_853075d7cd.png'

/**
 * Portal-aware navbar logo: Masai uses the hosted wordmark; every other portal
 * (iHub, IIT Jodhpur) uses its branding mark from {@link getAuthBranding}.
 */
function navbarLogoSrc(): string {
  return isMasaiPortal() ? MASAI_LOGO : getAuthBranding().logoSrc
}

/**
 * Dark-theme logo variant, swapped via CSS. Non-Masai portals keep their single
 * mark (no dark asset supplied); Masai gets the light-on-dark wordmark.
 */
function navbarLogoDarkSrc(): string | undefined {
  return isMasaiPortal() ? MASAI_LOGO_DARK : undefined
}

/**
 * Legacy student app (`experience-ui/apps/student-experience`) routes — keep in sync with
 * `src/utils/route.utils.ts` and top nav `src/components/NewLayout/DesktopNavbar.tsx`.
 *
 * Profile dropdown labels/order match `profileMenuOptions.ts` + `DesktopNavbar` extras
 * (Report a Bug, Level up, Sign out). In-app links use this app’s routes.
 *
 * MasaiVerse lives at `/masaiverse` here (not the legacy Discord route).
 *
 * Refer & Earn: navbar uses `Routes.changemakersCircle.main()` (`/changemakers-circle`).
 * `/alumniReferal` is a different flow (alumni hiring / refer-hiring), not the main CTA.
 */
function oldStudentUiLink(path: string): NavbarActivation {
  const href = getOldStudentUiUrlForPath(path) ?? '#'
  const onClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    href === '#' ? (e) => e.preventDefault() : undefined
  return { href, openInNewTab: false, onClick }
}

/** In-app route a primary nav tab can point to when it stays in the new LMS. */
type InternalNavPath = '/' | '/learn' | '/masaiverse'

/**
 * Declarative config for a primary nav tab. The single `stayInNew` flag decides
 * routing: `true` → client-side navigate within this app (port 3002);
 * `false` → full navigation to the old LMS via `oldStudentUiLink`. To migrate a
 * tab, flip the flag and give it an in-app `to` — no new handler needed.
 */
type PrimaryNavTab = { id: string; label: string; isActive?: boolean } & (
  | { stayInNew: true; to: InternalNavPath }
  | { stayInNew: false; oldUiPath: string }
)

export default function AppNavbar() {
  const { user } = layoutRouteApi.useRouteContext()
  // Non-Masai portals (iHub, IIT Jodhpur) hide the Masai-only surfaces
  // (MasaiVerse, Refer & Earn, Practice Interviews, LevelUp, chat + guided-tour
  // icons). Download App is different: hidden on iHub only, kept on IIT Jodhpur.
  const hideMasaiExtras = hidesMasaiOnlyFeatures()
  const isIHub = isIHubPortal()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // Lecture detail only goes dark when it renders the immersive black video
  // experience — i.e. a watchable in-app recording is present. Before/during
  // and "recording not available" states keep the normal light navbar. The
  // flag comes from the lecture route's loader data (this navbar is its
  // ancestor, so we read it off the active router matches).
  const lectureHasRecording = useRouterState({
    select: (s) => {
      const match = s.matches.find(
        (m) => m.routeId === '/(protected)/_layout/lectures_/$lectureId',
      )
      const detail = match?.loaderData
      return Boolean(
        detail && !detail.restriction && detail.hasRecording && detail.videoUrl,
      )
    },
  })
  const showTryNew = useTryNewCtaVisible()
  const activeNavId = activeAppNavIdForPathname(pathname)
  const [downloadAppOpen, setDownloadAppOpen] = useState(false)
  const [isLevelupLoading, setIsLevelupLoading] = useState(false)
  const levelupLoadingRef = useRef(false)
  const REFERRAL_URL_REFETCH_INTERVAL = 5 * 60 * 1000

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['announcement-unread-count'],
    queryFn: fetchAnnouncementUnreadCount,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const { data: referralUrl, isFetching: isReferralUrlLoading } = useQuery({
    queryKey: ['referral-lms-login-url'],
    queryFn: fetchReferralLmsLoginRedirectUrl,
    staleTime: REFERRAL_URL_REFETCH_INTERVAL,
    refetchInterval: REFERRAL_URL_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const handleLevelupClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (levelupLoadingRef.current) return
      levelupLoadingRef.current = true
      setIsLevelupLoading(true)
      try {
        const { url } = await fetchLevelupSso()
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Something went wrong while redirecting to Levelup'
        window.alert(message)
      } finally {
        levelupLoadingRef.current = false
        setIsLevelupLoading(false)
      }
    },
    [],
  )

  const handleSignOut = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      try {
        await logout()
      } catch (err) {
        console.error('Logout failed', err)
        window.alert(
          err instanceof Error
            ? err.message
            : 'Sign out failed. Please try again.',
        )
        return
      }
      window.location.assign(getPostLogoutRedirectUrl())
    },
    [],
  )

  const handleHomeClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      void navigate({ to: '/' })
    },
    [navigate],
  )

  // Single builder for primary tabs: the `stayInNew` flag on each config decides
  // whether it navigates in-app (port 3002) or out to the old LMS.
  const buildPrimaryNavTab = useCallback(
    (tab: PrimaryNavTab): NavbarLinkItem => {
      if (!tab.stayInNew) {
        return {
          id: tab.id,
          label: tab.label,
          isActive: tab.isActive,
          ...oldStudentUiLink(tab.oldUiPath),
        }
      }
      const to = tab.to
      return {
        id: tab.id,
        label: tab.label,
        href: to,
        openInNewTab: false,
        isActive: tab.isActive,
        onClick: (e) => {
          e.preventDefault()
          void navigate({ to, search: {} })
        },
      }
    },
    [navigate],
  )

  const handleAnnouncementsClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      void navigate({ to: '/announcements', search: { page: 1 } })
    },
    [navigate],
  )

  const handleReferAndEarnClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (referralUrl) {
        window.open(referralUrl, '_blank', 'noopener,noreferrer')
        return
      }

      if (isReferralUrlLoading) {
        window.alert('Loading referral link...')
        return
      }

      const fallbackHref =
        getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.referAndEarn) ??
        '/refer-and-earn'
      window.location.assign(fallbackHref)
    },
    [isReferralUrlLoading, referralUrl],
  )

  const navItems: Array<NavbarLinkItem> = [
    buildPrimaryNavTab({
      id: 'home',
      label: 'Home',
      stayInNew: true,
      to: '/',
      isActive: activeNavId === 'home',
    }),
    buildPrimaryNavTab({
      id: 'learn',
      label: 'Learn',
      stayInNew: true,
      to: '/learn',
      isActive: activeNavId === 'learn',
    }),
    // Community and Interviews are Masai-only surfaces (MasaiVerse/Chat/
    // Practice Interviews all live behind the same `hideMasaiExtras` gate on
    // iHub/IIT Jodhpur, same as before).
    ...(hideMasaiExtras
      ? []
      : [
          buildPrimaryNavTab({
            id: 'community',
            label: 'Community',
            stayInNew: true,
            to: '/masaiverse',
            isActive: activeNavId === 'community',
          }),
          buildPrimaryNavTab({
            id: 'interviews',
            label: 'Interviews',
            stayInNew: false,
            oldUiPath: '/practice-interview',
            isActive: activeNavId === 'interviews',
          }),
        ]),
  ]

  // Tier 1 right icon cluster: Announcements, then Bookmarks — a standalone
  // utility, not a Learn concept, so it lives here rather than in Learn's
  // Tier 2. (Calendar and the onboarding "Get started" entry aren't part of
  // the global chrome anymore; Calendar's covered by Home's aggregated
  // schedule.)
  const trailingActions: Array<NavbarActionItem> = useMemo(
    () => [
      {
        id: 'announcements',
        type: 'icon',
        icon: <Megaphone />,
        ariaLabel: 'Announcements',
        tooltip: 'Announcements',
        href: '/announcements',
        openInNewTab: false,
        notificationCount: unreadCount,
        onClick: handleAnnouncementsClick,
      },
      {
        id: 'bookmarks',
        type: 'icon',
        icon: <Bookmark />,
        ariaLabel: 'Bookmarks',
        tooltip: 'Bookmarks',
        href: '/bookmarks',
        openInNewTab: false,
        isActive: pathname.startsWith('/bookmarks'),
      },
    ],
    [handleAnnouncementsClick, pathname, unreadCount],
  )

  // Tier 1 right: "Get the app" — desktop/mobile-web only (hidden on iHub,
  // which has no mobile app; never shown from inside the native app shell).
  const primaryRowActions: Array<NavbarActionItem> = useMemo(
    () =>
      isIHub
        ? []
        : [
            {
              id: 'download-app',
              type: 'text',
              variant: 'pill',
              label: 'Get the app',
              icon: <Smartphone />,
              href: '#',
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                setDownloadAppOpen(true)
              },
            },
          ],
    [isIHub],
  )

  // Tier 1 right: Refer & Earn is now a persistent link (no longer traded off
  // against a MasaiVerse CTA — Community is its own fixed Tier 1 tab). Still
  // Masai-only.
  const secondaryRowLinks: Array<NavbarActionItem> = useMemo(
    () =>
      hideMasaiExtras
        ? []
        : [
            {
              id: 'refer',
              type: 'text',
              label: 'Refer & Earn',
              icon: <Gift />,
              href: '#',
              openInNewTab: false,
              onClick: handleReferAndEarnClick,
            },
          ],
    [handleReferAndEarnClick, hideMasaiExtras],
  )

  // Tier 2: contextual per-module sub-nav. Learn's left side is the
  // Lectures/Assignments/Resources tab switcher (portaled in from the Learn
  // page itself — see `LEARN_TIER2_TABS_SLOT_ID` — so its state stays owned by
  // the page's URL search params) plus a divider and Discussions (the one
  // Learn-scoped utility that doesn't live on the page). Bookmarks isn't a
  // Learn concept — it moved to the Tier 1 icon cluster above. The right side
  // is the program/course switcher, also portaled in, and only appears once
  // the Learn page finds the student has more than one enrolled program —
  // with one program the slot simply stays empty (nothing to portal).
  // Community surfaces Chat first, then MasaiVerse; "Masai Live" has no route
  // yet, so it's omitted rather than linked to nothing. Home and Interviews
  // have no Tier 2 at all.
  const tier2: ReactNode = useMemo(() => {
    if (activeNavId === 'learn') {
      return (
        <>
          <div className="flex min-w-0 items-stretch gap-3">
            <div
              id={LEARN_TIER2_TABS_SLOT_ID}
              className="flex items-stretch gap-4"
            />
            <span
              aria-hidden="true"
              className="h-5 w-px shrink-0 self-center bg-border"
            />
            <NavbarTrailingActions
              items={[
                {
                  id: 'discussions',
                  type: 'iconText',
                  icon: <MessagesSquare />,
                  label: 'Discussions',
                  ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.discussions),
                },
              ]}
            />
          </div>
          <div id={LEARN_TIER2_PROGRAM_SLOT_ID} className="flex items-center" />
        </>
      )
    }
    if (activeNavId === 'community') {
      return (
        <NavbarTrailingActions
          items={[
            {
              id: 'chat-tab',
              type: 'text',
              label: 'Chat',
              href: '/chat',
              openInNewTab: false,
              isActive: pathname.startsWith('/chat'),
            },
            {
              id: 'masaiverse-tab',
              type: 'text',
              label: 'MasaiVerse',
              href: '/masaiverse',
              openInNewTab: false,
              isActive: pathname.startsWith('/masaiverse'),
            },
          ]}
        />
      )
    }
    return undefined
  }, [activeNavId, pathname])

  const profileMenuItems: Array<NavbarProfileMenuItem> = useMemo(
    () => [
      {
        id: 'profile',
        label: 'My Profile',
        icon: <UserCircle className="size-4" />,
        href: '/profile',
        openInNewTab: false,
      },
      {
        id: 'courses',
        label: 'My Programs',
        icon: <GraduationCap className="size-4" />,
        href: '/my-courses',
        openInNewTab: false,
      },
      // Support is a guaranteed fallback here (the floating support button is
      // suppressed during lecture playback / interviews) — always visible,
      // not gated by portal.
      {
        id: 'support',
        label: 'Support',
        icon: <Headphones className="size-4" />,
        href: '/support',
        openInNewTab: false,
      },
      {
        id: 'report-bug',
        label: 'Report a Bug',
        href: getBugReportFormUrl(),
        openInNewTab: true,
        icon: <Bug className="size-4" />,
      },
      // LevelUp is the Masai placement platform — hidden on non-Masai portals.
      ...(hideMasaiExtras
        ? []
        : [
            {
              id: 'levelup',
              label: isLevelupLoading ? 'Opening Level up...' : 'Level up',
              icon: (
                <span className="flex size-4 shrink-0 items-center justify-center text-foreground-muted">
                  <LevelUpIcon width={18} height={14} color="currentColor" />
                </span>
              ),
              href: '#',
              openInNewTab: false,
              title:
                'LevelUp - Is our placement platform. You can only access this if you are onboarded in Masai Placement Process',
              onClick: handleLevelupClick,
              disabled: isLevelupLoading,
            },
          ]),
      {
        id: 'sign-out',
        label: 'Sign out',
        icon: <LogOutIcon className="size-4" />,
        onClick: (e) => {
          void handleSignOut(e)
        },
      },
    ],
    [handleLevelupClick, handleSignOut, hideMasaiExtras, isLevelupLoading],
  )

  const profile: NavbarProfile = useMemo(
    () => ({
      ...(user.profileImageUrl ? { avatarSrc: user.profileImageUrl } : {}),
      avatarAlt: user.name,
      fallbackText: profileInitials(user.name),
      menuTriggerLabel: 'Open account menu',
      menuItems: profileMenuItems,
    }),
    [profileMenuItems, user.name, user.profileImageUrl],
  )

  return (
    <>
      <Navbar
        className="z-40 max-lg:hidden"
        forceDark={lectureHasRecording}
        logo={{
          src: navbarLogoSrc(),
          darkSrc: navbarLogoDarkSrc(),
          alt: getAuthBranding().logoAlt,
          href: '/',
          openInNewTab: false,
          onClick: handleHomeClick,
        }}
        navItems={navItems}
        trailingActions={trailingActions}
        primaryRowActions={primaryRowActions}
        secondaryRowLinks={secondaryRowLinks}
        tier2={tier2}
        actionsSlot={
          showTryNew && !user.hideSwitchOption && isMigratedRoute(pathname) ? (
            <TryNewToggle initialEnabled={user.newLmsPagesEnabled} />
          ) : undefined
        }
        profile={profile}
      />
      <DownloadAppModal
        open={downloadAppOpen}
        onOpenChange={setDownloadAppOpen}
      />
    </>
  )
}
