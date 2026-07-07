// Provider-flexible LLM client (OpenAI-compatible HTTP, no SDK).
//
// Supports two providers, chosen automatically from whichever key is set:
//   * Groq       (GROQ_API_KEY, keys start "gsk_") — fast & free, tight limits.
//   * OpenRouter (OPENROUTER_API_KEY, keys "sk-or") — your own credits, no
//     free-tier throttling. Preferred when both are present.
//
// Set LLM_PROVIDER=groq|openrouter to force one, and LLM_MODEL to override the
// model. Server-only: reads process.env, so only import from route handlers.

type Provider = "groq" | "openrouter";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_DEFAULT_MODEL = "openai/gpt-4o-mini";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function resolveProvider(): Provider {
  const forced = env("LLM_PROVIDER").toLowerCase();
  if (forced === "groq" || forced === "openrouter") return forced;
  if (env("OPENROUTER_API_KEY")) return "openrouter"; // prefer the unthrottled one
  if (env("GROQ_API_KEY")) return "groq";
  return "openrouter";
}

export function llmConfigured(): boolean {
  return Boolean(env("OPENROUTER_API_KEY") || env("GROQ_API_KEY"));
}

function providerConfig() {
  const provider = resolveProvider();
  if (provider === "openrouter") {
    return {
      provider,
      base: OPENROUTER_BASE,
      key: env("OPENROUTER_API_KEY"),
      model: env("LLM_MODEL") || OPENROUTER_DEFAULT_MODEL,
    };
  }
  return {
    provider,
    base: GROQ_BASE,
    key: env("GROQ_API_KEY"),
    model: env("LLM_MODEL") || GROQ_DEFAULT_MODEL,
  };
}

export function activeProvider(): Provider {
  return providerConfig().provider;
}
export function activeModel(): string {
  return providerConfig().model;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function repairJson(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "").trim();
  }
  return t
    .replace(/[“”]/g, '"')
    .replace(/,\s*([}\]])/g, "$1"); // trailing commas
}

function extractJson(content: string): unknown {
  for (const c of [content, repairJson(content)]) {
    try {
      return JSON.parse(c);
    } catch {
      /* keep trying */
    }
  }
  for (const [open, close] of [
    ["{", "}"],
    ["[", "]"],
  ] as const) {
    const i = content.indexOf(open);
    const j = content.lastIndexOf(close);
    if (i >= 0 && j > i) {
      const blob = content.slice(i, j + 1);
      for (const c of [blob, repairJson(blob)]) {
        try {
          return JSON.parse(c);
        } catch {
          /* keep trying */
        }
      }
    }
  }
  throw new Error("The model did not return valid JSON.");
}

export interface ChatOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  json?: boolean; // request response_format json_object (default true)
}

export async function chatRaw(opts: ChatOptions): Promise<string> {
  const cfg = providerConfig();
  if (!cfg.key) {
    throw new Error(
      "No LLM API key configured. Add OPENROUTER_API_KEY (recommended) or GROQ_API_KEY to .env."
    );
  }
  const model = opts.model || cfg.model;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json",
  };
  if (cfg.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://mindcob.tools/content-studio";
    headers["X-Title"] = "Mindcob Content Studio";
  }
  const tokKey =
    cfg.provider === "openrouter" ? "max_tokens" : "max_completion_tokens";

  let useJson = opts.json !== false;
  let lastErr = "unknown error";

  for (let attempt = 0; attempt < 5; attempt++) {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.3,
      [tokKey]: opts.maxTokens ?? 1500,
    };
    if (useJson) body.response_format = { type: "json_object" };

    let res: Response;
    try {
      res = await fetch(`${cfg.base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000), // don't hang the route on a stalled provider
      });
    } catch (e) {
      lastErr = `network error: ${(e as Error).message}`;
      await sleep(Math.min(2000 * (attempt + 1), 12000));
      continue;
    }

    if (res.ok) {
      try {
        const data = await res.json();
        return data?.choices?.[0]?.message?.content ?? "";
      } catch (e) {
        // 200 but non-JSON/truncated body — treat as transient and retry.
        lastErr = `bad success body: ${(e as Error).message}`;
        await sleep(Math.min(1000 * (attempt + 1), 6000));
        continue;
      }
    }

    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get("retry-after"));
      const wait = ra > 0 ? ra * 1000 : Math.min(2000 * 2 ** attempt, 20000);
      lastErr = `${cfg.provider} ${res.status} (rate limited / retrying)`;
      await sleep(wait);
      continue;
    }

    // Other 4xx: a model that rejects response_format — retry once without it.
    if (useJson) {
      useJson = false;
      continue;
    }
    let msg = "";
    try {
      msg = (await res.json())?.error?.message ?? "";
    } catch {
      msg = await res.text().catch(() => "");
    }
    throw new Error(`${cfg.provider} API ${res.status}: ${msg}`);
  }
  throw new Error(`LLM unavailable after retries: ${lastErr}`);
}

export async function chatJSON<T = unknown>(opts: ChatOptions): Promise<T> {
  const content = await chatRaw({ ...opts, json: opts.json !== false });
  return extractJson(content) as T;
}
