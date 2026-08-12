import { ThemedLogo } from '@/components/common/ThemedLogo'

const GOOGLE_PLAY_QR_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/google_play_qr.png'
const APP_STORE_QR_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/app_store_qr.png'

// UTM parameters shared across both store links so app installs attribute back
// to the LMS "Download the app" surface.
const APP_UTM_PARAMS = new URLSearchParams({
  utm_source: 'masai_lms',
  utm_medium: 'web',
  utm_campaign: 'download_masai_learn_app',
  utm_content: 'download_app_modal',
  utm_term: 'masai_learn',
}).toString()

const APP_STORE_LINK = `https://apps.apple.com/in/app/masai-learn/id6753811719?${APP_UTM_PARAMS}`
const GOOGLE_PLAY_LINK = `https://play.google.com/store/apps/details?id=com.lms.masai&${APP_UTM_PARAMS}`

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
        <ThemedLogo
          lightSrc="https://masai-website-images.s3.ap-south-1.amazonaws.com/Group_1707486823_bb03f18e00.svg"
          darkSrc="/masai-learn-dark.svg"
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
