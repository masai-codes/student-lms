'use client'

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'

const GOOGLE_PLAY_QR_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/25088ff4-0060-43c3-88ad-f7232e6e23e1/gVzYkLNCEIgmfdic.png'
const APP_STORE_QR_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/f043eb9b-0d02-499b-90f1-eb33940239c0/JGQKZLQoKo1qfKpj.png'

const APP_STORE_LINK =
  'https://apps.apple.com/sa/app/masai-learn/id6753811719?uo=2'
const GOOGLE_PLAY_LINK =
  'https://play.google.com/store/apps/details?id=com.lms.masai'

export type DownloadAppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  googlePlayQRUrl?: string
  appStoreQRUrl?: string
}

/** Same content as legacy `student-experience` `DownloadAppQRModal`. */
export function DownloadAppModal({
  open,
  onOpenChange,
  googlePlayQRUrl = GOOGLE_PLAY_QR_URL,
  appStoreQRUrl = APP_STORE_QR_URL,
}: DownloadAppModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-[668px] md:p-10">
        <div className="flex justify-center pb-6 pt-1 md:pt-0 md:pb-8">
          <img
            src="https://masai-website-images.s3.ap-south-1.amazonaws.com/Group_1707486823_bb03f18e00.svg"
            alt="Masai Learn"
            className="h-[37px] object-contain"
          />
        </div>

        <ModalTitle className="text-balance text-center font-poppins text-base font-bold text-gray-900 md:text-xl">
          Download the Masai Learn app
        </ModalTitle>

        <ModalDescription className="mt-2 text-center font-poppins text-xs font-medium text-gray-600 md:text-sm md:font-normal md:text-gray-700">
          Get your LMS on mobile and continue learning wherever you are.
        </ModalDescription>

        <div className="mt-8 flex flex-col items-center justify-center gap-8 rounded-[24px] bg-gray-100 px-6 py-7 md:flex-row md:justify-between md:px-12 md:py-7">
          <div className="flex w-full max-w-[200px] flex-col items-center gap-4">
            <a
              href={GOOGLE_PLAY_LINK}
              className="w-full shrink-0 transition-transform hover:scale-105 active:scale-95"
              aria-label="Download on Google Play"
              target="_blank"
              rel="noreferrer noopener"
            >
              <img
                src="https://masai-website-images.s3.ap-south-1.amazonaws.com/Google_Play_714a8811e2.svg"
                alt="GET IT ON Google Play"
                className="h-auto w-full object-contain"
              />
            </a>
            {googlePlayQRUrl ? (
              <img
                src={googlePlayQRUrl}
                alt="Google Play QR code"
                className="size-[200px] object-contain"
              />
            ) : null}
          </div>

          <div className="flex w-full max-w-[200px] flex-col items-center gap-4">
            <a
              href={APP_STORE_LINK}
              className="w-full shrink-0 transition-transform hover:scale-105 active:scale-95"
              aria-label="Download on App Store"
              target="_blank"
              rel="noreferrer noopener"
            >
              <img
                src="https://masai-website-images.s3.ap-south-1.amazonaws.com/App_Store_f6793e6fef.svg"
                alt="Download on the App Store"
                className="h-auto w-full object-contain"
              />
            </a>
            {appStoreQRUrl ? (
              <img
                src={appStoreQRUrl}
                alt="App Store QR code"
                className="size-[200px] object-contain"
              />
            ) : null}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
