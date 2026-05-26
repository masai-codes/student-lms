import { ChatTeardropDots, EnvelopeSimple, WhatsappLogo } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SignInNoticeVariant = 'email' | 'sms' | 'whatsapp'

const titles: Record<SignInNoticeVariant, string> = {
  email: 'Check your email',
  sms: 'Code sent by text',
  whatsapp: 'Code sent on WhatsApp',
}

const shellClass: Record<SignInNoticeVariant, string> = {
  email:
    'border-violet-300/50 bg-gradient-to-br from-violet-50/95 via-purple-50/60 to-fuchsia-50/40 shadow-md shadow-violet-500/10 ring-1 ring-violet-200/40 dark:border-violet-500/25 dark:from-violet-950/70 dark:via-purple-950/50 dark:to-fuchsia-950/30 dark:shadow-violet-950/20 dark:ring-violet-400/15',
  sms: 'border-sky-400/45 bg-gradient-to-br from-sky-50/95 via-blue-50/70 to-cyan-50/50 shadow-md shadow-sky-500/15 ring-1 ring-sky-200/50 dark:border-sky-500/30 dark:from-sky-950/75 dark:via-blue-950/55 dark:to-cyan-950/35 dark:shadow-sky-950/25 dark:ring-sky-400/15',
  whatsapp:
    'border-emerald-400/50 bg-gradient-to-br from-emerald-50/95 via-[#e7ffdb]/90 to-teal-50/55 shadow-md shadow-emerald-600/15 ring-1 ring-emerald-300/45 dark:border-emerald-500/35 dark:from-emerald-950/80 dark:via-emerald-900/45 dark:to-teal-950/40 dark:shadow-emerald-950/30 dark:ring-emerald-500/20',
}

const iconWrapClass: Record<SignInNoticeVariant, string> = {
  email:
    'bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-600/35 ring-2 ring-white/40 dark:from-violet-500 dark:to-purple-600 dark:ring-violet-300/25',
  sms: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-600/35 ring-2 ring-white/45 dark:from-sky-400 dark:to-blue-500 dark:ring-sky-200/20',
  whatsapp:
    'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-emerald-700/40 ring-2 ring-white/50 dark:from-[#2fe077] dark:to-[#0d6b5c] dark:ring-emerald-200/25',
}

const titleClass: Record<SignInNoticeVariant, string> = {
  email: 'text-violet-950 dark:text-violet-50',
  sms: 'text-sky-950 dark:text-sky-50',
  whatsapp: 'text-emerald-950 dark:text-emerald-50',
}

const bodyClass: Record<SignInNoticeVariant, string> = {
  email: 'text-violet-900/85 dark:text-violet-100/88',
  sms: 'text-sky-900/88 dark:text-sky-100/90',
  whatsapp: 'text-emerald-900/90 dark:text-emerald-100/92',
}

function NoticeIcon({ variant }: { variant: SignInNoticeVariant }) {
  const iconClass = 'size-7 drop-shadow-sm'
  switch (variant) {
    case 'email':
      return <EnvelopeSimple className={iconClass} weight="duotone" aria-hidden />
    case 'sms':
      return <ChatTeardropDots className={iconClass} weight="duotone" aria-hidden />
    case 'whatsapp':
      return <WhatsappLogo className={iconClass} weight="fill" aria-hidden />
    default:
      return null
  }
}

type Props = {
  variant: SignInNoticeVariant
  children: ReactNode
}

/** Channel-specific styling so users instantly recognize email vs SMS vs WhatsApp. */
export function SignInNotice({ variant, children }: Props) {
  return (
    <div
      role="status"
      className={cn(
        'relative flex gap-3.5 overflow-hidden rounded-2xl border px-4 py-4',
        shellClass[variant],
      )}
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl',
          iconWrapClass[variant],
        )}
      >
        <NoticeIcon variant={variant} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn('font-poppins text-sm font-bold leading-tight tracking-tight', titleClass[variant])}>
          {titles[variant]}
        </p>
        <div className={cn('mt-2 text-sm font-medium leading-relaxed', bodyClass[variant])}>{children}</div>
      </div>
    </div>
  )
}
