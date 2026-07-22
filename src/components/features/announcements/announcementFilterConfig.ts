import type { MasaiDropdownCheckboxFilterOption } from '@/components/ui/masai-dropdown-checkbox-filter'

/**
 * Announcement TYPE filter options. Matches the old LMS student filter, which
 * intentionally surfaces only `critical` and `info` (other stored types such as
 * `warning`/`success` are admin-side and not offered to students).
 */
export const ANNOUNCEMENT_TYPE_OPTIONS: Array<MasaiDropdownCheckboxFilterOption> =
  [
    { value: 'critical', label: 'Critical' },
    { value: 'info', label: 'Information' },
  ]

/**
 * Coerce a raw search-param value (string, array, or absent) into a deduped
 * list of non-empty strings, or `undefined` when nothing is selected. Used by
 * the route's `validateSearch` so the URL stays canonical.
 */
export function normalizeFilterValues(raw: unknown): Array<string> | undefined {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.length > 0
      ? [raw]
      : []
  const cleaned = [
    ...new Set(
      list.filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0,
      ),
    ),
  ]
  return cleaned.length > 0 ? cleaned : undefined
}
