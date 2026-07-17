import { Lock } from '@phosphor-icons/react'

interface GuidedTourLockedNoticeProps {
  title: string
  message: string
}

/**
 * Shown in place of a step's content when it's gated behind an earlier step
 * (e.g. document upload / student kit are locked until the agreement is signed).
 */
export function GuidedTourLockedNotice({
  title,
  message,
}: GuidedTourLockedNoticeProps) {
  return (
    <div
      className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6"
      data-testid="guided-tour-locked-notice"
    >
      <Lock className="size-8 text-foreground-subtle" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  )
}
