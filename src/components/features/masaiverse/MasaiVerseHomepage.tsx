import MasaiverseSidebar from './MasaiverseSidebar/MasaiverseSidebar'
import type { ReactNode } from 'react'

type MasaiverseHomepageProps = {
  children: ReactNode
}

export const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="w-full p-[24px]">
      <div className="flex w-full items-stretch gap-[24px]">
        <div className="w-[20%] shrink-0">
          <MasaiverseSidebar />
        </div>
        <div className="min-w-0 w-[80%]">{children}</div>
      </div>
    </div>
  )
}
