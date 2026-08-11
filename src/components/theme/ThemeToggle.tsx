'use client'

import { Moon, Sun } from 'lucide-react'

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
 * script has already set `.dark` on <html> before these styles apply.
 */
export function ThemeToggle({ className, size = 'navbar' }: ThemeToggleProps) {
  const { toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      data-testid="theme-toggle"
      className={cn(
        'group/theme relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-muted shadow-none transition-colors hover:bg-surface-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        size === 'navbar' ? 'size-8 [&_svg]:size-[17px]' : 'size-10 [&_svg]:size-6',
        className,
      )}
    >
      <Sun
        aria-hidden
        className="absolute rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0"
      />
      <Moon
        aria-hidden
        className="absolute rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100"
      />
    </button>
  )
}
