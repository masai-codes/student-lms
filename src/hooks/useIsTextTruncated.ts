import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/**
 * Tells you whether an element's single-line text is actually cut off by
 * `truncate`, so callers can reveal the full string on hover *only* when it is
 * hidden — an always-on tooltip on a label that already fits reads as noise.
 *
 * Measurement is width-driven, never a character cap: the same label shows in
 * full in a wide container and ellipsizes in a narrow one.
 *
 * Both the element and its parent are observed. A `truncate` label's own box
 * often stops changing size once it is clipped, so the container is what
 * reports the shrink that flips the answer back to `false`.
 */
export function useIsTextTruncated<T extends HTMLElement>(
  /** Re-measures whenever this changes; pass the text being rendered. */
  text?: string,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) {
      return
    }
    // +1 absorbs the sub-pixel rounding browsers apply to text metrics.
    setIsTruncated(el.scrollWidth > el.clientWidth + 1)
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [measure, text])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.parentElement) {
      observer.observe(el.parentElement)
    }
    return () => observer.disconnect()
  }, [measure, text])

  return [ref, isTruncated]
}
