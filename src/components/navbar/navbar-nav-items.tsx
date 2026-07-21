import { NavbarAnchor } from './navbar-anchor'
import type { NavbarLinkItem } from './types'

import { cn } from '@/lib/utils'

type NavbarNavItemsProps = {
  items: Array<NavbarLinkItem>
  className?: string
}

export function NavbarNavItems({ items, className }: NavbarNavItemsProps) {
  if (!items.length) {
    return null
  }

  return (
    <nav
      aria-label="Primary"
      className={`flex min-w-0 flex-1 items-center ${className ?? ''}`.trim()}
    >
      <ul className="flex min-w-0 flex-nowrap items-center gap-3 xl:gap-4">
        {items.map((item, index) => (
          <li
            key={item.id ?? `${item.href}-${item.label}-${index}`}
            className="shrink-0"
          >
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className="flex flex-col gap-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            >
              <span
                className={cn(
                  'subpixel-antialiased cursor-pointer whitespace-nowrap font-poppins text-base leading-6 !font-[500] transition-colors',
                  item.isActive
                    ? 'text-brand'
                    : 'text-foreground-muted hover:text-brand',
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  'h-0.5 rounded-[3px] transition-colors',
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
