import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { saveUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("No file was provided.");
  if (file.size === 0) return badRequest("The file is empty.");
  if (file.size > 25 * 1024 * 1024) return badRequest("File is too large (max 25 MB).");

  const saved = await saveUpload(file);
  const rec = await prisma.upload.create({ data: { ...saved, uploadedById: user.id } });

  return ok({ id: rec.id, originalName: rec.originalName, size: rec.size, mime: rec.mime });
}
