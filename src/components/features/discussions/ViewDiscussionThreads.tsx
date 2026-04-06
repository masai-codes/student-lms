import type { ThreadType } from '@/server/discussions/fetchDiscussionThreads'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"



export function ViewDiscussionThreads({ thread }: { thread: ThreadType }) {

    console.log(thread,"👌")
    return (
        <div className='flex gap-4 border-b-1 mt-2 pb-2'>
            <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="text-3xl text-white bg-gray-400">CN</AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-1'>
                <p className='text-[#1F2A37] font-medium text-lg'>Mahesh Jain</p>
                <p className='text-[#374151]'>
                    I opened the file with Notepad++. I’m facing a similar issue. It pops up an error saying there’s no module called “numpy”, even though that’s a correct module. I need help on the same.
                </p>
                <p className='text-[#4B5563] text-sm'>8hr ago</p>
            </div>
        </div>
    )
}

export function ZeroDiscussionThreads(){
    return(
        <div className='bg-white'>
            <div className="flex flex-1 items-center justify-center border bg-white p-4 rounded-xl">
                <div className="flex flex-col items-center justify-center gap-4 p-12">
                    <img src="/ChatsCircle.svg" alt="" className="h-32" />
                    <p className="text-xl font-medium">No Responses Yet</p>
                    <p className="text-center text-[#6C7280]">
                        Be the first one to respond and help your peers.
                    </p>

                </div>
            </div>
        </div>
    )
}