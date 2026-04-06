import { Calendar } from "lucide-react"
import type {WhatsNewType} from '@/server/whats-new/fetchWhatsNew'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"


export default function WhatsNew({ whatsnew }: { whatsnew: WhatsNewType}) {
  return (
    <div className="p-6 mx-auto space-y-6">

      {/* Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {whatsnew.subject}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(`${whatsnew.updatedAt}`).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} (IST)</span>
          </div>

          <Separator />

          {/* Description */}
          <p className="text-gray-700 font-medium">
            {whatsnew.subject}
          </p>

          <img src={whatsnew.image || "https://coding-platform.s3.amazonaws.com/dev/lms/tickets/25cfee5d-79d4-42a1-96a1-b289f457941d/pDvPcpAlCoGv3XIq.png"} alt="What's New" />

        </CardContent>
      </Card>
    </div>
  )
}
