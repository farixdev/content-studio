import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Count words in plain text or lightly-tagged HTML. */
export function countWords(text?: string | null): number {
  if (!text) return 0;
  const stripped = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return 0;
  return stripped.split(" ").length;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(date: Date | string | number, pattern = "MMM d, yyyy"): string {
  try {
    return format(new Date(date), pattern);
  } catch {
    return "";
  }
}

export function timeAgo(date: Date | string | number): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/** Make any user-entered link safe to open externally. A bare "example.com" (no
 * scheme) would otherwise be treated as a same-site relative path, so we prepend
 * https://. Leaves http(s)/mailto/tel untouched. */
export function externalHref(url: string): string {
  const u = (url ?? "").trim();
  if (!u) return "#";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}

/** Deterministic colour class from a string (for avatars). */
export function colorFromString(str: string): string {
  const palette = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-fuchsia-500",
    "bg-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
