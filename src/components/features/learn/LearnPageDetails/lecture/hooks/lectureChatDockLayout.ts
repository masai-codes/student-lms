/** Dock only after the user scrolls the inline anchor above the viewport (not when it is below the fold). */
export function shouldDockLectureChatAnchor(
  rect: Pick<DOMRectReadOnly, 'bottom'>,
): boolean {
  return rect.bottom <= 0
}
