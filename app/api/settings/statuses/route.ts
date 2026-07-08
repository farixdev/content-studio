import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { isStatus, CUSTOM_STATUS_COLOR_NAMES } from "@/lib/constants";

const schema = z.object({
  label: z.string().min(1, "Give the status a name").max(40),
  color: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");

  const label = parsed.data.label.trim();
  const color = CUSTOM_STATUS_COLOR_NAMES.includes(parsed.data.color ?? "")
    ? (parsed.data.color as string)
    : "slate";
  // The stored key IS the label, so it renders correctly even before the colour
  // registry hydrates. Reject collisions with a built-in status or an existing one.
  if (isStatus(label)) return badRequest("That name matches a built-in status.");

  const count = await prisma.customStatus.count();
  try {
    const created = await prisma.customStatus.create({
      data: { key: label, label, color, order: count },
    });
    return ok({ id: created.id });
  } catch {
    return badRequest("A custom status with that name already exists.");
  }
}
