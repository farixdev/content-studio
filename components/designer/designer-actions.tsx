"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadField, type UploadedFile } from "@/components/upload-field";
import { toast } from "sonner";

export function DesignerActions({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [asset, setAsset] = useState<UploadedFile | null>(null);

  async function run(action: "start" | "submit") {
    if (action === "submit" && !asset) return toast.error("Upload the design file first.");
    setBusy(action);
    try {
      const res = await fetch(`/api/tasks/${taskId}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, designAssetId: asset?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Something went wrong.");
      else {
        toast.success(action === "start" ? "Marked as designing" : "Design delivered 🎨");
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
        Design actions
      </p>
      <div className="space-y-3">
        {status === "DESIGN_NOW" && (
          <Button className="w-full" variant="subtle" onClick={() => run("start")} disabled={busy !== null}>
            {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start designing
          </Button>
        )}
        <div className="space-y-1.5">
          <Label>Upload finished design</Label>
          <UploadField value={asset} onChange={setAsset} label="Upload design file" />
        </div>
        <Button className="w-full" onClick={() => run("submit")} disabled={busy !== null || !asset}>
          {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark as designed
        </Button>
      </div>
    </Card>
  );
}
