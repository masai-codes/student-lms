import type { LectureType } from "@/server/lectures/fetchAllLectures"
import { Badge } from "@/components/ui/badge"
import { formatSqlDate } from "@/utils/generics"

type LectureDetailsHeaderProps = {
    data: LectureType
}

export function LectureDetailsHeader({ data }: LectureDetailsHeaderProps) {
    return (
        <div>
            <h1 className="text-2xl font-bold">{data.title}</h1>

            <div className="flex items-center gap-2 text-sm text-[#4B5563] mt-1">
                <span>Prof. Anvesh Jain</span>
                <span>•</span>
                <span>{formatSqlDate(data.schedule)}</span>
                <Badge variant="outline" className="bg-white text-[#6C7280]">Faculty Led</Badge>
                {data.optional === 0 ? (
                    <Badge variant="outline" className="bg-white text-[#6C7280]">Mandatory</Badge>

                ) : (
                    <Badge variant="outline" className="bg-white text-[#6C7280]">Recommended</Badge>

                )}
                {/* <Badge variant="outline" className="bg-white text-[#6C7280]">{data.module}</Badge> */}
            </div>

        </div>
    )
}