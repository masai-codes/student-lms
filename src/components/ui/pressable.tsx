import { Slot } from '@radix-ui/react-slot'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Pressable — the building block for the app's "native, premium" tap feel.
 *
 * Wraps any clickable surface (cards, list rows, icon buttons) and gives it the
 * physical feedback a native mobile app has: it scales down slightly and dims on
 * press, springs back on release, and never shows a text-selection flash. Pair
 * it with `rounded-*` + a background and you get an iOS/Android-grade control.
 *
 * Reusable across every module — keep module-specific styling in the caller, not
 * here. Use `asChild` to project the behaviour onto an existing element (e.g. a
 * link or a `Card`) without adding a wrapper node.
 *
 * @example
 * <Pressable asChild>
 *   <Card>…</Card>
 * </Pressable>
 */
export function Pressable({
  className,
  asChild = false,
  ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="pressable"
      className={cn(
        // motion: spring-like scale on press, quick and subtle.
        'transition-[transform,opacity,box-shadow] duration-150 ease-out',
        'active:scale-[0.97] active:opacity-90',
        // feel: no tap highlight / text selection, comfortable touch target.
        'cursor-pointer select-none touch-manipulation outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        className,
      )}
      {...props}
    />
  )
}
