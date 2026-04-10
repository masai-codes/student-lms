import { useEffect, useState } from 'react'
import { Await, Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import type { WeeklyScheduleResponse } from '@/server/dashboard/fetchWeeklySchedule'
import type { AssignmentsType } from '@/server/assignments/fetchAllAssignments'
import type { AnnouncementsType } from '@/server/announcements/fetchAllAnnouncement'
import type { LectureType } from '@/server/lectures/fetchAllLectures'
import type { PendingTaskRow } from '@/server/dashboard/fetchPendingTasks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { capitalize, formatTimeInHHMM, getWeeklyRange } from "@/utils/generics"
import { Separator } from '@/components/ui/separator'


type DashboardProps = {
    schedule: Promise<WeeklyScheduleResponse>;
    pendingTasks: Promise<Array<PendingTaskRow>>;
    announcements: Promise<Array<AnnouncementsType>>
};

export default function DashboardPanels({ schedule, pendingTasks, announcements }: DashboardProps) {

    const [dateRange, setDateRange] = useState<string>("");

    useEffect(() => {
        getWeeklyRange().then((range) => setDateRange(range));
    }, []);


    console.log(announcements, "❤️")


    return (
        <div className="grid h-screen grid-cols-1 gap-8 bg-muted/40 p-6 md:grid-cols-3 mb-3 bg-white">
            {/* LEFT COLUMN */}
            <div className="md:col-span-2 flex flex-col gap-6">
                {/* Schedule */}
                <Card className='bg-[#F9FAFB]'>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Your Schedule</CardTitle>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold">
                                {dateRange}
                            </p>
                            <Separator className="flex-1" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 max-h-80 overflow-y-auto">
                        <Await promise={schedule} fallback={<div>Loading...123</div>}>
                            {(resolvedSchedule) =>
                                Object.entries(resolvedSchedule).map(
                                    ([dateKey, dayData], index) => (
                                        <ScheduleItem
                                            key={dateKey}
                                            index={index}
                                            dateKey={dateKey}
                                            dayData={dayData}
                                        />
                                    )
                                )
                            }
                        </Await>


                    </CardContent>
                </Card>


                {/* Pending Tasks */}
                <Card className="flex bg-[#F9FAFB]">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <div className="flex gap-2 items-center">
                            <CardTitle className="text-lg font-bold">Pending Tasks</CardTitle>

                            <Await promise={pendingTasks} fallback={<div></div>}>
                                {(resolvedPendingTasks) =>
                                    resolvedPendingTasks.length > 0 && (
                                        <p className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm font-medium text-white">
                                            {resolvedPendingTasks.length}
                                        </p>
                                    )
                                }
                            </Await>
                        </div>

                        <Link to="/whats-new">
                            <p className="text-sm text-[#6962AC] font-medium">View all</p>
                        </Link>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4 max-h-60 overflow-y-auto">
                        <div className="space-y-3">
                            <Await promise={pendingTasks} fallback={<div>Loading...</div>}>
                                {(resolvedPendingTasks) =>
                                    resolvedPendingTasks.length === 0 ? (
                                        <NoPendingTasksPlaceholder />
                                    ) : (
                                        resolvedPendingTasks.map((item) => (
                                            <PendingTasksItem
                                                key={item.assignments.id}
                                                data={item.assignments}
                                            />
                                        ))
                                    )
                                }
                            </Await>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6">

                {/* Announcements */}
                <Card className='bg-[#F9FAFB]'>
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">Announcements</CardTitle>
                        <Link to='/announcements' search={{ page: undefined }}>
                            <p className='text-sm text-[#6962AC] font-medium'>View all</p>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 max-h-50 overflow-y-auto">
                        <Await promise={announcements} fallback={<div>Loading...123</div>}>
                            {(announcementsResolved) =>
                                announcementsResolved.length === 0 ? (
                                    <NoAnnouncementPlaceholder />
                                ) : (
                                    announcementsResolved.map((item) => (
                                        <AnnouncementScheduleItem
                                            key={item.id}
                                            data={item}
                                        />
                                    ))
                                )
                            }
                        </Await>



                    </CardContent>
                </Card>


                {/* Product Updates */}
                <Card className='bg-[#F9FAFB]'>
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">Product Updates</CardTitle>
                        <Link to='/whats-new'>
                            <p className='text-sm text-[#6962AC] font-medium'>View all</p>
                        </Link>
                    </CardHeader>
                    <Link to='/whats-new'>
                        <CardContent className='bg-white'>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <img src="VerifiedBadge.svg" alt="icon" />
                                    <p className="text-sm font-medium">
                                        Product Update | Get access to all platforms of Masai at one place!
                                    </p>
                                </div>
                                <ChevronRight size={32} />
                            </div>
                        </CardContent>
                    </Link>
                </Card>

            </div>
        </div>
    )
}
interface ScheduleItemProps {
    index: number;
    dateKey: string;
    dayData: {
        lectures: Array<LectureType>;
        assignments: Array<AssignmentsType>;
    };
}

function ScheduleItem({
    index,
    dateKey,
    dayData,
}: ScheduleItemProps) {
    const [day, dd] = dateKey.split("-");

    const isToday = index === 0;

    const hasRecords =
        dayData.lectures.length > 0 ||
        dayData.assignments.length > 0;

    return (
        <div className="flex gap-4 items-start">
            {/* Date box */}
            <div
                className={`flex flex-col items-center justify-center p-1 my-4 rounded-lg min-w-[52px]
          ${isToday ? "bg-[#3F83F8] text-white" : "text-black"}
        `}
            >
                <p className="font-semibold">{day}</p>
                <p className="font-normal">{dd}</p>
            </div>

            {/* Right section */}
            <div className="flex flex-col gap-3 flex-1">
                {/* Empty state */}
                {!hasRecords && (
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-sm text-center text-muted-foreground">
                        No sessions scheduled for the day
                    </div>
                )}

                {/* Lectures */}
                {dayData.lectures.map((lecture) => (
                    <div
                        key={`lecture-${lecture.id}`}
                        className="flex items-start gap-2 bg-white border border-[#E5E7EB] rounded-lg p-3"
                    >
                        <img
                            className="mt-[0.25em] h-6"
                            src={
                                lecture.type === "reading"
                                    ? "ResourceIcon.svg"
                                    : "LectureIcon.svg"
                            }
                            alt="lecture-icon"
                        />

                        <div>
                            <p className="text-lg font-medium">
                                {lecture.title}
                            </p>

                            <div className="flex items-center gap-2 text-sm font-medium mt-2">
                                <p className="text-[#665C5C]">
                                    {formatTimeInHHMM(lecture.schedule)} -{" "}
                                    {formatTimeInHHMM(lecture.concludes)}
                                </p>

                                <p className="text-[#4B5563]">&bull;</p>

                                <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                                    {capitalize(lecture.category)}
                                </p>

                                <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                                    {capitalize(lecture.type)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Assignments */}
                {dayData.assignments.map((assignment) => (
                    <div
                        key={`assignment-${assignment.id}`}
                        className="flex items-start gap-2 bg-white border border-[#E5E7EB] rounded-lg p-3"
                    >
                        <img
                            className="mt-[0.25em] h-6"
                            src="AssignmentIcon.svg"
                            alt="assignment-icon"
                        />

                        <div>
                            <p className="text-lg font-medium">
                                {assignment.title}
                            </p>

                            <div className="flex items-center gap-2 text-sm font-medium mt-2">
                                <p className="text-[#665C5C]">
                                    {formatTimeInHHMM(assignment.schedule)} -{" "}
                                    {formatTimeInHHMM(assignment.concludes)}
                                </p>

                                <p className="text-[#4B5563]">&bull;</p>

                                <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                                    {capitalize(assignment.category)}
                                </p>

                                <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                                    {capitalize(assignment.type)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function NoPendingTasksPlaceholder() {
    return (
        <CardContent className="flex h-full py-8 items-center justify-center text-sm text-muted-foreground">
            No announcements yet
        </CardContent>
    )
}

type PendingTasksItemProps = {
    data: AssignmentsType;
};


function PendingTasksItem({ data }: PendingTasksItemProps) {
    return (
        <div className="flex items-start gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-lg p-3">
            <img className="mt-[0.25em] h-6" src="LectureIcon.svg" alt="" />

            <div>
                <p className="text-lg font-medium">{data.title}</p>

                <div className="flex items-center gap-2 text-sm font-medium mt-2">
                    <p className="text-[#665C5C]">
                        {data.startTime} - {data.endTime}
                    </p>

                    <p className="text-[#4B5563]">&bull;</p>

                    <p className="text-[#4B5563]">
                        {data.platform}
                    </p>

                    {data.category && (
                        <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                            {data.category}
                        </p>
                    )}

                    {data.tags && (
                        <p className="bg-[#F9FAFB] p-1 rounded-full text-[#6C7280]">
                            {data.tags}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}



function NoAnnouncementPlaceholder() {
    return (
        <CardContent className="flex h-full items-center p-6 justify-center text-sm text-muted-foreground">
            No announcements yet
        </CardContent>
    )
}



type AnnouncementScheduleItemProps = {
    data: AnnouncementsType;
};


function AnnouncementScheduleItem({ data }: AnnouncementScheduleItemProps) {
    return (
        <>
            <div className="flex items-start gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-lg p-3">
                <div className="min-w-0">
                    <p className="text-lg font-medium truncate">
                        {data.subject}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-[#4B5563] text-sm whitespace-nowrap">
                            Prof. Anvesh Jain
                        </p>
                        <p className="bg-[#EBF5FF] px-2 py-1 rounded-full text-[#3F83F8] text-xs whitespace-nowrap">
                            For you
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
