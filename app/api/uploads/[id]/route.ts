import { prisma } from "@/lib/prisma";
import { apiUser, notFound, unauthorized } from "@/lib/api";
import { readUpload } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const rec = await prisma.upload.findUnique({ where: { id } });
  if (!rec) return notFound("File not found.");

  try {
    const buf = await readUpload(rec.filename);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": rec.mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(rec.originalName)}"`,
        "Content-Length": String(rec.size),
      },
    });
  } catch {
    return notFound("File is no longer available.");
  }
}
