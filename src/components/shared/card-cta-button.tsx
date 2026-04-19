type CardCtaButtonProps = {
  text: string;
  onClick?: () => void;
  theme?: "yellow" | "red";
  fullWidth?: boolean;
  className?: string;
};

const THEME_CLASSES = {
  yellow: "bg-[#EF8833] text-[#fff] hover:bg-[#DC7A2D]",
  red: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
} as const;

export function CardCtaButton({
  text,
  onClick,
  theme = "yellow",
  fullWidth = false,
  className = "",
}: CardCtaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-0 max-w-full items-center justify-center rounded-[8px] px-[16px] py-[8px] text-[14px] font-[500] leading-[20px] font-poppins transition-colors ${fullWidth ? "w-full" : ""} ${THEME_CLASSES[theme]} ${className}`.trim()}
    >
      <span className="min-w-0 max-w-full whitespace-normal break-words text-center">{text}</span>
    </button>
  );
}
