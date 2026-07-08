"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  MessageSquareText,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AuditIssue {
  severity: "high" | "medium" | "low";
  type: string;
  note: string;
}
interface AuditComment {
  quote: string;
  comment: string;
  severity: "high" | "medium" | "low";
  type: string;
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
  comments: AuditComment[];
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
// highlight tint per severity for the annotated document
const MARK_STYLE: Record<string, string> = {
  high: "bg-rose-200/70 ring-rose-300",
  medium: "bg-amber-200/70 ring-amber-300",
  low: "bg-sky-200/70 ring-sky-300",
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

type Segment = { text: string; markIndex?: number };

/** Locate each comment's verbatim quote in the content and split it into
 *  highlightable segments. Comments whose quote can't be found verbatim are
 *  flagged (found=false) so nothing is silently dropped. */
function annotate(content: string, comments: AuditComment[]) {
  const lc = content.toLowerCase();
  const used: { start: number; end: number }[] = [];
  const found: { index: number; start: number; end: number }[] = [];
  const located = new Set<number>();

  comments.forEach((c, i) => {
    const q = (c.quote || "").trim();
    if (!q) return;
    const needle = q.toLowerCase();
    let from = 0;
    while (from <= lc.length) {
      const p = lc.indexOf(needle, from);
      if (p === -1) break;
      const end = p + q.length;
      if (!used.some((r) => p < r.end && end > r.start)) {
        used.push({ start: p, end });
        found.push({ index: i, start: p, end });
        located.add(i);
        break;
      }
      from = p + 1;
    }
  });

  found.sort((a, b) => a.start - b.start);
  const segs: Segment[] = [];
  let cur = 0;
  for (const m of found) {
    if (m.start > cur) segs.push({ text: content.slice(cur, m.start) });
    segs.push({ text: content.slice(m.start, m.end), markIndex: m.index });
    cur = m.end;
  }
  if (cur < content.length) segs.push({ text: content.slice(cur) });
  return { segs, located };
}

export function AiAudit({
  taskId,
  content,
  guideText,
  contentType,
}: {
  taskId: string;
  content: string | null;
  guideText: string | null;
  contentType: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [active, setActive] = useState<number | null>(null);

  const hasContent = Boolean(content && content.trim());
  const comments = useMemo<AuditComment[]>(
    () => (Array.isArray(result?.comments) ? result!.comments : []),
    [result]
  );
  const annotated = useMemo(
    () => (content && comments.length ? annotate(content, comments) : null),
    [content, comments]
  );

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
      setActive(null);
    } catch {
      toast.error("Audit failed.");
    } finally {
      setBusy(false);
    }
  }

  function focusMark(i: number) {
    setActive(i);
    const el = document.getElementById(`hl-${taskId}-${i}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function sendToWriter() {
    if (!comments.length) return;
    setSending(true);
    try {
      const lines = comments.map(
        (c, i) => `${i + 1}. [${c.severity} · ${c.type}] "${c.quote}"\n   → ${c.comment}`
      );
      const extra =
        result?.suggestions?.length ? `\n\nSuggestions:\n- ${result.suggestions.join("\n- ")}` : "";
      const message = `AI review — ${comments.length} point(s) to fix:\n\n${lines.join("\n\n")}${extra}`;
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not send to the writer.");
        return;
      }
      toast.success("Sent to the writer with inline comments.");
      router.refresh();
    } catch {
      toast.error("Could not send to the writer.");
    } finally {
      setSending(false);
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
              Scores it, then pins comments to the exact spots that need a change.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={result ? "outline" : "default"}
          onClick={run}
          disabled={busy || !hasContent}
        >
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
          {/* score hero */}
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="text-center">
              <div className={`text-4xl font-bold leading-none ${scoreColor(result.overall_score)}`}>
                {result.overall_score}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                out of 100
              </div>
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

          {/* annotated document with pinned comments */}
          {comments.length > 0 && annotated && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <MessageSquareText className="h-3.5 w-3.5" /> Annotated document ({comments.length}{" "}
                  comment{comments.length === 1 ? "" : "s"})
                </p>
                <Button size="sm" variant="subtle" onClick={sendToWriter} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to writer
                </Button>
              </div>

              {/* the content, with the flagged spans highlighted inline */}
              <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-relaxed">
                {annotated.segs.map((seg, k) =>
                  seg.markIndex === undefined ? (
                    <span key={k}>{seg.text}</span>
                  ) : (
                    <mark
                      key={k}
                      id={`hl-${taskId}-${seg.markIndex}`}
                      onClick={() => setActive(seg.markIndex!)}
                      className={`cursor-pointer rounded px-0.5 ring-1 ${
                        MARK_STYLE[comments[seg.markIndex].severity] ?? "bg-slate-200/70 ring-slate-300"
                      } ${active === seg.markIndex ? "outline outline-2 outline-primary" : ""}`}
                    >
                      {seg.text}
                      <sup className="ml-0.5 text-[9px] font-bold text-foreground/70">
                        {seg.markIndex + 1}
                      </sup>
                    </mark>
                  )
                )}
              </div>

              {/* the comments themselves */}
              <ol className="space-y-1.5">
                {comments.map((c, i) => {
                  const found = annotated.located.has(i);
                  return (
                    <li
                      key={i}
                      onClick={() => found && focusMark(i)}
                      className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                        found ? "cursor-pointer hover:bg-muted/50" : ""
                      } ${active === i ? "border-primary bg-primary/5" : ""}`}
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground/80 text-[10px] font-bold text-background">
                        {i + 1}
                      </span>
                      <div>
                        <span
                          className={`mr-1.5 rounded px-1.5 py-0.5 font-medium ${
                            SEVERITY_STYLE[c.severity] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.severity} · {c.type}
                        </span>
                        <span className="text-muted-foreground">{c.comment}</span>
                        {!found && (
                          <span className="ml-1 italic text-muted-foreground/70">
                            (couldn&apos;t locate the exact text — quote: &ldquo;{c.quote}&rdquo;)
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

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
            AI assessment ({result.words} words analysed) — a decision aid, not a substitute for your
            review. Content is never edited; comments only point to what to change.
          </p>
        </div>
      )}
    </Card>
  );
}
