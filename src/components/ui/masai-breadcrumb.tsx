"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type MasaiBreadcrumbItem = {
  label: React.ReactNode;
  /** Required for every segment except the last. The last crumb is always the current page (not a link). */
  href?: string;
};

export type MasaiBreadcrumbRenderLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export type MasaiBreadcrumbProps = {
  items: MasaiBreadcrumbItem[];
  className?: string;
  navClassName?: string;
  listClassName?: string;
  separatorClassName?: string;
  linkClassName?: string;
  currentClassName?: string;
  separator?: React.ReactNode;
  /**
   * Renders clickable ancestors (everything before the last crumb). Swap in your framework `Link`
   * (`next/link`, `@tanstack/react-router`, etc.) to keep navigation client-side instead of `<a>` full reloads.
   */
  renderLink?: (props: MasaiBreadcrumbRenderLinkProps) => React.ReactNode;
};

const defaultSeparator = (
  <ChevronRight
    aria-hidden
    className="size-[14px] shrink-0 text-gray-400"
    strokeWidth={2}
  />
);

export function MasaiBreadcrumb({
  items,
  className,
  navClassName,
  listClassName,
  separatorClassName,
  linkClassName,
  currentClassName,
  separator = defaultSeparator,
  renderLink,
}: MasaiBreadcrumbProps) {
  if (!items?.length) {
    return null;
  }

  const linkStyles = cn(
    "type-t1 text-gray-600 transition-colors hover:text-gray-900",
    linkClassName,
  );

  const staticStyles = cn("type-t1 text-gray-900", currentClassName);

  return (
    <nav aria-label="Breadcrumb" className={cn(className, navClassName)}>
      <ol className={cn("flex flex-wrap items-center gap-x-1 gap-y-2 text-left", listClassName)}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const rawHref = item.href?.trim();
          /* Last segment is never a link — current page stays bold plain text even if href is passed. */
          const asLink = Boolean(rawHref) && !isLast;
          const href = rawHref ?? "";

          return (
            <li key={index} className="inline-flex min-w-0 items-center gap-x-1">
              {index > 0 ? (
                <span className={cn("inline-flex shrink-0", separatorClassName)} aria-hidden>
                  {separator}
                </span>
              ) : null}
              {asLink ? (
                renderLink ? (
                  renderLink({
                    href,
                    className: linkStyles,
                    children: item.label,
                  })
                ) : (
                  <a href={href} className={linkStyles}>
                    {item.label}
                  </a>
                )
              ) : (
                <span
                  className={cn(staticStyles, isLast ? "font-bold" : undefined)}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
