import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export interface SavedFile {
  filename: string;
  originalName: string;
  mime: string;
  size: number;
  path: string;
}

export async function saveUpload(file: File): Promise<SavedFile> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).slice(0, 12);
  const filename = crypto.randomUUID() + ext;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return {
    filename,
    originalName: file.name,
    mime: file.type || "application/octet-stream",
    size: buffer.length,
    path: `storage/uploads/${filename}`,
  };
}

export async function readUpload(filename: string): Promise<Buffer> {
  // Guard against path traversal — only allow the bare filename.
  const safe = path.basename(filename);
  return readFile(path.join(UPLOAD_DIR, safe));
}
