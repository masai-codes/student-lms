import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

interface ConfettiOverlayProps {
  /** Fires the burst while true; stops and resets when false. */
  active: boolean
  /** How long the celebratory burst runs, in milliseconds. */
  durationMs?: number
  /** Extra classes for the absolutely-positioned canvas. */
  className?: string
  /** Automation hook. */
  'data-testid'?: string
}

const DEFAULT_DURATION_MS = 3000

/**
 * Absolutely-positioned confetti canvas that celebrates for `durationMs` and
 * then fires a final centre burst. Presentation-only and pointer-transparent —
 * drop it inside any `relative` container (a modal, a card) that wants a
 * one-shot celebration. Shared by the certificate reveal and the T0 welcome
 * modal so the burst behaviour stays identical.
 */
export function ConfettiOverlay({
  active,
  durationMs = DEFAULT_DURATION_MS,
  className,
  'data-testid': dataTestId,
}: ConfettiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const instanceRef = useRef<ReturnType<typeof confetti.create> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return

    const fire = confetti.create(canvas, { resize: true, useWorker: false })
    instanceRef.current = fire

    const end = Date.now() + durationMs

    function frame() {
      void fire({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.4 },
        gravity: 1.2,
        scalar: 0.9,
        ticks: 150,
      })
      void fire({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.4 },
        gravity: 1.2,
        scalar: 0.9,
        ticks: 150,
      })

      if (Date.now() < end) {
        animFrameRef.current = requestAnimationFrame(frame)
      } else {
        void fire({ particleCount: 40, spread: 90, origin: { x: 0.5, y: 0.3 }, ticks: 250, decay: 0.88 })
      }
    }

    animFrameRef.current = requestAnimationFrame(frame)

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
      instanceRef.current?.reset()
    }
  }, [active, durationMs])

  return (
    <canvas
      ref={canvasRef}
      data-testid={dataTestId}
      className={cn('pointer-events-none absolute inset-0 h-full w-full z-10', className)}
    />
  )
}
