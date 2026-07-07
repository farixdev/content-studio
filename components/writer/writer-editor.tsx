"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Save, Loader2, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadField, type UploadedFile } from "@/components/upload-field";
import { countWords } from "@/lib/utils";
import { toast } from "sonner";

export function WriterEditor({
  taskId,
  initialText,
  initialFile,
}: {
  taskId: string;
  initialText: string | null;
  initialFile: UploadedFile | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [file, setFile] = useState<UploadedFile | null>(initialFile);
  const [busy, setBusy] = useState<string | null>(null);
  const words = countWords(text);

  async function send(draft: boolean) {
    setBusy(draft ? "draft" : "submit");
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentText: text, contentFileId: file?.id ?? null, draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
      } else {
        toast.success(draft ? "Draft saved" : "Submitted for review 🎉");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Your content</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <Hash className="h-3 w-3" />
          {words.toLocaleString()} words
        </span>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write or paste your content here…"
        className="min-h-[340px] leading-relaxed"
      />
      <div className="mt-3">
        <UploadField value={file} onChange={setFile} label="Attach content document (.docx, .pdf)" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={() => send(false)}
          disabled={busy !== null || (!text.trim() && !file)}
        >
          {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit for review
        </Button>
        <Button variant="outline" onClick={() => send(true)} disabled={busy !== null}>
          {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save draft
        </Button>
      </div>
    </Card>
  );
}
