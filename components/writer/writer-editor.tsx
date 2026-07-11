"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Save, Loader2, Hash, Link2, PenLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadField, type UploadedFile } from "@/components/upload-field";
import { countWords } from "@/lib/utils";
import { toast } from "sonner";

export function WriterEditor({
  taskId,
  status,
  initialText,
  initialLink,
  initialFile,
}: {
  taskId: string;
  status: string;
  initialText: string | null;
  initialLink: string | null;
  initialFile: UploadedFile | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [link, setLink] = useState(initialLink ?? "");
  const [file, setFile] = useState<UploadedFile | null>(initialFile);
  const [busy, setBusy] = useState<string | null>(null);
  const words = countWords(text);
  const isGDoc = /docs\.google\.com\/document\//.test(link);
  const notStarted = status === "ASSIGNED";

  // Let the writer flag that they've started, so the manager/reviewer can see
  // work is underway (moves ASSIGNED → In Progress).
  async function start() {
    setBusy("start");
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentText: text, contentLink: link || null, contentFileId: file?.id ?? null, draft: true }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Something went wrong.");
      else {
        toast.success("Marked as writing — your manager can see you've started.");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function send(draft: boolean) {
    setBusy(draft ? "draft" : "submit");
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentText: text,
          contentLink: link || null,
          contentFileId: file?.id ?? null,
          draft,
        }),
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
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="content-link" className="flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> Or share a Google Doc / content link
        </Label>
        <Input
          id="content-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://docs.google.com/document/d/…"
        />
        <p className="text-xs text-muted-foreground">
          {isGDoc
            ? "We'll read this Google Doc and count its words on submit (make sure it's shared as “anyone with the link”)."
            : "If you don't type your content here, paste a link to it instead."}
        </p>
      </div>
      <div className="mt-3">
        <UploadField value={file} onChange={setFile} label="Attach content document (.docx, .pdf)" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {notStarted && (
          <Button variant="secondary" onClick={start} disabled={busy !== null}>
            {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
            Start writing
          </Button>
        )}
        <Button
          onClick={() => send(false)}
          disabled={busy !== null || (!text.trim() && !link.trim() && !file)}
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
