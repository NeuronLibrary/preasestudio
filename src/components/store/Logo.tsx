import { siteAsset } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Logo({ variant = "dark", className, showText = true }: { variant?: "dark" | "white"; className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={siteAsset(variant === "dark" ? "logo-emblem-dark.png" : "logo-emblem-white.png")}
        alt="PreaseStudios"
        className="h-6 w-6 object-contain"
        width={24}
        height={24}
      />
      {showText && <span className="text-[15px] font-semibold tracking-tight">PreaseStudios</span>}
    </span>
  );
}
