import { Code2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Linkify } from "@/components/linkify";
import { externalHref } from "@/lib/utils";

export function DevCard({
  devInstructions,
  devLink,
  developerName,
}: {
  devInstructions: string | null;
  devLink: string | null;
  developerName?: string | null;
}) {
  if (!devInstructions && !devLink) return null;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Code2 className="h-4 w-4 text-primary" />
        Development{developerName ? ` · ${developerName}` : ""}
      </div>
      {devInstructions && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Instructions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            <Linkify text={devInstructions} />
          </p>
        </div>
      )}
      {devLink && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Built page
          </p>
          <a
            href={externalHref(devLink)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {devLink.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}
    </Card>
  );
}
