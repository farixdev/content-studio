"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function DeveloperActions({
  taskId,
  status,
  devLink: initialLink,
}: {
  taskId: string;
  status: string;
  devLink?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [devLink, setDevLink] = useState(initialLink ?? "");

  async function run(action: "start" | "submit") {
    if (action === "submit" && !devLink.trim()) {
      return toast.error("Add the link to the built page first.");
    }
    setBusy(action);
    try {
      const res = await fetch(`/api/tasks/${taskId}/develop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, devLink: devLink.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Something went wrong.");
      else {
        toast.success(action === "start" ? "Marked as developing" : "Build delivered 🚀");
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
        Development actions
      </p>
      <div className="space-y-3">
        {status === "DEV_NOW" && (
          <Button className="w-full" variant="subtle" onClick={() => run("start")} disabled={busy !== null}>
            {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start building
          </Button>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="dev-link">Built page link</Label>
          <Input
            id="dev-link"
            value={devLink}
            onChange={(e) => setDevLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <Button className="w-full" onClick={() => run("submit")} disabled={busy !== null || !devLink.trim()}>
          {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark as developed
        </Button>
      </div>
    </Card>
  );
}
