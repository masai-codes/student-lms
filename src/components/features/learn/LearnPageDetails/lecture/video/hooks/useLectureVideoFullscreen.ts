'use client'

import { useEffect, useState, type RefObject } from 'react'

export function useIsElementFullscreen(
  elementRef: RefObject<HTMLElement | null>,
): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const sync = () => {
      const element = elementRef.current
      setIsFullscreen(Boolean(element && document.fullscreenElement === element))
    }

    document.addEventListener('fullscreenchange', sync)
    sync()

    return () => document.removeEventListener('fullscreenchange', sync)
  }, [elementRef])

  return isFullscreen
}

export function useLectureVideoFullscreenActive(): boolean {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const sync = () => {
      setIsActive(
        Boolean(
          document.fullscreenElement?.classList.contains('lecture-video-fs-root'),
        ),
      )
    }

    document.addEventListener('fullscreenchange', sync)
    sync()

    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  return isActive
}
