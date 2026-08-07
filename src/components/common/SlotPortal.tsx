'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Portals `children` into a DOM node elsewhere in the tree, found by id at
 * mount time. Used to let a page (e.g. Learn) render controls that visually
 * live in the persistent navbar's Tier 2 row without lifting page state up
 * into the navbar itself — the navbar only needs to mount an empty target
 * div with a stable `id`; whichever page is active portals its own content
 * into it, and the content unmounts automatically when the page changes.
 *
 * Renders nothing (both on the server and until the target is found) rather
 * than throwing if the target id never mounts, so a missing/renamed slot
 * fails silently instead of crashing the page.
 */
export function SlotPortal({
  slotId,
  children,
}: {
  slotId: string
  children: ReactNode
}) {
  const [target, setTarget] = useState<Element | null>(null)

  useEffect(() => {
    setTarget(document.getElementById(slotId))
  }, [slotId])

  if (!target) return null
  return createPortal(children, target)
}
