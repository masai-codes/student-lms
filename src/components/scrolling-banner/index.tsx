"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ScrollingBannerProps } from "./types";

function toCssSize(value: number | string | undefined) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value;
}

function normalizeMarkdownContent(value: string) {
  if (!value) return "";

  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="m-0 min-w-0 max-w-full break-words whitespace-pre-wrap">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-1 min-w-0 max-w-full list-outside list-disc space-y-1 break-words pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 min-w-0 max-w-full list-outside list-decimal space-y-1 break-words pl-5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="min-w-0 break-words marker:text-[#4B5563]">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="min-w-0 break-words font-semibold text-[#111928]">{children}</strong>
  ),
};

export function ScrollingBanner({
  items,
  bannerHeading,
  className = "",
  maxHeight,
  maxWidth,
  autoScroll = true,
  itemDurationSeconds = 3,
  pauseOnHover = true,
  allowManualScroll = true,
  ariaLabel = "Latest updates",
}: ScrollingBannerProps) {
  const CONTENT_TRUNCATE_LIMIT = 50;
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isHoveredRef = React.useRef(false);
  const safeItems = React.useMemo(() => items.filter(Boolean), [items]);
  const [activeModalItem, setActiveModalItem] = React.useState<{
    heading: string;
    content: string;
  } | null>(null);

  const containerStyle: React.CSSProperties = {
    maxHeight: toCssSize(maxHeight),
    maxWidth: toCssSize(maxWidth),
  };

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!autoScroll || !container || safeItems.length === 0) {
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
  }, [autoScroll, safeItems.length, itemDurationSeconds, pauseOnHover]);

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
          <h2 className="break-words text-[14px] font-[600] leading-[20px] text-[#111928]">
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
            (() => {
              const itemKey = `${item.id ?? item.heading ?? `item-${index}`}-${index}`;
              const contentText = normalizeMarkdownContent(item.content ?? "");
              const hasLongContent = contentText.length > CONTENT_TRUNCATE_LIMIT;
              const hasCtaText = (item.ctaText ?? "").trim().length > 0;
              const hasCtaLink = (item.ctaLink ?? "").trim().length > 0;

              return (
            <article
              key={itemKey}
              className="flex w-full gap-2 px-4 py-4"
            >
              <div className="relative flex w-8 shrink-0 justify-center">
                <span className="relative z-10 mt-1 size-4 rounded-full border-[2px] border-[#EF8833] bg-white" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[8px] bg-[#EF88331A] p-2">
                <h3 className="min-w-0 break-words text-[15px] font-[600] leading-[22px] text-[#111928]">
                  {item.heading}
                </h3>
                <div
                  className={`banner-markdown min-w-0 max-w-full break-words text-[13px] font-[400] leading-[20px] text-[#4B5563] ${
                    hasLongContent ? "max-h-[88px] overflow-hidden" : ""
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {contentText}
                  </ReactMarkdown>
                </div>
                {hasLongContent ? (
                  <button
                    type="button"
                    className="inline-flex w-fit text-[12px] font-[500] leading-[18px] text-[#EF8833] hover:text-[#DC7A2D]"
                    onClick={() => {
                      setActiveModalItem({
                        heading: item.heading,
                        content: contentText,
                      });
                    }}
                  >
                    View more
                  </button>
                ) : null}
                {hasCtaText && hasCtaLink ? (
                  <a
                    href={item.ctaLink}
                    target={item.openInNewTab ? "_blank" : "_self"}
                    rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                    suppressHydrationWarning
                    className="inline-flex max-w-full min-w-0 items-center break-words rounded-[8px] bg-[#EF8833] px-3 py-[6px] text-center text-[12px] font-[500] leading-[18px] text-white transition-colors hover:bg-[#DC7A2D]"
                  >
                    {item.ctaText}
                  </a>
                ) : null}
              </div>
            </article>
              );
            })()
          ))}
        </div>
      </div>
      {activeModalItem ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            setActiveModalItem(null);
          }}
        >
          <div
            className="w-full max-w-[640px] max-h-[80vh] overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-3 flex min-w-0 items-start justify-between gap-4">
              <h3 className="min-w-0 flex-1 break-words text-[16px] font-[600] leading-[24px] text-[#111928]">
                {activeModalItem.heading}
              </h3>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[13px] font-[500] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111928]"
                onClick={() => {
                  setActiveModalItem(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="banner-markdown min-w-0 max-w-full break-words text-[14px] font-[400] leading-[22px] text-[#374151]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {activeModalItem.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ) : null}
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
