export default function CommunityDiscussionsEmptyState() {
  return (
    <section className="relative rounded-[16px]">
      <img
        src=" https://masai-drive-uploads-prod.s3.ap-south-1.amazonaws.com/drive/69c5405a1048890fc9f0c63c/1775755878407-f6f422f682596cc1.png"
        alt="Community discussions background"
        className="rounded-[8px]"
      />
      <div className="absolute left-1/2 top-1/2 max-w-[325px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-[#EF8833] bg-[#FFF8F1] p-[16px] text-center">
        <h5 className="text-[16px] font-[600] leading-[24px] text-[#111928]">
          Join a club to unlock discussions
        </h5>
        <p className="text-[14px] font-[400] leading-[20px] text-[#475569] mt-[4px]">
          Become a member of any club to access and participate in discussions
        </p>
      </div>
    </section>
  )
}
