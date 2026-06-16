import type { TabNavbarProps } from "./types"

import { cn } from "@/lib/utils"

export function TabNavbar({
  items,
  className,
  labelClassName,
  activeClassName = "text-[#6962AC]",
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
        const accent = Boolean(item.accent)

        return (
          <button
            key={key}
            type="button"
            onClick={item.onClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-w-0 basis-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 transition-colors",
              "cursor-pointer border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              isActive
                ? activeClassName
                : "text-[#6B7280] hover:text-[#4B5563]",
            )}
          >
            {accent ? (
              <span
                className={cn(
                  "-mt-1 flex size-7 shrink-0 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-primary-500 to-primary-700 text-white",
                  "shadow-[0_4px_12px_-2px_rgba(96,89,157,0.55)] ring-[3px] ring-white",
                  "transition-transform duration-200 group-hover:scale-105 group-active:scale-95",
                  "[&_svg]:size-4 [&_svg]:shrink-0",
                )}
                aria-hidden
              >
                {item.icon}
              </span>
            ) : (
              <span
                className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-6 [&_svg]:shrink-0"
                aria-hidden
              >
                {item.icon}
              </span>
            )}
            <span
              className={cn(
                "truncate text-center text-[11px] font-medium leading-4",
                accent && "font-semibold text-primary-600",
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
