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
  spaceBetween = 16,
  navKey,
  navLabel,
}: ResponsiveCardCarouselProps<T>) {
  const maxPerView = Math.max(
    slidesPerView,
    ...Object.values(breakpoints ?? {}).map((b) => b.slidesPerView),
  )
  const showNav = items.length > Math.floor(maxPerView)

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
        slidesPerView={slidesPerView}
        breakpoints={breakpoints}
        className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
      >
        {items.map((item, index) => (
          <SwiperSlide key={getKey(item, index)} className="!h-auto">
            {renderItem(item, index)}
          </SwiperSlide>
        ))}
      </Swiper>

      {showNav ? (
        <CarouselNavButtons
          prevClassName={`${navKey}-prev`}
          nextClassName={`${navKey}-next`}
          label={navLabel}
        />
      ) : null}
    </div>
  )
}
