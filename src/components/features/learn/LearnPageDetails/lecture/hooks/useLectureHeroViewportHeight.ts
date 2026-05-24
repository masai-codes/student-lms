'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import {
  computeLectureHeroHeightPx,
  getStableHeroRootTopPx,
  measureLectureViewportChromeHeightPx,
} from './lectureViewportLayout'

function getMobileTabBarHeightPx(): number {
  if (typeof window === 'undefined') return 0
  if (!window.matchMedia('(max-width: 767px)').matches) return 0

  const tabBar = document.querySelector<HTMLElement>(
    '[data-app-mobile-tab-bar]',
  )
  return tabBar?.getBoundingClientRect().height ?? 0
}

type LectureViewportLocks = {
  heightPx: number
  reservedChromePx: number
}

function measureHeroHeight(
  root: HTMLElement,
  reservedChromePx: number,
): number {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  return computeLectureHeroHeightPx({
    viewportHeight,
    rootTop: getStableHeroRootTopPx(root, window.scrollY),
    mobileTabBarHeightPx: getMobileTabBarHeightPx(),
    reservedChromePx,
  })
}

/**
 * Locks hero height from the initial viewport slice. Only updates on window
 * resize/orientation — not on scroll or when docked chat collapses inline chrome.
 */
export function useLectureHeroViewportHeight() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined)
  const locksRef = useRef<LectureViewportLocks | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const applyMeasure = (force = false) => {
      if (!force && locksRef.current != null) {
        setHeightPx(locksRef.current.heightPx)
        return
      }

      const reservedChromePx = measureLectureViewportChromeHeightPx()
      const nextHeightPx = measureHeroHeight(root, reservedChromePx)
      locksRef.current = { heightPx: nextHeightPx, reservedChromePx }
      setHeightPx(nextHeightPx)
    }

    applyMeasure(true)

    const onResize = () => {
      locksRef.current = null
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
