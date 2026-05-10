"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Matches `MasaiCheckbox` / `masai-checkbox.tsx` regular size (18px root, h-3 check). */
const CHECKBOX_VISUAL_CLASSES = {
  root: "h-[18px] w-[18px] rounded-[2px]",
  icon: "h-3 w-3",
} as const;

/** One selectable row inside the dropdown. */
export type MasaiDropdownCheckboxFilterOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type MasaiDropdownCheckboxFilterProps = {
  options: MasaiDropdownCheckboxFilterOption[];
  /** Controlled selection — pass from parent state. */
  value: string[];
  /** Called when the user toggles any option (full next array). */
  onValueChange: (values: string[]) => void;
  /** Label on the default trigger (ignored when `children` is set). */
  triggerLabel?: string;
  /** Custom trigger; must be a single element (`asChild`). */
  children?: React.ReactElement;
  disabled?: boolean;
  /** Root wrapper classes (layout, width). */
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  contentAlign?: "start" | "center" | "end";
  sideOffset?: number;
};

const contentClassName =
  "z-[220] max-h-[min(320px,var(--radix-dropdown-menu-content-available-height))] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-md";

const checkboxItemClassName = cn(
  "relative flex cursor-pointer select-none items-center rounded-[2px] py-2 pl-9 pr-3 type-b2-regular text-gray-900 outline-none transition-colors",
  "data-highlighted:bg-gray-50",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
);

function toggleSelected(values: string[], optionValue: string, checked: boolean) {
  if (checked) {
    return Array.from(new Set([...values, optionValue]));
  }
  return values.filter((v) => v !== optionValue);
}

/**
 * MasaiDropdownCheckboxFilter — Radix DropdownMenu with multi-select checkbox rows.
 * Selection is controlled — parent owns `value` and updates from `onValueChange`.
 */
export function MasaiDropdownCheckboxFilter({
  options,
  value,
  onValueChange,
  triggerLabel = "Filter",
  children,
  disabled = false,
  className,
  triggerClassName,
  contentClassName: contentClassNameProp,
  contentAlign = "start",
  sideOffset = 6,
}: MasaiDropdownCheckboxFilterProps) {
  return (
    <div className={cn("inline-flex", className)}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          {children ? (
            children
          ) : (
            <button
              type="button"
              className={cn(
                "inline-flex h-10 min-w-[140px] max-w-full shrink-0 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 type-b2-md text-gray-900 outline-none transition-colors",
                "hover:border-gray-300 hover:bg-gray-50",
                "focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "data-disabled:pointer-events-none data-disabled:opacity-50 data-[state=open]:border-primary-500 data-[state=open]:ring-2 data-[state=open]:ring-primary-400 data-[state=open]:ring-offset-2 data-[state=open]:ring-offset-background",
                triggerClassName,
              )}
            >
              <span className="truncate">{triggerLabel}</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                {value.length > 0 ? (
                  <span
                    className="rounded-full bg-primary-50 px-2 py-0.5 type-caption font-medium text-primary-600"
                    aria-hidden
                  >
                    {value.length}
                  </span>
                ) : null}
                <ChevronDown className="size-4 text-gray-600" aria-hidden />
              </span>
            </button>
          )}
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(contentClassName, contentClassNameProp)}
            align={contentAlign}
            sideOffset={sideOffset}
            collisionPadding={12}
          >
            <DropdownMenu.Group>
              {options.map((option) => {
                const isChecked = value.includes(option.value);
                return (
                  <DropdownMenu.CheckboxItem
                    key={option.value}
                    className={checkboxItemClassName}
                    checked={isChecked}
                    disabled={option.disabled}
                    onCheckedChange={(checked) =>
                      onValueChange(toggleSelected(value, option.value, checked === true))
                    }
                    onSelect={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute left-2 flex shrink-0 items-center justify-center border border-gray-500 bg-white text-white transition-colors",
                        CHECKBOX_VISUAL_CLASSES.root,
                        isChecked && "border-gray-500 bg-primary-500",
                        option.disabled && isChecked && "bg-primary-300",
                      )}
                      aria-hidden
                    >
                      {isChecked ? (
                        <Check className={CHECKBOX_VISUAL_CLASSES.icon} aria-hidden />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </DropdownMenu.CheckboxItem>
                );
              })}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
