"use client";

import { Calendar } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const fieldShellClassName =
  "relative flex min-h-[40px] min-w-0 w-full items-center rounded-[8px] border border-gray-200 bg-white px-3 text-gray-900 outline-none transition-[color,border-color,box-shadow] focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-background";

function calendarIndicatorClearClasses() {
  return cn(
    "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
  );
}

export type MasaiDateSelectionProps = Omit<
  React.ComponentProps<"input">,
  "type" | "className"
> & {
  /** Optional label above the control (e.g. “Start Date”). */
  label?: string;
  /** Wrapper layout classes (column: label + field). */
  className?: string;
  shellClassName?: string;
  inputClassName?: string;
};

/**
 * MasaiDateSelection — native `type="date"` in a Masai-styled shell with optional label
 * and calendar icon. Value is ISO `yyyy-mm-dd` in HTML/React.
 *
 * Single variation for now; add sizes/variants later as needed.
 */
export function MasaiDateSelection({
  label,
  id: idProp,
  className,
  shellClassName,
  inputClassName,
  disabled,
  placeholder = "dd/mm/yyyy",
  ...inputProps
}: MasaiDateSelectionProps) {
  const generatedId = React.useId();
  const controlId = idProp ?? generatedId;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={controlId} className="type-b2-regular text-gray-600">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          fieldShellClassName,
          disabled && "pointer-events-none opacity-50",
          shellClassName,
        )}
      >
        <input
          {...inputProps}
          id={controlId}
          type="date"
          disabled={disabled}
          placeholder={placeholder}
          data-slot="masai-date-selection-control"
          className={cn(
            calendarIndicatorClearClasses(),
            "relative z-0 min-h-0 min-w-0 flex-1 bg-transparent py-2 pr-10 text-[15px] text-gray-900 outline-none [-webkit-appearance:none] [&::-webkit-datetime-edit]:py-0.5 [&::-webkit-datetime-edit-fields-wrapper]:p-0",
            "caret-primary-600 focus-visible:ring-0 disabled:cursor-not-allowed",
            "[color-scheme:light]",
            inputClassName,
          )}
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 z-10 inline-flex -translate-y-1/2 text-gray-800"
          aria-hidden
        >
          <Calendar className="size-[18px]" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
