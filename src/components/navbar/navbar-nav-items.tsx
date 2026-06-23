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
      className={`flex min-w-0 flex-1 flex-wrap items-center gap-1 sm:gap-2 ${className ?? ''}`.trim()}
    >
      <ul className="flex flex-wrap items-center gap-4">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.href}-${item.label}-${index}`}>
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className="flex flex-col gap-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            >
              <span className={cn(
                'subpixel-antialiased cursor-pointer font-poppins text-base leading-6 !font-[500] transition-colors',
                item.isActive ? 'text-[#6962AC]' : 'text-[#6B7280] hover:text-[#6962AC]',
              )}>
                {item.label}
              </span>
              <span className={cn(
                'h-0.5 rounded-[3px] transition-colors',
                item.isActive ? 'bg-[#6962AC]' : 'bg-transparent',
              )} />
            </NavbarAnchor>
          </li>
        ))}
      </ul>
    </nav>
  )
}
