import { Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileLink } from "./file-link";
import type { FileRef } from "@/lib/detail";

export function DesignCard({
  designInstructions,
  designAsset,
}: {
  designInstructions: string | null;
  designAsset: FileRef | null;
}) {
  if (!designInstructions && !designAsset) return null;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Palette className="h-4 w-4 text-primary" />
        Design
      </div>
      {designInstructions && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Instructions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {designInstructions}
          </p>
        </div>
      )}
      {designAsset && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Delivered asset
          </p>
          <FileLink file={designAsset} />
        </div>
      )}
    </Card>
  );
}
