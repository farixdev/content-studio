import { z } from "zod";
import { apiUser, badRequest, ok, unauthorized, serverError } from "@/lib/api";
import { chatRaw, llmConfigured } from "@/lib/llm";

const schema = z.object({
  title: z.string().min(1, "A title is required to generate a guide."),
  contentType: z.string().optional().default(""),
  keyword: z.string().optional().default(""),
  audience: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

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

  const system =
    "You are an expert SEO content strategist and editor. You produce concise, " +
    "writer-ready content briefs that a freelance writer can execute immediately. " +
    "Output clean GitHub-flavored Markdown only — no preamble, no code fences.";

  const userMsg =
    `Create a content guide / brief for the writer.\n` +
    `Title: ${d.title}\n` +
    `Content type: ${d.contentType || "(unspecified)"}\n` +
    `Primary keyword: ${d.keyword || "(infer the best one)"}\n` +
    `Target audience: ${d.audience || "(general)"}\n` +
    `Extra notes: ${d.notes || "(none)"}\n\n` +
    `Include these sections:\n` +
    `- **Search intent & audience** (1-2 lines)\n` +
    `- **Primary & secondary keywords** (a short list)\n` +
    `- **Recommended H1** and a **section-by-section outline** (H2/H3) with a ` +
    `one-line note on what each section must cover\n` +
    `- **Must-include points / facts**\n` +
    `- **Internal & external linking ideas**\n` +
    `- **Tone & style**\n` +
    `- **Target word count**\n` +
    `- **SEO checklist** (title tag, meta description, slug)\n\n` +
    `Keep it tight and practical. Markdown only.`;

  try {
    const guide = await chatRaw({
      system,
      user: userMsg,
      json: false,
      maxTokens: 1800,
      temperature: 0.5,
    });
    return ok({ guide: guide.trim() });
  } catch (e) {
    return serverError((e as Error).message || "Guide generation failed.");
  }
}
