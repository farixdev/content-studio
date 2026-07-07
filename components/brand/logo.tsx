import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl brand-gradient shadow-glow",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none">
        <path
          d="M4 13.5 L12 6 L20 13.5"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 18.5 L12 11 L20 18.5"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-foreground">
            Mindcob
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-700">
            Content Studio
          </div>
        </div>
      )}
    </div>
  );
}
