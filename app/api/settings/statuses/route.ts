import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { isStatus, STATUS_COLOR_NAMES, STATUS_ORDER } from "@/lib/constants";

const schema = z.object({
  action: z.enum(["add", "save", "remove"]),
  key: z.string().optional(),
  label: z.string().max(40).optional(),
  color: z.string().nullable().optional(),
});

function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null;
  return STATUS_COLOR_NAMES.includes(color) ? color : null;
}

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  // Add a brand-new, manually-settable status.
  if (d.action === "add") {
    const label = (d.label ?? "").trim();
    if (!label) return badRequest("Give the status a name.");
    if (isStatus(label)) return badRequest("That name matches a built-in status.");
    const count = await prisma.statusSetting.count();
    try {
      await prisma.statusSetting.create({
        data: { key: label, label, color: normalizeColor(d.color) ?? "slate", builtin: false, order: 100 + count },
      });
      return ok({ ok: true });
    } catch {
      return badRequest("A status with that name already exists.");
    }
  }

  // Edit an existing status (built-in override or an added one).
  if (d.action === "save") {
    const key = (d.key ?? "").trim();
    const label = (d.label ?? "").trim();
    if (!key) return badRequest("Missing status.");
    if (!label) return badRequest("Give the status a name.");
    const builtin = isStatus(key);
    if (!builtin) {
      const exists = await prisma.statusSetting.findUnique({ where: { key } });
      if (!exists) return badRequest("Unknown status.");
    }
    const order = builtin ? (STATUS_ORDER as string[]).indexOf(key) : undefined;
    await prisma.statusSetting.upsert({
      where: { key },
      update: { label, color: normalizeColor(d.color) },
      create: { key, label, color: normalizeColor(d.color), builtin, order: order ?? 100 },
    });
    return ok({ ok: true });
  }

  // Remove: deletes an added status, or resets a built-in to its default.
  const key = (d.key ?? "").trim();
  if (!key) return badRequest("Missing status.");
  await prisma.statusSetting.deleteMany({ where: { key } });
  return ok({ ok: true });
}
