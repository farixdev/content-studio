"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Loader2,
  UserPlus,
  X,
  ArrowUpRight,
  FileText,
  PenLine,
  Rocket,
  Hash,
  Trash2,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { TasksView } from "./tasks-view";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import type { ProjectDetail, ProjectMemberInfo } from "@/lib/projects";
import { toast } from "sonner";

const ROLE_GROUPS: { role: Role; label: string }[] = [
  { role: "WRITER", label: "Writers" },
  { role: "REVIEWER", label: "Reviewers" },
  { role: "DESIGNER", label: "Designers" },
  { role: "DEVELOPER", label: "Developers" },
];

type Candidate = { id: string; name: string; username: string; role: Role };

export function ProjectDetailView({
  project,
  candidates,
  canDelete,
}: {
  project: ProjectDetail;
  candidates: Candidate[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<ProjectMemberInfo[]>(project.members);
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Reflect server-side changes (live-refresh / concurrent edits).
  useEffect(() => {
    setMembers(project.members);
    setStatus(project.status);
  }, [project.members, project.status]);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [website, setWebsite] = useState(project.website ?? "");
  const [description, setDescription] = useState(project.description ?? "");

  const [addOpen, setAddOpen] = useState(false);
  const [addId, setAddId] = useState("");

  const available = candidates.filter((c) => !members.some((m) => m.id === c.id));

  async function addMember() {
    if (!addId) return toast.error("Pick someone to add.");
    setBusy("add");
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: addId }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Could not add member.");
      else {
        setMembers((m) => [...m, data.member]);
        setAddOpen(false);
        setAddId("");
        toast.success("Member added to project.");
      }
    } catch {
      toast.error("Could not add member.");
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(userId: string) {
    setBusy(userId);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      setMembers((m) => m.filter((x) => x.id !== userId));
      toast.success("Member removed.");
    } catch {
      toast.error("Could not remove member.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    setBusy("edit");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website: website || null, description: description || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Project updated.");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not update project.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleArchive() {
    const next = status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    setBusy("archive");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setStatus(next);
      router.refresh();
      toast.success(next === "ARCHIVED" ? "Project archived." : "Project reactivated.");
    } catch {
      toast.error("Could not update project.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteProject() {
    setBusy("delete");
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete project.");
        return;
      }
      toast.success("Project deleted.");
      router.push("/admin/projects");
    } catch {
      toast.error("Could not delete project.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <Link
        href="/admin/projects"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            {status === "ARCHIVED" ? (
              <Badge variant="secondary">Archived</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {project.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
          {members.some((m) => m.role === "REVIEWER") && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">
                Reviewer{members.filter((m) => m.role === "REVIEWER").length > 1 ? "s" : ""}:
              </span>{" "}
              {members
                .filter((m) => m.role === "REVIEWER")
                .map((m) => m.name)
                .join(", ")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href={`/admin/tasks/new?project=${project.id}`}>
              <Plus className="h-4 w-4" /> New content
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="ghost" onClick={toggleArchive} disabled={busy === "archive"}>
            {status === "ARCHIVED" ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Reactivate
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" /> Archive
              </>
            )}
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Delete project */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Delete {project.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the project and all {project.stats.total} content piece
              {project.stats.total === 1 ? "" : "s"} inside it, with their history. This can&apos;t
              be undone. To keep the content but hide the project, use Archive instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy === "delete"} onClick={deleteProject}>
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Content" value={project.stats.total} icon={FileText} tone="primary" />
        <StatCard label="Writers" value={project.stats.writers} icon={PenLine} tone="violet" />
        <StatCard label="Published" value={project.stats.published} icon={Rocket} tone="emerald" />
        <StatCard label="Approved words" value={project.stats.words.toLocaleString()} icon={Hash} tone="amber" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">
            Content
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
              {project.tasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="team">
            Team &amp; monthly work
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
              {members.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          {project.tasks.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No content in this project yet"
              description="Create the first piece and assign it to a writer."
              action={
                <Button asChild>
                  <Link href={`/admin/tasks/new?project=${project.id}`}>
                    <Plus className="h-4 w-4" /> New content
                  </Link>
                </Button>
              }
            />
          ) : (
            <TasksView initial={project.tasks} hideProject />
          )}
        </TabsContent>

        <TabsContent value="team">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setAddOpen(true)} disabled={available.length === 0}>
              <UserPlus className="h-4 w-4" /> Add member
            </Button>
          </div>

          {members.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No one assigned yet"
              description="Add writers, reviewers and designers who work on this project."
            />
          ) : (
            <div className="space-y-6">
              {ROLE_GROUPS.map((g) => {
                const group = members.filter((m) => m.role === g.role);
                if (group.length === 0) return null;
                return (
                  <div key={g.role}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.label} · {group.length}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.map((m) => (
                        <Card key={m.id} className="flex items-center justify-between p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar name={m.name} className="h-9 w-9" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                              <div className="truncate text-xs text-muted-foreground">@{m.username}</div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {m.role === "WRITER" && (
                              <Button asChild variant="subtle" size="sm">
                                <Link href={`/admin/team/${m.id}?project=${project.id}`}>
                                  Monthly work <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => removeMember(m.id)}
                              disabled={busy === m.id}
                              aria-label="Remove from project"
                            >
                              {busy === m.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit project dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Project name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={busy === "edit"}>
              {busy === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member to {project.name}</DialogTitle>
            <DialogDescription>Assign a writer, reviewer or designer to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Team member</Label>
            <Select value={addId} onValueChange={setAddId}>
              <SelectTrigger>
                <SelectValue placeholder="Select someone…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {ROLE_LABELS[c.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addMember} disabled={busy === "add" || !addId}>
              {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
