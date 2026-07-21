'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { AskAiPillContent, askAiPillClass } from './AskAiPill'
import { LectureAiChatExperience } from '../LectureAiChatExperience'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'
import { cn } from '@/lib/utils'

/** Shared open/close state (structurally matches the split-chat context value). */
export type LectureFloatingChatState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

type LectureFloatingChatProps = {
  lectureId: number
  state: LectureFloatingChatState
  /**
   * `viewport` (default) floats over the whole page via a body portal so it
   * stays pinned regardless of the hero's transforms. `contained` renders
   * absolutely inside the fullscreen video root so it's reachable while the
   * video is in browser fullscreen.
   */
  variant?: 'viewport' | 'contained'
  /**
   * Render the floating pill launcher. Off where the in-player controls already
   * expose an "Ask AI" button — the popup is then opened from there instead.
   */
  showLauncher?: boolean
}

const LAUNCHER_POSITION = {
  viewport: 'fixed bottom-6 right-6 z-[120]',
  // Sits just above the progress track (chrome bottom padding + toolbar +
  // track row ≈ 94-104px), without overlapping it.
  contained: 'absolute bottom-28 right-4 z-[60]',
} as const

// The viewport launcher/popup portal to <body>, so a `display:none` desktop-only
// ancestor can't hide them — gate on the breakpoint directly. Mobile keeps the
// separate below-hero dock. The contained (in-fullscreen) variant always shows.
const LAUNCHER_DISPLAY = {
  viewport: 'hidden md:block',
  contained: 'block',
} as const

const PANEL_DISPLAY = {
  viewport: 'hidden md:flex',
  contained: 'flex',
} as const

const PANEL_ANCHOR = {
  viewport: 'fixed z-[120]',
  contained: 'absolute z-[60]',
} as const

// Docked and expanded share the same bottom-right anchor and only differ in
// width/height, so toggling maximize animates as a smooth grow/shrink from the
// launcher corner (not a jump between two differently-anchored boxes).
const PANEL_DOCKED = {
  viewport:
    'bottom-6 right-6 h-[min(38rem,calc(100dvh-3rem))] w-[min(26rem,calc(100vw-3rem))]',
  contained: 'bottom-4 right-4 h-[min(85%,38rem)] w-[min(26rem,calc(100%-2rem))]',
} as const

const PANEL_EXPANDED = {
  viewport: 'bottom-6 right-6 h-[calc(100dvh-3rem)] w-[calc(100vw-3rem)]',
  contained: 'bottom-4 right-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]',
} as const

/**
 * Floating "Ask" AI chat: a launcher pill that opens a bottom-right popup the
 * user can maximize. Replaces the old shrink-the-video sidebar so the lecture
 * video always stays full width.
 */
export function LectureFloatingChat({
  lectureId,
  state,
  variant = 'viewport',
  showLauncher = true,
}: LectureFloatingChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // The popup node — passed as the composer's language-menu portal target so the
  // menu renders inside the popup (stacks above it, and stays inside the video's
  // fullscreen root) instead of behind it at <body>.
  const [popupEl, setPopupEl] = useState<HTMLDivElement | null>(null)
  // Keep the popup mounted through its close transition (open + close animate).
  const [isRendered, setIsRendered] = useState(state.isOpen)
  const [isShown, setIsShown] = useState(false)
  // Portal only after mount so SSR and the first client render agree (null).
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (state.isOpen) {
      setIsRendered(true)
      // Double rAF: mount in the closed state, let the browser paint it, then
      // flip to open so the grow-in transition actually runs (a single frame
      // can coalesce mount + state change and skip the animation).
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setIsShown(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setIsShown(false)
    // Keep it mounted through the close transition, then unmount and reset the
    // maximized view so it reopens docked next time.
    const timer = setTimeout(() => {
      setIsRendered(false)
      setIsExpanded(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [state.isOpen])

  const handleOpen = () => {
    pushLearnEvent('l_learn_lecture_ask_ai_open', { lectureId })
    state.open()
  }

  const handleClose = () => {
    pushLearnEvent('l_learn_lecture_ask_ai_close', { lectureId })
    state.close()
  }

  const handleToggleExpand = () => {
    const next = !isExpanded
    pushLearnEvent('l_learn_lecture_ask_ai_expand_toggle', {
      lectureId,
      expanded: next,
    })
    setIsExpanded(next)
  }

  const content = (
    <>
      {/* Always mounted — we fade/scale it in and out in sync with the popup so
          it never re-mounts (which would replay its entrance every close). */}
      {showLauncher ? (
        <div className={cn(LAUNCHER_POSITION[variant], LAUNCHER_DISPLAY[variant])}>
          <span className="group/tt relative block">
          <button
            type="button"
            onClick={handleOpen}
            data-testid="lecture-ask-ai-launcher"
            aria-label="Ask the AI tutor about this lecture"
            aria-hidden={state.isOpen}
            tabIndex={state.isOpen ? -1 : 0}
            className={cn(
              askAiPillClass,
              // Center origin + smooth ease so hover gives a barely-there lift.
              'inline-flex origin-center will-change-transform hover:-translate-y-px hover:scale-[1.015]',
              state.isOpen
                ? 'pointer-events-none scale-90 opacity-0'
                : 'scale-100 opacity-100',
            )}
          >
            <AskAiPillContent />
          </button>

          {/* Same hover tooltip as the in-player pill (hover devices only). */}
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none absolute bottom-[calc(100%+0.75rem)] right-2 z-[70] translate-y-1 scale-95 whitespace-nowrap rounded-lg border border-white/15 bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-150 ease-out',
              '[@media(hover:hover)]:group-hover/tt:translate-y-0 [@media(hover:hover)]:group-hover/tt:scale-100 [@media(hover:hover)]:group-hover/tt:opacity-100',
              state.isOpen && 'hidden',
            )}
          >
            Ask AI about this lecture
            </span>
          </span>
        </div>
      ) : null}

      {isRendered ? (
        <div
          ref={setPopupEl}
          data-testid="lecture-ask-ai-popup"
          data-state={isShown ? 'open' : 'closed'}
          className={cn(
            PANEL_ANCHOR[variant],
            PANEL_DISPLAY[variant],
            isExpanded ? PANEL_EXPANDED[variant] : PANEL_DOCKED[variant],
            'origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl',
            // One smooth curve for both the open/close (transform+opacity) and
            // the maximize/restore (width/height) — an iOS-like ease-out that
            // settles gently, no overshoot to spill past the viewport.
            'transition-[width,height,transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            isShown
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-90 opacity-0 blur-[1px]',
          )}
        >
          <LectureAiChatExperience
            lectureId={lectureId}
            onCloseSidebar={handleClose}
            isExpanded={isExpanded}
            onToggleExpand={handleToggleExpand}
            languageMenuContainer={popupEl}
          />
        </div>
      ) : null}
    </>
  )

  if (variant === 'viewport') {
    return isMounted ? createPortal(content, document.body) : null
  }

  return content
}
