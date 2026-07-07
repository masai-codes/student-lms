'use client'

import { useRouter } from '@tanstack/react-router'
import { ShieldCheck } from '@phosphor-icons/react'
import { useState } from 'react'

import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiCheckbox } from '@/components/ui/masai-checkbox'
import { createAssignmentSubmission } from '@/lib/api/learn/assignmentDetailActionsApi'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type AssignmentPledgeGateProps = {
  assignmentId: number
}

const PLEDGE_PARAGRAPHS = [
  'To grow and achieve breakthroughs in my career, I recognize the importance of working hard and staying committed to the practice-based learning approach.',
  'I will embrace challenges and uphold the highest standards of ethical conduct, achieving success with integrity and honesty.',
  "I acknowledge that if the Academic Committee finds evidence of cheating, plagiarism, or presenting someone else's work as my own, strict disciplinary action may be taken in accordance with program policies.",
]

/** Integrity pledge that gates evaluation submission creation (mirrors legacy LMS). */
export function AssignmentPledgeGate({ assignmentId }: AssignmentPledgeGateProps) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleConfirm = async () => {
    pushLearnEvent(learnEntityEvent('assignment', 'pledge_confirm', assignmentId), {
      assignment_id: assignmentId,
    })
    setLoading(true)
    setErrorMessage(null)
    try {
      await createAssignmentSubmission(assignmentId)
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not start the assignment',
      )
      setLoading(false)
    }
  }

  return (
    <section
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      data-testid="assignment-pledge-gate"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F7F7FF]"
          aria-hidden
        >
          <ShieldCheck className="size-6 text-[#6962AC]" weight="duotone" />
        </span>
        <div>
          <h2 className="type-h6 text-gray-900">
            Pledge Towards Integrity
          </h2>
          <p className="type-b3-md text-gray-600">No cheat code to success.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {PLEDGE_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="type-b3-regular text-gray-700">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-4">
        <MasaiCheckbox
          isSelected={accepted}
          onSelect={setAccepted}
          disabled={loading}
          label="I pledge that I will not engage in any form of cheating or plagiarism."
        />
      </div>

      {errorMessage ? (
        <p className="mt-3 type-b3-md text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <MasaiButton
          type="primary"
          size="md"
          ctaText="Acknowledge & Confirm"
          htmlType="button"
          disabled={!accepted || loading}
          onClick={() => void handleConfirm()}
          data-testid="assignment-pledge-confirm"
        />
      </div>
    </section>
  )
}
