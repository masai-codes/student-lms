import type { EventCardProps } from "./types";
import { CardCtaButton } from "../shared/card-cta-button";

type EventCardPreviewProps = Pick<
  EventCardProps,
  "title" | "miniDescription" | "ctaText" | "isActive" | "category" | "image"
> & {
  onCtaClick: () => void;
};

export function EventCardPreview({
  title,
  miniDescription,
  ctaText,
  isActive,
  category,
  image,
  onCtaClick,
}: EventCardPreviewProps) {
  return (
    <div className="font-poppins flex h-full w-full max-w-[300px] flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
      <img
        src={image}
        alt={title}
        className="h-[84px] w-full rounded-t-[12px] object-cover"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-[32px] border border-[#E5E7EB] bg-[#E5E7EB] px-2 py-[2px] text-[12px] font-[500] leading-[16px] text-[#374151]">
            {category}
          </span>
          <span
            className={`rounded-[32px] px-2 py-[2px] text-[12px] font-[500] leading-[16px] ${
              isActive
                ? "bg-[#00B178] text-[#fff]"
                : "bg-[#F3F4F6] text-[#6B7280]"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <h3 className="text-[14px] font-[600] leading-[20px] text-[#111928]">
          {title}
        </h3>
        <p className="mt-[8px] line-clamp-2 text-[12px] font-[400] leading-[16px] text-[#4B5563]">
          {miniDescription}
        </p>

        <div className="mt-auto flex justify-end pt-4">
          <CardCtaButton text={ctaText} onClick={onCtaClick} />
        </div>
      </div>
    </div>
  );
}
