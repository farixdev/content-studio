import { countWords } from "./utils";

const GDOC_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

/** Extract a Google Doc id from any of its share URLs. */
export function googleDocId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = GDOC_RE.exec(url);
  return m ? m[1] : null;
}

/**
 * Count words in a Google Doc by exporting it as plain text. Only works if the
 * doc is shared "anyone with the link" — a private doc returns Google's HTML
 * sign-in page, which we detect and treat as "couldn't read it".
 * Returns null when it can't read the doc.
 */
export async function wordsFromGoogleDoc(url: string | null | undefined): Promise<number | null> {
  const id = googleDocId(url);
  if (!id) return null;
  try {
    const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, {
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const head = text.slice(0, 300).toLowerCase();
    if (head.includes("<html") || head.includes("<!doctype")) return null; // sign-in / error page
    const words = countWords(text);
    return words > 0 ? words : null;
  } catch {
    return null;
  }
}

/**
 * Count words inside an uploaded .docx by extracting its raw text with mammoth.
 * Returns null for non-docx files or on any parse error.
 */
export async function wordsFromDocx(
  bytes: Uint8Array,
  name: string,
  mime: string
): Promise<number | null> {
  const isDocx = /\.docx$/i.test(name) || mime.includes("wordprocessingml");
  if (!isDocx) return null;
  try {
    // Lazy import keeps mammoth out of the edge/runtime bundle for other routes.
    const mod = (await import("mammoth")) as unknown as {
      default?: { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> };
      extractRawText?: (o: { buffer: Buffer }) => Promise<{ value: string }>;
    };
    const lib = mod.default ?? mod;
    if (!lib.extractRawText) return null;
    const result = await lib.extractRawText({ buffer: Buffer.from(bytes) });
    const words = countWords(result.value);
    return words > 0 ? words : null;
  } catch {
    return null;
  }
}
