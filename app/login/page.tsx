import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { PenLine, ClipboardCheck, Palette, Rocket, ShieldCheck } from "lucide-react";

const features = [
  { icon: PenLine, title: "Brief & write", desc: "Hand writers a guide; they draft and submit in one place." },
  { icon: ClipboardCheck, title: "Review & approve", desc: "Reviewers sign off — or send it back with clear notes." },
  { icon: Palette, title: "Design & build", desc: "Approved content flows to designers and developers." },
  { icon: Rocket, title: "Publish & track", desc: "Follow every piece from brief to posted and SEO-ready." },
];

export default function LoginPage() {
  return (
    <div className="auth-scene relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-elevated backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
          {/* Brand / marketing panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden brand-gradient p-10 text-white lg:flex">
            {/* soft glow accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <Logo variant="white" size="lg" />

            <div className="relative py-10">
              <h2 className="text-[28px] font-bold leading-tight">
                From brief to published,
                <br /> beautifully organized.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-white/85">
                One workspace for writers, reviewers, designers and developers — with every status,
                guide and handoff in sync.
              </p>

              <div className="mt-8 space-y-4">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{f.title}</div>
                        <div className="text-xs text-white/75">{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Grow with us
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your Mindcob workspace.</p>
            <div className="mt-7">
              <LoginForm />
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Trouble signing in? Ask your Manager to reset your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
