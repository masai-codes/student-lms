"use client";

import * as React from "react";

import type { ScrollingBannerProps } from "./types";

function toCssSize(value: number | string | undefined) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value;
}

export function ScrollingBanner({
  items,
  bannerHeading,
  className = "",
  maxHeight,
  maxWidth,
  itemDurationSeconds = 3,
  pauseOnHover = true,
  allowManualScroll = true,
  ariaLabel = "Latest updates",
}: ScrollingBannerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isHoveredRef = React.useRef(false);
  const safeItems = React.useMemo(() => items.filter(Boolean), [items]);

  const containerStyle: React.CSSProperties = {
    maxHeight: toCssSize(maxHeight),
    maxWidth: toCssSize(maxWidth),
  };

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || safeItems.length === 0) {
      return;
    }

    let frameId = 0;
    let lastTime = 0;
    const pixelsPerSecond = Math.max(
      8,
      120 / Math.max(itemDurationSeconds, 0.5),
    );

    const tick = (time: number) => {
      if (!lastTime) {
        lastTime = time;
      }

      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;

      if (!(pauseOnHover && isHoveredRef.current)) {
        const maxScrollTop = Math.max(
          0,
          container.scrollHeight - container.clientHeight,
        );
        if (maxScrollTop === 0) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        container.scrollTop += pixelsPerSecond * deltaSeconds;
        if (container.scrollTop >= maxScrollTop) {
          container.scrollTop = 0;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [safeItems.length, itemDurationSeconds, pauseOnHover]);

  if (!safeItems.length) {
    return (
      <div
        className={`font-poppins flex h-full w-full items-center justify-center rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-4 text-center text-[13px] text-[#6B7280] ${className}`.trim()}
        style={containerStyle}
      >
        No latest updates available.
      </div>
    );
  }

  return (
    <section
      className={` group font-poppins flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-[#FFFCFC] ${className}`.trim()}
      style={containerStyle}
      aria-label={ariaLabel}
    >
      {bannerHeading && bannerHeading.length > 0 ? (
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="text-[14px] font-[600] leading-[20px] text-[#111928]">
            {bannerHeading}
          </h2>
        </div>
      ) : null}
      <div
        ref={scrollContainerRef}
        className={`mt-[14px] min-h-0 w-full flex-1 ${allowManualScroll ? "overflow-y-auto no-scrollbar" : "overflow-hidden"}`}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        <div className="relative flex flex-col">
          <span className="pointer-events-none absolute inset-y-0 left-8 w-[2px] -translate-x-1/2 bg-[#D1D5DB]" />
          {safeItems.map((item, index) => (
            <article
              key={`${item.id ?? item.heading}-${index}`}
              className="flex w-full gap-2 px-4 py-4"
            >
              <div className="relative flex w-8 shrink-0 justify-center">
                <span className="relative z-10 mt-1 size-4 rounded-full border-[2px] border-[#EF8833] bg-white" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 bg-[#EF88331A] p-2 rounded-[8px]">
                <h3 className="text-[15px] font-[600] leading-[22px] text-[#111928]">
                  {item.heading}
                </h3>
                <p className="text-[13px] font-[400] leading-[20px] text-[#4B5563]">
                  {item.content}
                </p>
                <a
                  href={item.ctaLink}
                  target={item.openInNewTab ? "_blank" : "_self"}
                  rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                  suppressHydrationWarning
                  className="inline-flex w-fit items-center rounded-[8px] bg-[#EF8833] px-3 py-[6px] text-[12px] font-[500] leading-[18px] text-white transition-colors hover:bg-[#DC7A2D]"
                >
                  {item.ctaText}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .no-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    </section>
  );
}

export type { ScrollingBannerItem, ScrollingBannerProps } from "./types";
