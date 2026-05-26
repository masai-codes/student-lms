"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type ButtonKind = "primary" | "secondary" | "tertiary" | "link";
type ButtonSize = "sm" | "md" | "lg";
type IconDirection = "left" | "right";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-30",
  {
    variants: {
      kind: {
        primary: "bg-primary-600 !text-white hover:bg-primary-700",
        secondary:
          "bg-purple-50 !text-[#6962AC] hover:bg-purple-100",
        tertiary: "bg-transparent !text-[#6962AC] hover:bg-purple-50",
        link: "bg-transparent !text-[#6962AC] hover:!text-[#6962AC] underline-offset-4 hover:underline",
      },
      size: {
        sm: "py-2 px-3 type-b2-md gap-1.5 [&_svg]:size-3.5",
        md: "py-2.5 px-4 type-b1-md gap-2 [&_svg]:size-5",
        lg: "py-3 px-5 type-b1-md gap-2 [&_svg]:size-5",
      },
      iconOnly: {
        true: "px-0",
        false: "",
      },
    },
    compoundVariants: [
      { size: "sm", iconOnly: true, className: "h-9 w-9" },
      { size: "md", iconOnly: true, className: "h-11 w-11" },
      { size: "lg", iconOnly: true, className: "h-12 w-12" },
      { kind: "link", size: "sm", className: "h-auto py-0 px-0 type-b2-md" },
      { kind: "link", size: "md", className: "h-auto py-0 px-0 type-b1-md" },
      { kind: "link", size: "lg", className: "h-auto py-0 px-0 type-s3" },
      { kind: "link", iconOnly: true, className: "h-auto w-auto" },
    ],
    defaultVariants: {
      kind: "primary",
      size: "md",
      iconOnly: false,
    },
  },
);

export type MasaiButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> &
  VariantProps<typeof buttonVariants> & {
    /** Visual style in design system terms. */
    type?: ButtonKind;
    /** Sizing token from design system. */
    size?: ButtonSize;
    /** Optional icon element (for example from lucide-react). */
    icon?: React.ReactNode;
    /** Required when icon is present with label. */
    iconDirection?: IconDirection;
    /** Button label. Ignored when iconOnly=true. */
    ctaText?: string;
    /** If true, only icon is shown (ctaText is ignored). */
    iconOnly?: boolean;
    /** Native button type attribute. */
    htmlType?: "button" | "submit" | "reset";
  };

export type ButtonProps = MasaiButtonProps;

/**
 * Masai reusable CTA button.
 * - if iconDirection is provided, icon should also be provided
 * - if iconOnly=true, only icon is rendered and ctaText is ignored
 */
export function MasaiButton({
  className,
  type = "primary",
  size = "md",
  icon,
  iconDirection,
  disabled = false,
  ctaText,
  onClick,
  iconOnly = false,
  htmlType = "button",
  ...props
}: MasaiButtonProps) {
  if (!icon && iconDirection) {
    // Keep this non-throwing to avoid crashing consumers.
    // eslint-disable-next-line no-console
    console.warn(
      "[Button] `iconDirection` was passed without `icon`. The direction will be ignored.",
    );
  }

  const showIcon = Boolean(icon);
  const showText = !iconOnly && Boolean(ctaText);
  const effectiveIconDirection: IconDirection = iconDirection ?? "left";

  return (
    <button
      type={htmlType}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        buttonVariants({ kind: type, size, iconOnly: Boolean(iconOnly) }),
        className,
      )}
      {...props}
    >
      {showIcon && effectiveIconDirection === "left" ? icon : null}
      {showText ? ctaText : null}
      {showIcon && effectiveIconDirection === "right" ? icon : null}
    </button>
  );
}

// Backward-compatible alias for existing imports.
export const Button = MasaiButton;
