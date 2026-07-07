import { Download, FileText } from "lucide-react";
import type { FileRef } from "@/lib/detail";

export function FileLink({ file }: { file: FileRef | null | undefined }) {
  if (!file) return null;
  return (
    <a
      href={`/api/uploads/${file.id}`}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
    >
      <FileText className="h-4 w-4 text-primary" />
      <span className="max-w-[220px] truncate">{file.name}</span>
      <Download className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}
