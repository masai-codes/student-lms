import MasaiverseV2LeftSection from './MasaiverseV2LeftSection'
import type { ReactNode } from 'react'

type MasaiverseV2PageProps = {
  children: ReactNode
}

/**
 * Masaiverse v2 shell layout.
 *
 * Persistent left sidebar + a content area that renders the active route
 * (passed as `children`, i.e. the route `<Outlet />`). A centered container
 * matches the old masaiverse width, pulled up to meet the navbar with no
 * top margin. Left and right sit flush, separated only by the sidebar's
 * divider border.
 */
export default function MasaiverseV2Page({ children }: MasaiverseV2PageProps) {
  return (
    <div className="mx-auto -mt-6 w-full max-w-[1440px] px-4 md:-mt-[24px] md:px-6">
      <div className="flex w-full items-stretch">
        <MasaiverseV2LeftSection />
        <section className="min-w-0 w-full p-6 md:w-[80%]">{children}</section>
      </div>
    </div>
  )
}
