'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import {
  MIN_LECTURE_HERO_HEIGHT_PX,
  computeLectureHeroHeightPx,
  getStableHeroRootTopPx,
  measureLectureViewportChromeHeightPx,
} from './lectureViewportLayout'

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

function getMobileTabBarHeightPx(): number {
  if (!isMobileViewport()) return 0

  const tabBar = document.querySelector<HTMLElement>(
    '[data-app-mobile-tab-bar]',
  )
  return tabBar?.getBoundingClientRect().height ?? 0
}

/**
 * On mobile the metadata + chat chrome below the video is tall, so the
 * first-viewport-slice math would crush the video far below its natural size.
 * Floor it at the video's 16:9 height (from the full-bleed screen width) so it
 * always reads as a proper player; the chrome simply scrolls below. Capped at
 * 60% of the viewport so it never swallows the whole screen on wide/landscape.
 */
function getMobileMinHeroHeightPx(): number {
  if (!isMobileViewport()) return MIN_LECTURE_HERO_HEIGHT_PX

  const width = window.visualViewport?.width ?? window.innerWidth
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const aspectHeightPx = Math.round((width * 9) / 16)
  return Math.max(
    MIN_LECTURE_HERO_HEIGHT_PX,
    Math.min(aspectHeightPx, Math.round(viewportHeight * 0.6)),
  )
}

/**
 * Once the real video dimensions are known, the mobile hero is sized to the
 * ACTUAL aspect ratio (full-bleed width / ratio) so the video fills its box
 * without letterboxing — flexible like the YouTube mobile player. Capped so a
 * portrait/tall video never swallows the screen; landscape phone viewports get
 * a higher cap since the video is the whole point of that orientation.
 */
function getMobileAspectHeroHeightPx(videoAspectRatio: number): number {
  const width = window.visualViewport?.width ?? window.innerWidth
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const isLandscape = width > viewportHeight
  const capPx = Math.round(viewportHeight * (isLandscape ? 0.8 : 0.62))
  const aspectHeightPx = Math.round(width / videoAspectRatio)
  return Math.max(
    MIN_LECTURE_HERO_HEIGHT_PX,
    Math.min(aspectHeightPx, Math.max(capPx, MIN_LECTURE_HERO_HEIGHT_PX)),
  )
}

type LectureViewportLocks = {
  heightPx: number
  reservedChromePx: number
}

function measureHeroHeight(
  root: HTMLElement,
  reservedChromePx: number,
  videoAspectRatio: number | null,
): number {
  if (isMobileViewport() && videoAspectRatio && videoAspectRatio > 0) {
    return getMobileAspectHeroHeightPx(videoAspectRatio)
  }
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  return computeLectureHeroHeightPx({
    viewportHeight,
    rootTop: getStableHeroRootTopPx(root, window.scrollY),
    mobileTabBarHeightPx: getMobileTabBarHeightPx(),
    reservedChromePx,
    minHeroHeightPx: getMobileMinHeroHeightPx(),
  })
}

/**
 * Locks hero height from the initial viewport slice. Only updates on window
 * resize/orientation or when the video's intrinsic aspect ratio arrives —
 * not on scroll or when docked chat collapses inline chrome.
 */
export function useLectureHeroViewportHeight(
  videoAspectRatio: number | null = null,
) {
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
      const nextHeightPx = measureHeroHeight(
        root,
        reservedChromePx,
        videoAspectRatio,
      )
      locksRef.current = { heightPx: nextHeightPx, reservedChromePx }
      setHeightPx(nextHeightPx)
    }

    // A new aspect ratio (or mount) invalidates the lock.
    locksRef.current = null
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
  }, [videoAspectRatio])

  return { rootRef, heightPx }
}
