"use client";

import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const ISO = "YYYY-MM-DD";
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Brand purple used across the learn filters panel. */
const ACCENT = "#6962AC";
const ACCENT_SOFT = "#ECEAF6";

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface MasaiDateRangePickerProps {
  /** ISO `yyyy-mm-dd` or null. */
  startDate: string | null;
  /** ISO `yyyy-mm-dd` or null. */
  endDate: string | null;
  onChange: (range: DateRange) => void;
  className?: string;
}

interface Preset {
  label: string;
  getRange: () => DateRange;
}

const PRESETS: Array<Preset> = [
  {
    label: "This week",
    getRange: () => ({
      start: dayjs().startOf("week").format(ISO),
      end: dayjs().endOf("week").format(ISO),
    }),
  },
  {
    label: "This month",
    getRange: () => ({
      start: dayjs().startOf("month").format(ISO),
      end: dayjs().endOf("month").format(ISO),
    }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({
      start: dayjs().subtract(29, "day").format(ISO),
      end: dayjs().format(ISO),
    }),
  },
];

function parse(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function formatSummary(start: Dayjs | null, end: Dayjs | null): string {
  if (!start && !end) return "Select a start date";
  if (start && !end) return `${start.format("MMM D, YYYY")} — select end date`;
  if (start && end) {
    const sameYear = start.year() === end.year();
    const left = sameYear ? start.format("MMM D") : start.format("MMM D, YYYY");
    return `${left} – ${end.format("MMM D, YYYY")}`;
  }
  return "Select a start date";
}

/**
 * MasaiDateRangePicker — inline, self-contained month calendar for choosing a
 * date range. Values are ISO `yyyy-mm-dd`. Click a day to set the start, click
 * again to set the end (clicking before the start restarts the range). Includes
 * month navigation, hover preview, quick presets, and clear.
 */
export function MasaiDateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
}: MasaiDateRangePickerProps) {
  const start = parse(startDate);
  const end = parse(endDate);

  const [viewMonth, setViewMonth] = React.useState<Dayjs>(() =>
    (start ?? dayjs()).startOf("month"),
  );
  const [hovered, setHovered] = React.useState<Dayjs | null>(null);

  // Follow the selected start into view when it changes from outside (presets/clear).
  React.useEffect(() => {
    if (start) setViewMonth(start.startOf("month"));
  }, [startDate]);

  const handleSelect = (day: Dayjs) => {
    if (!start || (start && end)) {
      onChange({ start: day.format(ISO), end: null });
      return;
    }
    if (day.isBefore(start, "day")) {
      onChange({ start: day.format(ISO), end: null });
      return;
    }
    onChange({ start: start.format(ISO), end: day.format(ISO) });
  };

  const previewEnd =
    end ??
    (start && hovered && !hovered.isBefore(start, "day") ? hovered : null);

  const gridStart = viewMonth.startOf("month").subtract(
    viewMonth.startOf("month").day(),
    "day",
  );
  const days = Array.from({ length: 42 }, (_, index) =>
    gridStart.add(index, "day"),
  );

  return (
    <div className={cn("w-full min-w-0 select-none", className)}>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.getRange())}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            style={{ "--accent": ACCENT } as React.CSSProperties}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth((m) => m.subtract(1, "month"))}
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft className="size-4" strokeWidth={2.25} />
          </button>
          <span className="text-sm font-semibold text-slate-900">
            {viewMonth.format("MMMM YYYY")}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth((m) => m.add(1, "month"))}
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-y-1">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="grid h-8 place-items-center text-[11px] font-medium uppercase tracking-wide text-slate-400"
            >
              {weekday}
            </div>
          ))}

          {days.map((day, index) => {
            const col = index % 7;
            const inMonth = day.month() === viewMonth.month();
            const isStart = start != null && day.isSame(start, "day");
            const isEnd = previewEnd != null && day.isSame(previewEnd, "day");
            const isEndpoint = isStart || isEnd;
            const isInRange =
              start != null &&
              previewEnd != null &&
              day.isAfter(start, "day") &&
              day.isBefore(previewEnd, "day");
            const isToday = day.isSame(dayjs(), "day");
            const hasRange = start != null && previewEnd != null;

            // The soft track sits behind every day in the range. Round it at the
            // range endpoints AND at each week's edge so wrapped rows keep clean
            // rounded caps instead of breaking into square-ended bars.
            const inBand = hasRange && (isInRange || isEndpoint);
            const roundLeft = isStart || col === 0;
            const roundRight = isEnd || col === 6;

            return (
              <div
                key={day.format(ISO)}
                className={cn(
                  "relative grid h-9 place-items-center",
                  inBand && "bg-[color:var(--range)]",
                  inBand && roundLeft && "rounded-l-full",
                  inBand && roundRight && "rounded-r-full",
                )}
                style={{ "--range": ACCENT_SOFT } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(day)}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() =>
                    setHovered((h) => (h && h.isSame(day, "day") ? null : h))
                  }
                  aria-label={day.format("dddd, MMMM D, YYYY")}
                  aria-pressed={isEndpoint}
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-sm transition-colors",
                    inMonth ? "text-slate-700" : "text-slate-300",
                    !isEndpoint && "hover:bg-slate-100",
                    !isEndpoint &&
                      isToday &&
                      "font-semibold text-[color:var(--accent)] ring-1 ring-inset ring-[color:var(--accent)]",
                    isEndpoint &&
                      "bg-[color:var(--accent)] font-semibold text-white hover:bg-[color:var(--accent)]",
                  )}
                  style={{ "--accent": ACCENT } as React.CSSProperties}
                >
                  {day.date()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
          <CalendarDays className="size-4 shrink-0 text-slate-400" strokeWidth={2} />
          <span className="truncate">{formatSummary(start, end)}</span>
        </span>
        {start || end ? (
          <button
            type="button"
            onClick={() => onChange({ start: null, end: null })}
            className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
