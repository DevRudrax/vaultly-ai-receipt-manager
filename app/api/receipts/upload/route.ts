import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedFile } from "@/lib/services/storage";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Save uploaded file to disk
    const saved = await saveUploadedFile(file);

    // Create receipt DB record
    const receipt = await db.receipt.create({
      data: {
        userId: user.id,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        originalFileName: saved.fileName,
        fileSize: saved.fileSize,
        processingStatus: "pending",
      },
    });

    return NextResponse.json({
      receipt,
      message: "Receipt file uploaded successfully.",
    });
  } catch (error: any) {
    console.error("Receipt upload error:", error);
    return NextResponse.json(
      { error: error.message || "This file couldn't be uploaded." },
      { status: 400 }
    );
  }
}
