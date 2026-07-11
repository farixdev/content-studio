import React from "react";
import { externalHref } from "@/lib/utils";

// Split on URLs while keeping them (capturing group). Matches http(s):// and
// www.-prefixed links, plus bare domains with a common TLD like "example.com/x".
// Non-global test per part avoids the stateful-lastIndex pitfall of a /g regex.
const URL_SPLIT =
  /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|io|co|dev|app|ai|pk|info|biz|me|xyz|online|site|store)(?:\/[^\s<]*)?)/gi;
const IS_URL = /^(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+[a-z]{2,})/i;

/**
 * Render plain text with any URLs turned into clickable links that open in a new
 * tab. Bare domains (no scheme) are normalised so they don't open as same-site
 * paths. Safe in server and client components (pure, no hooks).
 */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_SPLIT);
  return (
    <>
      {parts.map((part, i) =>
        part && IS_URL.test(part) ? (
          <a
            key={i}
            href={externalHref(part)}
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
