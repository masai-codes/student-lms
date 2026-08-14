'use client'

import { useRef } from 'react'
import { Moon, Sun } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  /** `navbar` matches the desktop icon-cluster scale; `mobile` the 40px header buttons. */
  size?: 'navbar' | 'mobile'
}

/**
 * Light/dark toggle. Persistence follows the collapse-to-system rule (see
 * `src/lib/theme/themes.ts`): picking the mode the OS is already in stores
 * `system`, so the app keeps following future OS switches automatically.
 *
 * Both icons are always in the DOM and swapped with `dark:` visibility so SSR
 * (which can't know the client theme) hydrates cleanly — the pre-paint theme
 * script has already set `.dark` on <html> before these styles apply. The
 * tooltip label uses the same trick, so it needs no client state either.
 *
 * The switch is a fast whole-page color fade (the provider's
 * `data-theme-transition`, styles.css) plus a one-shot springy pop + ring
 * burst on the button (`data-theme-toggle-pop`). A View Transitions circular
 * reveal was tried and reverted: its snapshot capture pauses rendering for a
 * page-sized cost, which read as a hitch — don't reintroduce it.
 */
export function ThemeToggle({ className, size = 'navbar' }: ThemeToggleProps) {
  const { toggleTheme, themeLocked, hydrated } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // The app shell pins light (see `lib/theme/appForcedTheme.ts`), so offering a
  // toggle there would do nothing. Gated on `hydrated` — SSR can't know.
  if (hydrated && themeLocked) return null

  const handleClick = () => {
    // Restart the one-shot pop/ring on every click: remove the attribute,
    // force a reflow so the animation resets, re-add it.
    const button = buttonRef.current
    if (button) {
      button.removeAttribute('data-theme-toggle-pop')
      void button.offsetWidth
      button.setAttribute('data-theme-toggle-pop', '')
    }
    toggleTheme()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          aria-label="Toggle dark mode"
          data-testid="theme-toggle"
          className={cn(
            'group/theme relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-muted shadow-none transition-colors hover:bg-surface-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
            size === 'navbar'
              ? 'size-8 [&_svg]:size-[17px]'
              : 'size-10 [&_svg]:size-6',
            className,
          )}
        >
          <Sun
            aria-hidden
            className="absolute rotate-0 scale-100 transition-transform duration-500 group-hover/theme:rotate-45 dark:-rotate-90 dark:scale-0"
          />
          <Moon
            aria-hidden
            className="absolute rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100 dark:group-hover/theme:-rotate-12"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        {/* Both labels rendered; `.dark` visibility picks one (hydration-safe). */}
        <span className="dark:hidden">Switch to dark mode</span>
        <span className="hidden dark:inline">Switch to light mode</span>
      </TooltipContent>
    </Tooltip>
  )
}
