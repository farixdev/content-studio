import { cn } from "@/lib/utils";

type Variant = "color" | "white";

/** The Mindcob mark — two forward chevrons with the brand cyan→blue gradient and
 * a folded-ribbon highlight. Pass variant="white" for dark backgrounds. */
export function LogoMark({ className, variant = "color" }: { className?: string; variant?: Variant }) {
  const white = variant === "white";
  return (
    <svg viewBox="0 0 96 96" className={cn("block", className)} fill="none" role="img" aria-label="Mindcob">
      {!white && (
        <defs>
          <linearGradient id="mcGrad" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#69D3FB" />
            <stop offset="1" stopColor="#1E7FE6" />
          </linearGradient>
          <linearGradient id="mcHi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <g fill={white ? "#FFFFFF" : "url(#mcGrad)"}>
        <path d="M2 6 L26 6 L60 48 L26 90 L2 90 L36 48 Z" />
        <path d="M36 6 L60 6 L94 48 L60 90 L36 90 L70 48 Z" />
      </g>
      {!white && (
        <g fill="url(#mcHi)">
          <path d="M2 6 L26 6 L60 48 L36 48 Z" />
          <path d="M36 6 L60 6 L94 48 L70 48 Z" />
        </g>
      )}
    </svg>
  );
}

/** Full Mindcob logo: mark + MINDCOB wordmark + GROW WITH US tagline. */
export function Logo({
  collapsed = false,
  variant = "color",
  size = "sm",
  className,
}: {
  collapsed?: boolean;
  variant?: Variant;
  size?: "sm" | "lg";
  className?: string;
}) {
  const white = variant === "white";
  const lg = size === "lg";
  return (
    <div className={cn("flex items-center", lg ? "gap-3" : "gap-2.5", className)}>
      <LogoMark variant={variant} className={lg ? "h-11 w-11" : "h-8 w-8"} />
      {!collapsed && (
        <div className="leading-none">
          <div
            className={cn(
              "font-black tracking-tight",
              lg ? "text-[26px]" : "text-[18px]",
              white
                ? "text-white"
                : "bg-gradient-to-r from-[#40C8F7] to-[#1877E6] bg-clip-text text-transparent"
            )}
          >
            MINDCOB
          </div>
          <div
            className={cn(
              "mt-1 font-semibold uppercase",
              lg ? "text-[11px]" : "text-[8.5px]",
              white ? "text-white/75" : "text-[#4FA4EC]"
            )}
            style={{ letterSpacing: lg ? "0.42em" : "0.26em" }}
          >
            Grow with us
          </div>
        </div>
      )}
    </div>
  );
}
