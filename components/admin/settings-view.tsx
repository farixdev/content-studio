"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Tags } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { CUSTOM_STATUS_COLORS, CUSTOM_STATUS_COLOR_NAMES } from "@/lib/constants";
import { toast } from "sonner";

interface CustomStatus {
  id: string;
  label: string;
  color: string;
}

export function SettingsView({ initial }: { initial: CustomStatus[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("blue");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function add() {
    if (!label.trim()) return toast.error("Name the status first.");
    setBusy(true);
    try {
      const res = await fetch("/api/settings/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), color }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not add the status.");
      } else {
        toast.success("Custom status added.");
        setLabel("");
        router.refresh();
      }
    } catch {
      toast.error("Could not add the status.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/settings/statuses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not remove.");
      } else {
        toast.success("Removed.");
        router.refresh();
      }
    } catch {
      toast.error("Could not remove.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tags className="h-4 w-4 text-primary" />
          Add a custom status
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="status-name">Status name</Label>
            <Input
              id="status-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Client Review"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Colour</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_STATUS_COLOR_NAMES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span className={"h-2.5 w-2.5 rounded-full " + CUSTOM_STATUS_COLORS[c].dot} />
                      <span className="capitalize">{c}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Custom statuses appear in the manual <span className="font-medium">Set status</span> menu on any
          piece of content — useful for stages the built-in pipeline doesn&apos;t cover.
        </p>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your custom statuses
        </p>
        {initial.length === 0 ? (
          <EmptyState icon={Tags} title="None yet" description="Add your first custom status above." />
        ) : (
          <ul className="divide-y divide-border">
            {initial.map((s) => {
              const c = CUSTOM_STATUS_COLORS[s.color] ?? CUSTOM_STATUS_COLORS.slate;
              return (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset " +
                      c.badge
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + c.dot} />
                    {s.label}
                  </span>
                  <button
                    onClick={() => remove(s.id)}
                    disabled={deleting === s.id}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove"
                  >
                    {deleting === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
