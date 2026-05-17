'use client'

import { useLayoutEffect, useRef, useState } from 'react'

const MIN_HERO_HEIGHT_PX = 180

function getMobileTabBarHeightPx(): number {
  if (typeof window === 'undefined') return 0
  if (!window.matchMedia('(max-width: 767px)').matches) return 0

  const tabBar = document.querySelector<HTMLElement>(
    '[data-app-mobile-tab-bar]',
  )
  return tabBar?.getBoundingClientRect().height ?? 0
}

function measureHeroHeight(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top
  const bottomChrome = getMobileTabBarHeightPx()
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  return Math.max(Math.floor(viewportHeight - top - bottomChrome), MIN_HERO_HEIGHT_PX)
}

/**
 * Locks hero height from the initial viewport slice. Only updates on window
 * resize/orientation — not when tab content below expands (avoids video growth).
 */
export function useLectureHeroViewportHeight() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined)
  const lockedHeightRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const applyMeasure = (force = false) => {
      const next = measureHeroHeight(root)
      if (!force && lockedHeightRef.current != null) return
      lockedHeightRef.current = next
      setHeightPx(next)
    }

    applyMeasure(true)

    const onResize = () => {
      lockedHeightRef.current = null
      applyMeasure(true)
    }

    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [])

  return { rootRef, heightPx }
}
