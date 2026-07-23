'use client'

import { useEffect, useState } from 'react'

import { LECTURE_RAIL_MEDIA_QUERY } from '../constants/lectureSplitLayout'

/**
 * True at laptop/desktop widths where the AI chat is a side rail; false on
 * mobile/tablet where it's a bottom drawer. Used to fully unmount the surface
 * that doesn't apply — the drawer is portaled to `<body>`, so CSS `hidden`
 * can't stop it from showing on desktop; it must not be mounted at all.
 */
export function useLectureRailViewport() {
  const [isRail, setIsRail] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(LECTURE_RAIL_MEDIA_QUERY)
    const update = () => setIsRail(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isRail
}
