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
  /** Currently selected day (YYYY-MM-DD), highlighted; null when none. */
  selectedDateKey?: string | null
  /** Called with a day's key when it is clicked, so the panel can list its events. */
  onSelectDate?: (dateKey: string) => void
}

/**
 * Month calendar. Today is highlighted and event days show a dot; clicking a
 * day selects it (so the panel can list that day's events). Months can be
 * browsed with the arrows.
 */
export default function ReadOnlyCalendar({
  eventDateKeys,
  selectedDateKey,
  onSelectDate,
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
          cell.day === null || cell.dateKey === null ? (
            <span key={cell.key} />
          ) : (
            <DayCell
              key={cell.key}
              day={cell.day}
              dateKey={cell.dateKey}
              isToday={cell.dateKey === todayKey}
              isSelected={cell.dateKey === selectedDateKey}
              hasEvents={eventDateKeys.has(cell.dateKey)}
              onSelectDate={onSelectDate}
            />
          ),
        )}
      </div>
    </div>
  )
}

type DayCellProps = {
  day: number
  dateKey: string
  isToday: boolean
  isSelected: boolean
  hasEvents: boolean
  onSelectDate?: (dateKey: string) => void
}

function DayCell({
  day,
  dateKey,
  isToday,
  isSelected,
  hasEvents,
  onSelectDate,
}: DayCellProps) {
  const label = `${day}${hasEvents ? ', has events' : ''}`
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      onClick={() => onSelectDate?.(dateKey)}
      className="flex flex-col items-center rounded-[8px] py-0.5 hover:bg-white/15"
    >
      <span
        className={`flex size-7 items-center justify-center rounded-full text-[13px] ${
          isToday
            ? 'bg-white font-bold text-masaiverse-orange'
            : isSelected
              ? 'font-bold text-white ring-1 ring-white'
              : 'text-white'
        }`}
      >
        {day}
      </span>
      <span
        className={`mt-0.5 size-1 rounded-full ${
          hasEvents ? 'bg-white' : 'bg-transparent'
        }`}
      />
    </button>
  )
}
