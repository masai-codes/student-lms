'use client'

import { useEffect, useState, type RefObject } from 'react'

import {
  FULLSCREEN_CHANGE_EVENTS,
  getFullscreenElement,
} from './lectureVideoFullscreen.utils'

export function useIsElementFullscreen(
  elementRef: RefObject<HTMLElement | null>,
): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const sync = () => {
      const element = elementRef.current
      setIsFullscreen(Boolean(element && getFullscreenElement() === element))
    }

    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(eventName, sync)
    }
    sync()

    return () => {
      for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(eventName, sync)
      }
    }
  }, [elementRef])

  return isFullscreen
}

export function useLectureVideoFullscreenActive(): boolean {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const sync = () => {
      setIsActive(
        Boolean(
          getFullscreenElement()?.classList.contains('lecture-video-fs-root'),
        ),
      )
    }

    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(eventName, sync)
    }
    sync()

    return () => {
      for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(eventName, sync)
      }
    }
  }, [])

  return isActive
}
