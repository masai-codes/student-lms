import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  Bookmark,
  Bug,
  Gift,
  GraduationCap,
  Headphones,
  Home,
  LogOutIcon,
  Megaphone,
  MessagesSquare,
  Mic,
  Smartphone,
  UserCircle,
} from 'lucide-react'
import type { NavItem } from './navItemConfig'
import { useNavGatingSignals } from './useNavGatingSignals'
import { fetchAnnouncementUnreadCount } from '@/lib/api/announcement/announcementApi'
import { LevelUpIcon } from '@/components/common/LevelUpIcon'
import { getBugReportFormUrl } from '@/utils/bugReportFormUrl'
import { logout } from '@/server/auth/logout'
import {
  getOldStudentUiUrlForPath,
  getPostLogoutRedirectUrl,
} from '@/utils/authRedirect'
import { fetchLevelupSso } from '@/utils/levelupSso'
import { fetchReferralLmsLoginRedirectUrl } from '@/utils/referralLmsLogin'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { HandWaving, UsersThreeIcon } from '@phosphor-icons/react'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

const REFERRAL_URL_REFETCH_INTERVAL = 5 * 60 * 1000

function LevelUpNavIcon({ className }: { className?: string }) {
  return (
    <span className={className}>
      <LevelUpIcon width={18} height={14} color="currentColor" />
    </span>
  )
}

/**
 * Assembles the canonical set of nav items (Tier 1 left tabs, right-side
 * items to be resolved by `resolveNavItemPriority`, and tertiary
 * profile-dropdown items) from live app signals. All gating/data-fetching
 * logic lives here — consumers (desktop navbar, mobile tab bar, mobile
 * header) only render the returned items and never re-derive any of it.
 */
export function useAppNavItems() {
  const { user } = layoutRouteApi.useRouteContext()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const gating = useNavGatingSignals(user.id)

  const [downloadAppOpen, setDownloadAppOpen] = useState(false)
  const [isLevelupLoading, setIsLevelupLoading] = useState(false)
  const levelupLoadingRef = useRef(false)

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
    enabled: gating.showReferAndEarn,
  })

  const handleLevelupClick = useCallback(async () => {
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
  }, [])

  const handleSignOut = useCallback(async () => {
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
  }, [])

  const handleReferAndEarnClick = useCallback(() => {
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
  }, [isReferralUrlLoading, referralUrl])

  // Tier 1 — left side. All carry an icon; Chat/MasaiVerse are independent
  // (no combined "Community" tab), each shown only when eligible.
  const tier1: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        id: 'home',
        type: 'internal-link',
        to: '/',
        label: 'Home',
        icon: Home,
        uiType: 'primary',
        isActive: pathname === '/',
      },
      {
        id: 'learn',
        type: 'internal-link',
        to: '/learn',
        label: 'Learn',
        icon: GraduationCap,
        uiType: 'primary',
        isActive:
          pathname.startsWith('/learn') || pathname.startsWith('/lectures'),
      },
    ]

    if (gating.showChat) {
      items.push({
        id: 'chat',
        type: 'internal-link',
        to: '/chat',
        label: 'Chat',
        icon: MessagesSquare,
        uiType: 'primary',
        isActive: pathname.startsWith('/chat'),
      })
    }

    if (gating.showMasaiVerse) {
      items.push({
        id: 'masaiverse',
        type: 'internal-link',
        to: '/masaiverse',
        label: 'MasaiVerse',
        icon: UsersThreeIcon,
        uiType: 'primary',
        isActive: pathname.startsWith('/masaiverse'),
      })
    }

    items.push({
      id: 'interviews',
      type: 'internal-link',
      to: '/interviews',
      label: 'Interviews',
      icon: Mic,
      uiType: 'primary',
      isActive: pathname.startsWith('/interviews'),
    })

    return items
  }, [gating.showChat, gating.showMasaiVerse, pathname])

  // Right side — fed through `resolveNavItemPriority` by the caller. "Get the
  // app" is primary only when the app isn't installed; Refer & Earn is
  // primary otherwise, and demotes to icon-only once "Get the app" claims
  // the primary slot.
  const rightItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = []

    if (gating.hasMobileApp) {
      items.push({
        id: 'download-app',
        type: 'action',
        onClick: () => setDownloadAppOpen(true),
        label: 'Get the app',
        icon: Smartphone,
        tooltip: 'Get the app',
        uiType: gating.isAppInstalled ? 'secondary' : 'primary',
      })
    }

    if (gating.showReferAndEarn) {
      items.push({
        id: 'refer',
        type: 'action',
        onClick: handleReferAndEarnClick,
        label: 'Refer & Earn',
        icon: Gift,
        tooltip: 'Refer & Earn',
        uiType: 'primary',
        showTextWhenPrimary: true,
      })
    }

    if (!gating.isIHub && !gating.isIitj) {
      items.push({
        id: 'guided-tour',
        type: 'action',
        onClick: () =>
          void navigate({ to: '/', search: { guidedTour: 'open' } }),
        label: 'Onboarding',
        icon: HandWaving,
        tooltip: 'Onboarding',
        uiType: 'secondary',
      })
    }

    items.push({
      id: 'announcements',
      type: 'internal-link',
      to: '/announcements',
      label: 'Announcements',
      icon: Megaphone,
      tooltip: 'Announcements',
      uiType: 'secondary',
      isActive: pathname.startsWith('/announcements'),
      notificationCount: unreadCount,
    })

    items.push({
      id: 'bookmarks',
      type: 'internal-link',
      to: '/bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      tooltip: 'Bookmarks',
      uiType: 'secondary',
      isActive: pathname.startsWith('/bookmarks'),
    })

    return items
  }, [
    gating.isAppInstalled,
    gating.hasMobileApp,
    gating.isIHub,
    gating.isIitj,
    gating.showReferAndEarn,
    handleReferAndEarnClick,
    navigate,
    pathname,
    unreadCount,
  ])

  // Tertiary — always routed into the profile dropdown.
  const tertiaryItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        id: 'profile',
        type: 'internal-link',
        to: '/profile',
        label: 'My Profile',
        icon: UserCircle,
        uiType: 'tertiary',
      },
      {
        id: 'courses',
        type: 'internal-link',
        to: '/my-courses',
        label: 'My Programs',
        icon: GraduationCap,
        uiType: 'tertiary',
      },
      {
        id: 'support',
        type: 'internal-link',
        to: '/support',
        label: 'Support',
        icon: Headphones,
        uiType: 'tertiary',
      },
      {
        id: 'report-bug',
        type: 'external-link',
        href: getBugReportFormUrl(),
        label: 'Report a Bug',
        icon: Bug,
        uiType: 'tertiary',
      },
    ]

    if (!gating.isIHub && !gating.isIitj) {
      items.push({
        id: 'levelup',
        type: 'action',
        onClick: () => void handleLevelupClick(),
        label: isLevelupLoading ? 'Opening Level up...' : 'Level up',
        icon: LevelUpNavIcon,
        uiType: 'tertiary',
      })
    }

    items.push({
      id: 'sign-out',
      type: 'action',
      onClick: () => void handleSignOut(),
      label: 'Sign out',
      icon: LogOutIcon,
      uiType: 'tertiary',
    })

    return items
  }, [
    gating.isIHub,
    gating.isIitj,
    handleLevelupClick,
    handleSignOut,
    isLevelupLoading,
  ])

  const lectureHasRecording = useRouterState({
    select: (s) => {
      const match = s.matches.find(
        (m) => m.routeId === '/(protected)/_layout/learn/lectures_/$lectureId',
      )
      const detail = match?.loaderData as
        | { restriction?: unknown; hasRecording?: boolean; videoUrl?: string }
        | undefined
      return Boolean(
        detail && !detail.restriction && detail.hasRecording && detail.videoUrl,
      )
    },
  })

  return {
    user,
    pathname,
    navigate,
    tier1,
    rightItems,
    tertiaryItems,
    downloadAppOpen,
    setDownloadAppOpen,
    lectureHasRecording,
  }
}
