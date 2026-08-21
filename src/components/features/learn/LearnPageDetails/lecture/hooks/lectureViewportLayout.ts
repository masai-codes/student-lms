export const MIN_LECTURE_HERO_HEIGHT_PX = 180

export type LectureHeroHeightInput = {
  viewportHeight: number
  rootTop: number
  mobileTabBarHeightPx: number
  reservedChromePx: number
  minHeroHeightPx?: number
}

/** Video height so title, chat, and tab rows stay in the first viewport slice. */
export function computeLectureHeroHeightPx({
  viewportHeight,
  rootTop,
  mobileTabBarHeightPx,
  reservedChromePx,
  minHeroHeightPx = MIN_LECTURE_HERO_HEIGHT_PX,
}: LectureHeroHeightInput): number {
  const available =
    viewportHeight - rootTop - mobileTabBarHeightPx - reservedChromePx
  return Math.max(Math.floor(available), minHeroHeightPx)
}

export function sumElementOffsetHeights(
  elements: Iterable<HTMLElement>,
): number {
  let total = 0
  for (const element of elements) {
    total += element.offsetHeight
  }
  return total
}

/**
 * Viewport offset of the hero top that stays constant while scrolling (unlike
 * `getBoundingClientRect().top`, which goes negative and inflates hero height).
 */
export function getStableHeroRootTopPx(
  root: Pick<HTMLElement, 'getBoundingClientRect'>,
  scrollY: number,
): number {
  return root.getBoundingClientRect().top + scrollY
}
