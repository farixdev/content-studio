"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  RotateCcw,
  Palette,
  Pencil,
  XCircle,
  Loader2,
  Link2,
  ArrowRight,
  ExternalLink,
  Code2,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UploadField, type UploadedFile } from "@/components/upload-field";
import { CONTENT_TYPES, STATUS_ORDER, statusMeta } from "@/lib/constants";
import { isReviewPhase, isFullyReviewed, isDesignReview } from "@/lib/workflow";
import type { TaskDetail } from "@/lib/detail";
import { toast } from "sonner";

type People = { id: string; name: string }[];

export function AdminActions({
  task,
  writers,
  designers,
  developers,
  customStatuses = [],
  canDelete,
}: {
  task: TaskDetail;
  writers: People;
  designers: People;
  developers: People;
  customStatuses?: { key: string; label: string }[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const [status, setStatus] = useState(task.status);
  const [link, setLink] = useState(task.websiteLink ?? "");

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueMsg, setIssueMsg] = useState("");
  const [issueFile, setIssueFile] = useState<UploadedFile | null>(null);

  const [designOpen, setDesignOpen] = useState(false);
  const [designerId, setDesignerId] = useState(task.designer?.id ?? "");
  const [designInstructions, setDesignInstructions] = useState(task.designInstructions ?? "");

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [developerId, setDeveloperId] = useState(task.developer?.id ?? "");
  const [devInstructions, setDevInstructions] = useState(task.devInstructions ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Keep the status/link controls in sync when a refresh brings a new task state,
  // so the Apply button can't offer to revert a workflow action.
  useEffect(() => {
    setStatus(task.status);
    setLink(task.websiteLink ?? "");
  }, [task.status, task.websiteLink]);

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [contentType, setContentType] = useState(task.contentType);
  const [writerId, setWriterId] = useState(task.writer?.id ?? "UNASSIGNED");
  const [date, setDate] = useState(task.date.slice(0, 10));
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : "");
  const [guideText, setGuideText] = useState(task.guideText ?? "");
  const [remarks, setRemarks] = useState(task.remarks ?? "");

  async function call(key: string, url: string, body: unknown, ok = "Done", after?: () => void) {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method: url.includes("/tasks/") && !url.match(/\/(status|submit|review|design-review|develop|assign-designer|design|comments)$/)
          ? "PATCH"
          : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
      } else {
        toast.success(ok);
        after?.();
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteTask() {
    setBusy("delete");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete.");
        return;
      }
      toast.success("Content deleted.");
      router.push("/admin/tasks");
    } catch {
      toast.error("Could not delete.");
    } finally {
      setBusy(null);
    }
  }

  const inReview = isReviewPhase(task.status);
  const reviewed = isFullyReviewed(task.status);

  return (
    <div className="space-y-4">
      {/* Contextual review actions */}
      {inReview && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Review
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              disabled={busy !== null}
              onClick={() => call("approve", `/api/tasks/${task.id}/review`, { action: "approve" }, "Approved")}
            >
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </Button>
            <Button variant="outline" disabled={busy !== null} onClick={() => setIssueOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Send back
            </Button>
          </div>
        </Card>
      )}

      {/* Design approval */}
      {isDesignReview(task.status) && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Design approval
          </p>
          {task.figmaLink && (
            <a
              href={task.figmaLink}
              target="_blank"
              rel="noreferrer"
              className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-primary transition hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" /> Open the Figma design
            </a>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={busy !== null} onClick={() => setApproveOpen(true)}>
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
            <Button variant="outline" disabled={busy !== null} onClick={() => setRejectOpen(true)}>
              <RotateCcw className="h-4 w-4" /> Reject
            </Button>
          </div>
        </Card>
      )}

      {/* Assign designer */}
      {(reviewed || task.designer) && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Design
          </p>
          <Button variant="subtle" className="w-full" onClick={() => setDesignOpen(true)}>
            <Palette className="h-4 w-4" />
            {task.designer ? `Reassign · ${task.designer.name}` : "Assign designer"}
          </Button>
        </Card>
      )}

      {/* Status override — Manager only */}
      {canDelete && (
      <Card className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Set status
        </p>
        <div className="space-y-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusMeta(s).label}
                </SelectItem>
              ))}
              {customStatuses.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label} · custom
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy !== null || status === task.status}
            onClick={() => call("status", `/api/tasks/${task.id}/status`, { status }, "Status updated")}
          >
            {busy === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Apply
          </Button>
        </div>
      </Card>
      )}

      {/* Website link */}
      <Card className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Published link
        </p>
        <div className="space-y-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy !== null || link === (task.websiteLink ?? "")}
            onClick={() => call("link", `/api/tasks/${task.id}`, { websiteLink: link || null }, "Link saved")}
          >
            {busy === "link" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save link
          </Button>
        </div>
      </Card>

      {/* Manage */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={busy !== null || task.status === "CANCELLED"}
              onClick={() => call("cancel", `/api/tasks/${task.id}/status`, { status: "CANCELLED" }, "Task cancelled")}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            className="mt-2 w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={busy !== null}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete permanently
          </Button>
        )}
      </Card>

      {/* Issue dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back for improvement</DialogTitle>
            <DialogDescription>
              Describe what needs fixing. The writer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={issueMsg}
              onChange={(e) => setIssueMsg(e.target.value)}
              placeholder="What should the writer change?"
              className="min-h-[120px]"
            />
            <UploadField value={issueFile} onChange={setIssueFile} label="Attach a document" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy !== null || !issueMsg.trim()}
              onClick={() =>
                call(
                  "issue",
                  `/api/tasks/${task.id}/review`,
                  { action: "issue", message: issueMsg, fileId: issueFile?.id ?? null },
                  "Sent back to writer",
                  () => {
                    setIssueOpen(false);
                    setIssueMsg("");
                    setIssueFile(null);
                  }
                )
              }
            >
              {busy === "issue" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designer dialog */}
      <Dialog open={designOpen} onOpenChange={setDesignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to a designer</DialogTitle>
            <DialogDescription>Hand off the approved content with instructions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Designer</Label>
              <Select value={designerId} onValueChange={setDesignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Design instructions</Label>
              <Textarea
                value={designInstructions}
                onChange={(e) => setDesignInstructions(e.target.value)}
                placeholder="Layout, brand palette, assets to include…"
                className="min-h-[110px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDesignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy !== null || !designerId}
              onClick={() =>
                call(
                  "assign",
                  `/api/tasks/${task.id}/assign-designer`,
                  { designerId, designInstructions },
                  "Assigned to designer",
                  () => setDesignOpen(false)
                )
              }
            >
              {busy === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit content details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Writer</Label>
                <Select value={writerId} onValueChange={setWriterId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {writers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Guide</Label>
              <Textarea
                value={guideText}
                onChange={(e) => setGuideText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() =>
                call(
                  "edit",
                  `/api/tasks/${task.id}`,
                  {
                    title,
                    contentType,
                    writerId: writerId === "UNASSIGNED" ? null : writerId,
                    date: new Date(date).toISOString(),
                    deadline: deadline ? new Date(deadline).toISOString() : null,
                    guideText: guideText || null,
                    remarks: remarks || null,
                  },
                  "Saved",
                  () => setEditOpen(false)
                )
              }
            >
              {busy === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve design + assign developer */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve design &amp; assign developer</DialogTitle>
            <DialogDescription>
              The approved design is handed to the developer you pick.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Developer</Label>
              <Select value={developerId} onValueChange={setDeveloperId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a developer" />
                </SelectTrigger>
                <SelectContent>
                  {developers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {developers.length === 0 && (
                <p className="text-xs text-amber-600">
                  No developers yet — add one under Team first.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Instructions for the developer</Label>
              <Textarea
                value={devInstructions}
                onChange={(e) => setDevInstructions(e.target.value)}
                placeholder="Framework, responsive rules, CMS, page URL, deadline…"
                className="min-h-[110px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy !== null || !developerId}
              onClick={() =>
                call(
                  "approve-design",
                  `/api/tasks/${task.id}/design-review`,
                  { action: "approve", developerId, devInstructions },
                  "Design approved — sent to developer",
                  () => setApproveOpen(false)
                )
              }
            >
              {busy === "approve-design" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
              Approve &amp; assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject design */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject design</DialogTitle>
            <DialogDescription>Send it back to the designer with a reason.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="What needs to change in the design?"
            className="min-h-[110px]"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy !== null}
              onClick={() =>
                call(
                  "reject-design",
                  `/api/tasks/${task.id}/design-review`,
                  { action: "reject", reason: rejectReason },
                  "Sent back to designer",
                  () => {
                    setRejectOpen(false);
                    setRejectReason("");
                  }
                )
              }
            >
              {busy === "reject-design" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reject design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete content */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this content?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{task.title}&rdquo; and its whole history. This
              can&apos;t be undone. (To pause it instead, use Cancel.)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy !== null} onClick={deleteTask}>
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
