import { FileText, Hash, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileLink } from "./file-link";
import { Linkify } from "@/components/linkify";
import { externalHref } from "@/lib/utils";
import type { FileRef } from "@/lib/detail";

export function ContentCard({
  contentText,
  contentLink,
  contentFile,
  words,
}: {
  contentText: string | null;
  contentLink?: string | null;
  contentFile: FileRef | null;
  words: number;
}) {
  const hasContent = !!contentText || !!contentFile || !!contentLink;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Submitted Content
        </div>
        {hasContent && words > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Hash className="h-3 w-3" />
            {words.toLocaleString()} words
          </span>
        )}
      </div>
      {contentText ? (
        <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90 thin-scrollbar">
          <Linkify text={contentText} />
        </div>
      ) : !contentLink && !contentFile ? (
        <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
      ) : null}
      {contentLink && (
        <a
          href={externalHref(contentLink)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4 shrink-0" /> Open submitted document
        </a>
      )}
      {contentFile && (
        <div className="mt-3">
          <FileLink file={contentFile} />
        </div>
      )}
    </Card>
  );
}
