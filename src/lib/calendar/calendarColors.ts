import type { CalendarEventType } from '@/server/api/calendar/calendarTypes'

/**
 * Stable per-type visual identity — the old LMS alternated two pastels by
 * array index, so color carried no meaning. One semantic-token family per
 * type (re-themes automatically), shared by chips, blocks, and the legend.
 */
export interface CalendarTypeStyle {
  type: CalendarEventType
  label: string
  /** Filled chip/block: `bg-*-subtle` + its paired foreground + a tinted border. */
  chipClass: string
  /** Solid legend/detail dot. */
  dotClass: string
  /** Type badge in the details modal. */
  badgeClass: string
}

export const CALENDAR_TYPE_STYLES: Array<CalendarTypeStyle> = [
  {
    type: 'lecture',
    label: 'Lecture',
    chipClass:
      'bg-brand-subtle text-brand-subtle-foreground border-brand/40 hover:border-brand/70',
    dotClass: 'bg-brand',
    badgeClass: 'bg-brand-subtle text-brand-subtle-foreground',
  },
  {
    type: 'assignment',
    label: 'Assignment',
    chipClass:
      'bg-warning-subtle text-warning-subtle-foreground border-warning/40 hover:border-warning/70',
    dotClass: 'bg-warning',
    badgeClass: 'bg-warning-subtle text-warning-subtle-foreground',
  },
  {
    type: 'quiz',
    label: 'Quiz',
    chipClass:
      'bg-success-subtle text-success-subtle-foreground border-success/40 hover:border-success/70',
    dotClass: 'bg-success',
    badgeClass: 'bg-success-subtle text-success-subtle-foreground',
  },
]

const BY_TYPE = new Map(CALENDAR_TYPE_STYLES.map((s) => [s.type, s]))

export function calendarTypeStyle(type: CalendarEventType): CalendarTypeStyle {
  // Every DTO type has an entry; the fallback only guards future enum growth.
  return BY_TYPE.get(type) ?? CALENDAR_TYPE_STYLES[0]
}
