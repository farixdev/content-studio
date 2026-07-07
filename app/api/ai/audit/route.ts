import { z } from "zod";
import { apiUser, badRequest, ok, unauthorized, serverError } from "@/lib/api";
import { chatJSON, llmConfigured } from "@/lib/llm";

const schema = z.object({
  content: z.string().min(1, "There is no content to audit yet."),
  guideText: z.string().optional().default(""),
  contentType: z.string().optional().default(""),
});

export interface AuditIssue {
  severity: "high" | "medium" | "low";
  type: "grammar" | "factual" | "clarity" | "structure" | "seo" | "tone";
  note: string;
}
export interface AuditResult {
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

export async function POST(req: Request) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();
  if (!llmConfigured()) {
    return badRequest(
      "No LLM key configured. Add OPENROUTER_API_KEY (or GROQ_API_KEY) to .env."
    );
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  }
  const d = parsed.data;
  const words = (d.content.trim().match(/\S+/g) || []).length;

  const system =
    "You are a meticulous content editor and fact-checker who decides whether a " +
    "piece is ready to publish. You assess writing quality AND factual " +
    "credibility. You NEVER rewrite the text — you only report on it. Reply " +
    "with ONE valid JSON object, no markdown, no code fences.";

  const userMsg =
    `Audit this ${d.contentType || "content"} for publication.\n\n` +
    `BRIEF / GUIDE it should follow:\n"""${
      (d.guideText || "(no brief provided)").slice(0, 4000)
    }"""\n\n` +
    `CONTENT (${words} words):\n"""${d.content.slice(0, 16000)}"""\n\n` +
    `Return JSON with EXACTLY these keys:\n` +
    `  overall_score (integer 0-100: publish-readiness)\n` +
    `  verdict (one of ["Publish","Minor fixes","Needs work","Reject"])\n` +
    `  summary (2-3 sentence plain assessment)\n` +
    `  grammar_score (0-100)\n` +
    `  quality_score (0-100: clarity, structure, depth, usefulness)\n` +
    `  realism_score (0-100: factual credibility / truthfulness)\n` +
    `  on_brief (0-100: how well it follows the brief; 50 if no brief)\n` +
    `  issues (array up to 10 of {"severity": one of [high,medium,low], ` +
    `"type": one of [grammar,factual,clarity,structure,seo,tone], ` +
    `"note": short specific description})\n` +
    `  suggestions (array up to 8 short pieces of advice for the writer — ` +
    `advice only, never rewritten sentences)\n` +
    `  red_flags (array up to 6 specific statements that seem false, ` +
    `exaggerated or unsupported — quote or paraphrase the exact bit)`;

  try {
    const data = await chatJSON<Partial<AuditResult>>({
      system,
      user: userMsg,
      maxTokens: 2200,
      temperature: 0.2,
    });
    return ok({ ...data, words });
  } catch (e) {
    return serverError((e as Error).message || "Audit failed.");
  }
}
