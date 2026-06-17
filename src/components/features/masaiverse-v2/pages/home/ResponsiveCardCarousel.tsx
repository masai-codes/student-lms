import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import type { ReactNode } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'

/** Per-breakpoint `slidesPerView` overrides, keyed by min-width (px). */
type SlidesBreakpoints = Record<number, { slidesPerView: number }>

type ResponsiveCardCarouselProps<T> = {
  items: Array<T>
  /** Stable key per item (used for the slide key). */
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  /**
   * Slides visible on the smallest screens. Fractional values (e.g. 1.15) let
   * the next card peek in, signalling the row is swipeable on touch devices.
   */
  slidesPerView?: number
  /** Larger `slidesPerView` at wider breakpoints, e.g. `{ 1024: { slidesPerView: 4 } }`. */
  breakpoints?: SlidesBreakpoints
  /**
   * Fixed/max per-slide width (Tailwind classes with `!` to beat Swiper's base
   * `width: 100%`, e.g. `'!w-[200px] sm:!w-[240px]'`).
   * When set, the carousel switches to `slidesPerView="auto"`: every card keeps
   * this width and the track packs in as many as fit (rest scroll), instead of
   * stretching a fixed count to fill the row. Use it to stop cards/images from
   * sprawling on wide screens. Takes precedence over `slidesPerView`/`breakpoints`.
   */
  slideWidth?: string
  spaceBetween?: number
  /** Nav-button class prefix so multiple carousels on a page stay independent. */
  navKey: string
  /** Accessible label suffix: "Previous {navLabel}" / "Next {navLabel}". */
  navLabel: string
}

/**
 * Shared "grid that becomes a swiper on mobile" primitive. Renders its items as
 * a single Swiper track — fractional `slidesPerView` on phones (swipe to see the
 * rest), widening to the full column count at desktop breakpoints so the row
 * reads as the original grid. Items are rendered exactly once (no desktop/mobile
 * duplication), so it stays test- and DOM-friendly.
 *
 * Prev/next controls appear only when the items can't all fit at the widest
 * breakpoint, so desktop layouts that show everything aren't cluttered with
 * disabled buttons.
 */
export default function ResponsiveCardCarousel<T>({
  items,
  getKey,
  renderItem,
  slidesPerView = 1.15,
  breakpoints,
  slideWidth,
  spaceBetween = 16,
  navKey,
  navLabel,
}: ResponsiveCardCarouselProps<T>) {
  // Auto-width mode caps each card's width; fixed-count mode stretches N slides.
  const autoWidth = slideWidth != null
  const maxPerView = Math.max(
    slidesPerView,
    ...Object.values(breakpoints ?? {}).map((b) => b.slidesPerView),
  )
  // In auto-width mode we can't know up front how many fit, so always wire up
  // navigation; Swiper's `watchOverflow` hides the controls when they all fit.
  const showNav = autoWidth ? items.length > 1 : items.length > Math.floor(maxPerView)

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        navigation={
          showNav
            ? { prevEl: `.${navKey}-prev`, nextEl: `.${navKey}-next` }
            : false
        }
        spaceBetween={spaceBetween}
        slidesPerView={autoWidth ? 'auto' : slidesPerView}
        breakpoints={autoWidth ? undefined : breakpoints}
        // Resolve breakpoints against the carousel's own width, not the window,
        // so the cards reflow when an open side panel shrinks the content column.
        breakpointsBase="container"
        className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={getKey(item, index)}
            className={autoWidth ? `!h-auto ${slideWidth}` : '!h-auto'}
          >
            {renderItem(item, index)}
          </SwiperSlide>
        ))}
      </Swiper>

      {showNav ? (
        <CarouselNavButtons
          prevClassName={`${navKey}-prev`}
          nextClassName={`${navKey}-next`}
          label={navLabel}
          trackingId={navKey}
        />
      ) : null}
    </div>
  )
}
