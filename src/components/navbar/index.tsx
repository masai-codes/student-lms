"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { NavbarLogo } from "./navbar-logo";
import { NavbarNavItems } from "./navbar-nav-items";
import { NavbarProfileMenu } from "./navbar-profile-menu";
import { NavbarTrailingActions } from "./navbar-trailing-actions";
import type { NavbarProps } from "./types";

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
        "flex w-full items-center gap-3 bg-[#fff] py-[12px] rounded-b-[32px] px-[80px] ",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-[48px] sm:gap-6">
        <NavbarLogo logo={logo} />
        <NavbarNavItems items={navItems} />
      </div>

      <div className="flex shrink-0 items-center gap-[24px]">
        <NavbarTrailingActions items={trailingActions ?? []} />
        <NavbarProfileMenu profile={profile} />
      </div>
    </header>
  );
}
