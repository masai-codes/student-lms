'use client'

import * as React from 'react'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'

import { MasaiButton } from '@/components/masai-button'
import { cn } from '@/lib/utils'

type DrawerDirection = 'bottom' | 'right' | 'left'

type MasaiDrawerProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  /** Fired once the close animation has fully finished (drawer no longer visible). */
  onClosed?: () => void
  content: React.ReactNode | React.ComponentType
  direction?: DrawerDirection
  sideMarginInPx?: number
  /** Extra space to leave at the viewport bottom (e.g. fixed footers). */
  bottomInsetPx?: number
  title?: React.ReactNode
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
}

function resolveContent(content: MasaiDrawerProps['content']) {
  if (React.isValidElement(content)) return content
  if (typeof content === 'function') {
    const Content = content as React.ComponentType
    return <Content />
  }
  return content
}

const drawerDirectionClassNames: Record<DrawerDirection, string> = {
  bottom: 'left-0 right-0 bottom-0 max-h-[88svh] rounded-t-2xl border-t',
  right: 'right-0 top-0 h-svh w-[420px] max-w-full border-l',
  left: 'left-0 top-0 h-svh w-[420px] max-w-full border-r',
}

export function MasaiDrawer({
  isOpen,
  onOpenChange,
  onClosed,
  content,
  direction = 'bottom',
  sideMarginInPx,
  bottomInsetPx = 0,
  title,
  showCloseButton = true,
  className,
  overlayClassName,
}: MasaiDrawerProps) {
  const renderedContent = React.useMemo(
    () => resolveContent(content),
    [content],
  )
  const hasFloatingMargin =
    typeof sideMarginInPx === 'number' && sideMarginInPx > 0
  const resolvedBottomInsetPx = Math.max(0, bottomInsetPx)
  const stacksAboveFixedChrome = resolvedBottomInsetPx > 0

  const floatingPanelStyle = React.useMemo(() => {
    if (!hasFloatingMargin || !sideMarginInPx) return undefined

    const spacing = `${sideMarginInPx}px`
    const bottomSpacing = `calc(${spacing} + ${resolvedBottomInsetPx}px)`
    const viewportInsetWidth = `calc(100vw - ${sideMarginInPx * 2}px)`
    const verticalInsetTotal = sideMarginInPx * 2 + resolvedBottomInsetPx
    const viewportInsetHeight = `calc(100svh - ${verticalInsetTotal}px)`

    if (direction === 'right') {
      return {
        top: spacing,
        right: spacing,
        bottom: bottomSpacing,
        width: `min(420px, ${viewportInsetWidth})`,
        height: viewportInsetHeight,
      }
    }

    if (direction === 'left') {
      return {
        top: spacing,
        left: spacing,
        bottom: bottomSpacing,
        width: `min(420px, ${viewportInsetWidth})`,
        height: viewportInsetHeight,
      }
    }

    return {
      top: spacing,
      left: spacing,
      right: spacing,
      bottom: bottomSpacing,
      height: viewportInsetHeight,
    }
  }, [direction, hasFloatingMargin, resolvedBottomInsetPx, sideMarginInPx])

  const drawerLayerClass = stacksAboveFixedChrome ? 'z-[90]' : 'z-50'

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={onOpenChange}
      onAnimationEnd={(open) => {
        if (!open) onClosed?.()
      }}
      direction={direction}
      modal
      shouldScaleBackground={false}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay
          onClick={() => onOpenChange(false)}
          className={cn(
            'fixed inset-0 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
            drawerLayerClass,
            overlayClassName,
          )}
        />
        <Drawer.Content
          className={cn(
            'fixed inset-0 bg-transparent outline-none',
            drawerLayerClass,
          )}
        >
          <button
            type="button"
            aria-label="Close drawer backdrop"
            className="absolute inset-0 pointer-events-auto"
            onClick={() => onOpenChange(false)}
          />
          <div
            style={floatingPanelStyle}
            className={cn(
              'pointer-events-auto fixed flex flex-col border bg-white font-poppins shadow-xl outline-none',
              drawerLayerClass,
              hasFloatingMargin
                ? 'rounded-2xl'
                : drawerDirectionClassNames[direction],
              className,
            )}
          >
            {direction === 'bottom' ? (
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            ) : null}

            {title || showCloseButton ? (
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <Drawer.Title className="text-lg font-semibold text-slate-900">
                  {title ?? 'Drawer'}
                </Drawer.Title>
                {showCloseButton ? (
                  <MasaiButton
                    type="tertiary"
                    size="sm"
                    iconOnly
                    icon={<X size={16} />}
                    htmlType="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Close drawer"
                    className="!h-8 !w-8 !rounded-md !border !border-slate-200 !text-slate-500 hover:!bg-slate-50 hover:!text-slate-800"
                  />
                ) : null}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {renderedContent}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export type { DrawerDirection, MasaiDrawerProps }
