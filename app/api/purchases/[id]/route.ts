import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteUploadedFile } from "@/lib/services/storage";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchase = await db.purchase.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      items: true,
      receipt: true,
      warranty: true,
      returnWindow: true,
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  let warrantyStats = null;
  if (purchase.warranty) {
    warrantyStats = calculateWarrantyStatus(
      purchase.warranty.startDate,
      purchase.warranty.durationMonths
    );
  }

  let returnStats = null;
  if (purchase.returnWindow) {
    returnStats = calculateReturnWindowStatus(purchase.returnWindow.startDate, 14);
  }

  return NextResponse.json({
    purchase: {
      ...purchase,
      warrantyStats,
      returnStats,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.purchase.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    const updated = await db.purchase.update({
      where: { id: params.id },
      data: {
        storeName: body.storeName ?? existing.storeName,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate,
        totalAmount: body.totalAmount ?? existing.totalAmount,
        currency: body.currency ?? existing.currency,
        category: body.category ?? existing.category,
        invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
        notes: body.notes ?? existing.notes,
      },
      include: {
        items: true,
        receipt: true,
        warranty: true,
        returnWindow: true,
      },
    });

    if (body.warrantyDurationMonths && updated.warranty) {
      const wStats = calculateWarrantyStatus(
        updated.warranty.startDate,
        body.warrantyDurationMonths
      );
      await db.warranty.update({
        where: { id: updated.warranty.id },
        data: {
          durationMonths: body.warrantyDurationMonths,
          expiryDate: wStats.expiryDate,
          status: wStats.status,
        },
      });
    }

    return NextResponse.json({
      purchase: updated,
      message: "Purchase updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update purchase:", error);
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchase = await db.purchase.findFirst({
    where: { id: params.id, userId: user.id },
    include: { receipt: true },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  // Delete associated receipt file from disk if exists
  if (purchase.receipt && purchase.receipt.fileUrl) {
    await deleteUploadedFile(purchase.receipt.fileUrl);
  }

  // Delete purchase (cascade deletes items, warranty, returnWindow, receipt)
  await db.purchase.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Receipt and purchase deleted." });
}
