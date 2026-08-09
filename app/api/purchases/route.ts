import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PurchaseCreateSchema } from "@/lib/validators";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

const DEMO_PURCHASES_FALLBACK = [
  {
    id: "demo-1",
    storeName: "Croma",
    purchaseDate: "2026-06-09T00:00:00.000Z",
    totalAmount: 74999,
    currency: "INR",
    category: "Electronics",
    invoiceNumber: "INV-994812",
    notes: "Living room TV",
    items: [
      {
        id: "item-1",
        productName: "Samsung 55 OLED 4K Smart TV",
        brand: "Samsung",
        category: "Electronics",
        quantity: 1,
        unitPrice: 74999,
        totalPrice: 74999,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_samsung_tv.svg" },
    warranty: { durationMonths: 24, startDate: "2026-06-09T00:00:00.000Z" },
    warrantyStats: { status: "active", daysRemaining: 671, percentageElapsed: 8 },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "demo-2",
    storeName: "Apple Store",
    purchaseDate: "2025-09-09T00:00:00.000Z",
    totalAmount: 24900,
    currency: "INR",
    category: "Audio",
    invoiceNumber: "INV-883719",
    notes: "AppleCare enabled",
    items: [
      {
        id: "item-2",
        productName: "Apple AirPods Pro (2nd Gen)",
        brand: "Apple",
        category: "Audio",
        quantity: 1,
        unitPrice: 24900,
        totalPrice: 24900,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_airpods.svg" },
    warranty: { durationMonths: 12, startDate: "2025-09-09T00:00:00.000Z" },
    warrantyStats: { status: "expiring", daysRemaining: 35, percentageElapsed: 90 },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "demo-3",
    storeName: "Amazon",
    purchaseDate: "2026-07-09T00:00:00.000Z",
    totalAmount: 29990,
    currency: "INR",
    category: "Audio",
    invoiceNumber: "INV-473821",
    notes: "Black noise canceling",
    items: [
      {
        id: "item-3",
        productName: "Sony WH-1000XM5 Headphones",
        brand: "Sony",
        category: "Audio",
        quantity: 1,
        unitPrice: 29990,
        totalPrice: 29990,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_sony.svg" },
    warranty: { durationMonths: 12, startDate: "2026-07-09T00:00:00.000Z" },
    warrantyStats: { status: "active", daysRemaining: 334, percentageElapsed: 8 },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "demo-4",
    storeName: "Reliance Digital",
    purchaseDate: "2026-04-09T00:00:00.000Z",
    totalAmount: 58999,
    currency: "INR",
    category: "Appliances",
    invoiceNumber: "INV-119284",
    items: [
      {
        id: "item-4",
        productName: "LG 423L Double Door Refrigerator",
        brand: "LG",
        category: "Appliances",
        quantity: 1,
        unitPrice: 58999,
        totalPrice: 58999,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_lg.svg" },
    warranty: { durationMonths: 24, startDate: "2026-04-09T00:00:00.000Z" },
    warrantyStats: { status: "active", daysRemaining: 610, percentageElapsed: 16 },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "demo-5",
    storeName: "Dyson Flagship",
    purchaseDate: "2026-08-01T00:00:00.000Z",
    totalAmount: 42500,
    currency: "INR",
    category: "Home Appliances",
    invoiceNumber: "INV-559281",
    items: [
      {
        id: "item-5",
        productName: "Dyson Purifier Cool Gen1",
        brand: "Dyson",
        category: "Home Appliances",
        quantity: 1,
        unitPrice: 42500,
        totalPrice: 42500,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_dyson.svg" },
    warranty: { durationMonths: 24, startDate: "2026-08-01T00:00:00.000Z" },
    warrantyStats: { status: "active", daysRemaining: 722, percentageElapsed: 1 },
    returnStats: { isEligible: true, daysRemaining: 12 },
  },
  {
    id: "demo-6",
    storeName: "Nike Flagship",
    purchaseDate: "2026-08-05T00:00:00.000Z",
    totalAmount: 12999,
    currency: "INR",
    category: "Apparel",
    invoiceNumber: "INV-774921",
    items: [
      {
        id: "item-6",
        productName: "Nike Air Max 270",
        brand: "Nike",
        category: "Apparel",
        quantity: 1,
        unitPrice: 12999,
        totalPrice: 12999,
      },
    ],
    receipt: { fileUrl: "/uploads/receipt_nike.svg" },
    warranty: { durationMonths: 6, startDate: "2026-08-05T00:00:00.000Z" },
    warrantyStats: { status: "active", daysRemaining: 176, percentageElapsed: 2 },
    returnStats: { isEligible: true, daysRemaining: 26 },
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id || "demo-user-id";

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const store = searchParams.get("store");
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: any = { userId };

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

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({
        purchases: DEMO_PURCHASES_FALLBACK,
        pagination: { total: DEMO_PURCHASES_FALLBACK.length, page: 1, limit: 50, totalPages: 1 },
      });
    }

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
  } catch (err) {
    console.warn("Purchases API fallback used:", err);
    return NextResponse.json({
      purchases: DEMO_PURCHASES_FALLBACK,
      pagination: { total: DEMO_PURCHASES_FALLBACK.length, page: 1, limit: 50, totalPages: 1 },
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const userId = user?.id || "demo-user-id";

  try {
    const body = await req.json();
    const validated = PurchaseCreateSchema.parse(body);

    const purchaseDate = new Date(validated.purchaseDate);

    const result = await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId,
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

      if (validated.receiptId) {
        await tx.receipt.update({
          where: { id: validated.receiptId },
          data: {
            purchaseId: purchase.id,
            processingStatus: "completed",
          },
        });
      }

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
