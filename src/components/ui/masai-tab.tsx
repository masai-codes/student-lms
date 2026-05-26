"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tabVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-lg border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        regular: "h-10 px-3 gap-2 type-b2-md [&_svg]:size-4",
        large: "h-12 px-4 gap-2 type-b1-md [&_svg]:size-5",
      },
      selected: {
        true: "bg-primary-50 border-primary-500 !text-primary-600 hover:bg-primary-100",
        false:
          "bg-white border-gray-200 !text-gray-700 hover:bg-gray-50 hover:border-gray-300",
      },
    },
    defaultVariants: {
      size: "regular",
      selected: false,
    },
  },
);

export type MasaiTabSize = "regular" | "large";

export type MasaiTabProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> &
  VariantProps<typeof tabVariants> & {
    /** Tab label text. */
    label: string;
    /** Whether this tab is the active/selected one. */
    selected?: boolean;
    /** Icon rendered to the left of the label. */
    iconLeft?: React.ReactNode;
    /** Icon rendered to the right of the label. */
    iconRight?: React.ReactNode;
    /** Visual size token. Default: regular. */
    size?: MasaiTabSize;
    /** Native button type attribute. */
    htmlType?: "button" | "submit" | "reset";
  };

/**
 * MasaiTab — single outlined tab item with default/selected states and
 * optional left/right icons. Composes inside any layout (row, grid, etc.).
 */
export function MasaiTab({
  label,
  selected = false,
  iconLeft,
  iconRight,
  size = "regular",
  htmlType = "button",
  className,
  disabled,
  ...props
}: MasaiTabProps) {
  return (
    <button
      type={htmlType}
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      className={cn(tabVariants({ size, selected }), className)}
      {...props}
    >
      {iconLeft ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden>
          {iconLeft}
        </span>
      ) : null}
      <span className="truncate">{label}</span>
      {iconRight ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden>
          {iconRight}
        </span>
      ) : null}
    </button>
  );
}
