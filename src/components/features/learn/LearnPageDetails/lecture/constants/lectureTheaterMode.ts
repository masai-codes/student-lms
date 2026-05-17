/** Default on load: theater = full-width video (YouTube-style). */
export const DEFAULT_LECTURE_THEATER_MODE = true

/** Split layout (non-theater): video column width (% of hero row). */
export const LECTURE_SPLIT_VIDEO_WIDTH_PERCENT = 75

/** Split layout (non-theater): chat sidebar width (% of hero row). */
export const LECTURE_SPLIT_CHAT_WIDTH_PERCENT = 25

/** Open AI chat panel by default when split layout (non-theater) is active. */
export const LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT = true

/** @deprecated Use LECTURE_SPLIT_VIDEO_WIDTH_PERCENT */
export const LECTURE_THEATER_VIDEO_WIDTH_PERCENT = LECTURE_SPLIT_VIDEO_WIDTH_PERCENT

/** @deprecated Use LECTURE_SPLIT_CHAT_WIDTH_PERCENT */
export const LECTURE_THEATER_CHAT_WIDTH_PERCENT = LECTURE_SPLIT_CHAT_WIDTH_PERCENT

/** @deprecated Use LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT */
export const LECTURE_THEATER_CHAT_OPEN_BY_DEFAULT = LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT
