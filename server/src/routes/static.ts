import { Router, Request, Response } from "express";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const router = Router();

const STORAGE_MODE = process.env.STORAGE_MODE || "local";

const mimeTypes: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  zip: "application/zip",
};

router.get("/uploads/:filename", async (req: Request, res: Response) => {
  if (STORAGE_MODE === "s3") {
    return res.status(404).json({ error: "Not found" });
  }

  const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";

  // Sanitize filename to prevent path traversal
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = resolve(join(uploadDir, safeName));

  // Ensure the resolved path is still within uploadDir
  if (!filePath.startsWith(resolve(uploadDir))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const file = await readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();

    return res.set({
      "Content-Type": mimeTypes[ext || ""] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    }).send(file);
  } catch {
    return res.status(404).json({ error: "File not found" });
  }
});

export { router as staticUploads };
