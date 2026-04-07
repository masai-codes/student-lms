import type { ClubCardProps } from "./types";
import { CardCtaButton } from "../shared/card-cta-button";

type ClubCardPreviewProps = Pick<
  ClubCardProps,
  "domain" | "name" | "imageUrl" | "miniDescription" | "ctaText" | "ctaTheme"
> & {
  onCtaClick: () => void;
};

export function ClubCardPreview({
  domain,
  name,
  imageUrl,
  miniDescription,
  ctaText,
  ctaTheme,
  onCtaClick,
}: ClubCardPreviewProps) {
  return (
    <div className="font-poppins w-full max-w-[298px] rounded-[12px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="bg-[#EBF5FF] p-[12px] rounded-[50%]">
          <img
            src={imageUrl}
            alt={name}
            className="w-[24px] h-[24px] object-cover rounded-[8px]"
          />
        </div>
        <p className="px-[8px] text-[12px] font-[500] leading-[16px] font-poppins rounded py-[4px] border border-[#E5E7EB] rounded-[32px] text-center">
          {domain}
        </p>
      </div>
      <div className="mt-[12px]">
        <h3 className="text-[16px] font-[600] leading-[24px] font-poppins">
          {name}
        </h3>
        <p className="mt-[4px] text-[14px] font-[400] leading-[20px] font-poppins text-[#6B7280]">
          {miniDescription}
        </p>
      </div>
      <div className="flex justify-end">
        <CardCtaButton
          text={ctaText}
          onClick={onCtaClick}
          theme={ctaTheme}
          className="mt-[20px] leading-[12px]"
        />
      </div>
    </div>
  );
}
