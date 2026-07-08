"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Copy,
  KeyRound,
  MoreVertical,
  Power,
  Loader2,
  Check,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
}
type Creds = { username: string; password: string };

const ROLE_TABS: { role: Role; label: string }[] = [
  { role: "WRITER", label: "Writers" },
  { role: "REVIEWER", label: "Reviewers" },
  { role: "DESIGNER", label: "Designers" },
  { role: "DEVELOPER", label: "Developers" },
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function TeamView({ users }: { users: Member[] }) {
  const router = useRouter();
  const [members, setMembers] = useState(users);
  const [tab, setTab] = useState<Role>("WRITER");
  const [busy, setBusy] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("WRITER");

  const [creds, setCreds] = useState<Creds | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [resetMode, setResetMode] = useState<"generate" | "custom">("generate");
  const [customPw, setCustomPw] = useState("");

  async function addMember() {
    if (!newName.trim()) return toast.error("Enter a name.");
    setBusy("add");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add member.");
      } else {
        setMembers((m) => [...m, data.user]);
        setCreds(data.credentials);
        setAddOpen(false);
        setNewName("");
        setTab(newRole);
        router.refresh();
      }
    } catch {
      toast.error("Could not add member.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(m: Member) {
    setBusy(m.id);
    try {
      const res = await fetch(`/api/users/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !m.active }),
      });
      if (!res.ok) throw new Error();
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)));
      toast.success(m.active ? "Member deactivated" : "Member activated");
    } catch {
      toast.error("Could not update member.");
    } finally {
      setBusy(null);
    }
  }

  async function resetPassword() {
    if (!resetTarget) return;
    if (resetMode === "custom" && customPw.trim().length < 6) {
      return toast.error("Custom password must be at least 6 characters.");
    }
    const m = resetTarget;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/users/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetPassword: true,
          ...(resetMode === "custom" ? { newPassword: customPw.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not reset password.");
        return;
      }
      setResetTarget(null);
      setCreds(data.credentials);
      toast.success(`Password changed — ${m.name.split(" ")[0]}'s old password no longer works.`);
    } catch {
      toast.error("Could not reset password.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteMember() {
    if (!deleteTarget) return;
    const m = deleteTarget;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/users/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete member.");
      } else {
        setMembers((list) => list.filter((x) => x.id !== m.id));
        setDeleteTarget(null);
        toast.success(`${m.name} deleted.`);
      }
    } catch {
      toast.error("Could not delete member.");
    } finally {
      setBusy(null);
    }
  }

  const list = members.filter((m) => m.role === tab);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Role)}>
          <TabsList>
            {ROLE_TABS.map((t) => (
              <TabsTrigger key={t.role} value={t.role}>
                {t.label}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {members.filter((m) => m.role === t.role).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          onClick={() => {
            setNewRole(tab);
            setAddOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" /> Add member
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={`No ${ROLE_LABELS[tab].toLowerCase()}s yet`}
          description="Add a member and share their generated login."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <Card
              key={m.id}
              onClick={() => router.push(`/admin/team/${m.id}`)}
              className="flex cursor-pointer items-center justify-between p-4 transition hover:border-primary-100 hover:shadow-elevated"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={m.name} className="h-10 w-10" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{m.name}</div>
                  <div className="truncate text-xs text-muted-foreground">@{m.username}</div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {m.active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" disabled={busy === m.id}>
                      {busy === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setResetMode("generate");
                        setCustomPw("");
                        setResetTarget(m);
                      }}
                    >
                      <KeyRound className="h-4 w-4" /> Reset password
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toggleActive(m)}>
                      <Power className="h-4 w-4" /> {m.active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onSelect={() => setDeleteTarget(m)}>
                      <Trash2 className="h-4 w-4" /> Delete member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>We'll generate a username and password automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TABS.map((t) => (
                    <SelectItem key={t.role} value={t.role}>
                      {ROLE_LABELS[t.role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addMember} disabled={busy === "add"}>
              {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle>Reset {resetTarget?.name.split(" ")[0]}&apos;s password</DialogTitle>
            <DialogDescription>
              This sets a new password for @{resetTarget?.username} immediately — their current
              password will stop working.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetMode("generate")}
                className={
                  "rounded-xl border px-3 py-2.5 text-left text-sm transition " +
                  (resetMode === "generate"
                    ? "border-primary bg-primary-50 font-medium text-primary-700"
                    : "border-border text-muted-foreground hover:bg-muted")
                }
              >
                Generate a strong password
              </button>
              <button
                type="button"
                onClick={() => setResetMode("custom")}
                className={
                  "rounded-xl border px-3 py-2.5 text-left text-sm transition " +
                  (resetMode === "custom"
                    ? "border-primary bg-primary-50 font-medium text-primary-700"
                    : "border-border text-muted-foreground hover:bg-muted")
                }
              >
                Set my own password
              </button>
            </div>
            {resetMode === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-pw">New password</Label>
                <Input
                  id="custom-pw"
                  value={customPw}
                  onChange={(e) => setCustomPw(e.target.value)}
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={resetPassword} disabled={busy === resetTarget?.id}>
              {busy === resetTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials dialog */}
      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle>Login credentials</DialogTitle>
            <DialogDescription>
              Share these with the member. For security, the password won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>
          {creds && (
            <div className="space-y-2">
              <CopyRow label="Username" value={creds.username} />
              <CopyRow label="Password" value={creds.password} />
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={async () => {
                if (creds) {
                  await navigator.clipboard.writeText(`Username: ${creds.username}\nPassword: ${creds.password}`);
                  toast.success("Copied both to clipboard");
                }
              }}
              variant="outline"
            >
              <Copy className="h-4 w-4" /> Copy both
            </Button>
            <Button onClick={() => setCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes their account and login. Content assigned to them stays but
              becomes unassigned. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteMember} disabled={busy === deleteTarget?.id}>
              {busy === deleteTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
