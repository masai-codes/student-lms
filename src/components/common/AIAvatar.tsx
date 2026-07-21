'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { LottieComponentProps } from 'lottie-react'
import aiAvatarAnimation from '@/assets/ai-avatar.json'
import { cn } from '@/lib/utils'

type AIAvatarProps = {
  className?: string
  isSpeaking?: boolean
}

type LottieComponent = ComponentType<LottieComponentProps>

function resolveLottieComponent(
  module:
    | LottieComponent
    | { default: LottieComponent | { default: LottieComponent } },
): LottieComponent {
  if (typeof module === 'function') {
    return module
  }

  if (typeof module.default === 'function') {
    return module.default
  }

  return module.default.default
}

export function AIAvatar({ className, isSpeaking = false }: AIAvatarProps) {
  const [Lottie, setLottie] = useState<LottieComponent | null>(null)

  useEffect(() => {
    void import('lottie-react').then((module) => {
      setLottie(() => resolveLottieComponent(module))
    })
  }, [])

  return (
    <div
      className={cn(
        'mx-auto size-[min(11rem,42vw)] max-w-full shrink-0',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'size-full transition-transform duration-500 ease-out',
          isSpeaking && 'animate-ai-avatar-speak',
        )}
      >
        {Lottie ? <Lottie animationData={aiAvatarAnimation} loop /> : null}
      </div>
    </div>
  )
}
