import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

const DEMO_WARRANTIES_FALLBACK = [
  {
    id: "w-1",
    durationMonths: 24,
    startDate: "2026-06-09T00:00:00.000Z",
    calculatedStatus: "active",
    daysRemaining: 671,
    totalDays: 730,
    percentageElapsed: 8,
    expiryDateFormatted: "2028-06-09",
    purchase: {
      id: "demo-1",
      storeName: "Croma",
      category: "Electronics",
      items: [{ productName: "Samsung 55 OLED 4K Smart TV" }],
      returnWindow: { startDate: "2026-06-09T00:00:00.000Z" },
    },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "w-2",
    durationMonths: 12,
    startDate: "2025-09-09T00:00:00.000Z",
    calculatedStatus: "expiring",
    daysRemaining: 35,
    totalDays: 365,
    percentageElapsed: 90,
    expiryDateFormatted: "2026-09-09",
    purchase: {
      id: "demo-2",
      storeName: "Apple Store",
      category: "Audio",
      items: [{ productName: "Apple AirPods Pro (2nd Gen)" }],
      returnWindow: { startDate: "2025-09-09T00:00:00.000Z" },
    },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
  {
    id: "w-3",
    durationMonths: 12,
    startDate: "2026-07-09T00:00:00.000Z",
    calculatedStatus: "active",
    daysRemaining: 334,
    totalDays: 365,
    percentageElapsed: 8,
    expiryDateFormatted: "2027-07-09",
    purchase: {
      id: "demo-3",
      storeName: "Amazon",
      category: "Audio",
      items: [{ productName: "Sony WH-1000XM5 Headphones" }],
      returnWindow: { startDate: "2026-07-09T00:00:00.000Z" },
    },
    returnStats: { isEligible: false, daysRemaining: 0 },
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id || "demo-user-id";

    const warranties = await db.warranty.findMany({
      where: { purchase: { userId } },
      include: {
        purchase: {
          include: {
            items: true,
            receipt: true,
            returnWindow: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    if (!warranties || warranties.length === 0) {
      return NextResponse.json({ warranties: DEMO_WARRANTIES_FALLBACK });
    }

    const enrichedWarranties = warranties.map((w) => {
      const wStats = calculateWarrantyStatus(w.startDate, w.durationMonths);
      let rStats = null;
      if (w.purchase.returnWindow) {
        rStats = calculateReturnWindowStatus(w.purchase.returnWindow.startDate, 14);
      }

      return {
        ...w,
        calculatedStatus: wStats.status,
        daysRemaining: wStats.daysRemaining,
        totalDays: wStats.totalDays,
        percentageElapsed: wStats.percentageElapsed,
        expiryDateFormatted: wStats.expiryDate.toISOString().split("T")[0],
        returnStats: rStats,
      };
    });

    return NextResponse.json({ warranties: enrichedWarranties });
  } catch (err) {
    console.warn("Warranties API fallback used:", err);
    return NextResponse.json({ warranties: DEMO_WARRANTIES_FALLBACK });
  }
}
