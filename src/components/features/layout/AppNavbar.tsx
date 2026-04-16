'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  Book,
  Bookmark,
  BriefcaseBusiness,
  Bug,
  CalendarDays,
  LogOutIcon,
  Megaphone,
  MessagesSquare,
  ToggleLeft,
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
import { Navbar } from '@/components/navbar'
import { LevelUpIcon } from '@/components/common/LevelUpIcon'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import { LEGACY_STUDENT_LMS_URL } from '@/constants/legacyStudentUi'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getBugReportFormUrl } from '@/utils/bugReportFormUrl'
import { logout } from '@/server/auth/logout'
import {
  getOldStudentUiUrlForPath,
  getPostLogoutRedirectUrl,
} from '@/utils/authRedirect'
import { fetchLevelupSso } from '@/utils/levelupSso'
import { fetchReferralLmsLoginRedirectUrl } from '@/utils/referralLmsLogin'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const MASAI_LOGO =
  'https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg'

/**
 * Legacy student app (`experience-ui/apps/student-experience`) routes — keep in sync with
 * `src/utils/route.utils.ts` and top nav `src/components/NewLayout/DesktopNavbar.tsx`.
 *
 * Profile dropdown labels/order match `profileMenuOptions.ts` + `DesktopNavbar` extras
 * (Report a Bug, Level up, Switch to OLD LMS, Sign out). In-app links use this app’s routes.
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

export default function AppNavbar() {
  const { user } = layoutRouteApi.useRouteContext()
  const [downloadAppOpen, setDownloadAppOpen] = useState(false)
  const [isLevelupLoading, setIsLevelupLoading] = useState(false)
  const levelupLoadingRef = useRef(false)
  const REFERRAL_URL_REFETCH_INTERVAL = 5 * 60 * 1000

  const { data: referralUrl, isFetching: isReferralUrlLoading } = useQuery({
    queryKey: ['referral-lms-login-url'],
    queryFn: fetchReferralLmsLoginRedirectUrl,
    staleTime: REFERRAL_URL_REFETCH_INTERVAL,
    refetchInterval: REFERRAL_URL_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const handleLevelupClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (levelupLoadingRef.current) return
    levelupLoadingRef.current = true
    setIsLevelupLoading(true)
    try {
      const { url } = await fetchLevelupSso()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while redirecting to Levelup'
      window.alert(message)
    } finally {
      levelupLoadingRef.current = false
      setIsLevelupLoading(false)
    }
  }, [])

  const handleSignOut = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed', err)
      window.alert(err instanceof Error ? err.message : 'Sign out failed. Please try again.')
      return
    }
    window.location.assign(getPostLogoutRedirectUrl())
  }, [])

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
        getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.referAndEarn) ?? '/refer-and-earn'
      window.location.assign(fallbackHref)
    },
    [isReferralUrlLoading, referralUrl],
  )

  const navItems: Array<NavbarLinkItem> = [
    {
      id: 'home',
      label: 'Home',
      ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.home),
    },
    {
      id: 'learn',
      label: 'Learn',
      ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.learn),
    },
    {
      id: 'support',
      label: 'Support',
      ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.support),
    },
    {
      id: 'discussions',
      label: 'Discussions',
      ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.discussions),
    },
    {
      id: 'refer',
      label: 'Refer & Earn',
      href: '#',
      openInNewTab: false,
      onClick: handleReferAndEarnClick,
    },
  ]

  const trailingActions: Array<NavbarActionItem> = useMemo(
    () => [
      {
        id: 'download-app',
        type: 'image',
        src: 'https://students.masaischool.com/static/media/download-app.394dce64e9e436e88052.png',
        alt: 'Download app',
        tooltip: 'Download App',
        href: '#',
        imageClassName: 'h-[40px]',
        onClick: (e) => {
          e.preventDefault()
          setDownloadAppOpen(true)
        },
      },
      {
        id: 'calendar',
        type: 'icon',
        icon: <CalendarDays className="size-5" />,
        ariaLabel: 'Calendar',
        ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.calendar),
      },
      {
        id: 'chat',
        type: 'icon',
        icon: <MessagesSquare className="size-5" />,
        ariaLabel: 'Chat',
        ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.chat),
      },
      {
        id: 'announcements',
        type: 'icon',
        icon: <Megaphone className="size-5" />,
        ariaLabel: 'Announcements',
        ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.announcements),
      },
    ],
    [],
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
        href: '/courses',
        openInNewTab: false,
      },
      {
        id: 'bookmark',
        label: 'Bookmark',
        icon: <Bookmark className="size-4" />,
        href: '/bookmark',
        openInNewTab: false,
      },
      {
        id: 'masaiverse-menu',
        label: 'MasaiVerse Community',
        icon: <Users className="size-4" />,
        href: '/masaiverse',
        openInNewTab: false,
      },
      {
        id: 'practice-interview',
        label: 'Practice Interviews',
        icon: <BriefcaseBusiness className="size-4" />,
        href: '/practice-interview',
        openInNewTab: false,
      },
      {
        id: 'report-bug',
        label: 'Report a Bug',
        href: getBugReportFormUrl(),
        openInNewTab: true,
        icon: <Bug className="size-4" />,
      },
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
      {
        id: 'old-lms',
        label: 'Switch to OLD LMS',
        href: LEGACY_STUDENT_LMS_URL,
        openInNewTab: true,
        icon: <ToggleLeft className="size-4" />,
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
    [handleLevelupClick, handleSignOut, isLevelupLoading],
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
        className="z-40 max-md:hidden"
        logo={{
          src: MASAI_LOGO,
          alt: 'Masai Logo',
          ...oldStudentUiLink(OLD_STUDENT_UI_NAV_PATHS.home),
        }}
        navItems={navItems}
        trailingActions={trailingActions}
        profile={profile}
      />
      <DownloadAppModal open={downloadAppOpen} onOpenChange={setDownloadAppOpen} />
    </>
  )
}
