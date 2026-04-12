"use client";

import * as React from "react";

import { NavbarAnchor } from "./navbar-anchor";
import type { NavbarActionItem } from "./types";

type NavbarTrailingActionsProps = {
  items: NavbarActionItem[];
  className?: string;
};

export function NavbarTrailingActions({
  items,
  className,
}: NavbarTrailingActionsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div
      className={`flex shrink-0 items-center gap-[16px] ${className ?? ""}`.trim()}
    >
      {items.map((item, index) => {
        const key = item.id ?? `${item.type}-${item.href}-${index}`;

        if (item.type === "text") {
          return (
            <NavbarAnchor
              key={key}
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              className="cursor-pointer rounded-md px-2 py-1.5 font-poppins text-sm font-medium subpixel-antialiased text-[#6B7280] shadow-none transition-colors hover:text-[#6962AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            >
              {item.label}
            </NavbarAnchor>
          );
        }

        if (item.type === "image") {
          const imageClassName = item.imageClassName?.trim().length
            ? item.imageClassName
            : "size-8 max-h-9 object-contain";

          return (
            <NavbarAnchor
              key={key}
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              title={item.tooltip}
              className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-gray-600 shadow-none transition-colors hover:text-[#6962AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            >
              <img
                src={item.src}
                alt={item.alt}
                className={imageClassName}
                loading="lazy"
                decoding="async"
                suppressHydrationWarning
              />
            </NavbarAnchor>
          );
        }

        return (
          <NavbarAnchor
            key={key}
            href={item.href}
            openInNewTab={item.openInNewTab}
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            title={item.tooltip}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-gray-600 shadow-none transition-colors hover:text-[#6962AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
          >
            {item.icon}
          </NavbarAnchor>
        );
      })}
    </div>
  );
}
