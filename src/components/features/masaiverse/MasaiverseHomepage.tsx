import MasaiverseSidebar from './MasaiverseSidebar/MasaiverseSidebar'
import type { ReactNode } from 'react'

type MasaiverseHomepageProps = {
  children: ReactNode
}

const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="w-full">
      <div className="flex w-full items-stretch gap-6">
        <div className="hidden w-[20%] shrink-0 md:block flex-1 max-h-[calc(100vh-130px)] sticky top-[100px]">
          <MasaiverseSidebar />
        </div>
        <div className="min-w-0 w-full md:w-[80%]">{children}</div>
      </div>
    </div>
  )
}

export default MasaiverseHomepage
