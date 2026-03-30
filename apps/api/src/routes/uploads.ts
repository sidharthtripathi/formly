import { Elysia } from "elysia";
import { uploadFile, deleteFile } from "../services/storage";
import { authMiddleware } from "../middleware/auth";

export const uploads = new Elysia()
  .post("/api/uploads", async ({ request, store }) => {
    // Auth required for uploads
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized" };
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return { error: "No file provided" };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(buffer, file.name, file.type);

      return { data: { url: result.url, filename: file.name, mimeType: file.type, size: file.size } };
    } catch (error) {
      console.error("Upload error:", error);
      return { error: "Upload failed" };
    }
  })
  .delete("/api/uploads", async ({ request, store }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized" };
    }

    try {
      const formData = await request.formData();
      const url = formData.get("url") as string;
      if (!url) {
        return { error: "No URL provided" };
      }

      await deleteFile(url);
      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      return { error: "Delete failed" };
    }
  });
