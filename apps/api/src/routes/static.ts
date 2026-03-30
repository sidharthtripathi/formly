import { Elysia } from "elysia";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Serves local uploads at /uploads/* — only active when STORAGE_MODE=local
export const staticUploads = new Elysia().get(
  "/uploads/:filename",
  async ({ params, error }) => {
    if (process.env.STORAGE_MODE === "s3") {
      return error(404, "Not found");
    }

    const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";
    const filePath = join(uploadDir, params.filename);

    try {
      const file = await readFile(filePath);
      const ext = params.filename.split(".").pop()?.toLowerCase();

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

      return new Response(file, {
        headers: {
          "Content-Type": mimeTypes[ext || ""] || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return error(404, "File not found");
    }
  }
);
