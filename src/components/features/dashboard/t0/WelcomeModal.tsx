import { useEffect, useRef, useState } from 'react'
import { Confetti } from '@phosphor-icons/react'
import { WELCOME_INTRO_VIDEO_URL } from './t0Config'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import { LottieConfetti } from '@/components/ui/lottie-confetti'
import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/ui/modal'
import BottomDrawer from '@/components/ui/bottom-drawer'
import { useIsMobileViewport } from '@/components/features/chatbot/hooks/useIsMobileViewport'

interface WelcomeModalProps {
  /** Whether the modal/drawer is visible. */
  open: boolean
  /** Called on backdrop click, cross, escape, or the "Get Started" button. */
  onDismiss: () => void
  /** Disables the CTA while the dismissal is being persisted. */
  isDismissing?: boolean
}

const TITLE = 'Welcome to Masai!'
const BODY =
  'Your registration is confirmed and your LMS access is now active. Let’s take a quick walkthrough to help you get started.'

/** The shared inner content: confetti, intro video, copy, and the CTA. */
function WelcomeModalBody({ open, onDismiss, isDismissing }: WelcomeModalProps) {
  // Each celebrate-button click re-fires the one-shot confetti (remount via key).
  const [celebrateCount, setCelebrateCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Hard-stop the intro video whenever the modal is closed or unmounted.
  // Unmounting the <video> alone does NOT reliably stop audio: a played-then-
  // paused media element stays alive as the browser's active media session, so
  // the OS/hardware "play" control (lock screen, headphones, media notification)
  // could resume it with no visible player. Pausing + detaching the source and
  // calling load() tears the element down so no audio can leak after close.
  useEffect(() => {
    if (open) return
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.removeAttribute('src')
    video.load()
  }, [open])

  useEffect(
    () => () => {
      const video = videoRef.current
      if (!video) return
      video.pause()
      video.removeAttribute('src')
      video.load()
    },
    [],
  )

  return (
    <div
      className="relative flex flex-col items-center gap-5 text-center md:gap-6"
      data-testid="welcome-modal-body"
    >
      <LottieConfetti key={celebrateCount} active={open} data-testid="welcome-modal-confetti" />

      <button
        type="button"
        onClick={() => setCelebrateCount((count) => count + 1)}
        title="Woohoo!"
        aria-label="Celebrate again"
        data-testid="welcome-modal-celebrate"
        // Sits in the modal's top-left corner (mirroring the close X on the
        // right); the negative offsets pull it out past the modal's padding.
        className="absolute left-0 top-0 z-20 inline-flex size-9 items-center justify-center rounded-full text-[#F59E0B] transition-colors hover:bg-[#FEF3C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] md:-left-6 md:-top-6"
      >
        <Confetti size={24} weight="fill" aria-hidden />
      </button>

      <div className="flex flex-col gap-2">
        <h2
          className="text-2xl font-bold text-[#111827] md:text-3xl"
          data-testid="welcome-modal-title"
        >
          {TITLE}
        </h2>
        <p className="text-sm text-gray-600 md:text-base" data-testid="welcome-modal-body-text">
          {BODY}
        </p>
      </div>

      {celebrateCount > 2 ? (
        <p
          className="animate-bounce text-sm font-semibold text-[#EC4899]"
          data-testid="welcome-modal-celebrate-message"
        >
          Okay, okay! We love celebrating wins as much as you do!
        </p>
      ) : null}

      {/* Native player (same as the guided-tour videos). No autoplay — the
          learner taps play (autoplay would be muted, and the intro is worth
          hearing).

          Width is derived from a viewport-height cap (width = cap * 16/9,
          clamped to the container), so `aspect-video` yields a height that can
          never exceed the cap. On short screens the video shrinks to fit
          instead of pushing content past the viewport and triggering a scroll,
          while the 16:9 ratio stays intact (no letterboxing) in both axes. */}
      <div
        className="mx-auto aspect-video w-[min(100%,calc(38svh_*_16_/_9))] max-w-full overflow-hidden rounded-2xl bg-black shadow-md md:w-[min(100%,calc(52vh_*_16_/_9))]"
        data-testid="welcome-modal-video"
      >
        <video
          ref={videoRef}
          src={WELCOME_INTRO_VIDEO_URL}
          className="h-full w-full object-contain"
          controls
          playsInline
          suppressHydrationWarning
        />
      </div>

      <button
        type="button"
        onClick={() => {
          pushDashboardEvent('l_dashboard_welcome_modal_get_started')
          onDismiss()
        }}
        disabled={isDismissing}
        className="inline-flex h-12 w-52 items-center justify-center rounded-lg bg-[#6962AC] text-base font-semibold text-white transition-colors hover:bg-[#554f8b] disabled:opacity-60"
        data-testid="welcome-modal-get-started"
      >
        {isDismissing ? 'Just a moment…' : 'Get Started'}
      </button>
    </div>
  )
}

/**
 * The T0 welcome modal (onboarding Phase 1). Shown once to a newly-admitted
 * user: a celebratory confetti burst, an embedded intro video, and a "Get
 * Started" CTA. Renders as a swipeable bottom drawer on mobile and a centred
 * dialog on desktop. Dismissing it (any exit path) is the caller's cue to mark
 * it seen so it never reappears.
 */
export function WelcomeModal(props: WelcomeModalProps) {
  const { open, onDismiss } = props
  const isMobile = useIsMobileViewport()

  if (isMobile) {
    return (
      <BottomDrawer open={open} onClose={onDismiss} bodyClassName="px-4 pb-6">
        <WelcomeModalBody {...props} />
      </BottomDrawer>
    )
  }

  return (
    <Modal open={open} onOpenChange={(next) => !next && onDismiss()}>
      <ModalContent className="max-w-[1000px] p-8 md:p-10" data-testid="welcome-modal">
        {/* Screen-reader-only labels: the visible title/body inside the body
            are styled headings, so Radix needs an explicit accessible name. */}
        <ModalTitle className="sr-only">{TITLE}</ModalTitle>
        <ModalDescription className="sr-only">{BODY}</ModalDescription>
        <WelcomeModalBody {...props} />
      </ModalContent>
    </Modal>
  )
}
