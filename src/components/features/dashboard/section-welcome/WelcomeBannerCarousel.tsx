import type { WelcomeBanner } from '../shared/types'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface WelcomeBannerCarouselProps {
  banners: Array<WelcomeBanner>
}

// Light-blue promotional carousel that sits beside the welcome greeting.
// Renders nothing when there are no banners to show.
export function WelcomeBannerCarousel({ banners }: WelcomeBannerCarouselProps) {
  if (banners.length === 0) return null

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <div className="relative rounded-2xl bg-[#EBF3FE] px-12 py-5">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl">
                  🪙
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 md:text-base">
                    {banner.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
                    {banner.subtitle}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-2 size-8 border-none bg-white/70 text-gray-500 shadow-sm hover:bg-white" />
        <CarouselNext className="right-2 size-8 border-none bg-white/70 text-gray-500 shadow-sm hover:bg-white" />
      </div>
    </Carousel>
  )
}
