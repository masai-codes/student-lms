'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  Book,
  Bookmark,
  BriefcaseBusiness,
  Bug,
  CalendarDays,
  CircleHelp,
  Gift,
  LogOutIcon,
  Megaphone,
  MessagesSquare,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react'
import type { MouseEventHandler } from 'react'

import type {
  NavbarActionItem,
  NavbarLinkItem,
  NavbarProfile,
  NavbarProfileMenuItem,
} from '@/components/navbar'
import { fetchAnnouncementUnreadCount } from '@/lib/api/announcement/announcementApi'
import { Navbar } from '@/components/navbar'
import { LevelUpIcon } from '@/components/common/LevelUpIcon'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import { NextActionBanner } from '@/components/features/layout/NextActionBanner'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { getBugReportFormUrl } from '@/utils/bugReportFormUrl'
import { logout } from '@/server/auth/logout'
import { getMasaiverseAccessDebugServer } from '@/server/masaiverse/getMasaiverseAccessDebugServer'
import {
  getOldStudentUiUrlForPath,
  getPostLogoutRedirectUrl,
} from '@/utils/authRedirect'
import { fetchLevelupSso } from '@/utils/levelupSso'
import { fetchReferralLmsLoginRedirectUrl } from '@/utils/referralLmsLogin'
import { getAuthBranding } from '@/utils/authBranding'
import { isIHubPortal } from '@/utils/portal'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const MASAI_LOGO =
  'https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg'

/** Portal-aware navbar logo: iHub gets its own mark, everyone else Masai. */
function navbarLogoSrc(): string {
  return isIHubPortal() ? getAuthBranding('ihub').logoSrc : MASAI_LOGO
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
function oldStudentUiLink(
  path: string,
): Pick<NavbarLinkItem, 'href' | 'openInNewTab' | 'onClick'> {
  const href = getOldStudentUiUrlForPath(path) ?? '#'
  const onClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    href === '#' ? (e) => e.preventDefault() : undefined
  return { href, openInNewTab: false, onClick }
}

/** In-app route a primary nav tab can point to when it stays in the new LMS. */
type InternalNavPath = '/' | '/learn'

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
  // iHub portal hides Masai-only surfaces (MasaiVerse, Refer & Earn, Practice
  // Interviews, LevelUp, Download App, chat + guided-tour icons).
  const isIHub = isIHubPortal()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
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

  // MasaiVerse Community access is per-user and stable for the session, so cache
  // it the same way the masaiverse route loader does. Admins always have access.
  const { data: masaiverseAccess } = useQuery({
    queryKey: ['masaiverse-access', user.id],
    queryFn: () =>
      getMasaiverseAccessDebugServer({ data: { userId: user.id } }),
    staleTime: 5 * 60 * 1000,
    enabled: user.role !== 'admin',
  })

  // When the CTA is active we surface "MasaiVerse Community" in the main desktop
  // nav (replacing "Refer & Earn") and move "Refer & Earn" into the profile
  // dropdown. Otherwise the nav keeps "Refer & Earn" and the dropdown keeps
  // "MasaiVerse Community" as-is.
  const showMasaiverseCta =
    !isIHub &&
    (user.role === 'admin' || masaiverseAccess?.canShowMasaiverse === true)

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

  // Opens the onboarding guided tour on the dashboard — works from any page and
  // regardless of whether onboarding is already complete.
  const handleGuidedTourClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      void navigate({ to: '/', search: { guidedTour: 'open' } })
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

  const handleProductUpdatesClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      void navigate({ to: '/whats-new', search: { page: 1 } })
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
    buildPrimaryNavTab({
      id: 'support',
      label: 'Support',
      stayInNew: false,
      oldUiPath: OLD_STUDENT_UI_NAV_PATHS.support,
    }),
    buildPrimaryNavTab({
      id: 'discussions',
      label: 'Discussions',
      stayInNew: false,
      oldUiPath: OLD_STUDENT_UI_NAV_PATHS.discussions,
    }),
    // iHub hides the MasaiVerse CTA and the Refer & Earn (changemakers) link
    // entirely; Masai keeps the existing either/or behaviour.
    ...(isIHub
      ? []
      : [
          showMasaiverseCta
            ? {
                id: 'masaiverse-nav',
                label: 'MasaiVerse Community',
                href: '/masaiverse',
                openInNewTab: false,
                isActive: activeNavId === 'masaiverse',
              }
            : {
                id: 'refer',
                label: 'Refer & Earn',
                href: '#',
                openInNewTab: false,
                onClick: handleReferAndEarnClick,
              },
        ]),
  ]

  const trailingActions: Array<NavbarActionItem> = useMemo(
    () => [
      // Download App, Chat and the guided-tour icon are Masai-only.
      ...(isIHub
        ? []
        : [
            {
              id: 'download-app',
              type: 'image' as const,
              src: 'https://students.masaischool.com/static/media/download-app.394dce64e9e436e88052.png',
              alt: 'Download app',
              tooltip: 'Download App',
              href: '#',
              imageClassName: 'h-[40px]',
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                setDownloadAppOpen(true)
              },
            },
          ]),
      {
        id: 'calendar',
        type: 'icon',
        icon: <CalendarDays className="size-7" />,
        ariaLabel: 'Calendar',
        ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.calendar),
      },
      ...(isIHub
        ? []
        : [
            {
              id: 'chat',
              type: 'icon' as const,
              icon: <MessagesSquare className="size-7" />,
              ariaLabel: 'Chat',
              ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.chat),
            },
            {
              id: 'guided-tour',
              type: 'icon' as const,
              icon: <CircleHelp className="size-7" />,
              ariaLabel: 'Onboarding steps',
              tooltip: 'Onboarding steps',
              href: '/',
              openInNewTab: false,
              onClick: handleGuidedTourClick,
            },
          ]),
      {
        id: 'announcements',
        type: 'icon',
        icon: <Megaphone className="size-7 -scale-x-100" />,
        ariaLabel: 'Announcements',
        href: '/announcements',
        openInNewTab: false,
        notificationCount: unreadCount,
        onClick: handleAnnouncementsClick,
      },
    ],
    [handleAnnouncementsClick, handleGuidedTourClick, isIHub, unreadCount],
  )

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
        label: 'My Courses',
        icon: <Book className="size-4" />,
        href: '/my-courses',
        openInNewTab: false,
      },
      {
        id: 'bookmark',
        label: 'Bookmark',
        icon: <Bookmark className="size-4" />,
        href: '/bookmarks',
        openInNewTab: false,
      },
      // MasaiVerse Community / Refer & Earn and Practice Interviews are
      // Masai-only and dropped from the iHub profile menu.
      ...(isIHub
        ? []
        : [
            showMasaiverseCta
              ? {
                  id: 'refer-menu',
                  label: 'Refer & Earn',
                  icon: <Gift className="size-4" />,
                  href: '#',
                  openInNewTab: false,
                  onClick: handleReferAndEarnClick,
                }
              : {
                  id: 'masaiverse-menu',
                  label: 'MasaiVerse Community',
                  icon: <Users className="size-4" />,
                  href: '/masaiverse',
                  openInNewTab: false,
                  isActive: activeNavId === 'masaiverse',
                },
            {
              id: 'practice-interview',
              label: 'Practice Interviews',
              icon: <BriefcaseBusiness className="size-4" />,
              ...oldStudentUiLink('/practice-interview'),
            },
          ]),
      {
        id: 'report-bug',
        label: 'Report a Bug',
        href: getBugReportFormUrl(),
        openInNewTab: true,
        icon: <Bug className="size-4" />,
      },
      // LevelUp is the Masai placement platform — hidden on iHub.
      ...(isIHub
        ? []
        : [
            {
              id: 'levelup',
              label: isLevelupLoading ? 'Opening Level up...' : 'Level up',
              icon: (
                <span className="flex size-4 shrink-0 items-center justify-center text-[#6B7280]">
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
        id: 'product-updates',
        label: 'Product Updates',
        icon: <Sparkles className="size-4" />,
        href: '/whats-new',
        openInNewTab: false,
        onClick: handleProductUpdatesClick,
      },
      {
        id: 'sign-out',
        label: 'Sign out',
        href: '#',
        icon: <LogOutIcon className="size-4" />,
        onClick: (e) => {
          void handleSignOut(e)
        },
      },
    ],
    [
      activeNavId,
      handleLevelupClick,
      handleProductUpdatesClick,
      handleReferAndEarnClick,
      handleSignOut,
      isIHub,
      isLevelupLoading,
      showMasaiverseCta,
    ],
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
        logo={{
          src: navbarLogoSrc(),
          alt: isIHub ? 'iHub Logo' : 'Masai Logo',
          href: '/',
          openInNewTab: false,
          onClick: handleHomeClick,
        }}
        navItems={navItems}
        centerSlot={<NextActionBanner className="max-w-[340px]" />}
        trailingActions={trailingActions}
        profile={profile}
      />
      <DownloadAppModal
        open={downloadAppOpen}
        onOpenChange={setDownloadAppOpen}
      />
    </>
  )
}
