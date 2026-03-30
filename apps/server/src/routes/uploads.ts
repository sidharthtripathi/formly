import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadFile, deleteFile } from "../services/storage.js";
import { AuthRequest } from "../middleware/auth.js";

export const uploadsRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// POST /api/uploads - Upload file
uploadsRouter.post("/", upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    const result = await uploadFile(buffer, filename, mimeType);

    return res.status(201).json({
      data: {
        url: result.url,
        filename: filename,
        mimeType: mimeType,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// DELETE /api/uploads - Delete file
uploadsRouter.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    await deleteFile(url);
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Delete failed" });
  }
});
