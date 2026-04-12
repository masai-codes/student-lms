"use client";

import * as React from "react";

import { NavbarAnchor } from "./navbar-anchor";
import type { NavbarLinkItem } from "./types";

type NavbarNavItemsProps = {
  items: NavbarLinkItem[];
  className?: string;
};

export function NavbarNavItems({ items, className }: NavbarNavItemsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className={`flex min-w-0 flex-1 flex-wrap items-center gap-1 sm:gap-2 ${className ?? ""}`.trim()}
    >
      <ul className="flex flex-wrap items-center gap-[16px] sm:gap-3">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.href}-${item.label}-${index}`}>
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              className="font-poppins rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-[16px] font-[500] leading-[24px]"
            >
              {item.label}
            </NavbarAnchor>
          </li>
        ))}
      </ul>
    </nav>
  );
}
