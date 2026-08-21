import { BookIcon, CirclePlayIcon, NotepadTextIcon } from 'lucide-react'
import { type CSSProperties } from 'react'

export type SupportedIcons = 'lecture' | 'assignment' | 'resource'

const icons = {
  lecture: CirclePlayIcon,
  assignment: NotepadTextIcon,
  resource: BookIcon,
}

export function CommonIcon({
  name,
  className,
  style,
}: {
  name: SupportedIcons
  className?: string
  style?: CSSProperties
}) {
  const Icon = icons[name]

  return <Icon className={className} style={style} />
}

/**
 * Per-type icon tint for `lecture` / `assignment` / `resource` glyphs. Light
 * keeps the three distinct hues (blue / teal / orange); dark collapses them
 * onto the theme accent (`text-brand` = red) so listings read as one
 * red-and-black system — the icon *shape* still carries the content type.
 * Must be applied via `className` (not `style`) so `dark:` can win.
 */
export const LEARN_TYPE_ICON_CLASS: Record<SupportedIcons, string> = {
  lecture: 'text-[#3F83F8] dark:text-brand',
  assignment: 'text-[#16BDCA] dark:text-brand',
  resource: 'text-[#FF8A4C] dark:text-brand',
}

/**
 * `public/AnnouncementIcon.svg`, inlined so the glyph can be tinted with
 * `currentColor`. As an `<img>` its baked-in `#6962AC` fill could not follow
 * the theme — it stayed purple in dark, while critical announcements (reddened
 * by a CSS `filter`) did not, so lists rendered a mix of purple and red icons.
 * The path is byte-identical to the asset, and `text-brand` resolves to the
 * same `#6962ac` in light, so light rendering is unchanged.
 */
export function AnnouncementIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M38.75 18.75C38.7479 16.7615 37.9571 14.855 36.551 13.449C35.1449 12.0429 33.2385 11.2521 31.25 11.25H25.0312C24.5766 11.2234 16.6531 10.6656 9.10781 4.33749C8.74345 4.03148 8.29932 3.8358 7.82761 3.77345C7.35589 3.7111 6.87618 3.78466 6.44482 3.98549C6.01346 4.18632 5.64837 4.50608 5.39244 4.90721C5.1365 5.30834 5.00036 5.77417 5 6.24999V31.25C5.00006 31.7259 5.13599 32.192 5.39181 32.5933C5.64762 32.9947 6.01269 33.3147 6.44411 33.5157C6.87553 33.7167 7.35536 33.7904 7.82722 33.7281C8.29908 33.6658 8.74335 33.4702 9.10781 33.1641C15.0094 28.2141 21.1391 26.7953 23.75 26.3984V31.3547C23.7495 31.7666 23.8508 32.1723 24.0448 32.5357C24.2389 32.8991 24.5198 33.2089 24.8625 33.4375L26.5812 34.5828C26.9135 34.8045 27.294 34.9434 27.6909 34.9879C28.0878 35.0324 28.4896 34.9811 28.8627 34.8383C29.2357 34.6955 29.5691 34.4655 29.8349 34.1674C30.1008 33.8693 30.2913 33.5119 30.3906 33.125L32.2297 26.1937C34.034 25.9537 35.6897 25.0666 36.889 23.6974C38.0883 22.3283 38.7496 20.5702 38.75 18.75ZM7.5 31.2391V6.24999C14.1891 11.8609 21.0359 13.2812 23.75 13.6312V23.8625C21.0391 24.2187 14.1938 25.6359 7.5 31.2391ZM27.9688 32.4891V32.5062L26.25 31.3609V26.25H29.625L27.9688 32.4891ZM31.25 23.75H26.25V13.75H31.25C32.5761 13.75 33.8479 14.2768 34.7855 15.2145C35.7232 16.1521 36.25 17.4239 36.25 18.75C36.25 20.0761 35.7232 21.3478 34.7855 22.2855C33.8479 23.2232 32.5761 23.75 31.25 23.75Z" />
    </svg>
  )
}
