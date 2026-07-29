import * as React from 'react'

import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

export type NavbarAnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href?: string
  openInNewTab?: boolean
}

function resolveOpenInNewTab(href?: string, openInNewTab?: boolean) {
  if (typeof openInNewTab === 'boolean') {
    return openInNewTab
  }
  if (!href) return false

  return /^https?:\/\//i.test(href)
}

export const NavbarAnchor = React.forwardRef<
  HTMLAnchorElement,
  NavbarAnchorProps
>(function NavbarAnchor(
  { href, openInNewTab, className, children, ...rest },
  ref,
) {
  const external = resolveOpenInNewTab(href, openInNewTab)

  return external ? (
    <a
      ref={ref}
      href={href}
      className={cn(className)}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...rest}
      suppressHydrationWarning
    >
      {children}
    </a>
  ) : (
    <Link
      ref={ref}
      className={cn(className)}
      to={href}
      {...rest}
      suppressHydrationWarning
    >
      {children}
    </Link>
  )
})

NavbarAnchor.displayName = 'NavbarAnchor'
