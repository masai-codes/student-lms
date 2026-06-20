import { useEffect, useRef } from 'react'

/**
 * Returns a ref to attach to a focusable element (input, etc.). The element is
 * focused on mount and again whenever any value in `deps` changes — e.g. when an
 * auth step switches between password and OTP modes, where React reuses the same
 * DOM node so the native `autoFocus` attribute would not re-fire.
 */
export function useAutoFocus<T extends HTMLElement = HTMLInputElement>(
  deps: ReadonlyArray<unknown> = [],
) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
