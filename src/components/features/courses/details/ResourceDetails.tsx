import type { ResourceType } from "@/server/resources/fetchAllResources"
import { Button } from "@/components/ui/button"

interface ResourceDetailBodyProps {
  data: ResourceType
}

export default function ResourceDetails({ data }: ResourceDetailBodyProps) {
  return (
    <div className="bg-white rounded-b-xl rounded-tr-xl border flex flex-col max-h-[600px]">
      <div className="p-6 flex flex-1 overflow-y-auto">
        <section className="flex-1 flex items-center justify-center">
          {data.notes ? (
            <div className="whitespace-pre-wrap leading-relaxed text-[#626A77] w-full">
              {data.notes}
            </div>
          ) : (<NoResourcesYet />)}
        </section>
      </div>
    </div>
  )
}






function NoResourcesYet() {
    return (
        <div className="bg-white flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <img src="/ResourceIconGrey.svg" alt="icon" className='h-24 w-24'/>
            <p className='font-semibold text-xl'>Nothing Here Yet</p>
            <p className='text-[#6B7280]'>Looks like the description isn’t available for this resource</p>
        </div>
    )
}