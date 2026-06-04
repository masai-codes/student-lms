import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  MONTH_NAMES,
  WEEKDAYS,
  getMonthGrid,
  toDateKey,
} from './calendarUtils'

type ReadOnlyCalendarProps = {
  /** Date keys (YYYY-MM-DD) that have at least one event → shown with a dot. */
  eventDateKeys: Set<string>
}

/**
 * Read-only month calendar. Today is highlighted; event dates show a dot.
 * Months can be browsed with the arrows; no other actions are possible.
 */
export default function ReadOnlyCalendar({
  eventDateKeys,
}: ReadOnlyCalendarProps) {
  const today = new Date()
  const todayKey = toDateKey(today)
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )

  const goToMonth = (delta: number) =>
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1))

  const cells = getMonthGrid(viewDate)

  return (
    <div className="rounded-[16px] p-4" style={{ backgroundColor: 'var(--color-masaiverse-orange)' }}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <p className="text-[15px] font-bold text-white">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday.key}
            className="pb-1 text-[11px] font-semibold text-white/70"
          >
            {weekday.label}
          </span>
        ))}

        {cells.map((cell) =>
          cell.day === null ? (
            <span key={cell.key} />
          ) : (
            <div key={cell.key} className="flex flex-col items-center">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[13px] ${
                  cell.dateKey === todayKey
                    ? 'bg-white font-bold text-masaiverse-orange'
                    : 'text-white'
                }`}
              >
                {cell.day}
              </span>
              <span
                className={`mt-0.5 size-1 rounded-full ${
                  cell.dateKey && eventDateKeys.has(cell.dateKey)
                    ? 'bg-white'
                    : 'bg-transparent'
                }`}
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}
