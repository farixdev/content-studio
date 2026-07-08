"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
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
import { CONTENT_TYPES } from "@/lib/constants";
import { toast } from "sonner";

export function CreateTaskForm({
  writers,
  projects,
  defaultProjectId,
}: {
  writers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [contentType, setContentType] = useState("");
  const [writerId, setWriterId] = useState("UNASSIGNED");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [guideText, setGuideText] = useState("");
  const [guideFile, setGuideFile] = useState<UploadedFile | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  // AI guide generation
  const [genOpen, setGenOpen] = useState(false);
  const [genKeyword, setGenKeyword] = useState("");
  const [genAudience, setGenAudience] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  async function generateGuide() {
    if (!title.trim()) {
      toast.error("Add a title first — the guide is built around it.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          contentType,
          keyword: genKeyword,
          audience: genAudience,
          notes: genNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate the guide.");
        return;
      }
      if (guideText.trim() && !window.confirm("Replace the guide you've already written with the AI version?")) {
        return;
      }
      setGuideText(data.guide);
      setGenKeyword("");
      setGenAudience("");
      setGenNotes("");
      setGenOpen(false);
      toast.success("Guide generated — review and tweak as needed.");
    } catch {
      toast.error("Could not generate the guide.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Add a title.");
    if (!projectId) return toast.error("Pick a project.");
    if (!contentType) return toast.error("Pick a content type.");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId,
          contentType,
          writerId: writerId === "UNASSIGNED" ? null : writerId,
          guideText: guideText || null,
          guideFileId: guideFile?.id ?? null,
          remarks: remarks || null,
          date: new Date(date).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create content.");
        setLoading(false);
        return;
      }
      toast.success("Content created & assigned.");
      router.push(`/admin/tasks/${data.id}`);
    } catch {
      toast.error("Could not create content.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Ways to Improve Your Home Office"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
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
              <Label>Assign writer</Label>
              <Select value={writerId} onValueChange={setWriterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Writer" />
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
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-semibold">Content guide</Label>
          <button
            type="button"
            onClick={() => setGenOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Generate guide with AI
          </button>
        </div>
        <Textarea
          value={guideText}
          onChange={(e) => setGuideText(e.target.value)}
          placeholder="Target keyword, structure, tone, word count, must-include points…"
          className="min-h-[140px]"
        />
        <div className="mt-3">
          <UploadField value={guideFile} onChange={setGuideFile} label="Attach guide document" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-1.5">
          <Label htmlFor="remarks">Remarks (optional)</Label>
          <Textarea
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any notes for the team…"
            className="min-h-[80px]"
          />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Create & assign
            </>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/tasks")}>
          Cancel
        </Button>
      </div>

      {/* AI guide generation */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate a content guide</DialogTitle>
            <DialogDescription>
              AI drafts a writer-ready brief from your title
              {title ? <> — <span className="font-medium">“{title}”</span></> : ""}. Review and
              edit it before assigning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Primary keyword (optional)</Label>
              <Input
                value={genKeyword}
                onChange={(e) => setGenKeyword(e.target.value)}
                placeholder="e.g. home office setup"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target audience (optional)</Label>
              <Input
                value={genAudience}
                onChange={(e) => setGenAudience(e.target.value)}
                placeholder="e.g. remote workers, small business owners"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Extra notes (optional)</Label>
              <Textarea
                value={genNotes}
                onChange={(e) => setGenNotes(e.target.value)}
                placeholder="Angle, must-include points, things to avoid…"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setGenOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={generateGuide} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate guide
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
