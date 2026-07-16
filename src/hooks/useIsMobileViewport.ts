import { useEffect, useState } from 'react'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export function getIsMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobileViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const sync = () => {
      setIsMobile(mediaQuery.matches)
    }
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  return isMobile
}
