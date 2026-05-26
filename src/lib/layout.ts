/**
 * Main content column (legacy LMS: `max-w-[1440px]`, `px-4` / `md:px-6`, `md:pt-24`).
 */
export const LAYOUT_MAX_WIDTH_CLASS = "max-w-[1440px]"

export const LAYOUT_MAIN_PADDING_X = "px-1 md:px-1"

export const LAYOUT_MAIN_PADDING_Y = "py-6 md:pt-[24px]"

export const layoutMainClasses = `mx-auto w-full flex-1 min-h-0 ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X} ${LAYOUT_MAIN_PADDING_Y}`

/** Lecture detail route shell: flush under navbar, full viewport width for video. */
export const lectureDetailRouteClasses = 'w-full -mt-6 md:-mt-[24px]'

/** Centered column for title, tabs, and discussions below full-bleed video. */
export const lectureDetailContentClasses = `mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} px-4 md:px-6`

export const LAYOUT_NAVBAR_OUTER_CLASSES = "w-full"

export const LAYOUT_NAVBAR_INNER_CLASSES =
  "mx-auto flex w-full max-w-[1440px] flex-row items-center"
