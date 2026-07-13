"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, RotateCcw, Check, Tags, FileType2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  STATUS_COLORS,
  STATUS_COLOR_NAMES,
  applyStatusSettings,
  previewStatus,
  ROLES,
  ROLE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SettingsStatus {
  id: string | null;
  key: string;
  label: string;
  color: string | null;
  pipeline: boolean;
  phase: string | null;
}

const DEFAULT_COLOR = "__default__";

function StatusRow({ status, onChanged }: { status: SettingsStatus; onChanged: () => void }) {
  const [label, setLabel] = useState(status.label);
  const [color, setColor] = useState(status.color ?? DEFAULT_COLOR);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLabel(status.label);
    setColor(status.color ?? DEFAULT_COLOR);
  }, [status.label, status.color]);

  const colorValue = color === DEFAULT_COLOR ? null : color;
  const dirty = label.trim() !== status.label || colorValue !== (status.color ?? null);
  const preview = previewStatus(status.key, label.trim() || status.key, colorValue);
  const overridden = status.pipeline && status.id !== null;

  async function post(body: unknown, msg: string) {
    setBusy(msg);
    try {
      const res = await fetch("/api/settings/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Could not save.");
      } else {
        onChanged();
      }
    } catch {
      toast.error("Could not save.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span
        className={cn(
          "inline-flex min-w-[112px] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
          preview.badge
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", preview.dot)} />
        {preview.label}
      </span>
      <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 w-44" />
      <Select value={color} onValueChange={setColor}>
        <SelectTrigger className="h-9 w-[132px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_COLOR}>Default</SelectItem>
          {STATUS_COLOR_NAMES.map((c) => (
            <SelectItem key={c} value={c}>
              <span className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[c].dot)} />
                <span className="capitalize">{c}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {status.pipeline ? (
        <span className="text-[11px] text-muted-foreground">{status.phase} · auto</span>
      ) : (
        <span className="text-[11px] text-muted-foreground">manual</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        {dirty && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null || !label.trim()}
            onClick={() => post({ action: "save", key: status.key, label: label.trim(), color: colorValue }, "save")}
          >
            {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save
          </Button>
        )}
        {status.pipeline
          ? overridden && (
              <button
                onClick={() => post({ action: "remove", key: status.key }, "reset")}
                disabled={busy !== null}
                title="Reset to default"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {busy === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              </button>
            )
          : (
              <button
                onClick={() => post({ action: "remove", key: status.key }, "del")}
                disabled={busy !== null}
                title="Delete status"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
              >
                {busy === "del" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
      </div>
    </div>
  );
}

export function SettingsView({
  statuses: initialStatuses,
  contentTypes: initialTypes,
  chatPolicy,
}: {
  statuses: SettingsStatus[];
  contentTypes: string[];
  chatPolicy: Record<string, string[]>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [types, setTypes] = useState(initialTypes);
  const [policy, setPolicy] = useState(chatPolicy);

  // New-status form
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [addingStatus, setAddingStatus] = useState(false);
  // New content-type form
  const [newType, setNewType] = useState("");
  const [typeBusy, setTypeBusy] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState<string | null>(null);

  useEffect(() => setStatuses(initialStatuses), [initialStatuses]);
  useEffect(() => setTypes(initialTypes), [initialTypes]);
  useEffect(() => setPolicy(chatPolicy), [chatPolicy]);

  async function toggleChat(fromRole: string, toRole: string) {
    const current = policy[fromRole] ?? [];
    const next = current.includes(toRole)
      ? current.filter((r) => r !== toRole)
      : [...current, toRole];
    setPolicy((p) => ({ ...p, [fromRole]: next })); // optimistic
    setChatBusy(`${fromRole}:${toRole}`);
    try {
      const res = await fetch("/api/settings/chat-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromRole, toRoles: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Could not update.");
        setPolicy((p) => ({ ...p, [fromRole]: current }));
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Could not update.");
      setPolicy((p) => ({ ...p, [fromRole]: current }));
    } finally {
      setChatBusy(null);
    }
  }

  // Keep the client status registry in sync with what's shown, so every badge
  // across the app reflects edits live (without a full reload).
  useEffect(() => {
    applyStatusSettings(statuses.map((s) => ({ key: s.key, label: s.label, color: s.color })));
  }, [statuses]);

  async function addStatus() {
    if (!newLabel.trim()) return toast.error("Name the status first.");
    setAddingStatus(true);
    try {
      const res = await fetch("/api/settings/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", label: newLabel.trim(), color: newColor }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(d.error ?? "Could not add.");
      else {
        toast.success("Status added.");
        setNewLabel("");
        router.refresh();
      }
    } catch {
      toast.error("Could not add.");
    } finally {
      setAddingStatus(false);
    }
  }

  async function changeType(action: "add" | "remove", name: string) {
    setTypeBusy(name);
    try {
      const res = await fetch("/api/settings/content-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(d.error ?? "Could not update.");
      else {
        if (action === "add") {
          setNewType("");
          const n = d.added ?? 1;
          toast.success(`Added ${n} content type${n === 1 ? "" : "s"}.`);
        }
        router.refresh();
      }
    } catch {
      toast.error("Could not update.");
    } finally {
      setTypeBusy(null);
    }
  }

  const pipeline = statuses.filter((s) => s.pipeline);
  const added = statuses.filter((s) => !s.pipeline);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Statuses */}
      <Card className="p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tags className="h-4 w-4 text-primary" />
          Statuses
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Rename or recolour any status — it updates everywhere. “Auto” statuses are set by the
          workflow as people do their work; add your own for stages you set by hand.
        </p>

        <div className="divide-y divide-border">
          {pipeline.map((s) => (
            <StatusRow key={s.key} status={s} onChanged={() => router.refresh()} />
          ))}
        </div>

        {added.length > 0 && (
          <>
            <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Statuses you added
            </p>
            <div className="divide-y divide-border">
              {added.map((s) => (
                <StatusRow key={s.key} status={s} onChanged={() => router.refresh()} />
              ))}
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap items-end gap-2 rounded-xl bg-muted/40 p-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Add a status</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Client Review"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && addStatus()}
            />
          </div>
          <Select value={newColor} onValueChange={setNewColor}>
            <SelectTrigger className="h-9 w-[132px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_COLOR_NAMES.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[c].dot)} />
                    <span className="capitalize">{c}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addStatus} disabled={addingStatus} className="h-9">
            {addingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </Card>

      {/* Content types */}
      <Card className="p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileType2 className="h-4 w-4 text-primary" />
          Content types
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          The options shown when creating or editing a piece of content. Add several at once by
          separating them with commas.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {types.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
            >
              {t}
              <button
                onClick={() => changeType("remove", t)}
                disabled={typeBusy === t}
                className="text-muted-foreground transition hover:text-rose-600"
                aria-label={`Remove ${t}`}
              >
                {typeBusy === t ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </span>
          ))}
          {types.length === 0 && <span className="text-sm text-muted-foreground">No content types yet.</span>}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Add content types</Label>
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. Newsletter, Case Study, Email"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && newType.trim() && changeType("add", newType.trim())}
            />
          </div>
          <Button
            onClick={() => newType.trim() && changeType("add", newType.trim())}
            disabled={typeBusy !== null || !newType.trim()}
            className="h-9"
          >
            {typeBusy === newType.trim() ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </Card>

      {/* Chat permissions */}
      <Card className="p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageSquare className="h-4 w-4 text-primary" />
          Chat permissions
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Pick who each role is allowed to message. If either side is allowed, they can chat both
          ways. (By default only Managers &amp; Reviewers can talk to everyone.)
        </p>
        <div className="space-y-3">
          {ROLES.map((from) => (
            <div key={from} className="rounded-xl border border-border p-3">
              <div className="mb-2 text-sm font-medium text-foreground">
                {ROLE_LABELS[from]} can message:
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.filter((r) => r !== from).map((to) => {
                  const on = (policy[from] ?? []).includes(to);
                  const key = `${from}:${to}`;
                  return (
                    <button
                      key={to}
                      onClick={() => toggleChat(from, to)}
                      disabled={chatBusy === key}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition",
                        on
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-muted text-muted-foreground ring-border hover:bg-muted/70"
                      )}
                    >
                      {chatBusy === key ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : on ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                      {ROLE_LABELS[to]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
