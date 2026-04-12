import MasaiverseSidebar from './MasaiverseSidebar/MasaiverseSidebar'
import type { ReactNode } from 'react'

type MasaiverseHomepageProps = {
  children: ReactNode
}

const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="w-full">
      <div className="flex w-full items-stretch gap-6">
        <div className="w-[20%] shrink-0">
          <MasaiverseSidebar />
        </div>
        <div className="min-w-0 w-[80%]">{children}</div>
      </div>
    </div>
  )
}

export default MasaiverseHomepage
