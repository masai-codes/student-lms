'use client'

import { Link } from '@tanstack/react-router'
import { Prohibit } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import type { LearnDetailRestriction } from '@/server/restrictions/types'
import { cn } from '@/lib/utils'

/** Secondary CTA — redirects the learner to /support. */
export function ContactSupportButton({ className }: { className?: string }) {
  return (
    <Link
      to="/support"
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 type-b1-md text-white transition hover:opacity-90',
        className,
      )}
      data-testid="learn-restriction-contact-support"
    >
      Contact support
    </Link>
  )
}

/**
 * Opens the onboarding guided tour on the agreement step for a specific batch.
 * The dashboard route reads these search params and preselects the batch + step.
 */
export function SignAgreementButton({
  batchId,
  className,
}: {
  batchId: number
  className?: string
}) {
  return (
    <Link
      to="/"
      search={{ guidedTour: 'open', batchId, tab: 'program', step: 'agreement' }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 type-b1-md text-white transition hover:opacity-90',
        className,
      )}
      data-testid="learn-restriction-sign-agreement"
    >
      Sign agreement
    </Link>
  )
}

type RestrictionCopy = {
  title: string
  description: ReactNode
  cta: ReactNode
}

function restrictionCopy(
  restriction: LearnDetailRestriction,
): RestrictionCopy {
  switch (restriction.kind) {
    case 'enrolment-cancelled':
      return {
        title: "You can't access this content",
        description:
          'Your enrolment in this batch has been cancelled, so this content is no longer available. Please contact support if you think this is a mistake.',
        cta: <ContactSupportButton className="mt-2" />,
      }
    case 'paused':
      return {
        title: "You're not allowed to access this page",
        description:
          "You don't have access to this content right now. Please contact support if you need help.",
        cta: <ContactSupportButton className="mt-2" />,
      }
    case 'agreement-recording':
    case 'agreement-practice':
      return {
        title: 'Your access is restricted',
        description:
          "You haven't signed your agreement yet, so this content is restricted. Sign your agreement to unlock it.",
        cta: <SignAgreementButton batchId={restriction.batchId} className="mt-2" />,
      }
  }
}

/**
 * Full-page block rendered when a batch/agreement restriction applies to a detail
 * page. Copy + CTA are driven entirely by the backend-computed `restriction`.
 */
export function LearnRestrictionPage({
  restriction,
}: {
  restriction: LearnDetailRestriction
}) {
  const { title, description, cta } = restrictionCopy(restriction)
  return (
    <div
      className="flex min-h-[min(70vh,560px)] w-full flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      data-testid="learn-restriction-page"
      data-restriction-kind={restriction.kind}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Prohibit className="size-8" weight="duotone" aria-hidden />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="type-h5 text-gray-900">{title}</h1>
        <p className="type-b2-regular text-gray-600">{description}</p>
      </div>
      {cta}
    </div>
  )
}
