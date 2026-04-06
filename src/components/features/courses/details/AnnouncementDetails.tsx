import type { AnnouncementsType } from "@/server/announcements/fetchAllAnnouncement"

interface AnnouncementDetailBodyProps {
    data: AnnouncementsType
}

export default function AnnouncementDetail({ data }: AnnouncementDetailBodyProps) {
    return (
        <div className="bg-white rounded-b-xl rounded-xl border flex flex-col max-h-[700px]">

            {/* Scrollable Content */}
            <div className="p-6 flex flex-col gap-6 md:flex-row md:justify-between overflow-y-auto">

                {/* Left Content */}
                <div className="space-y-6">
                    <section>
                        <div className="whitespace-pre-wrap leading-relaxed text-[#626A77]">
                            {data.body}
                        </div>
                    </section>
                </div>
            </div>
        </div>

    )
}
