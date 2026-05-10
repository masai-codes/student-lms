"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

import { Button } from "@/components/masai-button";
import { cn } from "@/lib/utils";

type DrawerDirection = "bottom" | "right" | "left";

type MasaiDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  content: React.ReactNode | React.ComponentType;
  direction?: DrawerDirection;
  sideMarginInPx?: number;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
};

function resolveContent(content: MasaiDrawerProps["content"]) {
  if (React.isValidElement(content)) return content;
  if (typeof content === "function") {
    const Content = content as React.ComponentType;
    return <Content />;
  }
  return content;
}

const drawerDirectionClassNames: Record<DrawerDirection, string> = {
  bottom: "left-0 right-0 bottom-0 max-h-[88svh] rounded-t-2xl border-t",
  right: "right-0 top-0 h-svh w-[420px] max-w-full border-l",
  left: "left-0 top-0 h-svh w-[420px] max-w-full border-r",
};

export function MasaiDrawer({
  isOpen,
  onOpenChange,
  content,
  direction = "bottom",
  sideMarginInPx,
  title,
  showCloseButton = true,
  className,
  overlayClassName,
}: MasaiDrawerProps) {
  const renderedContent = React.useMemo(() => resolveContent(content), [content]);
  const hasFloatingMargin = typeof sideMarginInPx === "number" && sideMarginInPx > 0;
  const floatingPanelStyle = React.useMemo(() => {
    if (!hasFloatingMargin || !sideMarginInPx) return undefined;

    const spacing = `${sideMarginInPx}px`;
    const viewportInsetWidth = `calc(100vw - ${sideMarginInPx * 2}px)`;
    const viewportInsetHeight = `calc(100svh - ${sideMarginInPx * 2}px)`;

    if (direction === "right") {
      return {
        top: spacing,
        right: spacing,
        bottom: spacing,
        width: `min(420px, ${viewportInsetWidth})`,
        height: viewportInsetHeight,
      } as React.CSSProperties;
    }

    if (direction === "left") {
      return {
        top: spacing,
        left: spacing,
        bottom: spacing,
        width: `min(420px, ${viewportInsetWidth})`,
        height: viewportInsetHeight,
      } as React.CSSProperties;
    }

    return {
      top: spacing,
      left: spacing,
      right: spacing,
      bottom: spacing,
      height: viewportInsetHeight,
    } as React.CSSProperties;
  }, [direction, hasFloatingMargin, sideMarginInPx]);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={onOpenChange}
      direction={direction}
      modal
      shouldScaleBackground={false}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            overlayClassName,
          )}
        />
        <Drawer.Content className="fixed inset-0 z-50 pointer-events-none bg-transparent outline-none">
          <div
            style={floatingPanelStyle}
            className={cn(
              "pointer-events-auto fixed z-50 flex flex-col border bg-white font-poppins shadow-xl outline-none",
              hasFloatingMargin
                ? "rounded-2xl"
                : drawerDirectionClassNames[direction],
              className,
            )}
          >
            {direction === "bottom" ? (
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            ) : null}

            {title || showCloseButton ? (
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <Drawer.Title className="text-lg font-semibold text-slate-900">
                  {title ?? "Drawer"}
                </Drawer.Title>
                {showCloseButton ? (
                  <Drawer.Close asChild>
                    <Button
                      type="tertiary"
                      size="sm"
                      iconOnly
                      icon={<X size={16} />}
                      htmlType="button"
                      aria-label="Close drawer"
                      className="!h-8 !w-8 !rounded-md !border !border-slate-200 !text-slate-500 hover:!bg-slate-50 hover:!text-slate-800"
                    />
                  </Drawer.Close>
                ) : null}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">{renderedContent}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export type { DrawerDirection, MasaiDrawerProps };
