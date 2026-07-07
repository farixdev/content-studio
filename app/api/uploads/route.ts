import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { readFileUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("No file was provided.");
  if (file.size === 0) return badRequest("The file is empty.");
  // Serverless request bodies are capped (~4.5 MB on Vercel), so keep files small.
  if (file.size > 4 * 1024 * 1024) return badRequest("File is too large (max 4 MB).");

  const saved = await readFileUpload(file);
  const rec = await prisma.upload.create({ data: { ...saved, uploadedById: user.id } });

  return ok({ id: rec.id, originalName: rec.originalName, size: rec.size, mime: rec.mime });
}
