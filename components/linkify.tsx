import React from "react";

// Split on URLs while keeping them (capturing group). Non-global test per part
// avoids the stateful-lastIndex pitfall of reusing a /g regex with .test().
const URL_SPLIT = /(https?:\/\/[^\s<]+)/gi;
const IS_URL = /^https?:\/\//i;

/**
 * Render plain text with any URLs turned into clickable links. Safe in both
 * server and client components (pure, no hooks). Preserves whitespace via the
 * caller's wrapper (e.g. `whitespace-pre-wrap`).
 */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_SPLIT);
  return (
    <>
      {parts.map((part, i) =>
        IS_URL.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="break-words font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
