'use client'

import { NavbarAnchor } from './navbar-anchor'
import type { NavbarLogo as NavbarLogoConfig } from './types'

type NavbarLogoProps = {
  logo: NavbarLogoConfig
  className?: string
  /**
   * Renders an invisible, non-interactive copy of the logo. Used in tier 2 of
   * the navbar to reserve the same width as the tier 1 logo, so tier 2 tabs
   * align horizontally with the tier 1 nav items without duplicating layout
   * math in every consumer.
   */
  decorative?: boolean
}

export function NavbarLogo({ logo, className, decorative }: NavbarLogoProps) {
  return (
    <NavbarAnchor
      data-testid={decorative ? 'navbar-logo-placeholder' : 'navbar-logo'}
      href={decorative ? undefined : logo.href}
      openInNewTab={logo.openInNewTab}
      onClick={decorative ? undefined : logo.onClick}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className={`inline-flex shrink-0 cursor-pointer items-center rounded-md shadow-none outline-none ring-offset-background transition-opacity hover:opacity-90 hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 ${decorative ? 'invisible pointer-events-none' : ''} ${className ?? ''}`.trim()}
    >
      {logo.darkSrc ? (
        <>
          {/* Two images swapped by the theme's `.dark` class so the correct
              logo is present at first paint (no hydration flash). */}
          <img
            src={logo.src}
            alt={logo.alt}
            className="h-7 w-auto max-w-[140px] object-contain dark:hidden"
            loading="eager"
            decoding="async"
            suppressHydrationWarning
          />
          <img
            src={logo.darkSrc}
            alt={logo.alt}
            className="hidden h-7 w-auto max-w-[140px] object-contain dark:block"
            loading="eager"
            decoding="async"
            suppressHydrationWarning
          />
        </>
      ) : (
        <img
          src={logo.src}
          alt={logo.alt}
          className="h-7 w-auto max-w-[140px] object-contain"
          loading="eager"
          decoding="async"
          suppressHydrationWarning
        />
      )}
    </NavbarAnchor>
  )
}
