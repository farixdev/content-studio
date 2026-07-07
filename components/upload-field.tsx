"use client";

import { useRef, useState } from "react";
import { Paperclip, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  name: string;
}

export function UploadField({
  value,
  onChange,
  label = "Attach a file",
  accept,
}: {
  value: UploadedFile | null;
  onChange: (f: UploadedFile | null) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Upload failed.");
      else onChange({ id: data.id, name: data.originalName });
    } catch {
      toast.error("Upload failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <Paperclip className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{value.name}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary-100 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {loading ? "Uploading…" : label}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handle} />
    </>
  );
}
