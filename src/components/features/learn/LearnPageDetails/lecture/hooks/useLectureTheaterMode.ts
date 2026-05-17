'use client'

import { useCallback, useState } from 'react'

import { DEFAULT_LECTURE_THEATER_MODE } from '../constants/lectureTheaterMode'

export function useLectureTheaterMode(
  initialTheaterMode = DEFAULT_LECTURE_THEATER_MODE,
) {
  const [isTheaterMode, setIsTheaterMode] = useState(initialTheaterMode)

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode(current => !current)
  }, [])

  return {
    isTheaterMode,
    setIsTheaterMode,
    toggleTheaterMode,
  }
}
