'use client'

import { WarningCircle } from '@phosphor-icons/react'

import { MasaiButton } from '@/components/ui/masai-button'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'

type AssessmentPlatformRedirectModalProps = {
  open: boolean
  loading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function AssessmentPlatformRedirectModal({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: AssessmentPlatformRedirectModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg" data-testid="assessment-platform-modal">
        <div className="flex flex-col gap-4">
          <WarningCircle
            className="size-14 text-amber-400"
            weight="duotone"
            aria-hidden
          />
          <ModalTitle className="type-h6 text-gray-900">
            You are going to be redirected to Assessment Platform
          </ModalTitle>
          <ModalDescription className="type-b2-regular text-gray-600">
            This is a unique link generated only for you. Please do not share
            this link with anyone.
          </ModalDescription>
          <div className="flex justify-end gap-3 pt-2">
            <MasaiButton
              type="secondary"
              size="md"
              ctaText="Cancel"
              htmlType="button"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            />
            <MasaiButton
              type="primary"
              size="md"
              ctaText={loading ? 'Please wait…' : 'Okay'}
              htmlType="button"
              disabled={loading}
              onClick={onConfirm}
            />
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
