/**
 * Page width and padding aligned with legacy `experience-ui/apps/student-experience`
 * (`NewLayout/index.tsx` main + `DesktopNavbar` inner row: `md:max-w-[1440px] mx-auto`, `md:px-6` / `px-4`).
 */
export const LAYOUT_MAX_WIDTH_CLASS = "max-w-[1440px]"

/** Horizontal padding for the main scroll region (matches old `px-4` / `md:px-6`). */
export const LAYOUT_MAIN_PADDING_X = "px-4 md:px-6"

/** Vertical padding for main; top uses `md:pt-24` on desktop like old default layout. */
export const LAYOUT_MAIN_PADDING_Y = "py-6 md:pt-24"

/** Classes for `<main>` under the global shell (width + padding). */
export const layoutMainClasses = `mx-auto w-full flex-1 min-h-0 ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X} ${LAYOUT_MAIN_PADDING_Y}`

/** Outer navbar strip: full-bleed background; horizontal gutter matches old `md:px-[24px]`. */
export const LAYOUT_NAVBAR_OUTER_CLASSES = "w-full md:px-6"

/** Inner navbar row: same max width as main content. */
export const LAYOUT_NAVBAR_INNER_CLASSES = `mx-auto flex w-full ${LAYOUT_MAX_WIDTH_CLASS} items-center gap-3`
