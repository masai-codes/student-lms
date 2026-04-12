import * as React from "react"

import { NavbarAnchor } from "./navbar-anchor"
import type { NavbarLinkItem } from "./types"

import { cn } from "@/lib/utils"

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
      className={`flex min-w-0 flex-1 flex-wrap items-center gap-1 sm:gap-2 ${className ?? ""}`.trim()}
    >
      <ul className="flex flex-wrap items-center gap-6">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.href}-${item.label}-${index}`}>
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                /* Legacy LMS DesktopNavbar: 16/24 Poppins medium, gray-500 #6B7280, accent #6962AC; subpixel-antialiased avoids “thin” look vs body antialiased. */
                "cursor-pointer border border-transparent pb-1 font-poppins text-[16px] leading-[24px] !font-[500] subpixel-antialiased transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                "text-[#6B7280] hover:text-[#6962AC]",
                item.isActive &&
                  "border-b-2 border-[#6962AC] pb-1 text-[#6962AC]",
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
