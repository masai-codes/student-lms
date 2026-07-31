import { NavbarAnchor } from './navbar-anchor'
import type { NavbarLinkItem } from './types'

import { cn } from '@/lib/utils'

type NavbarNavItemsProps = {
  items: Array<NavbarLinkItem>
  className?: string
}

function navLinkTestId(item: NavbarLinkItem) {
  const slug =
    item.id ?? (item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'item')
  return `navbar-nav-link-${slug}`
}

export function NavbarNavItems({ items, className }: NavbarNavItemsProps) {
  if (!items.length) {
    return null
  }

  return (
    <nav
      aria-label="Primary"
      data-testid="navbar-nav-links"
      className={cn('flex min-w-0 items-stretch self-stretch', className)}
    >
      <ul className="flex min-w-0 flex-nowrap items-stretch gap-5 xl:gap-6">
        {items.map((item, index) => (
          <li
            key={item.id ?? `${item.href}-${item.label}-${index}`}
            className="flex shrink-0 items-stretch"
          >
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              data-testid={navLinkTestId(item)}
              className="relative flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 subpixel-antialiased cursor-pointer whitespace-nowrap font-poppins text-[14px] leading-5 transition-colors',
                  item.isActive
                    ? 'font-semibold text-brand'
                    : 'font-medium text-foreground-muted hover:text-brand',
                )}
              >
                {item.icon ? (
                  <span
                    className="flex shrink-0 items-center justify-center [&_svg]:size-4"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                ) : null}
                {item.label}
              </span>
              {/* Active indicator sits on the row's baseline (rather than
                  directly under the label) so it reads as a tab underline. */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0 h-0.5 rounded-t-[2px] transition-colors',
                  item.isActive ? 'bg-brand' : 'bg-transparent',
                )}
              />
            </NavbarAnchor>
          </li>
        ))}
      </ul>
    </nav>
  )
}
