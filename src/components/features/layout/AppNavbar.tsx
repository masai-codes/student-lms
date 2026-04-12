'use client'

import { useState } from 'react'
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
  User,
  Users,
} from 'lucide-react'
import type { MouseEventHandler } from 'react'

import type {
  NavbarActionItem,
  NavbarLinkItem,
  NavbarProfile,
} from '@/components/navbar'
import { Navbar } from '@/components/navbar'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import {
  getOldStudentUiUrlForPath,
  redirectToOldStudentUi,
} from '@/utils/authRedirect'

const MASAI_LOGO =
  'https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg'

/**
 * Legacy student app (`experience-ui/apps/student-experience`) routes — keep in sync with
 * `src/utils/route.utils.ts` and top nav `src/components/NewLayout/DesktopNavbar.tsx`.
 *
 * Refer & Earn: navbar uses `Routes.changemakersCircle.main()` (`/changemakers-circle`).
 * `/alumniReferal` is a different flow (alumni hiring / refer-hiring), not the main CTA.
 */
const OLD_UI_PATHS = {
  home: '/',
  learn: '/learn',
  support: '/support?tab=unresolved',
  discussions: '/discussions',
  referAndEarn: '/changemakers-circle',
  calendar: '/my-calendar',
  chat: '/chat',
  announcements: '/announcements',
  profile: '/profile',
  myCourses: '/my-lectures',
  bookmarks: '/bookmarks?tab=Lecture',
  masaiverse: '/discord',
  practiceInterview: '/practice-interview',
} as const

function oldStudentUiLink(
  path: string,
): Pick<NavbarLinkItem, 'href' | 'openInNewTab' | 'onClick'> {
  const href = getOldStudentUiUrlForPath(path) ?? '#'
  const onClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    href === '#' ? (e) => e.preventDefault() : undefined
  return { href, openInNewTab: false, onClick }
}

export default function AppNavbar() {
  const [downloadAppOpen, setDownloadAppOpen] = useState(false)
  const oldStudentUiRoot = getOldStudentUiUrlForPath('/') ?? '#'

  const navItems: Array<NavbarLinkItem> = [
    {
      id: 'home',
      label: 'Home',
      ...oldStudentUiLink(OLD_UI_PATHS.home),
    },
    {
      id: 'learn',
      label: 'Learn',
      ...oldStudentUiLink(OLD_UI_PATHS.learn),
    },
    {
      id: 'support',
      label: 'Support',
      ...oldStudentUiLink(OLD_UI_PATHS.support),
    },
    {
      id: 'discussions',
      label: 'Discussions',
      ...oldStudentUiLink(OLD_UI_PATHS.discussions),
    },
    {
      id: 'refer',
      label: 'Refer & Earn',
      ...oldStudentUiLink(OLD_UI_PATHS.referAndEarn),
    },
  ]

  const trailingActions: Array<NavbarActionItem> = [
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
      ...oldStudentUiLink(OLD_UI_PATHS.calendar),
    },
    {
      id: 'chat',
      type: 'icon',
      icon: <MessagesSquare className="size-5" />,
      ariaLabel: 'Chat',
      ...oldStudentUiLink(OLD_UI_PATHS.chat),
    },
    {
      id: 'announcements',
      type: 'icon',
      icon: <Megaphone className="size-5" />,
      ariaLabel: 'Announcements',
      ...oldStudentUiLink(OLD_UI_PATHS.announcements),
    },
  ]

  const profile: NavbarProfile = {
    avatarSrc: 'https://github.com/shadcn.png',
    avatarAlt: 'Profile',
    fallbackText: 'LR',
    menuTriggerLabel: 'Open account menu',
    menuItems: [
      {
        id: 'profile',
        label: 'Profile',
        icon: <User className="size-4" />,
        ...oldStudentUiLink(OLD_UI_PATHS.profile),
      },
      {
        id: 'courses',
        label: 'My Courses',
        icon: <Book className="size-4" />,
        ...oldStudentUiLink(OLD_UI_PATHS.myCourses),
      },
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        icon: <Bookmark className="size-4" />,
        ...oldStudentUiLink(OLD_UI_PATHS.bookmarks),
      },
      {
        id: 'masaiverse-menu',
        label: 'MasaiVerse',
        icon: <Users className="size-4" />,
        ...oldStudentUiLink(OLD_UI_PATHS.masaiverse),
      },
      {
        id: 'practice-interview',
        label: 'Practice Interview',
        icon: <BriefcaseBusiness className="size-4" />,
        ...oldStudentUiLink(OLD_UI_PATHS.practiceInterview),
      },
      {
        id: 'report-bug',
        label: 'Report a Bug',
        href: 'https://forms.gle/ZMRLA8rQ85CtSkWf8',
        openInNewTab: true,
        icon: <Bug className="size-4" />,
      },
      {
        id: 'old-lms',
        label: 'Switch to Old LMS',
        href: oldStudentUiRoot,
        openInNewTab: false,
        icon: <ToggleLeft className="size-4" />,
        onClick:
          oldStudentUiRoot === '#' ? (e) => e.preventDefault() : undefined,
      },
      {
        id: 'sign-out',
        label: 'Sign Out',
        href: '#',
        icon: <LogOutIcon className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          redirectToOldStudentUi()
        },
      },
    ],
  }

  return (
    <>
      <Navbar
        className="z-[210]"
        logo={{
          src: MASAI_LOGO,
          alt: 'Masai Logo',
          ...oldStudentUiLink(OLD_UI_PATHS.home),
        }}
        navItems={navItems}
        trailingActions={trailingActions}
        profile={profile}
      />
      <DownloadAppModal open={downloadAppOpen} onOpenChange={setDownloadAppOpen} />
    </>
  )
}
