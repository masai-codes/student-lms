'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { LottieComponentProps } from 'lottie-react'
import aiAvatarAnimation from '@/assets/ai-avatar.json'
import { cn } from '@/lib/utils'

type AIAvatarProps = {
  className?: string
}

type LottieComponent = ComponentType<LottieComponentProps>

function resolveLottieComponent(
  module: LottieComponent | { default: LottieComponent | { default: LottieComponent } },
): LottieComponent {
  if (typeof module === 'function') {
    return module
  }

  if (typeof module.default === 'function') {
    return module.default
  }

  return module.default.default
}

export function AIAvatar({ className }: AIAvatarProps) {
  const [Lottie, setLottie] = useState<LottieComponent | null>(null)

  useEffect(() => {
    void import('lottie-react').then((module) => {
      setLottie(() => resolveLottieComponent(module))
    })
  }, [])

  return (
    <div
      className={cn('mx-auto size-[min(11rem,42vw)] max-w-full shrink-0', className)}
      aria-hidden
    >
      {Lottie ? <Lottie animationData={aiAvatarAnimation} loop /> : null}
    </div>
  )
}
