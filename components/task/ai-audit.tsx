"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AuditIssue {
  severity: "high" | "medium" | "low";
  type: string;
  note: string;
}
interface AuditResult {
  overall_score: number;
  verdict: string;
  summary: string;
  grammar_score: number;
  quality_score: number;
  realism_score: number;
  on_brief: number;
  issues: AuditIssue[];
  suggestions: string[];
  red_flags: string[];
  words: number;
}

function scoreColor(v: number) {
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-amber-600";
  return "text-rose-600";
}
function barColor(v: number) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}
const VERDICT_STYLE: Record<string, string> = {
  Publish: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Minor fixes": "bg-amber-100 text-amber-800 ring-amber-200",
  "Needs work": "bg-orange-100 text-orange-800 ring-orange-200",
  Reject: "bg-rose-100 text-rose-700 ring-rose-200",
};
const SEVERITY_STYLE: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor(v)}`} style={{ width: `${v}%` }} />
      </div>
      <span className={`w-9 text-right text-xs font-semibold ${scoreColor(v)}`}>{v}</span>
    </div>
  );
}

export function AiAudit({
  content,
  guideText,
  contentType,
}: {
  taskId: string;
  content: string | null;
  guideText: string | null;
  contentType: string;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const hasContent = Boolean(content && content.trim());

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, guideText, contentType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Audit failed.");
        return;
      }
      setResult(data as AuditResult);
    } catch {
      toast.error("Audit failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">AI content audit</p>
            <p className="text-xs text-muted-foreground">
              Quality, grammar, realism &amp; how well it follows the brief.
            </p>
          </div>
        </div>
        <Button size="sm" variant={result ? "outline" : "default"} onClick={run} disabled={busy || !hasContent}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {result ? "Re-run" : "Run audit"}
        </Button>
      </div>

      {!hasContent && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          No content has been submitted yet — the audit runs on the writer&apos;s submission.
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="text-center">
              <div className={`text-4xl font-bold leading-none ${scoreColor(result.overall_score)}`}>
                {result.overall_score}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">out of 100</div>
            </div>
            <div className="flex-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                  VERDICT_STYLE[result.verdict] ?? "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                {result.verdict}
              </span>
              <p className="mt-1.5 text-xs text-muted-foreground">{result.summary}</p>
            </div>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Grammar" value={result.grammar_score} />
            <ScoreBar label="Quality" value={result.quality_score} />
            <ScoreBar label="Realism" value={result.realism_score} />
            <ScoreBar label="On brief" value={result.on_brief} />
          </div>

          {Array.isArray(result.red_flags) && result.red_flags.length > 0 && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Factual red flags
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-rose-700">
                {result.red_flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.issues) && result.issues.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Issues</p>
              <ul className="space-y-1.5">
                {result.issues.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-medium ${
                        SEVERITY_STYLE[it.severity] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {it.severity}
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{it.type}:</span> {it.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Suggestions</p>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            AI assessment ({result.words} words analysed) — a decision aid, not a substitute for your review.
          </p>
        </div>
      )}
    </Card>
  );
}
