import { prisma } from "./prisma";
import {
  STATUS_ORDER,
  STATUS_META,
  CONTENT_TYPES,
  applyStatusSettings,
  type StatusOverride,
} from "./constants";

/**
 * Load every Manager status override from the DB and apply it to the server-side
 * registry so `statusMeta()` reflects the Manager's edits during SSR. Returns the
 * same list so it can be handed to <StatusHydrator> for the client registry.
 */
export async function loadStatusSettings(): Promise<StatusOverride[]> {
  try {
    const rows = await prisma.statusSetting.findMany({ orderBy: { order: "asc" } });
    const list: StatusOverride[] = rows.map((r) => ({ key: r.key, label: r.label, color: r.color ?? null }));
    applyStatusSettings(list);
    return list;
  } catch {
    // Never let a settings/DB hiccup break page rendering — fall back to defaults.
    applyStatusSettings([]);
    return [];
  }
}

/** Manager-added statuses (builtin=false) for the manual "Set status" menu. */
export async function getAddedStatuses(): Promise<{ key: string; label: string }[]> {
  const rows = await prisma.statusSetting.findMany({
    where: { builtin: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({ key: r.key, label: r.label }));
}

export interface SettingsStatus {
  id: string | null;
  key: string;
  label: string;
  color: string | null;
  pipeline: boolean; // true = built-in pipeline status (relabel/recolour only, can't delete)
  phase: string | null;
}

/** The full status list for the Settings screen: every built-in (with any
 * override applied) plus Manager-added statuses. */
export async function getStatusesForSettings(): Promise<SettingsStatus[]> {
  const rows = await prisma.statusSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const builtins: SettingsStatus[] = STATUS_ORDER.map((key) => {
    const row = byKey.get(key);
    const base = STATUS_META[key];
    return {
      id: row?.id ?? null,
      key,
      label: row?.label ?? base.label,
      color: row?.color ?? null,
      pipeline: true,
      phase: base.phase,
    };
  });

  const added: SettingsStatus[] = rows
    .filter((r) => !r.builtin && !(r.key in STATUS_META))
    .sort((a, b) => a.order - b.order)
    .map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      color: r.color ?? "slate",
      pipeline: false,
      phase: null,
    }));

  return [...builtins, ...added];
}

/** Seed the default content types EXACTLY once, tracked by an AppMeta marker so
 * a list the Manager intentionally emptied is never silently re-seeded.
 * Idempotent and race-safe (createMany skipDuplicates + marker upsert). */
export async function ensureContentTypesSeeded(): Promise<void> {
  try {
    const marker = await prisma.appMeta.findUnique({ where: { key: "contentTypesSeeded" } });
    if (marker) return;
    await prisma.contentType.createMany({
      data: CONTENT_TYPES.map((name, i) => ({ name, order: i })),
      skipDuplicates: true,
    });
    await prisma.appMeta.upsert({
      where: { key: "contentTypesSeeded" },
      create: { key: "contentTypesSeeded", value: "1" },
      update: {},
    });
  } catch {
    /* best-effort; getContentTypes falls back to defaults on a genuine DB error */
  }
}

/** Content types from the DB (seeding the defaults once on first use). After the
 * first seed the DB is the source of truth — an emptied list stays empty. Falls
 * back to the built-in defaults only on a DB error. */
export async function getContentTypes(): Promise<string[]> {
  try {
    await ensureContentTypesSeeded();
    const rows = await prisma.contentType.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
    return rows.map((r) => r.name);
  } catch {
    return CONTENT_TYPES;
  }
}
