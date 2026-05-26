import { useEffect, useRef, useState } from 'react'

export function useTimer(timeStart = 0) {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(timeStart)
  const [speed, setSpeed] = useState(1)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    let requestId = 0

    const updateTimer = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }

      if (isRunning) {
        const elapsed = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp
        setTime(previous => previous + (speed * elapsed) / 1000)
      }

      requestId = requestAnimationFrame(updateTimer)
    }

    if (isRunning) {
      requestId = requestAnimationFrame(updateTimer)
    } else {
      cancelAnimationFrame(requestId)
      lastTimeRef.current = 0
    }

    return () => cancelAnimationFrame(requestId)
  }, [isRunning, speed])

  const startTimer = () => setIsRunning(true)
  const stopTimer = () => setIsRunning(false)
  const resetTimer = () => {
    setIsRunning(false)
    setTime(0)
  }
  const changeSpeed = (newSpeed: number) => setSpeed(newSpeed)

  return { time, isRunning, startTimer, stopTimer, resetTimer, changeSpeed, setTime }
}
