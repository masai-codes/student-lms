'use client'

import { Link } from '@tanstack/react-router'
import { Prohibit } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Primary CTA used across the ban states — redirects the learner to /support. */
export function ContactSupportButton({ className }: { className?: string }) {
  return (
    <Link
      to="/support"
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 type-b1-md text-white transition hover:opacity-90',
        className,
      )}
      data-testid="learn-ban-contact-support"
    >
      Contact support
    </Link>
  )
}

const PAGE_TITLE = "You're not allowed to view this content"
const PAGE_DESCRIPTION =
  'You are not allowed to view this content as you are banned. Please contact support if you think this is a mistake.'

/**
 * Full-page block shown when a normal batch ban applies to the whole detail page
 * (content scheduled after the user's ban date in a banned batch).
 */
export function LearnBanPage({
  title = PAGE_TITLE,
  description = PAGE_DESCRIPTION,
}: {
  title?: string
  description?: ReactNode
}) {
  return (
    <div
      className="flex min-h-[min(70vh,560px)] w-full flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      data-testid="learn-ban-page"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Prohibit className="size-8" weight="duotone" aria-hidden />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="type-h5 text-gray-900">{title}</h1>
        <p className="type-b2-regular text-gray-600">{description}</p>
      </div>
      <ContactSupportButton className="mt-2" />
    </div>
  )
}
