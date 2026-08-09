import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface SaveFileResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function saveUploadedFile(file: File): Promise<SaveFileResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(
      `Unsupported file type: ${file.type}. Allowed formats: PNG, JPG, JPEG, WEBP, PDF.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum limit of 10MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExt = path.extname(file.name) || (file.type.includes("pdf") ? ".pdf" : ".png");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);

  await fs.promises.writeFile(filePath, buffer);

  const fileUrl = `/uploads/${uniqueName}`;

  return {
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    filePath,
  };
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl || !fileUrl.startsWith("/uploads/")) return false;
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to delete file:", err);
    return false;
  }
}
