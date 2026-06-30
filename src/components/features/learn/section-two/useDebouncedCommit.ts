import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Local "draft" for a value that is debounced before being committed (e.g. to the
 * URL, which then triggers a fetch). The returned value updates instantly so the
 * UI (search text, checkbox ticks) stays responsive, while `commit` fires once
 * after `delayMs` of inactivity. Re-syncs when `committed` changes externally
 * (tab switch, clear filters, back/forward) — compared by value, not reference,
 * so array inputs don't reset on every render.
 */
export function useDebouncedCommit<T>(
  committed: T,
  commit: (value: T) => void,
  delayMs: number,
): [T, (value: T) => void] {
  const [local, setLocal] = useState(committed)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const committedKey = JSON.stringify(committed)

  useEffect(() => {
    // Re-sync only when `committed` changes by value (`committedKey`), so a new
    // array reference with the same contents does not clobber a local edit.
    setLocal(committed)
  }, [committedKey])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const set = useCallback(
    (value: T) => {
      setLocal(value)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => commit(value), delayMs)
    },
    [commit, delayMs],
  )

  return [local, set]
}
