import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

const WELCOME_VIDEO_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/58e60b9e-3e33-4129-9d10-1b328933ad45/NYODJMCVszhbjguv.mp4'

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const instanceRef = useRef<ReturnType<typeof confetti.create> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const fire = confetti.create(canvas, { resize: true, useWorker: false })
    instanceRef.current = fire

    const duration = 3000
    const end = Date.now() + duration

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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-10"
    />
  )
}

interface Props {
  onClose: () => void
}

export function WelcomeModal({ onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* ── Desktop (≥ md) ── centered overlay */}
      <div className="hidden md:flex fixed inset-0 z-[400] items-center justify-center bg-black/60">
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[860px] mx-6 overflow-hidden"
          style={{ fontFamily: 'Poppins' }}
        >
          <ConfettiCanvas />

          {/* Header */}
          <div className="relative z-20 px-10 pt-10 pb-6 text-center">
            <h2 className="text-[28px] font-bold text-[#111827] leading-tight">Welcome to Masai!</h2>
            <p className="mt-3 text-base text-[#6B7280] leading-relaxed max-w-lg mx-auto">
              Your registration is confirmed and your LMS access is now active. Let's take a quick
              walkthrough to help you get started.
            </p>
          </div>

          {/* Video */}
          <div className="relative z-20 mx-6 rounded-2xl overflow-hidden bg-black">
            <video
              src={WELCOME_VIDEO_URL}
              controls
              className="w-full aspect-video"
              preload="metadata"
            />
          </div>

          {/* Footer */}
          <div className="relative z-20 px-10 py-8 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-12 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none"
              style={{ background: '#6962AC' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile (< md) ── bottom sheet */}
      <div className="md:hidden fixed inset-0 z-[400] flex items-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

        {/* Sheet */}
        <div
          className="relative w-full bg-white rounded-t-3xl overflow-hidden"
          style={{ fontFamily: 'Poppins' }}
        >
          <ConfettiCanvas />

          {/* Drag handle */}
          <div className="relative z-20 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#D1D5DB]" />
          </div>

          {/* Header */}
          <div className="relative z-20 px-5 pt-3 pb-4 text-center">
            <h2 className="text-xl font-bold text-[#111827]">Welcome to Masai!</h2>
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
              Your registration is confirmed and your LMS access is now active. Let's take a quick
              walkthrough to help you get started.
            </p>
          </div>

          {/* Video */}
          <div className="relative z-20 mx-4 rounded-2xl overflow-hidden bg-black">
            <video
              src={WELCOME_VIDEO_URL}
              controls
              className="w-full aspect-video"
              preload="metadata"
            />
          </div>

          {/* Footer */}
          <div className="relative z-20 px-5 py-5 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none"
              style={{ background: '#6962AC' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
