import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyAdmins, notifyReviewers } from "@/lib/tasks";
import { canDesignerEdit } from "@/lib/workflow";

const schema = z.object({
  action: z.enum(["start", "submit"]),
  designAssetId: z.string().nullable().optional(),
  figmaLink: z.string().nullable().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("DESIGNER");
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (task.designerId !== user.id) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  if (d.action === "start") {
    if (task.status !== "DESIGN_NOW" && task.status !== "DESIGN_IMPROVEMENT") {
      return badRequest("This task isn't ready to start.");
    }
    await prisma.task.update({ where: { id }, data: { status: "DESIGNING" } });
    await recordStatus(id, task.status, "DESIGNING", user.id, "Started designing");
    await notifyAdmins("DESIGNING", `${user.name} started designing: ${task.title}`, id);
    return ok({ id, status: "DESIGNING" });
  }

  // submit — needs a Figma link (or an attached design) to go for approval.
  if (!canDesignerEdit(task.status)) {
    return badRequest("This task isn't in the design stage.");
  }
  const figmaLink = d.figmaLink?.trim() || task.figmaLink;
  const assetId = d.designAssetId !== undefined ? d.designAssetId || null : task.designAssetId;
  if (!figmaLink && !assetId) {
    return badRequest("Add your Figma link (or attach the design) before submitting.");
  }

  await prisma.task.update({
    where: { id },
    data: { status: "DESIGNED", figmaLink: figmaLink || null, designAssetId: assetId },
  });
  await recordStatus(id, task.status, "DESIGNED", user.id, "Design submitted for approval");
  await notifyAdmins("DESIGNED", `Design ready to approve: ${task.title}`, id);
  await notifyReviewers("DESIGNED", `Design ready to approve: ${task.title}`, id, task.projectId);
  return ok({ id, status: "DESIGNED" });
}
