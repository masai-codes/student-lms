import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DashboardBannerItem } from '@/server/api/dashboard/getDashboardBanners.service'

function BannerSlideCard({ banner }: { banner: DashboardBannerItem }) {
  const inner = (
    <div
      className="rounded-[16px] border px-6 py-4 flex items-center gap-3 min-h-[84px] w-full"
      style={{
        borderColor: '#C3DDFD',
        background: 'linear-gradient(90deg, #E1EFFE 0%, #FFFFFF 100%)',
      }}
    >
      {banner.imageUrl ? (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          width={48}
          height={48}
          className="size-12 shrink-0 object-contain"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <div className="min-w-0">
        <p className="font-bold text-gray-900 leading-snug">{banner.title}</p>
        {banner.description ? (
          <p className="text-sm text-gray-500 mt-0.5">{banner.description}</p>
        ) : null}
      </div>
    </div>
  )

  if (banner.ctaUrl) {
    return (
      <a
        href={banner.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[16px]"
        aria-label={banner.title}
      >
        {inner}
      </a>
    )
  }

  return inner
}

export function DashboardBannerSection({ banners }: { banners: Array<DashboardBannerItem> }) {
  const [current, setCurrent] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')

  if (banners.length === 0) return null

  const count = banners.length
  const slide = banners[current % count]

  const touchStartX = useRef<number | null>(null)

  const prev = () => { setSlideDir('left'); setCurrent((c) => (c - 1 + count) % count) }
  const next = () => { setSlideDir('right'); setCurrent((c) => (c + 1) % count) }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count <= 1) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 40) return
    if (diff > 0) next(); else prev()
    touchStartX.current = null
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Desktop: arrows sit on the card border; mobile: swipe only */}
      <div className="relative w-full">
        {count > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Previous banner"
            className="hidden md:flex absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center size-8 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div
          className="w-full overflow-hidden rounded-[16px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            key={slide.id}
            className={slideDir === 'right' ? 'animate-banner-slide-in-right' : 'animate-banner-slide-in-left'}
          >
            <BannerSlideCard banner={slide} />
          </div>
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="hidden md:flex absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center size-8 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Dots below the banner */}
      {count > 1 ? (
        <div className="flex items-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all focus-visible:outline-none ${
                i === current ? 'size-2 bg-primary-600' : 'size-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
