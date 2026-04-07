"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Users } from "@phosphor-icons/react";
import { X } from "lucide-react";
import { CardCtaButton } from "../shared/card-cta-button";
import type { ClubCardProps, DrawerDirection } from "./types";

type ClubCardDrawerProps = Pick<
  ClubCardProps,
  | "domain"
  | "name"
  | "imageUrl"
  | "totalMembers"
  | "detailPoints"
  | "detailDescription"
  | "ctaText"
  | "ctaTheme"
  | "onCtaClick"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedDirection: Exclude<DrawerDirection, "auto">;
};

export function ClubCardDrawer({
  domain,
  name,
  imageUrl,
  totalMembers,
  detailPoints,
  detailDescription,
  ctaText,
  ctaTheme,
  onCtaClick,
  open,
  onOpenChange,
  resolvedDirection,
}: ClubCardDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={`fixed z-50 border bg-white font-poppins shadow-xl outline-none ${
            resolvedDirection === "right"
              ? "right-0 top-0 flex h-svh w-full max-w-[420px] flex-col border-l transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
              : "bottom-0 left-0 flex w-full max-h-[88svh] flex-col rounded-t-2xl border-t transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-y-full data-[state=open]:translate-y-0"
          }`}
        >
          <div className="flex items-start justify-between border-b p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {domain}
              </p>
              <Dialog.Title className="mt-1 text-lg font-semibold text-slate-900">
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
                alt={name}
                className="h-[56px] w-[56px] m-auto"
              />
            </div>
            <div className="mt-[16px] min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="text-[18px] font-[600] leading-[28px] font-poppins text-[#111928]">
                {name}
              </p>
              <p className="mt-[8px] text-[14px] font-[400] leading-[20px] font-poppins text-[#374151]">
                {detailDescription}
              </p>
              <div className="w-fit mt-[12px] flex items-center gap-[6px] text-[#111928] border border-[#E5E7EB] rounded-[32px] px-[12px] py-[4px]">
                <Users size={20} aria-hidden="true" color="#374151" />
                <p className="text-[12px] font-[500] leading-[16px] font-poppins text-[#374151]">
                  {totalMembers} members
                </p>
              </div>

              <div className="mt-[32px]">
                <h4 className="text-[14px] font-[600] leading-[20px] font-poppins text-[#111928]">
                  What you’ll do here
                </h4>
                <ul className="mt-[12px] list-disc gap-[4px] pl-5 text-[14px] font-[400] leading-[24px] font-poppins text-[#374151]">
                  {detailPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t p-4">
            <CardCtaButton text={ctaText} onClick={onCtaClick} theme={ctaTheme} fullWidth />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
