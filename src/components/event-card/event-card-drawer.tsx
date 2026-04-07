"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDots,
  ClockAfternoon,
  GlobeHemisphereWest,
  MapPin,
  X,
} from "@phosphor-icons/react";

import { CardCtaButton } from "../shared/card-cta-button";
import type { DrawerDirection, EventCardProps } from "./types";
import type { ReactNode } from "react";

type EventMetaTagProps = {
  icon: ReactNode;
  value: string;
  href?: string;
  className?: string;
};

function EventMetaTag({
  icon,
  value,
  href,
  className = "",
}: EventMetaTagProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-[#FFF4ED] px-2 py-2 text-[12px] text-[#374151] ${className}`}
    >
      {icon}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate text-[#374151] underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}

type EventCardDrawerProps = Pick<
  EventCardProps,
  | "title"
  | "ctaText"
  | "isActive"
  | "category"
  | "image"
  | "date"
  | "time"
  | "isOnline"
  | "eventLocationLink"
  | "eventMode"
  | "eventDetailDescription"
  | "eventTimeline"
  | "onCtaClick"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedDirection: Exclude<DrawerDirection, "auto">;
};

export function EventCardDrawer({
  title,
  ctaText,
  isActive,
  category,
  image,
  date,
  time,
  isOnline,
  eventLocationLink,
  eventMode,
  eventDetailDescription,
  eventTimeline,
  onCtaClick,
  open,
  onOpenChange,
  resolvedDirection,
}: EventCardDrawerProps) {
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
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Event Details
            </Dialog.Title>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded-md border text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <X size={16} />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <img
              src={image}
              alt={title}
              className="block max-h-[350px] w-full rounded-[10px] border border-[#E5E7EB] object-fill"
            />

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-[32px] border border-[#E5E7EB] px-2 py-1 text-[12px] font-[500] leading-[16px] text-[#374151]">
                {category}
              </span>
              <span
                className={`rounded-[32px] px-2 py-1 text-[12px] font-[500] leading-[16px] ${
                  isActive
                    ? "bg-[#ECFDF3] text-[#027A48]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <h3 className="mt-4 text-[20px] font-[600] leading-[30px] text-[#111928]">
              {title}
            </h3>

            {isOnline ? (
              <div className="mt-4 flex items-stretch justify-between gap-2">
                <EventMetaTag
                  icon={<CalendarDots size={14} color="#EF8833" />}
                  value={date}
                />
                <EventMetaTag
                  icon={<ClockAfternoon size={14} color="#EF8833" />}
                  value={time}
                />
                <EventMetaTag
                  icon={<GlobeHemisphereWest size={14} color="#EF8833" />}
                  value={eventMode}
                />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-stretch justify-between gap-2">
                  <EventMetaTag
                    icon={<CalendarDots size={14} color="#EF8833" />}
                    value={date}
                  />
                  <EventMetaTag
                    icon={<ClockAfternoon size={14} color="#EF8833" />}
                    value={time}
                  />
                </div>
                <EventMetaTag
                  icon={<MapPin size={14} color="#EF8833" />}
                  value="View On Maps"
                  href={eventLocationLink}
                  className="w-full flex-none"
                />
              </div>
            )}

            <p className="mt-4 text-[14px] leading-[22px] text-[#374151]">
              {eventDetailDescription}
            </p>

            <div className="mt-6">
              <h4 className="text-[14px] font-[600] leading-[20px] text-[#111928]">
                Event timeline
              </h4>
              <div className="mt-3 space-y-4">
                {eventTimeline.map((item, index) => (
                  <div key={`${item.time}-${index}`} className="relative pl-6">
                    {index < eventTimeline.length - 1 ? (
                      <span className="absolute left-[7px] top-4 h-[calc(100%+12px)] w-px bg-[#D1D5DB]" />
                    ) : null}
                    <span className="absolute left-1 top-1.5 size-[8px] rounded-full bg-[#EF8833]" />
                    <p className="text-[12px] font-[600] leading-[16px] text-[#111928]">
                      {item.time}
                    </p>
                    <p className="mt-1 text-[14px] leading-[20px] text-[#374151]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t p-4">
            <CardCtaButton text={ctaText} onClick={onCtaClick} fullWidth />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
