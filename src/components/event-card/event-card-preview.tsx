import { CardCtaButton } from '../shared/card-cta-button'
import { toRichPreviewText } from './rich-content'
import type { EventCardProps } from './types'

import { cn } from '@/lib/utils'

function toCapitalizedWords(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function getDateParts(value: string) {
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, '0'),
      month: parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    }
  }

  const tokens = value.trim().split(/\s+/)
  const monthToken = tokens.find((token) => /[A-Za-z]/.test(token)) ?? ''
  const dayToken =
    tokens.find((token) => /^\d{1,2}$/.test(token)) ??
    (tokens[0]?.replace(/\D/g, '') || '')

  return {
    day: dayToken.padStart(2, '0').slice(-2) || '--',
    month: monthToken.slice(0, 3).toUpperCase() || '---',
  }
}

type EventCardPreviewProps = Pick<
  EventCardProps,
  | 'title'
  | 'miniDescription'
  | 'ctaText'
  | 'hideCardCta'
  | 'isActive'
  | 'category'
  | 'image'
  | 'date'
  | 'className'
> & {
  onCtaClick: () => void
}

export function EventCardPreview({
  title,
  miniDescription,
  ctaText,
  hideCardCta,
  isActive,
  category,
  image,
  date,
  onCtaClick,
  className,
}: EventCardPreviewProps) {
  const resolvedTitle = toCapitalizedWords(title)
  const resolvedMiniDescription = toRichPreviewText(miniDescription)
  const resolvedCategory = toCapitalizedWords(category)
  const resolvedCtaText = toCapitalizedWords(ctaText)
  const { day, month } = getDateParts(date)

  return (
    <div
      className={cn(
        'font-poppins flex h-full w-full min-w-0 max-w-[300px] flex-col overflow-hidden rounded-[12px] border border-border bg-surface',
        className,
      )}
    >
      <div className="relative">
        <img
          src={image}
          alt={resolvedTitle}
          className="h-[84px] w-full rounded-t-[12px] object-cover"
        />
        <div className="absolute right-2 top-2 flex min-w-[38px] flex-col items-center rounded-[6px] border border-border bg-surface px-2 py-1 text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.08)]">
          <span className="text-[18px] font-[600] leading-[24px]">{day}</span>
          <span className="text-[12px] font-[500] leading-[16px]">{month}</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
          <span className="max-w-full break-words rounded-[32px] border border-border bg-muted px-2 py-[2px] text-[12px] font-[500] leading-[16px] text-foreground">
            {resolvedCategory}
          </span>
          <span
            className={`max-w-full break-words rounded-[32px] px-2 py-[2px] text-[12px] font-[500] leading-[16px] ${
              isActive
                ? 'bg-[#00B178] text-[#fff]'
                : 'bg-surface-muted text-foreground-muted'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <h3 className="min-w-0 break-words text-[14px] font-[600] leading-[20px] text-foreground">
          {resolvedTitle}
        </h3>
        <p className="mt-[8px] min-w-0 break-words whitespace-pre-line text-[12px] font-[400] leading-[16px] text-foreground-muted">
          {resolvedMiniDescription}
        </p>

        {!hideCardCta ? (
          <div className="mt-auto flex justify-end pt-4">
            <CardCtaButton text={resolvedCtaText} onClick={onCtaClick} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
