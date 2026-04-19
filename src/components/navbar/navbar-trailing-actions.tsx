"use client";

import { NavbarAnchor } from "./navbar-anchor";
import type { NavbarActionItem } from "./types";

type NavbarTrailingActionsProps = {
  items: Array<NavbarActionItem>;
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
              className="cursor-pointer rounded-md px-2 py-1.5 font-poppins text-sm font-medium text-[#6B7280] shadow-none transition-colors hover:text-[#6962AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
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

        const count =
          typeof item.notificationCount === "number" && item.notificationCount > 0
            ? item.notificationCount
            : 0;
        const badge =
          count > 0 ? (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 font-poppins text-[10px] leading-none font-medium text-white">
              {count > 9 ? "9+" : count}
            </span>
          ) : null;

        return (
          <NavbarAnchor
            key={key}
            href={item.href}
            openInNewTab={item.openInNewTab}
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            title={item.tooltip}
            className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-gray-600 shadow-none transition-colors hover:text-[#6962AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
          >
            {item.icon}
            {badge}
          </NavbarAnchor>
        );
      })}
    </div>
  );
}
