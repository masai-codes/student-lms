import { Warning } from '@phosphor-icons/react'

import type { SupportGateReason } from '@/server/api/support/support.types'
import { Button } from '@/components/ui/button'

/**
 * GateBanner — shown when ticket creation is blocked.
 *
 * The student should learn *why* they can't raise a ticket up-front (not after
 * writing a message). Each gate reason has its own copy + call-to-action. When
 * `reason` is `null` this renders nothing.
 */
const GATE_COPY: Record<
  NonNullable<SupportGateReason>,
  { title: string; body: string; cta?: string }
> = {
  'legal-agreement': {
    title: 'Complete your learning agreement',
    body: 'Review and sign your agreement to start raising support tickets.',
    cta: 'Complete agreement',
  },
  'no-active-section': {
    title: 'No active section yet',
    body: 'You’ll be able to raise tickets once you’re placed in an active section. You can still browse FAQs below.',
  },
}

export function GateBanner({
  reason,
  onAction,
}: {
  reason: SupportGateReason
  onAction?: () => void
}) {
  if (!reason) return null
  const copy = GATE_COPY[reason]

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <Warning className="mt-0.5 size-5 shrink-0 text-amber-600" weight="fill" />
      <div className="flex-1 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">{copy.title}</h3>
          <p className="text-sm text-amber-800">{copy.body}</p>
        </div>
        {copy.cta && (
          <Button size="sm" variant="default" onClick={onAction}>
            {copy.cta}
          </Button>
        )}
      </div>
    </div>
  )
}
