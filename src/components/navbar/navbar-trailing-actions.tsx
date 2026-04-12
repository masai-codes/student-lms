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
              className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {item.icon}
          </NavbarAnchor>
        );
      })}
    </div>
  );
}
