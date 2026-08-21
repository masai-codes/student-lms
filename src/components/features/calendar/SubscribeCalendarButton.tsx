import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarPlus,
  CaretRight,
  AppleLogo,
  GoogleLogo,
  LinkSimple,
  MicrosoftOutlookLogo,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { pushCalendarEvent } from './calendarAnalytics'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { fetchCalendarSubscriptionLink } from '@/lib/api/calendar/calendarApi'

type CalendarProvider = 'google' | 'outlook' | 'apple' | 'copy'

const PROVIDERS: Array<{
  id: CalendarProvider
  label: string
  description: string
  icon: Icon
}> = [
  {
    id: 'google',
    label: 'Google Calendar',
    description: 'Add your schedule to your Google Calendar',
    icon: GoogleLogo,
  },
  {
    id: 'outlook',
    label: 'Outlook Calendar',
    description: 'Subscribe via Outlook on the web',
    icon: MicrosoftOutlookLogo,
  },
  {
    id: 'apple',
    label: 'Apple Calendar',
    description: 'Open in Calendar app on Mac or iPhone',
    icon: AppleLogo,
  },
  {
    id: 'copy',
    label: 'Copy subscription link',
    description: 'Paste into any calendar app that supports ICS feeds',
    icon: LinkSimple,
  },
]

// Same URL recipes as the old LMS (Google wants the `cid` form with an http
// scheme; Apple uses webcal), so subscriptions behave identically. The feed
// host serves the ICS over plain HTTP as well as HTTPS, so the downgrade is
// safe — verified against the deployed host.
export function buildProviderUrl(
  provider: Exclude<CalendarProvider, 'copy'>,
  calendarUrl: string,
): string {
  if (provider === 'google') {
    const httpUrl = calendarUrl.replace(/^https:\/\//i, 'http://')
    return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(httpUrl)}`
  }
  if (provider === 'outlook') {
    return `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(calendarUrl)}&name=${encodeURIComponent('Masai Schedule')}`
  }
  return calendarUrl.replace(/^https?:\/\//i, 'webcal://')
}

/** "Subscribe" CTA + the old-LMS-style provider list modal. */
export function SubscribeCalendarButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, isPending, isError } = useQuery({
    queryKey: ['calendar', 'subscription-link'],
    queryFn: fetchCalendarSubscriptionLink,
    staleTime: Infinity,
    enabled: open,
  })
  const url = data?.calendarUrl

  const handleProviderClick = async (provider: CalendarProvider) => {
    if (!url) return
    pushCalendarEvent(`l_calendar_subscribe_${provider}`, {})
    if (provider === 'copy') {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        window.prompt('Copy this calendar subscription link:', url)
      }
      return
    }
    window.open(
      buildProviderUrl(provider, url),
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <>
      <button
        type="button"
        data-testid="my-calendar-subscribe"
        onClick={() => {
          pushCalendarEvent('l_calendar_subscribe_open', {})
          setOpen(true)
        }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95"
      >
        <CalendarPlus aria-hidden className="size-4" />
        Subscribe
      </button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent data-testid="my-calendar-subscribe-modal">
          <div className="space-y-1 pr-8">
            <ModalTitle className="text-lg font-semibold text-foreground">
              Subscribe to Calendar
            </ModalTitle>
            <ModalDescription className="text-sm text-foreground-muted">
              Choose how you want to add your events to your calendar.
            </ModalDescription>
          </div>

          <div className="mt-4 space-y-3">
            {isPending ? (
              <div className="dash-skeleton h-64 w-full rounded-xl">
                <span className="sr-only">Loading subscription link…</span>
              </div>
            ) : isError || !url ? (
              <p
                data-testid="my-calendar-subscribe-error"
                className="text-sm text-danger"
              >
                Couldn&apos;t create your link. Please try again later.
              </p>
            ) : (
              <>
                {PROVIDERS.map((provider, index) => (
                  <button
                    key={provider.id}
                    type="button"
                    data-testid={`my-calendar-subscribe-${provider.id}`}
                    onClick={() => void handleProviderClick(provider.id)}
                    style={
                      {
                        '--dash-delay': `${index * 0.05}s`,
                      } as React.CSSProperties
                    }
                    className="animate-dash-row-in group flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors duration-150 hover:border-brand/40 hover:bg-brand-subtle/40 active:scale-[0.99]"
                  >
                    <span className="rounded-full bg-brand-subtle p-2 text-brand-subtle-foreground transition-transform duration-150 group-hover:scale-110">
                      <provider.icon aria-hidden className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {provider.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-foreground-muted">
                        {provider.description}
                      </span>
                    </span>
                    <CaretRight
                      aria-hidden
                      className="size-5 shrink-0 text-foreground-subtle transition-transform duration-150 group-hover:translate-x-1"
                    />
                  </button>
                ))}
                {copied ? (
                  <p
                    data-testid="my-calendar-subscribe-copied"
                    className="animate-dash-pop text-center text-sm text-success"
                  >
                    Subscription link copied to clipboard.
                  </p>
                ) : null}
                <p className="pt-1 text-xs text-foreground-subtle">
                  Your calendar app will sync the lectures, assignments and
                  quizzes scheduled across your sections.
                </p>
              </>
            )}
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
