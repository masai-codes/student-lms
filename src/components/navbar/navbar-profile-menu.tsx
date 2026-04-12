"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { cn } from "@/lib/utils";

import { NavbarAnchor } from "./navbar-anchor";
import type { NavbarProfile } from "./types";

type NavbarProfileMenuProps = {
  profile: NavbarProfile;
  className?: string;
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const menuItemClassName =
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 font-poppins text-[14px] font-medium leading-6 shadow-none outline-none transition-colors subpixel-antialiased text-gray-700 hover:text-[#6962AC] data-[highlighted]:text-[#6962AC] data-[highlighted]:shadow-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"

const menuContentClassName =
  "z-[220] min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";

export function NavbarProfileMenu({
  profile,
  className,
}: NavbarProfileMenuProps) {
  const label =
    profile.menuTriggerLabel ??
    profile.avatarAlt ??
    profile.fallbackText ??
    "Account menu";

  return (
    <div className={cn("shrink-0", className)}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-foreground shadow-none outline-none ring-offset-background transition-colors hover:bg-accent hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-0"
            aria-label={label}
            suppressHydrationWarning
          >
            {profile.avatarSrc ? (
              <img
                src={profile.avatarSrc}
                alt={profile.avatarAlt ?? "Profile photo"}
                className="size-full rounded-full object-cover"
                loading="lazy"
                decoding="async"
                suppressHydrationWarning
              />
            ) : (
              <span aria-hidden="true">
                {initials(profile.fallbackText ?? profile.avatarAlt ?? "User")}
              </span>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={menuContentClassName}
            sideOffset={8}
            align="end"
            collisionPadding={12}
          >
            {profile.menuItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No menu items.
              </div>
            ) : (
              profile.menuItems.map((item, index) => (
                <DropdownMenu.Item
                  key={item.id ?? `${item.href}-${item.label}-${index}`}
                  asChild
                >
                  <NavbarAnchor
                    href={item.href}
                    openInNewTab={item.openInNewTab}
                    onClick={item.onClick}
                    aria-current={item.isActive ? "page" : undefined}
                    className={cn(
                      menuItemClassName,
                      item.isActive &&
                        "font-medium text-[#6962AC] data-[highlighted]:text-[#6962AC]",
                    )}
                  >
                    {item.icon ? (
                      <span
                        className="flex size-4 shrink-0 items-center justify-center text-inherit [&_svg]:size-4"
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-inherit text-[14px] font-medium leading-6",
                        item.isActive && "font-medium text-[#6962AC]",
                      )}
                    >
                      {item.label}
                    </span>
                  </NavbarAnchor>
                </DropdownMenu.Item>
              ))
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
