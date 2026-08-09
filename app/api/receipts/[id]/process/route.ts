import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReceiptExtractionService } from "@/lib/services/ai-extraction";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const receipt = await db.receipt.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt record not found." }, { status: 404 });
  }

  try {
    // Update status to processing
    await db.receipt.update({
      where: { id: receipt.id },
      data: { processingStatus: "processing" },
    });

    // Run AI & OCR extraction pipeline
    const extractedData = await ReceiptExtractionService.processReceipt(
      receipt.fileUrl
    );

    // Save extracted text & update status
    await db.receipt.update({
      where: { id: receipt.id },
      data: {
        extractedText: extractedData.rawOcrText || "",
        processingStatus: "completed",
      },
    });

    return NextResponse.json({
      receiptId: receipt.id,
      extractedData,
      message: "Receipt extraction completed successfully.",
    });
  } catch (error) {
    console.error("Receipt extraction error:", error);
    await db.receipt.update({
      where: { id: receipt.id },
      data: { processingStatus: "failed" },
    });

    return NextResponse.json(
      { error: "We couldn't process this receipt. Try a clearer image or enter details manually." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const receipt = await db.receipt.findFirst({
    where: { id: params.id, userId: user.id },
    include: { purchase: true },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ receipt });
}
