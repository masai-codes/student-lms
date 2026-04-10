import type { AssignmentsType } from "@/server/assignments/fetchAllAssignments"
import { Button } from "@/components/ui/button"

interface AssignmentDetailBodyProps {
    data: AssignmentsType
}

export default function AssignmentDetail({ data }: AssignmentDetailBodyProps) {
    return (
        <div className="bg-white rounded-b-xl rounded-tr-xl border flex flex-col max-h-[600px]">

            {/* Scrollable Content */}
            <div className="p-6 flex flex-col gap-6 md:flex-row md:justify-between overflow-y-auto">

                {/* Left Content */}
                <div className="space-y-6">
                    <section>
                        {data.instructions ? (
                            <div className="whitespace-pre-wrap leading-relaxed text-[#626A77]">
                                {data.instructions}
                            </div>
                        ) : (
                            <div>
                                <NoAssignmentInstruction />
                            </div>
                        )}



                    </section>
                </div>
            </div>

            {/* Sticky Bottom */}
            <div className="sticky bottom-0 bg-white border-t p-4 rounded-b-xl flex justify-end">
                <Button className="bg-[#6962AC] text-white hover:bg-[#5A539C] transition-colors">
                    Start assignment
                </Button>
            </div>

        </div>

    )
}




function NoAssignmentInstruction() {
    return(
        <div>
            <p className="font-semibold text-xl py-2">Instruction</p>
            <p className="text-[#4B5563]">This assignment does not require additional instructions. You can start the assignment below.</p>
        </div>
    )
}