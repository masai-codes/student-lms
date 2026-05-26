"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const rootVariants = cva(
  "flex min-h-0 w-full min-w-0 items-center rounded-xl border border-gray-200 bg-white text-gray-900 outline-none transition-[color,border-color,box-shadow] focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-background",
  {
    variants: {
      size: {
        regular:
          // "h-10 gap-2 px-3 type-b2-md [&_.masai-input__icon-slot_svg]:size-[18px]",
          "min-h-[44px] py-[10px] px-[12px] rounded-[8px] border border-gray-200 bg-white text-gray-900 outline-none transition-[color,border-color,box-shadow] focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-background",
      },
      // Future: small, large, etc.
    },
    defaultVariants: {
      size: "regular",
    },
  },
);

export type MasaiInputSize = "regular";

export type MasaiInputProps = Omit<
  React.ComponentProps<"input">,
  "size" | "className"
> &
  VariantProps<typeof rootVariants> & {
    /** Visual size token. Only `regular` is supported today. */
    size?: MasaiInputSize;
    /** Icon rendered to the left of the field. */
    iconLeft?: React.ReactNode;
    /** Icon rendered to the right of the field. */
    iconRight?: React.ReactNode;
    /** Classes applied to the outer shell (layout, width). */
    className?: string;
    /** Classes merged onto the native `input`. */
    inputClassName?: string;
  };

/**
 * MasaiInput — bordered text field with optional left/right adornments,
 * Masai typography, and focus ring on the wrapper.
 */
export function MasaiInput({
  iconLeft,
  iconRight,
  size = "regular",
  className,
  inputClassName,
  disabled,
  ...inputProps
}: MasaiInputProps) {
  return (
    <div
      className={cn(
        rootVariants({ size }),
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {iconLeft ? (
        <span
          className="mr-[8px] masai-input__icon-slot inline-flex shrink-0 items-center text-gray-600"
          aria-hidden
        >
          {iconLeft}
        </span>
      ) : null}
      <input
        {...inputProps}
        disabled={disabled}
        data-slot="masai-input-control"
        className={cn(
          "masai-input-control min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit caret-primary-600 outline-none placeholder:text-gray-400 focus-visible:ring-0 disabled:cursor-not-allowed",
          inputClassName,
        )}
      />
      {iconRight ? (
        <span
          className="ml-[8px] masai-input__icon-slot inline-flex shrink-0 items-center text-gray-600"
          aria-hidden
        >
          {iconRight}
        </span>
      ) : null}
    </div>
  );
}
