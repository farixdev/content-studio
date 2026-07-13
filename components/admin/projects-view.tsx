"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderKanban, Plus, Globe, FileText, Users, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ProjectListItem } from "@/lib/projects";

function host(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function ProjectsView({
  initial,
  reviewers = [],
  canCreate = false,
  canDelete = false,
}: {
  initial: ProjectListItem[];
  reviewers?: { id: string; name: string }[];
  canCreate?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();

  // Create
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Edit
  const [editing, setEditing] = useState<ProjectListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<ProjectListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Search
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? initial.filter((p) => `${p.name} ${p.website ?? ""} ${p.description ?? ""}`.toLowerCase().includes(query))
    : initial;

  async function create() {
    if (!name.trim()) return toast.error("Project name is required.");
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          website: website || null,
          description: description || null,
          memberIds: selectedReviewers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create project.");
      } else {
        toast.success("Project created.");
        setSelectedReviewers([]);
        router.refresh();
        router.push(`/admin/projects/${data.id}`);
      }
    } catch {
      toast.error("Could not create project.");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(p: ProjectListItem) {
    setEditing(p);
    setEditName(p.name);
    setEditWebsite(p.website ?? "");
    setEditDescription(p.description ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editName.trim()) return toast.error("Project name is required.");
    setEditBusy(true);
    try {
      const res = await fetch(`/api/projects/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          website: editWebsite.trim() || null,
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
      } else {
        toast.success("Project updated.");
        setEditing(null);
        router.refresh();
      }
    } catch {
      toast.error("Could not save.");
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/projects/${deleting.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not delete.");
      } else {
        toast.success("Project deleted.");
        setDeleting(null);
        router.refresh();
      }
    } catch {
      toast.error("Could not delete.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
        {canCreate && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        )}
      </div>

      {initial.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            canCreate
              ? "Create a project (a website or brand) — then create content inside it and assign writers."
              : "Projects the Manager creates will appear here."
          }
          action={
            canCreate ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="group relative rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary-100 hover:shadow-elevated"
            >
              {/* Whole-card link (stretched) — the click target. Kept separate from
                  the action buttons so we never nest interactive elements. */}
              <Link
                href={`/admin/projects/${p.id}`}
                aria-label={`Open project ${p.name}`}
                className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />

              {/* Edit / delete — above the link, revealed on hover or keyboard focus */}
              <div className="absolute right-3 top-3 z-20 flex items-center gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label={`Edit project ${p.name}`}
                  title="Edit project"
                  className="rounded-lg border border-border bg-white p-1.5 text-muted-foreground shadow-soft transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleting(p)}
                    aria-label={`Delete project ${p.name}`}
                    title="Delete project"
                    className="rounded-lg border border-border bg-white p-1.5 text-muted-foreground shadow-soft transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content — non-interactive so clicks fall through to the card link */}
              <div className="pointer-events-none relative z-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-foreground transition group-hover:text-primary-700">
                  {p.name}
                </h3>
                {p.website && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {host(p.website)}
                  </p>
                )}
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {p.taskCount} content
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {p.memberCount} members
                  </span>
                  <span className="ml-auto">
                    {p.status === "ARCHIVED" ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>A project is a website or brand you produce content for.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-project-name">Project name</Label>
              <Input id="new-project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mindcob" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-project-website">Website (optional)</Label>
              <Input id="new-project-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mindcob.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-project-desc">Description (optional)</Label>
              <Textarea
                id="new-project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this project is about…"
                className="min-h-[80px]"
              />
            </div>
            {reviewers.length > 0 && (
              <div className="space-y-1.5">
                <Label>Reviewers (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Only the reviewers you pick here can see this project.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {reviewers.map((r) => {
                    const on = selectedReviewers.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setSelectedReviewers((s) =>
                            on ? s.filter((x) => x !== r.id) : [...s, r.id]
                          )
                        }
                        className={
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition " +
                          (on
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-muted text-muted-foreground ring-border hover:bg-muted/70")
                        }
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update this project&apos;s name, website, or description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-name">Project name</Label>
              <Input id="edit-project-name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-website">Website (optional)</Label>
              <Input id="edit-project-website" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://mindcob.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-desc">Description (optional)</Label>
              <Textarea
                id="edit-project-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editBusy}>
              {editBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              This permanently deletes <span className="font-medium text-foreground">{deleting?.name}</span> and{" "}
              <span className="font-medium text-foreground">all {deleting?.taskCount ?? 0} pieces of content</span> in
              it. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
