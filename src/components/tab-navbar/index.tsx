import * as React from "react"

import type { TabNavbarProps } from "./types"

import { cn } from "@/lib/utils"

export function TabNavbar({
  items,
  className,
  labelClassName,
  ariaLabel = "Primary navigation",
}: TabNavbarProps) {
  if (!items.length) {
    return null
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex w-full flex-row items-center bg-white py-2 font-poppins",
        className,
      )}
    >
      {items.map((item, index) => {
        const key = item.id ?? `${item.label}-${index}`
        const isActive = Boolean(item.isActive)

        return (
          <button
            key={key}
            type="button"
            onClick={item.onClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 basis-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 transition-colors",
              "cursor-pointer border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              isActive
                ? "text-[#6962AC]"
                : "text-[#6B7280] hover:text-[#4B5563]",
            )}
          >
            <span
              className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-6 [&_svg]:shrink-0"
              aria-hidden
            >
              {item.icon}
            </span>
            <span
              className={cn(
                "truncate text-center text-[11px] font-medium leading-4",
                labelClassName,
              )}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export type { TabNavbarItem, TabNavbarProps } from "./types"
