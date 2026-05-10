"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type MasaiCheckboxSize = "regular" | "large";

export type MasaiCheckboxProps = {
  size?: MasaiCheckboxSize;
  isSelected?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  onSelect?: (selected: boolean) => void;
  className?: string;
};

const checkboxSizeClasses: Record<MasaiCheckboxSize, { root: string; icon: string }> = {
  regular: { root: "h-[18px] w-[18px] rounded-[2px]", icon: "h-3 w-3" },
  large: { root: "h-[18px] w-[18px] rounded-[2px]", icon: "h-3.5 w-3.5" },
};

export function MasaiCheckbox({
  size = "regular",
  isSelected = false,
  disabled = false,
  label,
  description,
  onSelect,
  className,
}: MasaiCheckboxProps) {
  const { root, icon } = checkboxSizeClasses[size];
  const labelClassName = size === "large" ? "type-b1-regular text-gray-900" : "type-b2-regular text-gray-900";

  return (
    <label
      className={cn(
        "inline-flex items-start gap-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <CheckboxPrimitive.Root
        checked={isSelected}
        onCheckedChange={(next) => onSelect?.(next === true)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center border border-gray-500 bg-white text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 data-[state=checked]:bg-primary-500 data-[state=checked]:border-gray-500 disabled:data-[state=checked]:bg-primary-300",
          root,
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className={icon} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label || description ? (
        <span className="flex flex-col">
          {label ? <span className={labelClassName}>{label}</span> : null}
          {description ? <span className="type-caption text-gray-700">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
