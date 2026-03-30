/**
 * Unified Storage Service
 * Supports both local filesystem and S3 backends.
 * Toggle via STORAGE_MODE env variable ("local" | "s3")
 */

import { Blob } from "node:buffer";

const STORAGE_MODE = process.env.STORAGE_MODE || "local";

// ─────────────────────────────────────────────
// Local Storage
// ─────────────────────────────────────────────

async function localUpload(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const crypto = await import("node:crypto");

  const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";
  const ext = path.extname(filename);
  const safeName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, safeName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);

  return `/uploads/${safeName}`;
}

async function localDelete(filePath: string): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";
  const fullPath = path.join(uploadDir, filePath.replace("/uploads/", ""));
  try {
    await fs.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}

function localGetUrl(filePath: string): string {
  const baseUrl = process.env.API_URL || "http://localhost:3001";
  return `${baseUrl}${filePath}`;
}

// ─────────────────────────────────────────────
// S3 Storage
// ─────────────────────────────────────────────

interface S3Client {
  send(command: any): Promise<any>;
}

let s3Client: S3Client | null = null;

async function getS3Client(): Promise<S3Client> {
  if (s3Client) return s3Client;

  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import(
    "@aws-sdk/client-s3"
  );

  const clientConfig: any = {
    region: process.env.AWS_REGION || "us-east-1",
  };

  // Custom endpoint (for MinIO, Backblaze, etc.)
  if (process.env.AWS_S3_ENDPOINT) {
    clientConfig.endpoint = process.env.AWS_S3_ENDPOINT;
    clientConfig.forcePathStyle = true;
  }

  // Access keys (use IAM roles in production — avoid long-lived keys)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  s3Client = new S3Client(clientConfig);
  return s3Client;
}

async function s3Upload(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = await getS3Client();
  const bucket = process.env.AWS_S3_BUCKET!;
  const ext = filename.split(".").pop();
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  // For public buckets, generate a direct URL
  const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

  // For private buckets, use signed URL (1 hour expiry)
  // Uncomment below if bucket is private:
  // const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  // return signedUrl;

  // For now, assume public bucket
  await client.send(command);
  return url;
}

async function s3Delete(fileUrl: string): Promise<void> {
  try {
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = await getS3Client();
    const bucket = process.env.AWS_S3_BUCKET!;
    // Extract key from URL
    const urlObj = new URL(fileUrl);
    const key = urlObj.pathname.slice(1); // Remove leading slash

    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
  } catch {
    // Ignore errors
  }
}

function s3GetUrl(filePath: string): string {
  return filePath; // S3 URLs are already absolute
}

// ─────────────────────────────────────────────
// Unified Storage Interface
// ─────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  let url: string;

  if (STORAGE_MODE === "s3") {
    url = await s3Upload(fileBuffer, filename, mimeType);
  } else {
    url = await localUpload(fileBuffer, filename, mimeType);
  }

  return { url, key: filename };
}

export async function deleteFile(url: string): Promise<void> {
  if (STORAGE_MODE === "s3") {
    await s3Delete(url);
  } else {
    await localDelete(url);
  }
}

export function getFileUrl(pathOrUrl: string): string {
  if (STORAGE_MODE === "s3") {
    return s3GetUrl(pathOrUrl);
  }
  return localGetUrl(pathOrUrl);
}

export function isS3Mode(): boolean {
  return STORAGE_MODE === "s3";
}
