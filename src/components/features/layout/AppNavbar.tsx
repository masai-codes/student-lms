'use client'

import type { MouseEvent } from 'react'
import type {
  NavbarActionItem,
  NavbarLinkItem,
  NavbarProfile,
  NavbarProfileMenuItem,
} from '@/components/navbar'
import { Navbar } from '@/components/navbar'
import { NavbarTrailingActions } from '@/components/navbar/navbar-trailing-actions'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import { LearnTier2Fallback } from '@/components/features/layout/LearnTier2Fallback'
import { TryNewToggle } from '@/components/features/layout/TryNewToggle'
import { useTryNewCtaVisible } from '@/hooks/useTryNewCtaVisible'
import { isMigratedRoute } from '@/utils/migratedRoutes'
import { getAuthBranding } from '@/utils/authBranding'
import { isMasaiPortal } from '@/utils/portal'
import type { NavItem } from '@/lib/navigation/navItemConfig'
import { resolveNavItemPriority } from '@/lib/navigation/resolveNavItemPriority'
import { useAppNavItems } from '@/lib/navigation/useAppNavItems'
import { MessagesSquare } from 'lucide-react'
import { LearnBatchSwitcher } from '../learn/section-one/LearnBatchSwitcher'

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const MASAI_LOGO =
  'https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg'
const MASAI_LOGO_DARK =
  'https://cdn.masaischool.com/masai-website/masai_dark_853075d7cd.png'

function navbarLogoSrc(): string {
  return isMasaiPortal() ? MASAI_LOGO : getAuthBranding().logoSrc
}

function navbarLogoDarkSrc(): string | undefined {
  return isMasaiPortal() ? MASAI_LOGO_DARK : undefined
}

/** Renders a `NavItem` as a Tier-1 nav link (icon + label always shown). */
function toNavbarLinkItem(
  item: NavItem,
  navigate: ReturnType<typeof useAppNavItems>['navigate'],
): NavbarLinkItem {
  const icon = item.icon ? <item.icon /> : undefined
  if (item.type === 'internal-link') {
    return {
      id: item.id,
      label: item.label ?? '',
      icon,
      isActive: item.isActive,
      href: item.to,
      openInNewTab: false,
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        void navigate({ to: item.to, search: {} })
      },
    }
  }
  if (item.type === 'external-link') {
    return {
      id: item.id,
      label: item.label ?? '',
      icon,
      isActive: item.isActive,
      href: item.href,
      openInNewTab: true,
    }
  }
  return {
    id: item.id,
    label: item.label ?? '',
    icon,
    isActive: item.isActive,
    href: '#',
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      item.onClick()
    },
  }
}

/** Renders a resolved-secondary `NavItem` as an icon-only trailing action. */
function toIconActionItem(item: NavItem): NavbarActionItem {
  const icon = item.icon ? <item.icon /> : null
  const base = {
    id: item.id,
    type: 'icon' as const,
    icon,
    ariaLabel: item.tooltip ?? item.label ?? item.id,
    tooltip: item.tooltip ?? item.label,
    isActive: item.isActive,
    notificationCount: item.notificationCount,
  }
  if (item.type === 'internal-link') {
    return { ...base, href: item.to, openInNewTab: false }
  }
  if (item.type === 'external-link') {
    return { ...base, href: item.href, openInNewTab: true }
  }
  return {
    ...base,
    href: '#',
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      item.onClick()
    },
  }
}

/** Renders the resolved-primary `NavItem` as the labeled pill CTA. */
function toPillActionItem(item: NavItem): NavbarActionItem {
  const icon = item.icon ? <item.icon /> : null
  const base = {
    id: item.id,
    type: 'text' as const,
    variant: 'pill' as const,
    label: item.label ?? '',
    icon,
    isActive: item.isActive,
  }
  if (item.type === 'internal-link') {
    return { ...base, href: item.to, openInNewTab: false }
  }
  if (item.type === 'external-link') {
    return { ...base, href: item.href, openInNewTab: true }
  }
  return {
    ...base,
    href: '#',
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      item.onClick()
    },
  }
}

function toProfileMenuItem(item: NavItem): NavbarProfileMenuItem {
  const icon = item.icon ? <item.icon className="size-4" /> : undefined
  const base = { id: item.id, label: item.label ?? '', icon }
  if (item.type === 'internal-link') {
    return { ...base, href: item.to, openInNewTab: false }
  }
  if (item.type === 'external-link') {
    return { ...base, href: item.href, openInNewTab: true }
  }
  return {
    ...base,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      item.onClick()
    },
  }
}

export default function AppNavbar() {
  const {
    user,
    pathname,
    navigate,
    tier1,
    rightItems,
    tertiaryItems,
    downloadAppOpen,
    setDownloadAppOpen,
    lectureHasRecording,
  } = useAppNavItems()
  const showTryNew = useTryNewCtaVisible()

  const { primary, secondary } = resolveNavItemPriority(rightItems)
  const isLearn = pathname.includes('/learn')

  const tier2 = isLearn ? (
    <>
      <div className="flex min-w-0 items-stretch gap-3">
        <LearnTier2Fallback />
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
              href: '/learn/discussions',
              openInNewTab: false,
              isActive: pathname.startsWith('/learn/discussions'),
            },
          ]}
        />
      </div>
      <div className="flex items-center">
        <LearnBatchSwitcher compact />
      </div>
    </>
  ) : null

  const profile: NavbarProfile = {
    ...(user.profileImageUrl ? { avatarSrc: user.profileImageUrl } : {}),
    avatarAlt: user.name,
    fallbackText: profileInitials(user.name),
    menuTriggerLabel: 'Open account menu',
    menuItems: tertiaryItems.map(toProfileMenuItem),
  }

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
          onClick: (e) => {
            e.preventDefault()
            void navigate({ to: '/' })
          },
        }}
        navItems={tier1.map((item) => toNavbarLinkItem(item, navigate))}
        trailingActions={secondary.map(toIconActionItem)}
        primaryRowActions={primary.map(toPillActionItem)}
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
