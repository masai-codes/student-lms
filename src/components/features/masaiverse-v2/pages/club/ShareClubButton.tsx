import { useEffect, useRef, useState } from 'react'
import { CheckCircle, LinkSimple, ShareNetwork } from '@phosphor-icons/react'
import {
  MASAIVERSE_EVENTS,
  trackMasaiverse,
} from '@/components/features/masaiverse-v2/tracking'

/** How long the "link copied" confirmation stays visible. */
const COPIED_VISIBLE_MS = 2200

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // `navigator.clipboard` is unavailable in non-secure contexts; the catch
    // below falls through to the legacy `execCommand` path when it is.
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fall through to the legacy path below.
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * "Share Club" action for the club banner. Copies the current club page URL to
 * the clipboard and surfaces a self-dismissing confirmation popover so the user
 * knows the link was copied.
 */
export default function ShareClubButton() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  async function handleShare() {
    const url = window.location.href
    trackMasaiverse(MASAIVERSE_EVENTS.clubShareClick, { url })
    const ok = await copyToClipboard(url)
    if (!ok) return
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_VISIBLE_MS)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share club — copy link"
        className="flex items-center gap-2 rounded-[12px] bg-white/10 px-4 py-2.5 text-[14px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <ShareNetwork size={18} weight="bold" />
        Share Club
      </button>

      {copied ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+12px)] z-30 w-[264px] origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200"
        >
          <span className="absolute -top-1.5 right-7 size-3 rotate-45 rounded-[2px] border-l border-t border-black/5 bg-surface dark:border-white/10" />
          <div className="flex items-center gap-3 rounded-[14px] border border-black/5 bg-surface px-4 py-3 dark:border-white/10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.35)]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#23C16B] to-[#1FA463] text-success-foreground shadow-[0_4px_10px_rgba(31,164,99,0.35)]">
              <CheckCircle size={22} weight="fill" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold leading-5 text-foreground">
                Link copied!
              </span>
              <span className="flex items-center gap-1 text-[12px] leading-4 text-foreground-muted">
                <LinkSimple size={13} weight="bold" />
                Club link ready to share
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
