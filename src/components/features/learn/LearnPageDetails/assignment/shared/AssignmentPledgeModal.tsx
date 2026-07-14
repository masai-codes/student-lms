'use client'

import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiCheckbox } from '@/components/ui/masai-checkbox'
import { createAssignmentSubmission } from '@/lib/api/learn/assignmentDetailActionsApi'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type AssignmentPledgeModalProps = {
  assignmentId: number
}

// Verbatim copy from the legacy LMS pledge modal so the wording stays identical.
const PLEDGE_PARAGRAPHS = [
  'To become a better version of myself and achieve breakthroughs in my career through skill development, I recognize the importance of working hard and remaining committed to the program’s practice-based learning approach.',
  'Throughout this program, I will embrace challenges and strive for personal growth by upholding the highest standards of ethical conduct. I am committed to achieving success with integrity and honesty.',
  "I acknowledge that if the Academic Committee finds evidence of me cheating, plagiarism, or presenting someone else's work as my own, or aiding anyone in such activities, strict disciplinary action will be taken. This action will be in accordance with program policies and the discretion of the academic committee.",
]

const PLEDGE_CHECKBOX_LABEL =
  'I pledge that I will not engage in any form of cheating or plagiarism, as there is no cheat code to success in academic, professional, or personal life.'

/**
 * Integrity pledge that gates evaluation submission creation. Mirrors the legacy
 * LMS modal: a forced, non-dismissible dialog shown once the evaluation window
 * opens and no submission exists yet. The only way forward is to accept the
 * pledge and confirm, which creates the submission row.
 */
export function AssignmentPledgeModal({
  assignmentId,
}: AssignmentPledgeModalProps) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleConfirm = async () => {
    pushLearnEvent(
      learnEntityEvent('assignment', 'pledge_confirm', assignmentId),
      {
        assignment_id: assignmentId,
      },
    )
    setLoading(true)
    setErrorMessage(null)
    try {
      await createAssignmentSubmission(assignmentId)
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not start the assignment',
      )
      setLoading(false)
    }
  }

  return (
    <Modal open onOpenChange={() => undefined}>
      <ModalContent
        showCloseButton={false}
        // Wide on desktop to match the legacy LMS (`md:w-[80%]`); full-bleed
        // (minus a gutter) on mobile.
        className="w-[calc(100%-2rem)] p-5 md:w-[80%] md:max-w-[80vw]"
        // Forced acknowledgement: block every implicit dismissal path so the
        // learner can only proceed by accepting the pledge (matches legacy LMS).
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        data-testid="assignment-pledge-modal"
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span
            className="flex w-fit shrink-0 items-center justify-center rounded-full bg-brand-subtle p-2"
            aria-hidden
          >
            {/* Fixed desktop widths, scaled down on small screens so the modal
                header fits comfortably at 320px viewports. */}
            <img
              src="/pledgeBoy.svg"
              alt=""
              width={100}
              className="w-[68px] sm:w-[100px]"
            />
            <img
              src="/pledgeGirl.svg"
              alt=""
              width={90}
              className="w-[60px] sm:w-[90px]"
            />
          </span>
          <div className="self-center">
            <ModalTitle className="text-[16px] font-bold capitalize text-foreground md:text-[18px] lg:text-[22px]">
              Pledge Towards <span className="text-danger">Integrity</span>
            </ModalTitle>
            <p className="mt-4 text-[14px] font-bold capitalize text-foreground md:text-[16px] lg:text-[18px]">
              No Cheat Code To Success
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {PLEDGE_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-foreground">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-6">
          <MasaiCheckbox
            isSelected={accepted}
            onSelect={setAccepted}
            disabled={loading}
            label={PLEDGE_CHECKBOX_LABEL}
          />
        </div>

        {errorMessage ? (
          <p className="mt-3 type-b3-md text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
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
      </ModalContent>
    </Modal>
  )
}
