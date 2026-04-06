type MasaiverseContentProps = {
  title: string
  description: string
}

const MasaiverseContent = ({ title, description }: MasaiverseContentProps) => {
  return (
    <section className="min-h-[400px] flex-1 rounded-[16px] border border-[#E5E7EB] bg-[#fff] px-6 py-8">
      <h1 className="text-[24px] font-semibold text-[#111827]">{title}</h1>
      <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">{description}</p>
    </section>
  )
}

export default MasaiverseContent