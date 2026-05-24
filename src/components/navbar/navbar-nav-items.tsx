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
      <ul className="flex flex-wrap items-center gap-6">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.href}-${item.label}-${index}`}>
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                /* Weight 500 + subpixel smoothing on these links only: body `antialiased` makes 500 *look* thin on macOS Chrome; subpixel restores perceived stroke like legacy LMS. */
                'subpixel-antialiased cursor-pointer font-poppins text-base leading-6 !font-[500] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
                'text-[#6B7280] hover:text-[#6962AC]',
                item.isActive &&
                  'text-[#6962AC] underline decoration-[#6962AC] underline-offset-4',
              )}
            >
              {item.label}
            </NavbarAnchor>
          </li>
        ))}
      </ul>
    </nav>
  )
}
