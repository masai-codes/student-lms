import { useEffect, useState } from "react"
import { NotebookText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CarouselApi } from "@/components/ui/carousel"
import type { WeeklyScheduleResponse } from "@/server/dashboard/fetchWeeklySchedule"
import type { PendingTaskRow } from "@/server/dashboard/fetchPendingTasks"
import type { AnnouncementsType } from "@/server/announcements/fetchAllAnnouncement"
import { DashboardPanels } from "@/components/features/dashboard"
import { CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

type DashboardProps = {
    schedule: Promise<WeeklyScheduleResponse>;
    pendingTasks: Promise<Array<PendingTaskRow>>;
    announcements: Promise<Array<AnnouncementsType>>
};

export default function Dashboard({
    schedule,
    pendingTasks,
    announcements,
}: DashboardProps) {
    return (
        <div className="relative">
            {/* Learning banner */}
            <div className="md:absolute md:top-8 w-full">
                <LearningBannerCarousel />
            </div>

            {/* Main dashboard card */}
            <div className="border bg-white p-4 sm:p-5 rounded-t-3xl
                      md:absolute md:top-24 w-full">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    {/* Welcome */}
                    <div className="md:col-span-1 md:pl-6 text-center md:text-left">
                        <p className="text-lg sm:text-2xl text-[#544D4F]">Welcome</p>
                        <p className="text-xl sm:text-3xl font-semibold">
                            SuryaKumar 👋🏻
                        </p>
                    </div>

                    {/* Referral */}
                    <div className="md:col-span-2">
                        <ReferralBanner />
                    </div>
                </div>

                {/* Panels */}
                <div className="mt-4">
                    <DashboardPanels
                        schedule={schedule}
                        pendingTasks={pendingTasks}
                        announcements={announcements}
                    />
                </div>
            </div>
        </div>
    )
}

function LearningBannerCarousel() {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    const carouselData = [
        "Review and sign your learning agreement to start your course",
        "Complete your profile to unlock your first lesson",
        "Explore upcoming live sessions and events",
    ]

    useEffect(() => {
        if (!api) return
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        <div className="relative w-full">
            <Carousel setApi={setApi}>
                <CarouselContent>
                    {carouselData.map((text, index) => (
                        <CarouselItem key={index}>
                            <div
                                className="flex flex-col sm:flex-row sm:items-center
                           bg-[linear-gradient(90.38deg,#4B4396_2.62%,#6962AC_100%)]
                           p-4 sm:pt-4 sm:pb-8 sm:px-8 gap-3 sm:gap-6
                           rounded-t-3xl"
                            >
                                <span className="flex items-center gap-2 text-sm sm:text-base">
                                    <NotebookText className="text-white" size={18} />
                                    <p className="text-white">{text}</p>
                                </span>

                                <Button
                                    variant="outline"
                                    className="w-fit text-[#6962AC] self-start sm:self-auto"
                                >
                                    Start Learning
                                </Button>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Controls */}
                <div className="absolute right-3 bottom-2 sm:top-4 sm:right-16
                        flex items-center gap-2 sm:gap-3">
                    <CarouselPrevious
                        className="h-7 w-7 sm:h-8 sm:w-8
                       rounded-lg bg-white/20 text-white
                       border-none hover:bg-white/30"
                    />

                    {/* Dots */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: count }).map((_, i) => (
                            <span
                                key={i}
                                className={`h-2 w-2 rounded-full transition ${current === i + 1 ? "bg-white" : "bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>

                    <CarouselNext
                        className="h-7 w-7 sm:h-8 sm:w-8
                       rounded-lg bg-white/20 text-white
                       border-none hover:bg-white/30"
                    />
                </div>
            </Carousel>
        </div>
    )
}










function ReferralBanner() {

    const cardContent = [
        {
            imgURL: 'Referral.svg',
            REFERRAL_HEADING: "Be the friend who brings opportunities, not just memes.",
            REFERRAL_SUBHEADING: "Help a friend start learning and earn rewards"
        },
        {
            imgURL: 'Masaiverse.svg',
            REFERRAL_HEADING: "Be the friend who brings opportunities, not just memes.",
            REFERRAL_SUBHEADING: "Help a friend start learning and earn rewards"
        }
    ]

    return (
        <Carousel className="relative">
            <CarouselContent>
                {cardContent.map((content, key) => (
                    <CarouselItem key={key}>
                        <CardContent>
                            <div className="flex items-center gap-3 rounded-xl border border-[#C3DDFD] bg-[linear-gradient(90deg,#EAF4FF_0%,#F5FAFF_45%,#FFFFFF_100%)] px-5 py-4">
                                <img src={content.imgURL} alt="Referral" className="h-8 w-8" />

                                <div>
                                    <p className="font-bold">{content.REFERRAL_HEADING}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {content.REFERRAL_SUBHEADING}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </CarouselItem>
                ))}

            </CarouselContent>

            {/* Move buttons close to card */}
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10" />
        </Carousel>
    )
}
