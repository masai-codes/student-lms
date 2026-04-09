import type { ClubCardProps } from "./types";
import { CardCtaButton } from "../shared/card-cta-button";
import { CheckCircle } from "@phosphor-icons/react";

function toCapitalizedWords(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

type ClubCardPreviewProps = Pick<
  ClubCardProps,
  | "domain"
  | "name"
  | "imageUrl"
  | "miniDescription"
  | "shouldCompress"
  | "showSuccessIcon"
  | "ctaText"
  | "ctaTheme"
> & {
  onCtaClick: () => void;
};

export function ClubCardPreview({
  domain,
  name,
  imageUrl,
  miniDescription,
  shouldCompress,
  showSuccessIcon,
  ctaText,
  ctaTheme,
  onCtaClick,
}: ClubCardPreviewProps) {
  const resolvedName = toCapitalizedWords(name);
  const resolvedDomain = toCapitalizedWords(domain);
  const resolvedMiniDescription = toCapitalizedWords(miniDescription);
  const resolvedCtaText = toCapitalizedWords(ctaText);

  const iconBlock = (
    <div className="relative">
      <div className="bg-[#EBF5FF] rounded-[50%] p-[12px]">
        <img
          src={imageUrl}
          alt={resolvedName}
          className="w-[24px] h-[24px] object-cover rounded-[8px]"
        />
      </div>
      {showSuccessIcon ? (
        <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white">
          <CheckCircle size={16} weight="fill" color="#00B178" />
        </span>
      ) : null}
    </div>
  );

  if (shouldCompress) {
    return (
      <div className="font-poppins flex h-full w-full max-w-[300px] rounded-[12px] border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-start gap-3">
          {iconBlock}
          <div className="min-w-0">
            <h3 className="text-[16px] font-[600] leading-[24px] font-poppins">
              {resolvedName}
            </h3>
            <p className="mt-[4px] w-fit px-[8px] py-[4px] text-[12px] font-[500] leading-[16px] rounded-[32px] border border-[#E5E7EB] text-center">
              {resolvedDomain}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-poppins flex h-full w-full max-w-[300px] flex-col rounded-[12px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-start justify-between">
        {iconBlock}
        <p className="px-[8px] text-[12px] font-[500] leading-[16px] font-poppins rounded py-[4px] border border-[#E5E7EB] rounded-[32px] text-center">
          {resolvedDomain}
        </p>
      </div>
      <div className="mt-[12px]">
        <h3 className="text-[16px] font-[600] leading-[24px] font-poppins">
          {resolvedName}
        </h3>
        <p className="mt-[4px] text-[14px] font-[400] leading-[20px] font-poppins text-[#6B7280]">
          {resolvedMiniDescription}
        </p>
      </div>
      <div className="mt-auto flex justify-end pt-[20px]">
        <CardCtaButton
          text={resolvedCtaText}
          onClick={onCtaClick}
          theme={ctaTheme}
          className="leading-[12px]"
        />
      </div>
    </div>
  );
}
