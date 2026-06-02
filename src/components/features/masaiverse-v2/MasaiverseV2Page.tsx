import MasaiverseV2LeftSection from './MasaiverseV2LeftSection'
import type { ReactNode } from 'react'

type MasaiverseV2PageProps = {
  children: ReactNode
}

/**
 * Masaiverse v2 shell layout.
 *
 * Persistent left sidebar + a content area that renders the active route
 * (passed as `children`, i.e. the route `<Outlet />`). The container spans
 * the full viewport width (no max-width cap), pulled up to meet the navbar
 * with no top margin. Left and right sit flush, separated only by the
 * sidebar's divider border.
 */
export default function MasaiverseV2Page({ children }: MasaiverseV2PageProps) {
  return (
    <div className="-mt-6 w-full md:-mt-[24px]">
      <div className="flex w-full items-stretch">
        <MasaiverseV2LeftSection />
        <section className="min-w-0 w-full bg-[#FBF7F2] p-6 md:w-[80%]">
          {children}
        </section>
      </div>
    </div>
  )
}
