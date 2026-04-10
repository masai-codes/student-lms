import type { DiscussionType } from '@/server/discussions/fetchAllDiscussionsByEntityId'


export default function DiscussionView({ discussion }: { discussion: DiscussionType }) {
    return (
        <div>
            <div className='bg-white p-4 border rounded-xl'>
                <div className='flex items-start justify-between'>
                    <div>
                        <h2 className='text-xl font-semibold'>How to return data in specific format from Python Flask API?</h2>
                        <div className='flex items-center gap-3 text-sm font-medium my-2'>
                            <p className='text-[#4B5563]'>Rohit Kumar</p>
                            <p className='text-[#4B5563]'>&bull;</p>
                            <p className='text-[#4B5563]'>IIM-M DM</p>
                            <p className='p-1 rounded-full text-[#6C7280] border'>Lecture</p>
                            <p className='p-1 rounded-full border border-[#DEF7EC] text-[#0B9F6E]'>Ongoing</p>
                        </div>
                    </div>
                    <div className='p-2 border rounded-lg'>
                        <img src="/BookmarkSimple.svg" alt="bookmark-icon"/>
                    </div>
                </div>
                <p className='text-[#374151] my-2'>I downloaded this file from github: https://github.com/carykh/Abacaba and for it to work, I need to run "python processData.py", but I can't get it to work!It keeps saying there's no module named "numpy", and I was 100% sure that the correct module would be in the code somewhere, so I opened up the file for the script in Notepad++. I don't understand any of this information. HELP NEEDED!</p>
                <div className='flex gap-2 justify-end'>
                    <img src="/RedirectIcon.svg" alt="redirect-icon" />
                    <p className='text-[#7A74B6] hover:cursor-pointer'>Go to lectures</p>
                </div>
            </div>
            <div>

            </div>
        </div>
    )
}