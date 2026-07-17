import MasaiverseV2LeftSection from './MasaiverseV2LeftSection'
import type { ReactNode } from 'react'

type MasaiverseV2PageProps = {
  children: ReactNode
}

/**
 * Masaiverse v2 shell layout.
 *
 * Persistent left sidebar + a content area that renders the active route
 * (passed as `children`, i.e. the route `<Outlet />`). The shell spans the
 * full viewport width (no max-width cap) and, via `flex-1` + `items-stretch`,
 * fills the remaining viewport height — so the sidebar (white) and content
 * (#FBF7F2) backgrounds reach the bottom even when content is short. Left and
 * right sit flush, separated only by the sidebar's divider border.
 */
export default function MasaiverseV2Page({ children }: MasaiverseV2PageProps) {
  return (
    <div className="flex w-full flex-1 items-stretch">
      <MasaiverseV2LeftSection />
      <section className="min-w-0 w-full bg-[#FBF7F2] p-4 sm:p-5 dark:bg-background md:w-[80%] md:p-6">
        {children}
      </section>
    </div>
  )
}
