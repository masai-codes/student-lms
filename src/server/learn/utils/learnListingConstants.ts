/** Learn listing page size — matches legacy LMS UI (`ROW_PER_PAGE = 15`). */
export const LEARN_LISTING_PAGE_SIZE = 15

/** Hard cap so a crafted `pageSize` query param cannot request unbounded rows. */
export const LEARN_LISTING_MAX_PAGE_SIZE = 50

/** IST is UTC+5:30; legacy windows/cutoffs are expressed via this offset. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/**
 * Lecture types surfaced by default (legacy `experience-api` lectures query). A user
 * type filter overrides this list; resources are `reading` only.
 */
export const DEFAULT_LECTURE_TYPES = [
  'live',
  'recorded',
  'scrum',
  'video',
  'interactive-video',
] as const

/** Legacy content gate: lectures whose live window ended within this many hours stay visible. */
export const LECTURE_RECENT_CONCLUDE_MS = 48 * 60 * 60 * 1000
