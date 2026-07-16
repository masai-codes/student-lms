import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Smartphone, LogOut, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalContent } from '@/components/ui/modal'
import {
  fetchAccountActivity,
  signOutSession,
  signOutAllSessions,
} from '@/lib/api/profile/profileApi'
import type { SessionInfo } from '@/server/api/profile/accountActivity.service'

// ── UA parsing ────────────────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): {
  label: string
  isMobile: boolean
} {
  if (!ua) return { label: 'Unknown Device', isMobile: false }

  const mobile = /mobile|android|iphone|ipad|phone/i.test(ua)

  let browser = 'Other'
  let version = ''
  let os = ''

  // Browser + version
  const chromeMatch =
    ua.match(/Chrome\/([\d.]+)/) ?? ua.match(/CriOS\/([\d.]+)/)
  const safariMatch = ua.match(/Version\/([\d.]+).*Safari/)
  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/)
  const edgeMatch = ua.match(/Edg\/([\d.]+)/)
  const masaiMatch = ua.match(/MasaiLearn\/([\d.]+)/)

  if (masaiMatch) {
    browser = 'MasaiLearn'
    version = masaiMatch[1].split('.')[0]
  } else if (edgeMatch) {
    browser = 'Edge'
    version = edgeMatch[1].split('.')[0]
  } else if (chromeMatch && mobile && /wv/i.test(ua)) {
    browser = 'Chrome Mobile WebView'
    version = chromeMatch[1].split('.')[0]
  } else if (chromeMatch && mobile && /ios/i.test(ua)) {
    browser = 'Chrome Mobile iOS'
    version = chromeMatch[1].split('.')[0]
  } else if (chromeMatch && mobile) {
    browser = 'Chrome Mobile'
    version = chromeMatch[1].split('.')[0]
  } else if (chromeMatch) {
    browser = 'Chrome'
    version = chromeMatch[1].split('.')[0]
  } else if (safariMatch) {
    browser = 'Safari'
    version = safariMatch[1].split('.').slice(0, 2).join('.')
  } else if (firefoxMatch) {
    browser = 'Firefox'
    version = firefoxMatch[1].split('.')[0]
  }

  // OS
  const macMatch = ua.match(/Mac OS X ([\d_]+)/)
  const winMatch = ua.match(/Windows NT ([\d.]+)/)
  const androidMatch = ua.match(/Android ([\d.]+)/)
  const iosMatch = ua.match(/OS ([\d_]+) like Mac/)

  if (androidMatch) os = `Android ${androidMatch[1]}`
  else if (iosMatch) os = `iOS ${iosMatch[1].replace(/_/g, '.')}`
  else if (macMatch) os = `Mac OS X ${macMatch[1].replace(/_/g, '.')}`
  else if (winMatch) os = `Windows NT ${winMatch[1]}`
  else os = 'Other 0.0.0'

  const label = `${browser} ${version} (${os})`
  return { label, isMobile: mobile }
}

function formatLastActivity(unix: number): {
  relative: string
  absolute: string
} {
  const date = new Date(unix * 1000)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let relative: string
  if (diffMins < 1) relative = 'Just now'
  else if (diffMins < 60) relative = `${diffMins} min ago`
  else if (diffHours < 24) relative = `${diffHours} hr ago`
  else if (diffDays === 1) relative = 'Yesterday'
  else relative = `${diffDays} days ago`

  const absolute = date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  })

  return { relative, absolute }
}

// ── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  isCurrent,
  onSignOut,
  isSigningOut,
}: {
  session: SessionInfo
  isCurrent: boolean
  onSignOut: () => void
  isSigningOut: boolean
}) {
  const { label, isMobile } = parseUserAgent(session.userAgent)
  const { relative, absolute } = formatLastActivity(session.lastActivity)

  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-border bg-surface px-5 py-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-subtle">
        {isMobile ? (
          <Smartphone size={20} className="text-info" />
        ) : (
          <Monitor size={20} className="text-info" />
        )}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-[14px] font-bold text-foreground leading-snug truncate">
          {label}
          {isCurrent && (
            <span className="ml-2 text-[11px] font-semibold text-success bg-success-subtle border border-success-subtle rounded-full px-2 py-0.5">
              Current
            </span>
          )}
        </span>
        <span className="text-[13px] text-foreground-muted">{relative}</span>
        <span className="text-[12px] font-semibold text-foreground-muted">
          {absolute}
        </span>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-label="Sign out this device"
        className="shrink-0 flex items-center justify-center size-9 rounded-lg text-danger hover:text-danger hover:bg-danger-subtle transition-colors disabled:opacity-40"
      >
        <LogOut size={18} />
      </button>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SessionSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-border bg-surface px-5 py-4 animate-pulse">
      <div className="size-11 rounded-full bg-muted shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-surface-muted" />
        <div className="h-3 w-40 rounded bg-surface-muted" />
      </div>
      <div className="size-9 rounded-lg bg-surface-muted shrink-0" />
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  isConfirming,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isConfirming: boolean
  title: string
  children?: React.ReactNode
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <ModalContent className="max-w-[460px] w-full rounded-[20px] p-8 shadow-xl">
        <div className="flex flex-col gap-6 mt-2">
          {/* Warning icon + title */}
          <div className="flex flex-col items-center gap-4">
            <AlertCircle size={52} strokeWidth={1.8} className="text-warning" />
            <h2 className="text-[18px] font-bold text-foreground text-center leading-snug">
              {title}
            </h2>
          </div>

          {/* Optional body (device preview) */}
          {children}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-7 py-3 rounded-[12px] border border-border bg-surface-muted text-[15px] font-semibold text-foreground hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className="px-7 py-3 rounded-[12px] bg-brand text-brand-foreground text-[15px] font-semibold hover:bg-brand disabled:opacity-60 transition-colors"
            >
              {isConfirming ? 'Signing out…' : 'Continue'}
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

// ── Account Activity Tab ──────────────────────────────────────────────────────

export function AccountActivityTab() {
  const queryClient = useQueryClient()
  // pending single sign-out: holds the session to confirm
  const [pendingSession, setPendingSession] = useState<SessionInfo | null>(null)
  // pending sign-out-all dialog
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [signingOutId, setSigningOutId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['account-activity'],
    queryFn: fetchAccountActivity,
    staleTime: 60 * 1000,
  })

  const sessions = data?.sessions ?? []
  const currentSessionId = data?.currentSessionId ?? null

  const { mutate: doSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: signOutSession,
    onMutate: (sessionId) => {
      setSigningOutId(sessionId)
    },
    onSuccess: (_data, sessionId) => {
      queryClient.setQueryData<typeof data>(['account-activity'], (old) =>
        old
          ? { ...old, sessions: old.sessions.filter((s) => s.id !== sessionId) }
          : old,
      )
      toast.success('Device signed out.')
    },
    onError: () => {
      toast.error('Failed to sign out. Please try again.')
    },
    onSettled: () => {
      setSigningOutId(null)
    },
  })

  const { mutate: doSignOutAll, isPending: isSigningOutAll } = useMutation({
    mutationFn: signOutAllSessions,
    onSuccess: () => {
      queryClient.setQueryData<typeof data>(['account-activity'], (old) =>
        old ? { ...old, sessions: [] } : old,
      )
      toast.success('Signed out of all devices.')
    },
    onError: () => {
      toast.error('Failed to sign out all devices. Please try again.')
    },
    onSettled: () => {
      setConfirmAllOpen(false)
    },
  })

  function handleConfirmSingle() {
    if (!pendingSession) return
    doSignOut(pendingSession.id)
    setPendingSession(null)
  }

  // Sort: current session first, then by lastActivity desc
  const sorted = [...sessions].sort((a, b) => {
    if (a.id === currentSessionId) return -1
    if (b.id === currentSessionId) return 1
    return b.lastActivity - a.lastActivity
  })

  const left = sorted.filter((_, i) => i % 2 === 0)
  const right = sorted.filter((_, i) => i % 2 === 1)

  const pendingLabel = pendingSession
    ? parseUserAgent(pendingSession.userAgent).label
    : ''
  const pendingIsMobile = pendingSession
    ? parseUserAgent(pendingSession.userAgent).isMobile
    : false

  return (
    <>
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Account Activity
          </h2>
          <p className="text-sm text-foreground-muted">
            All devices currently signed in to your account.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SessionSkeleton key={i} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-foreground-subtle py-6 text-center">
            No active sessions found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col gap-3">
              {left.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  isCurrent={s.id === currentSessionId}
                  onSignOut={() => setPendingSession(s)}
                  isSigningOut={signingOutId === s.id}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {right.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  isCurrent={s.id === currentSessionId}
                  onSignOut={() => setPendingSession(s)}
                  isSigningOut={signingOutId === s.id}
                />
              ))}
            </div>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmAllOpen(true)}
              disabled={isSigningOutAll}
              className="text-[13px] font-semibold text-info bg-info-subtle border border-info-subtle rounded-[10px] px-4 py-2 transition-colors disabled:opacity-50"
            >
              SIGN OUT OF ALL DEVICES
            </button>
          </div>
        )}
      </div>

      {/* Single device confirm */}
      <ConfirmDialog
        open={pendingSession !== null}
        onClose={() => setPendingSession(null)}
        onConfirm={handleConfirmSingle}
        isConfirming={isSigningOut}
        title="Are you sure you want to sign out of from this device?"
      >
        <div className="flex items-center gap-4 rounded-[14px] bg-info-subtle px-5 py-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface border border-info-subtle">
            {pendingIsMobile ? (
              <Smartphone size={20} className="text-info" />
            ) : (
              <Monitor size={20} className="text-info" />
            )}
          </div>
          <span className="text-[15px] font-semibold text-foreground">
            {pendingLabel}
          </span>
        </div>
      </ConfirmDialog>

      {/* Sign out all confirm */}
      <ConfirmDialog
        open={confirmAllOpen}
        onClose={() => setConfirmAllOpen(false)}
        onConfirm={() => doSignOutAll()}
        isConfirming={isSigningOutAll}
        title="Are you sure you want to sign out from all the devices ?"
      />
    </>
  )
}
