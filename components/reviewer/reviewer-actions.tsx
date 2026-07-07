"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UploadField, type UploadedFile } from "@/components/upload-field";
import { toast } from "sonner";

export function ReviewerActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueMsg, setIssueMsg] = useState("");
  const [issueFile, setIssueFile] = useState<UploadedFile | null>(null);

  async function approve() {
    setBusy("approve");
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", note }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Something went wrong.");
      else {
        toast.success("Approved ✓");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function sendBack() {
    if (!issueMsg.trim()) return toast.error("Describe the issue first.");
    setBusy("issue");
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", message: issueMsg, fileId: issueFile?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Something went wrong.");
      else {
        toast.success("Sent back to the writer");
        setIssueOpen(false);
        setIssueMsg("");
        setIssueFile(null);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your review
      </p>
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)…"
          className="min-h-[70px]"
        />
        <Button className="w-full" onClick={approve} disabled={busy !== null}>
          {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIssueOpen(true)}
          disabled={busy !== null}
        >
          <RotateCcw className="h-4 w-4" />
          Send back with issue
        </Button>
      </div>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back for improvement</DialogTitle>
            <DialogDescription>The writer will be notified with your notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={issueMsg}
              onChange={(e) => setIssueMsg(e.target.value)}
              placeholder="What needs to change?"
              className="min-h-[120px]"
            />
            <UploadField value={issueFile} onChange={setIssueFile} label="Attach a document" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendBack} disabled={busy !== null || !issueMsg.trim()}>
              {busy === "issue" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
