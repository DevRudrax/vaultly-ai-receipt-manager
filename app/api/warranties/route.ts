import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const warranties = await db.warranty.findMany({
    where: { purchase: { userId: user.id } },
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
}
