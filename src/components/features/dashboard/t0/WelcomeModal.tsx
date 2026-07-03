import { WELCOME_CONFETTI_DURATION_MS, WELCOME_INTRO_VIDEO_URL } from './t0Config'
import { ConfettiOverlay } from '@/components/ui/confetti-overlay'
import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/ui/modal'
import BottomDrawer from '@/components/ui/bottom-drawer'
import {
  VideoPlayer,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from '@/components/ui/video-player'
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
  'Your registration is confirmed and your LMS is now active. Watch this quick intro to see how everything works, then jump right in.'

/** The shared inner content: confetti, intro video, copy, and the CTA. */
function WelcomeModalBody({ open, onDismiss, isDismissing }: WelcomeModalProps) {
  return (
    <div className="relative flex flex-col gap-5" data-testid="welcome-modal-body">
      <ConfettiOverlay
        active={open}
        durationMs={WELCOME_CONFETTI_DURATION_MS}
        data-testid="welcome-modal-confetti"
      />
      <div className="flex flex-col gap-2">
        <h2
          className="text-2xl font-semibold text-gray-900"
          data-testid="welcome-modal-title"
        >
          {TITLE}
        </h2>
        <p className="text-sm text-gray-600" data-testid="welcome-modal-body-text">
          {BODY}
        </p>
      </div>

      <VideoPlayer
        className="overflow-hidden rounded-2xl border border-gray-200"
        data-testid="welcome-modal-video"
      >
        <video
          slot="media"
          src={WELCOME_INTRO_VIDEO_URL}
          suppressHydrationWarning
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>

      <button
        type="button"
        onClick={onDismiss}
        disabled={isDismissing}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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
      <ModalContent className="max-w-xl" data-testid="welcome-modal">
        {/* Screen-reader-only labels: the visible title/body inside the body
            are styled headings, so Radix needs an explicit accessible name. */}
        <ModalTitle className="sr-only">{TITLE}</ModalTitle>
        <ModalDescription className="sr-only">{BODY}</ModalDescription>
        <WelcomeModalBody {...props} />
      </ModalContent>
    </Modal>
  )
}
