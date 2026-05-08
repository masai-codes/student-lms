import { Loader2 } from "lucide-react";

type AppLoadingProps = {
  label?: string;
  fullPage?: boolean;
  className?: string;
};

export default function AppLoading({
  label = "Loading...",
  fullPage = false,
  className = "",
}: AppLoadingProps) {
  const containerClassName = fullPage
    ? "flex min-h-[40vh] items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={`${containerClassName} ${className}`}>
      <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
