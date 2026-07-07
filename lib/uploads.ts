export interface SavedFile {
  originalName: string;
  mime: string;
  size: number;
  data: Uint8Array<ArrayBuffer>;
}

/**
 * Read an uploaded file into memory so it can be stored in the database.
 * (Serverless platforms like Vercel have a read-only filesystem, so we don't
 * write to disk.) The bytes are copied into a fresh ArrayBuffer-backed array so
 * the type matches Prisma's `Bytes` input.
 */
export async function readFileUpload(file: File): Promise<SavedFile> {
  const buf = await file.arrayBuffer();
  const data = new Uint8Array(buf.byteLength);
  data.set(new Uint8Array(buf));
  return {
    originalName: file.name,
    mime: file.type || "application/octet-stream",
    size: data.byteLength,
    data,
  };
}
