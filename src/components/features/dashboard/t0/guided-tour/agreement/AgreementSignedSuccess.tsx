import { useEffect, useState } from 'react'
import { ConfettiOverlay } from '@/components/ui/confetti-overlay'

/**
 * Celebratory "you're done" screen shown once the agreement is signed, in place
 * of the full details certificate. A self-drawing green tick (SVG stroke draw +
 * a scale/pop, all CSS — no framer-motion) with a one-shot confetti burst.
 * Preserves `data-testid="agreement-completed"` so the signed state stays
 * discoverable.
 */
export function AgreementSignedSuccess() {
  // Flip on after mount so the CSS transitions animate in (rather than starting
  // in their final state).
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className="relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-center"
      data-testid="agreement-completed"
    >
      <ConfettiOverlay active data-testid="agreement-success-confetti" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated tick: pulsing halo + popping circle + drawing checkmark. */}
        <div className="relative flex size-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-green-100 opacity-70 motion-safe:animate-ping" />
          <svg
            viewBox="0 0 52 52"
            className={`relative size-28 transition-transform duration-500 ease-out ${
              shown ? 'scale-100' : 'scale-0'
            }`}
            aria-hidden
          >
            <circle cx="26" cy="26" r="25" fill="#22c55e" />
            <path
              d="M14 27 L23 36 L39 18"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: shown ? 0 : 48,
                transition: 'stroke-dashoffset 500ms ease-out 250ms',
              }}
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-semibold text-gray-900">Agreement signed</h3>
          <p className="max-w-md text-sm text-gray-500">
            Thanks — your agreement has been signed and securely recorded.
          </p>
        </div>
      </div>
    </div>
  )
}
