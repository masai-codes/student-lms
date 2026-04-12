import type { LectureType } from "@/server/lectures/fetchAllLectures";
import { LectureDetailsHeader } from "@/components/features/courses";
import { Button } from "@/components/ui/button";

type LectureWithJoinCTAProps = {
  lecture: LectureType
}

export function LectureWithJoinCTA({lecture}:LectureWithJoinCTAProps) {
    return (
        <div className="flex min-h-screen w-full flex-col space-y-6 py-6">
            <LectureDetailsHeader data={lecture} />
            <div className="flex items-center justify-between border bg-white p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <img src="/ZoomIcon.svg" alt="zoom-icon" />
                    <div>
                        <p>Please mute your microphone when joining the lecture.</p>
                        <p className="text-[#6962AC]">Zoom settings - Auto Mute</p>
                    </div>
                </div>
                <Button className="rounded-lg bg-[#6962AC] hover:bg-[#5A539C] transition-colors">Join Now</Button>
            </div>
            <div className="flex flex-1 items-center justify-center border bg-white p-4 rounded-xl">
                <div className="flex flex-col items-center justify-center gap-4">
                    <img src="/NothingYetPlaceholder.svg" alt="" className="h-32" />
                    <p className="text-xl font-medium">Nothing Here Yet</p>
                    <p className="max-w-[30ch] text-center text-[#6C7280]">
                        Notes, Summary, AI Tutor and Chat will be available after the lecture
                    </p>

                </div>
            </div>
        </div>
    )
}
