"use client"

import { useNavigate } from "@tanstack/react-router"
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
} from "lucide-react"
import {
  Navbar,
  type NavbarActionItem,
  type NavbarLinkItem,
  type NavbarProfile,
} from "@/components/navbar"
import { getLegacyStudentUiUrl, redirectToLegacyStudentUi } from "@/utils/authRedirect"

const MASAI_LOGO =
  "https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg"

const STATIC_COURSE_ID = "4294967295"

export default function AppNavbar() {
  const navigate = useNavigate()
  const legacyStudentUiUrl = getLegacyStudentUiUrl()

  const navItems: Array<NavbarLinkItem> = [
    {
      id: "home",
      label: "Home",
      href: "/",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/", search: {} })
      },
    },
    {
      id: "learn",
      label: "Learn",
      href: `/courses/${STATIC_COURSE_ID}/lectures`,
      onClick: (e) => {
        e.preventDefault()
        navigate({
          to: "/courses/$courseId/lectures",
          params: { courseId: STATIC_COURSE_ID },
          search: { page: undefined },
        })
      },
    },
    {
      id: "support",
      label: "Support",
      href: "/support",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/support", search: { page: undefined } })
      },
    },
    {
      id: "discussions",
      label: "Discussions",
      href: "/discussions",
      onClick: (e) => {
        e.preventDefault()
        navigate({
          to: "/discussions",
          search: { page: undefined, type: undefined },
        })
      },
    },
    {
      id: "refer",
      label: "Refer & Earn",
      href: "/refer-and-earn",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/refer-and-earn" })
      },
    },
    {
      id: "masaiverse",
      label: "MasaiVerse",
      href: "/masaiverse",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/masaiverse" })
      },
    },
  ]

  const trailingActions: Array<NavbarActionItem> = [
    {
      id: "calendar",
      type: "icon",
      icon: <CalendarDays className="size-5" />,
      ariaLabel: "Calendar",
      href: "#",
      onClick: (e) => e.preventDefault(),
    },
    {
      id: "chat",
      type: "icon",
      icon: <MessagesSquare className="size-5" />,
      ariaLabel: "Chat",
      href: "/chat",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/chat" })
      },
    },
    {
      id: "announcements",
      type: "icon",
      icon: <Megaphone className="size-5" />,
      ariaLabel: "Announcements",
      href: "/announcements",
      onClick: (e) => {
        e.preventDefault()
        navigate({ to: "/announcements", search: { page: undefined } })
      },
    },
  ]

  const profile: NavbarProfile = {
    avatarSrc: "https://github.com/shadcn.png",
    avatarAlt: "Profile",
    fallbackText: "LR",
    menuTriggerLabel: "Open account menu",
    menuItems: [
      {
        id: "profile",
        label: "Profile",
        href: "/profile",
        icon: <User className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          navigate({ to: "/profile" })
        },
      },
      {
        id: "courses",
        label: "My Courses",
        href: "/courses",
        icon: <Book className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          navigate({ to: "/courses" })
        },
      },
      {
        id: "bookmarks",
        label: "Bookmarks",
        href: "/bookmark",
        icon: <Bookmark className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          navigate({
            to: "/bookmark",
            search: { page: undefined, type: undefined },
          })
        },
      },
      {
        id: "masaiverse-menu",
        label: "MasaiVerse",
        href: "/masaiverse",
        icon: <Users className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          navigate({ to: "/masaiverse" })
        },
      },
      {
        id: "practice-interview",
        label: "Practice Interview",
        href: "/practice-interview",
        icon: <BriefcaseBusiness className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          navigate({ to: "/practice-interview" })
        },
      },
      {
        id: "report-bug",
        label: "Report a Bug",
        href: "https://forms.gle/ZMRLA8rQ85CtSkWf8",
        openInNewTab: true,
        icon: <Bug className="size-4" />,
      },
      {
        id: "old-lms",
        label: "Switch to Old LMS",
        href: legacyStudentUiUrl ?? "#",
        icon: <ToggleLeft className="size-4" />,
        onClick: (e) => {
          if (!legacyStudentUiUrl) {
            e.preventDefault()
          }
        },
      },
      {
        id: "sign-out",
        label: "Sign Out",
        href: "#",
        icon: <LogOutIcon className="size-4" />,
        onClick: (e) => {
          e.preventDefault()
          redirectToLegacyStudentUi()
        },
      },
    ],
  }

  return (
    <Navbar
      className="sticky top-0 z-50 border-b border-border"
      logo={{
        src: MASAI_LOGO,
        alt: "Masai Logo",
        href: "/",
        onClick: (e) => {
          e.preventDefault()
          navigate({ to: "/", search: {} })
        },
      }}
      navItems={navItems}
      trailingActions={trailingActions}
      profile={profile}
    />
  )
}
