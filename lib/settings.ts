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

/** Content types from the DB, falling back to the built-in defaults if the
 * Manager hasn't customised them yet. */
export async function getContentTypes(): Promise<string[]> {
  try {
    const rows = await prisma.contentType.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
    return rows.length ? rows.map((r) => r.name) : CONTENT_TYPES;
  } catch {
    return CONTENT_TYPES;
  }
}

/** Seed the ContentType table with the defaults the first time Settings opens,
 * so the Manager has real rows to edit. Idempotent. */
export async function seedContentTypesIfEmpty(): Promise<void> {
  const count = await prisma.contentType.count();
  if (count > 0) return;
  await prisma.contentType.createMany({
    data: CONTENT_TYPES.map((name, i) => ({ name, order: i })),
    skipDuplicates: true,
  });
}
