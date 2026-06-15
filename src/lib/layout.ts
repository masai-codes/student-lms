/**
 * Main content column (legacy LMS: `max-w-[1440px]`, `px-4` / `md:px-6`, `md:pt-24`).
 */
export const LAYOUT_MAX_WIDTH_CLASS = "max-w-[1440px]"

export const LAYOUT_MAIN_PADDING_X = "px-1 md:px-1"

export const LAYOUT_MAIN_PADDING_Y = "py-6 md:pt-[24px]"

export const layoutMainClasses = `mx-auto w-full flex-1 min-h-0 ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X} ${LAYOUT_MAIN_PADDING_Y}`

/**
 * Full-viewport-width main content column (no `max-w` cap, no centering).
 * Used by Masaiverse pages, which span the full viewport width AND fill the
 * remaining viewport height. It is a flex column so the section shell
 * (sidebar + content) stretches to the bottom even when content is short.
 * No vertical padding here: the shell sits flush under the navbar and the
 * children own their internal spacing.
 */
export const layoutMainClassesFullWidth = `flex w-full flex-1 min-h-0 flex-col ${LAYOUT_MAIN_PADDING_X}`

/** Lecture-detail route shell: pulls the content up under the navbar. */
export const lectureDetailRouteClasses = 'w-full -mt-6 md:-mt-[24px]'

/** Lecture-detail content column (centered, capped width). */
export const lectureDetailContentClasses = `mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} px-4 md:px-6`

export const LAYOUT_NAVBAR_OUTER_CLASSES = "w-full"

export const LAYOUT_NAVBAR_INNER_CLASSES =
  "mx-auto flex w-full max-w-[1440px] flex-row items-center"
