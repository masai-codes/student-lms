import { useNavigate } from "@tanstack/react-router"
import type { CourseType } from "@/server/courses/fetchCourses"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"


export default function CourseCard({ course }: { course: CourseType }) {

    const navigate = useNavigate()

    const handleClick = () => {

        navigate({
            to: "/courses/$courseId/lectures",
            params: { courseId: JSON.stringify(course.id) },
            search: { page: undefined }
        })
    }


    return (
        <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-4">
                <img
                    src={course.meta?.["courseLogo"] ?? "https://i.pravatar.cc/80"}
                    alt={course.meta?.["courseLogo"] ?? "https://i.pravatar.cc/80"}
                    className="h-16 w-16 rounded-lg object-contain border"
                />
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-snug">
                        {course.name}
                    </h3>
                    <p className="text-sm font-medium text-[#4B5563]">By {course.program}</p>
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                {/** Replace course.id by actual course progess */}
                <Progress value={course.id} />
                <div className="flex items-center justify-between text-sm font-medium">
                    <p className="text-[#4B5563]">Course Progress</p>
                    <p className="text-[#1F2A37]">{course.id}%</p>
                </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-4">
                <Button variant="link" className="text-[#6962AC]">
                    Course Details
                </Button>
                <Button className="rounded-lg bg-[#6962AC] hover:bg-[#5A539C] transition-colors" onClick={handleClick}>
                    Start Learning
                </Button>
            </CardFooter>
        </Card>
    )
}