"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export interface GridProject {
  id: string;
  name: string;
  website: string | null;
  href: string;
  stats: { label: string; value: number | string }[];
}

function host(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** A project card grid with a search box (filters by name or website). */
export function SearchableProjectGrid({
  projects,
  placeholder = "Search projects…",
}: {
  projects: GridProject[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? projects.filter((p) => `${p.name} ${p.website ?? ""}`.toLowerCase().includes(query))
    : projects;

  return (
    <div>
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-9" aria-label="Search projects" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary-100 hover:shadow-elevated"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-foreground transition group-hover:text-primary-700">{p.name}</h3>
              {p.website && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {host(p.website)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {p.stats.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    <span className="font-medium text-foreground">{s.value}</span> {s.label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
