import { LectureDetailsHeader } from "./LectureDetailsHeader";
import type { LectureType } from "@/server/lectures/fetchAllLectures";

type LectureYetToStartProps = {
  lecture: LectureType
}

export function LectureYetToStart({lecture}: LectureYetToStartProps) {
    return(
        <div className="min-h-screen flex flex-col space-y-6 py-6 mx-[clamp(16px,6.25vw,80px)]">
            <LectureDetailsHeader data={lecture} />
            <div className="flex items-center justify-between border bg-white p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <img src="/LockIcon.svg" alt="zoom-icon" />
                    <div>
                        <p>Lecture hasn't started yet.</p>
                        <p className="text-[#6C7280]">This lecture will unlock 10 minutes before the scheduled time at 1:50 PM</p>
                    </div>
                </div>
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
