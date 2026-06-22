/** Learn listing page size — matches legacy LMS (`experience-api` `PAGE_SIZE = 25`). */
export const LEARN_LISTING_PAGE_SIZE = 25

/** Hard cap so a crafted `pageSize` query param cannot request unbounded rows. */
export const LEARN_LISTING_MAX_PAGE_SIZE = 50

/**
 * Lookahead window for lecture/resource listings (legacy LMS `tomorrow = now + 24h`).
 * The default ("all") and "upcoming" lecture views never surface sessions scheduled
 * beyond this horizon.
 */
export const LECTURE_LISTING_LOOKAHEAD_MS = 24 * 60 * 60 * 1000

/** IST is UTC+5:30; legacy assignment cutoff is expressed in IST. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
