/**
 * Main content column (legacy LMS: `max-w-[1440px]`, `px-4` / `md:px-6`, `md:pt-24`).
 */
export const LAYOUT_MAX_WIDTH_CLASS = 'max-w-[1440px]'

// Comfortable gutters on phones/tablets so cards never touch the viewport edge
// (matches the legacy LMS column padding).
export const LAYOUT_MAIN_PADDING_X = 'px-4 md:px-6'

export const LAYOUT_MAIN_PADDING_Y = 'py-6 md:pt-[24px]'

export const layoutMainClasses = `mx-auto w-full flex-1 min-h-0 ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X} ${LAYOUT_MAIN_PADDING_Y}`

/**
 * Lecture detail route shell: flush under navbar, full viewport width for video.
 * At `lg` it joins the flex chain (shell → `<main>` → here) so the split row
 * below can fill exactly the viewport height left by the navbar with CSS alone —
 * no measured height that can drift and leave the document taller than the
 * viewport. Below `lg` the page keeps natural window scrolling.
 */
export const lectureDetailRouteClasses =
  'w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col'

/**
 * The app shell: `min-h-dvh` so short pages still fill the screen, and window
 * scrolling for everything that grows past it.
 *
 * A page whose columns own their own scrolling (the lecture split layout) needs
 * the opposite — a *definite* viewport height, since `min-h-dvh` lets a `flex-1`
 * `<main>` keep growing to its content. That case is handled by the viewport lock
 * in `styles.css`, which keys off `data-app-shell` here plus
 * `data-viewport-locked` on `<html>`; see `useViewportScrollLock`.
 */
export const LAYOUT_APP_SHELL_CLASSES =
  'min-h-dvh bg-surface-muted flex flex-col'

/**
 * `<main>` shell for the lecture detail route: full viewport width, no
 * `max-w` cap, no gutters, flush under the navbar. This lets the hero (video /
 * state panels) span edge-to-edge like the recording video; the below-video
 * header + footer re-introduce their own centered column via
 * `lectureDetailContentClasses`.
 */
export const lectureDetailMainClasses = 'flex w-full flex-1 min-h-0 flex-col'

/**
 * Content column for title, tabs, and discussions below the full-bleed video.
 * True full width — no `max-w` cap, so it spans the whole viewport (only a
 * small edge gutter so content doesn't touch the screen edge).
 */
export const lectureDetailContentClasses = 'w-full px-4 md:px-6'
/**
 * Full-viewport-width main content column (no `max-w` cap, no centering).
 * Used by Masaiverse pages, which span the full viewport width AND fill the
 * remaining viewport height. It is a flex column so the section shell
 * (sidebar + content) stretches to the bottom even when content is short.
 * No vertical padding here: the shell sits flush under the navbar and the
 * children own their internal spacing.
 */
export const layoutMainClassesFullWidth =
  'flex w-full flex-1 min-h-0 flex-col px-1 md:px-1'

/**
 * Inner wrapper for detail routes rendered inside the already-padded
 * `<main>` (which applies `layoutMainClasses`): vertical rhythm only, so the
 * horizontal gutter isn't doubled.
 */
export const detailRouteInnerClasses = `w-full ${LAYOUT_MAIN_PADDING_Y}`

export const LAYOUT_NAVBAR_OUTER_CLASSES = 'w-full'

export const LAYOUT_NAVBAR_INNER_CLASSES =
  'mx-auto flex w-full max-w-[1440px] flex-row items-center'
