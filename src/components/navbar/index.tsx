"use client";

import * as React from "react";

import { NavbarLogo } from "./navbar-logo";
import { NavbarNavItems } from "./navbar-nav-items";
import { NavbarProfileMenu } from "./navbar-profile-menu";
import { NavbarTrailingActions } from "./navbar-trailing-actions";
import type { NavbarProps } from "./types";

import {
  LAYOUT_NAVBAR_INNER_CLASSES,
  LAYOUT_NAVBAR_OUTER_CLASSES,
} from "@/lib/layout";
import { cn } from "@/lib/utils";

export function Navbar({
  logo,
  navItems,
  profile,
  trailingActions,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        LAYOUT_NAVBAR_OUTER_CLASSES,
        "sticky top-0 z-50 flex flex-col bg-white shadow-sm rounded-b-[32px]",
        className,
      )}
    >
      <div
        className={cn(
          LAYOUT_NAVBAR_INNER_CLASSES,
          "justify-between py-3 md:py-3.5",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <NavbarLogo logo={logo} />
          <NavbarNavItems items={navItems} />
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <NavbarTrailingActions items={trailingActions ?? []} />
          <NavbarProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
