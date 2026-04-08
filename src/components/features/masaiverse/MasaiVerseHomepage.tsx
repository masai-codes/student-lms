import MasaiverseSidebar from './MasaiverseSidebar/MasaiverseSidebar'
import type { ReactNode } from 'react'

type MasaiverseHomepageProps = {
  children: ReactNode
}

const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="h-full w-full p-[24px]">
      <div className="flex h-full w-full items-stretch gap-[24px] overflow-hidden">
        <div className="h-full w-[20%] shrink-0 self-stretch overflow-y-auto">
          <MasaiverseSidebar />
        </div>
        <div className="min-w-0 h-full w-[80%] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default MasaiverseHomepage
