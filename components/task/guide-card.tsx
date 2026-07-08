import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileLink } from "./file-link";
import { Linkify } from "@/components/linkify";
import type { FileRef } from "@/lib/detail";

export function GuideCard({
  guideText,
  guideFile,
}: {
  guideText: string | null;
  guideFile: FileRef | null;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" />
        Content Guide
      </div>
      {guideText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"><Linkify text={guideText} /></p>
      ) : (
        <p className="text-sm text-muted-foreground">No written guide was provided.</p>
      )}
      {guideFile && <div className="mt-3">
        <FileLink file={guideFile} />
      </div>}
    </Card>
  );
}
