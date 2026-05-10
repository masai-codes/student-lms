"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type MasaiChipsType = "default" | "left-icon" | "right-icon" | "icon-only";
type MasaiChipsSize = "regular" | "large";

/** Default Masai LMS chip styling (blue field + blue text). */
const chipBrandPaletteClassName =
  "bg-blue-50 !text-blue-500 focus-visible:ring-blue-300 hover:bg-blue-100 active:bg-blue-200 disabled:border-gray-200 disabled:bg-gray-100 disabled:!text-gray-400";

/** Focus + disabled defaults when skipping the Masai blue palette. */
const chipCustomPaletteBaseClassName =
  "focus-visible:ring-gray-400 disabled:border-gray-200 disabled:bg-gray-100 disabled:!text-gray-400";

const masaiChipsVariants = cva(
  "inline-flex items-center justify-center rounded-[100px] border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
  {
    variants: {
      size: {
        regular: "px-2 py-1 gap-1.5 type-b3-md",
        large: "px-3 py-2 gap-2 type-b2-md",
      },
      type: {
        default: "",
        "left-icon": "",
        "right-icon": "",
        "icon-only": "",
      },
    },
    compoundVariants: [
      { size: "regular", type: "icon-only", className: "p-1" },
      { size: "large", type: "icon-only", className: "p-2" },
    ],
    defaultVariants: {
      size: "regular",
      type: "default",
    },
  },
);

export type MasaiChipsProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
  VariantProps<typeof masaiChipsVariants> & {
    type?: MasaiChipsType;
    size?: MasaiChipsSize;
    label?: string;
    icon?: React.ReactNode;
    htmlType?: "button" | "submit" | "reset";
    /** Chip surface (`bg-*`, borders, `hover:bg-*`, `active:bg-*`, etc.). Drops default blue palette when non-empty unless `forceBrandPalette` is true. */
    backgroundClassName?: string;
    /** Label/icon text color (`text-*`; use `!text-*` if a token overrides). Drops default blue palette when non-empty unless `forceBrandPalette` is true. */
    textClassName?: string;
    /**
     * If true, the Masai blue palette is merged in addition to `backgroundClassName` / `textClassName`;
     * `className` is applied last via `tailwind-merge` for final wins.
     */
    forceBrandPalette?: boolean;
  };

export function MasaiChips({
  className,
  type = "default",
  size = "regular",
  label = "Chip",
  icon,
  htmlType = "button",
  backgroundClassName,
  textClassName,
  forceBrandPalette = false,
  ...props
}: MasaiChipsProps) {
  if ((type === "left-icon" || type === "right-icon" || type === "icon-only") && !icon) {
    console.warn("[MasaiChips] Icon variant selected without passing `icon`.");
  }

  const usesCustomPalette =
    !forceBrandPalette && !!(backgroundClassName?.trim() || textClassName?.trim());

  return (
    <button
      type={htmlType}
      className={cn(
        masaiChipsVariants({ size, type }),
        !usesCustomPalette ? chipBrandPaletteClassName : chipCustomPaletteBaseClassName,
        backgroundClassName,
        textClassName,
        className,
      )}
      {...props}
    >
      {type === "left-icon" ? <span className="shrink-0">{icon}</span> : null}
      {type !== "icon-only" ? label : null}
      {type === "right-icon" ? <span className="shrink-0">{icon}</span> : null}
      {type === "icon-only" ? (
        <span className="size-4 shrink-0 [&_svg]:size-4">{icon}</span>
      ) : null}
    </button>
  );
}
