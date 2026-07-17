import { cn } from "@/lib/utils";

type Variant = "color" | "white";

/**
 * The official Mindcob logo (the horizontal chevron + wordmark lockup stored at
 * /public/logo.png). Pass variant="white" to render it white on dark backgrounds.
 */
export function Logo({
  variant = "color",
  size = "sm",
  className,
}: {
  variant?: Variant;
  size?: "sm" | "lg";
  className?: string;
  /** kept for backward compatibility; ignored (the lockup is one image) */
  collapsed?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Mindcob"
      width={1035}
      height={249}
      className={cn(
        "w-auto select-none object-contain",
        size === "lg" ? "h-9 sm:h-11" : "h-7",
        variant === "white" && "brightness-0 invert",
        className
      )}
    />
  );
}

/** Backward-compatible export — renders the same Mindcob logo image. */
export function LogoMark({ className, variant = "color" }: { className?: string; variant?: Variant }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Mindcob"
      width={1035}
      height={249}
      className={cn("h-8 w-auto select-none object-contain", variant === "white" && "brightness-0 invert", className)}
    />
  );
}
