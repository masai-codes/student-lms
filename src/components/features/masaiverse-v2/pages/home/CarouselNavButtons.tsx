import { CaretLeft, CaretRight } from '@phosphor-icons/react'

type CarouselNavButtonsProps = {
  /** Class Swiper binds the "prev" control to, e.g. `events-prev`. */
  prevClassName: string
  /** Class Swiper binds the "next" control to, e.g. `events-next`. */
  nextClassName: string
  /** Used for aria-labels: "Previous {label}" / "Next {label}". */
  label: string
}

const BASE =
  'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-masaiverse-orange shadow-sm [&.swiper-button-disabled]:cursor-default [&.swiper-button-disabled]:opacity-30'

/**
 * Prev/next controls overlaid on the vertical center of a carousel's left and
 * right edges (rather than a row below it), so they don't take extra height.
 * Swiper hides a control at the track's end via its disabled state.
 */
export default function CarouselNavButtons({
  prevClassName,
  nextClassName,
  label,
}: CarouselNavButtonsProps) {
  return (
    <>
      <button
        type="button"
        aria-label={`Previous ${label}`}
        className={`${prevClassName} ${BASE} left-0 -translate-x-1/2`}
      >
        <CaretLeft size={16} weight="bold" />
      </button>
      <button
        type="button"
        aria-label={`Next ${label}`}
        className={`${nextClassName} ${BASE} right-0 translate-x-1/2`}
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </>
  )
}
