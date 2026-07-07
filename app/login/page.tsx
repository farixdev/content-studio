import { Logo, LogoMark } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { PenLine, ClipboardCheck, Palette, Rocket } from "lucide-react";

const features = [
  { icon: PenLine, title: "Assign & write", desc: "Hand writers a guide, they draft and submit in one place." },
  { icon: ClipboardCheck, title: "Two-stage review", desc: "Umar & Waqar sign off, or send it back with notes." },
  { icon: Palette, title: "Design handoff", desc: "Approved copy flows to designers with instructions." },
  { icon: Rocket, title: "Publish & SEO", desc: "Track every piece from brief to posted and optimized." },
];

export default function LoginPage() {
  return (
    <div className="auth-scene relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-elevated backdrop-blur-xl lg:grid-cols-2">
          {/* Brand / marketing panel */}
          <div className="relative hidden flex-col justify-between brand-gradient p-10 text-white lg:flex">
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10 shadow-none" />
              <div>
                <div className="text-lg font-extrabold tracking-tight">Mindcob</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Content Studio
                </div>
              </div>
            </div>

            <div className="py-10">
              <h2 className="text-3xl font-bold leading-tight">
                From brief to published,
                <br /> beautifully organized.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-white/80">
                One workspace for writers, reviewers and designers — with every
                status, guide and handoff in sync.
              </p>

              <div className="mt-8 space-y-4">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
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

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Grow with us
            </p>
          </div>

          {/* Form panel */}
          <div className="p-8 sm:p-12">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Content Studio workspace.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
