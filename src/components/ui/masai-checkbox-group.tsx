"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MasaiCheckbox } from "@/components/ui/masai-checkbox";

type MasaiCheckboxGroupSize = "regular" | "large";

export type MasaiCheckboxOption = {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export type MasaiCheckboxGroupOrientation = "vertical" | "horizontal";

export type MasaiCheckboxGroupProps = {
  size?: MasaiCheckboxGroupSize;
  values: string[];
  onValueChange: (values: string[]) => void;
  options: MasaiCheckboxOption[];
  /** Default stacking; overridden by `className` when using `grid`/other display (tailwind-merge). */
  orientation?: MasaiCheckboxGroupOrientation;
} & Omit<React.ComponentPropsWithoutRef<"div">, "children">;

const orientationLayoutClasses: Record<MasaiCheckboxGroupOrientation, string> = {
  vertical: "flex flex-col gap-3",
  horizontal: "flex flex-row flex-wrap items-start gap-x-6 gap-y-3",
};

export function MasaiCheckboxGroup({
  size = "regular",
  values,
  onValueChange,
  options,
  orientation = "vertical",
  className,
  ...divProps
}: MasaiCheckboxGroupProps) {
  return (
    <div className={cn(orientationLayoutClasses[orientation], className)} {...divProps}>
      {options.map((option) => {
        const checked = values.includes(option.value);
        return (
          <MasaiCheckbox
            key={option.value}
            size={size}
            isSelected={checked}
            disabled={option.disabled}
            label={option.label ?? option.value}
            description={option.description}
            onSelect={(shouldCheck) => {
              if (shouldCheck) {
                onValueChange(Array.from(new Set([...values, option.value])));
              } else {
                onValueChange(values.filter((v) => v !== option.value));
              }
            }}
          />
        );
      })}
    </div>
  );
}
