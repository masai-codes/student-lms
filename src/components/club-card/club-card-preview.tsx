import { cn } from "@/lib/utils";

import type { ClubCardProps } from "./types";
import { CardCtaButton } from "../shared/card-cta-button";
import { CheckCircle } from "@phosphor-icons/react";
import { toRichPreviewText } from "./rich-content";

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
  | "className"
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
  className,
}: ClubCardPreviewProps) {
  const resolvedName = toCapitalizedWords(name);
  const resolvedDomain = toCapitalizedWords(domain);
  const resolvedMiniDescription = toRichPreviewText(miniDescription);
  const resolvedCtaText = toCapitalizedWords(ctaText);

  const iconBlock = (
    <div className="relative shrink-0 self-start">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF]">
        <img
          src={imageUrl}
          alt={resolvedName}
          className="size-6 shrink-0 rounded-lg object-cover"
        />
      </div>
      {showSuccessIcon ? (
        <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 shrink-0 rounded-full bg-white">
          <CheckCircle size={16} weight="fill" color="#00B178" />
        </span>
      ) : null}
    </div>
  );

  if (shouldCompress) {
    return (
      <div
        onClick={onCtaClick}
        className={cn(
          "font-poppins flex h-full w-full min-w-0 max-w-[300px] flex-col cursor-pointer rounded-[12px] border border-[#E5E7EB] bg-white p-4",
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          {iconBlock}
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-[16px] font-[600] leading-[24px] font-poppins">
              {resolvedName}
            </h3>
            <p className="mt-[4px] inline-block max-w-full break-words px-[8px] py-[4px] text-center text-[12px] font-[500] leading-[16px] rounded-[32px] border border-[#E5E7EB]">
              {resolvedDomain}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onCtaClick}
      className={cn(
        "font-poppins flex h-full w-full min-w-0 max-w-[300px] cursor-pointer flex-col rounded-[12px] border border-[#E5E7EB] bg-white p-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="shrink-0 self-start">{iconBlock}</div>
        <p className="w-fit max-w-full shrink-0 break-words px-[8px] text-right text-[12px] font-[500] leading-[16px] font-poppins rounded-[32px] border border-[#E5E7EB] py-[4px]">
          {resolvedDomain}
        </p>
      </div>
      <div className="mt-[12px] min-w-0">
        <h3 className="break-words text-[16px] font-[600] leading-[24px] font-poppins">
          {resolvedName}
        </h3>
        <p className="mt-[4px] break-words text-[14px] font-[400] leading-[20px] font-poppins text-[#6B7280]">
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
