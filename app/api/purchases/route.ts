import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PurchaseCreateSchema } from "@/lib/validators";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const store = searchParams.get("store");
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const whereClause: any = { userId: user.id };

  if (category && category !== "all") {
    whereClause.category = { equals: category };
  }

  if (store && store !== "all") {
    whereClause.storeName = { contains: store };
  }

  if (query && query.trim() !== "") {
    const q = query.trim();
    whereClause.OR = [
      { storeName: { contains: q } },
      { invoiceNumber: { contains: q } },
      { category: { contains: q } },
      {
        items: {
          some: {
            OR: [
              { productName: { contains: q } },
              { brand: { contains: q } },
              { category: { contains: q } },
            ],
          },
        },
      },
    ];
  }

  const [totalCount, purchases] = await Promise.all([
    db.purchase.count({ where: whereClause }),
    db.purchase.findMany({
      where: whereClause,
      include: {
        items: true,
        receipt: true,
        warranty: true,
        returnWindow: true,
      },
      orderBy: { purchaseDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Augment purchases with dynamic calculations
  const enrichedPurchases = purchases.map((p) => {
    let warrantyStats = null;
    if (p.warranty) {
      warrantyStats = calculateWarrantyStatus(
        p.warranty.startDate,
        p.warranty.durationMonths
      );
    }

    let returnStats = null;
    if (p.returnWindow) {
      returnStats = calculateReturnWindowStatus(p.returnWindow.startDate, 14);
    }

    return {
      ...p,
      warrantyStats,
      returnStats,
    };
  });

  return NextResponse.json({
    purchases: enrichedPurchases,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = PurchaseCreateSchema.parse(body);

    const purchaseDate = new Date(validated.purchaseDate);

    // Database Transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          storeName: validated.storeName,
          purchaseDate,
          totalAmount: validated.totalAmount,
          currency: validated.currency || "INR",
          category: validated.category || "General",
          invoiceNumber: validated.invoiceNumber || null,
          notes: validated.notes || null,
          items: {
            create: validated.items.map((item) => ({
              productName: item.productName,
              brand: item.brand || null,
              category: item.category || validated.category || "General",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Link receipt if receiptId provided
      if (validated.receiptId) {
        await tx.receipt.update({
          where: { id: validated.receiptId },
          data: {
            purchaseId: purchase.id,
            processingStatus: "completed",
          },
        });
      }

      // 3. Create Warranty record
      let warrantyRecord = null;
      const warrantyMonths = validated.warranty?.durationMonths ?? 12;
      if (warrantyMonths && warrantyMonths > 0) {
        const wStart = validated.warranty?.startDate
          ? new Date(validated.warranty.startDate)
          : purchaseDate;
        const wStats = calculateWarrantyStatus(wStart, warrantyMonths);

        warrantyRecord = await tx.warranty.create({
          data: {
            purchaseId: purchase.id,
            durationMonths: warrantyMonths,
            startDate: wStart,
            expiryDate: wStats.expiryDate,
            status: wStats.status,
            reminderSettings: JSON.stringify([30, 14, 7]),
          },
        });
      }

      // 4. Create Return Window record
      const returnDays = validated.returnWindow?.durationDays ?? 14;
      const rStart = validated.returnWindow?.startDate
        ? new Date(validated.returnWindow.startDate)
        : purchaseDate;
      const rStats = calculateReturnWindowStatus(rStart, returnDays);

      const returnWindowRecord = await tx.returnWindow.create({
        data: {
          purchaseId: purchase.id,
          startDate: rStart,
          expiryDate: rStats.expiryDate,
          status: rStats.status,
        },
      });

      // 5. Create notification for warranty tracker
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "purchase_saved",
          title: "Purchase Saved to Vault",
          message: `Saved ${purchase.storeName} purchase (${purchase.items[0]?.productName || "Item"}) with ${warrantyMonths} months warranty.`,
        },
      });

      return {
        purchase,
        warranty: warrantyRecord,
        returnWindow: returnWindowRecord,
      };
    });

    return NextResponse.json(
      {
        message: "Purchase saved to vault successfully!",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Failed to create purchase:", error);
    return NextResponse.json(
      { error: "We couldn't save your purchase. Please try again." },
      { status: 500 }
    );
  }
}
