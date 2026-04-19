"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Users } from "@phosphor-icons/react";
import { X } from "lucide-react";
import { CardCtaButton } from "../shared/card-cta-button";
import type { ClubCardProps, DrawerDirection } from "./types";
import { RichContent } from "./rich-content";

import { cn } from "@/lib/utils";

function toCapitalizedWords(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Positive member count, or `null` to hide the badge (0, N/A, invalid). */
function parsePositiveMemberCount(value: number | string): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.floor(value);
  }
  const trimmed = value.trim();
  if (!trimmed || /^n\/?a$/i.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed.replace(/,/g, ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

type ClubCardDrawerProps = Pick<
  ClubCardProps,
  | "domain"
  | "name"
  | "imageUrl"
  | "shouldCompress"
  | "totalMembers"
  | "detailPoints"
  | "detailDescription"
  | "ctaText"
  | "ctaTheme"
  | "onCtaClick"
  | "drawerBottomInsetClassName"
  | "drawerBodyClassName"
  | "drawerPinFooter"
  | "drawerFooterClassName"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedDirection: Exclude<DrawerDirection, "auto">;
};

export function ClubCardDrawer({
  domain,
  name,
  imageUrl,
  shouldCompress = false,
  totalMembers,
  detailPoints,
  detailDescription,
  ctaText,
  ctaTheme,
  onCtaClick,
  drawerBottomInsetClassName,
  drawerBodyClassName,
  drawerPinFooter = true,
  drawerFooterClassName,
  open,
  onOpenChange,
  resolvedDirection,
}: ClubCardDrawerProps) {
  const resolvedDomain = toCapitalizedWords(domain);
  const resolvedName = toCapitalizedWords(name);
  const resolvedCtaText = toCapitalizedWords(ctaText);
  const memberCount = parsePositiveMemberCount(totalMembers);

  const footerCta = (
    <div
      className={cn(
        "border-t bg-white p-4",
        drawerPinFooter && "shrink-0",
        drawerPinFooter &&
          resolvedDirection === "bottom" &&
          "shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
        !drawerPinFooter && "mt-6",
        drawerFooterClassName,
      )}
    >
      <CardCtaButton
        text={resolvedCtaText}
        onClick={onCtaClick}
        theme={ctaTheme}
        fullWidth
      />
    </div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={cn(
            "fixed z-50 border bg-white font-poppins shadow-xl outline-none",
            resolvedDirection === "right"
              ? "right-0 top-0 flex h-svh w-full max-w-[420px] flex-col border-l transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
              : "bottom-0 left-0 flex w-full max-h-[88svh] flex-col rounded-t-2xl border-t transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
            drawerBottomInsetClassName,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0 flex-1">
              <p className="break-words text-xs font-semibold uppercase tracking-wide text-slate-500">
                {resolvedDomain}
              </p>
              <Dialog.Title className="mt-1 break-words text-lg font-semibold text-slate-900">
                About the Club
              </Dialog.Title>
            </div>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded-md border text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="bg-[#EBF5FF] flex py-[32px] rounded-[8px]">
              <img
                src={imageUrl}
                alt={resolvedName}
                className="h-[56px] w-[56px] m-auto"
              />
            </div>
            <div
              className={cn(
                "mt-[16px] min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1",
                drawerBodyClassName,
              )}
            >
              <p className="break-words text-[18px] font-[600] leading-[28px] font-poppins text-[#111928]">
                {resolvedName}
              </p>
              <RichContent
                value={detailDescription}
                className="mt-[8px] text-[14px] font-[400] leading-[20px] font-poppins text-[#374151] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
              />
              {memberCount !== null ? (
                <div className="mt-[12px] flex w-fit items-center gap-[6px] rounded-[32px] border border-[#E5E7EB] px-[12px] py-[4px] text-[#111928]">
                  <Users size={20} aria-hidden="true" color="#374151" />
                  <p className="font-poppins text-[12px] font-[500] leading-[16px] text-[#374151]">
                    {memberCount}{" "}
                    {memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              ) : null}

              {detailPoints.length > 0 ? (
                <div className="mt-[32px]">
                  <h4 className="text-[14px] font-[600] leading-[20px] font-poppins text-[#111928]">
                    What you’ll do here
                  </h4>
                  <ul className="mt-[12px] list-disc gap-[4px] pl-5 text-[14px] font-[400] leading-[24px] font-poppins text-[#374151]">
                    {detailPoints.map((point, index) => (
                      <li key={`${point}-${index}`} className="break-words">
                        {toCapitalizedWords(point)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!drawerPinFooter && !shouldCompress ? footerCta : null}
            </div>
          </div>
          {drawerPinFooter && !shouldCompress ? footerCta : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
