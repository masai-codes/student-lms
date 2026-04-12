"use client"

import * as React from "react"

import { NavbarAnchor } from "./navbar-anchor"
import type { NavbarLogo as NavbarLogoConfig } from "./types"

type NavbarLogoProps = {
  logo: NavbarLogoConfig
  className?: string
}

export function NavbarLogo({ logo, className }: NavbarLogoProps) {
  return (
    <NavbarAnchor
      href={logo.href}
      openInNewTab={logo.openInNewTab}
      className={`inline-flex shrink-0 items-center rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ""}`.trim()}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className="h-8 w-auto max-w-[160px] object-contain"
        loading="eager"
        decoding="async"
        suppressHydrationWarning
      />
    </NavbarAnchor>
  )
}
