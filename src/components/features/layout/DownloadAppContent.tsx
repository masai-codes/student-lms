const GOOGLE_PLAY_QR_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/25088ff4-0060-43c3-88ad-f7232e6e23e1/gVzYkLNCEIgmfdic.png'
const APP_STORE_QR_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/f043eb9b-0d02-499b-90f1-eb33940239c0/JGQKZLQoKo1qfKpj.png'

const APP_STORE_LINK =
  'https://apps.apple.com/sa/app/masai-learn/id6753811719?uo=2'
const GOOGLE_PLAY_LINK =
  'https://play.google.com/store/apps/details?id=com.lms.masai'

export type DownloadAppContentProps = {
  googlePlayQRUrl?: string
  appStoreQRUrl?: string
  /** Extra classes for the root (e.g. to constrain/centre it in a wide panel). */
  className?: string
}

/**
 * The "download the Masai Learn app" content — logo, heading, and the two store
 * badges + QR codes. Presentation-only and modal-agnostic: `DownloadAppModal`
 * wraps it in a dialog for the navbar, and the T0 guided tour renders it inline.
 */
export function DownloadAppContent({
  googlePlayQRUrl = GOOGLE_PLAY_QR_URL,
  appStoreQRUrl = APP_STORE_QR_URL,
  className,
}: DownloadAppContentProps) {
  return (
    <div className={className} data-testid="download-app-content">
      <div className="flex justify-center pb-6 pt-1 md:pb-8 md:pt-0">
        <img
          src="https://masai-website-images.s3.ap-south-1.amazonaws.com/Group_1707486823_bb03f18e00.svg"
          alt="Masai Learn"
          className="h-[37px] object-contain"
        />
      </div>

      <h2 className="text-balance text-center font-poppins text-base font-bold text-foreground md:text-xl">
        Download the Masai Learn app
      </h2>
      <p className="mt-2 text-center font-poppins text-xs font-medium text-foreground-muted md:text-sm md:font-normal md:text-foreground">
        Get your LMS on mobile and continue learning wherever you are.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-8 rounded-[24px] bg-surface-muted px-6 py-7 md:flex-row md:gap-12 md:px-12 md:py-7">
        <div className="flex w-full max-w-[220px] flex-col items-center gap-4">
          <a
            href={GOOGLE_PLAY_LINK}
            className="w-full shrink-0 transition-transform hover:scale-105 active:scale-95"
            aria-label="Download on Google Play"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="download-app-google-play"
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
              className="size-[180px] object-contain sm:size-[200px] md:size-[220px]"
            />
          ) : null}
        </div>

        <div className="flex w-full max-w-[220px] flex-col items-center gap-4">
          <a
            href={APP_STORE_LINK}
            className="w-full shrink-0 transition-transform hover:scale-105 active:scale-95"
            aria-label="Download on App Store"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="download-app-app-store"
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
              className="size-[180px] object-contain sm:size-[200px] md:size-[220px]"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
