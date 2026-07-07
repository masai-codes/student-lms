'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { LottieComponentProps } from 'lottie-react'
import confettiAnimation from '@/assets/confetti.json'
import { cn } from '@/lib/utils'

interface LottieConfettiProps {
  /** Plays the one-shot burst while true; unmounts (and can replay) when false. */
  active: boolean
  /** Extra classes for the absolutely-positioned overlay. */
  className?: string
  /** Automation hook. */
  'data-testid'?: string
}

type LottieComponent = ComponentType<LottieComponentProps>

function resolveLottieComponent(
  module: LottieComponent | { default: LottieComponent | { default: LottieComponent } },
): LottieComponent {
  if (typeof module === 'function') return module
  if (typeof module.default === 'function') return module.default
  return module.default.default
}

/**
 * One-shot Lottie confetti overlay — the same celebration used across the
 * (legacy) student experience. Presentation-only and pointer-transparent; drop
 * it inside any `relative` container. `lottie-react` is loaded lazily so it
 * stays out of the SSR bundle (mirrors {@link AIAvatar}).
 */
export function LottieConfetti({ active, className, 'data-testid': dataTestId }: LottieConfettiProps) {
  const [Lottie, setLottie] = useState<LottieComponent | null>(null)

  useEffect(() => {
    void import('lottie-react').then((module) => {
      setLottie(() => resolveLottieComponent(module))
    })
  }, [])

  if (!active || !Lottie) return null

  return (
    <div
      data-testid={dataTestId}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-10', className)}
    >
      <Lottie animationData={confettiAnimation} loop={false} className="h-full w-full" />
    </div>
  )
}
