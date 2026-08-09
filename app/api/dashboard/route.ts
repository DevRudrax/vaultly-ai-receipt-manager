import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all user purchases with items, warranty, returnWindow, receipt
  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      receipt: true,
      warranty: true,
      returnWindow: true,
    },
    orderBy: { purchaseDate: "desc" },
  });

  const userSettings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  let activeWarrantiesCount = 0;
  let expiringWarrantiesCount = 0;
  let totalSpending = 0;
  let purchasesThisMonthCount = 0;
  let monthlySpending = 0;

  const upcomingDeadlines: any[] = [];

  purchases.forEach((p) => {
    totalSpending += p.totalAmount;

    if (new Date(p.purchaseDate) >= startOfMonth) {
      purchasesThisMonthCount++;
      monthlySpending += p.totalAmount;
    }

    if (p.warranty) {
      const wStats = calculateWarrantyStatus(
        p.warranty.startDate,
        p.warranty.durationMonths
      );
      if (wStats.status === "active") activeWarrantiesCount++;
      if (wStats.status === "expiring") {
        expiringWarrantiesCount++;
        activeWarrantiesCount++; // expiring is still active
      }

      if (wStats.daysRemaining > 0 && wStats.daysRemaining <= 60) {
        upcomingDeadlines.push({
          id: p.warranty.id,
          type: "warranty",
          title: p.items[0]?.productName || p.storeName,
          storeName: p.storeName,
          daysRemaining: wStats.daysRemaining,
          expiryDate: wStats.expiryDate.toISOString().split("T")[0],
          status: wStats.status,
          purchaseId: p.id,
        });
      }
    }

    if (p.returnWindow) {
      const rStats = calculateReturnWindowStatus(p.returnWindow.startDate, 14);
      if (rStats.isEligible) {
        upcomingDeadlines.push({
          id: p.returnWindow.id,
          type: "return_window",
          title: p.items[0]?.productName || p.storeName,
          storeName: p.storeName,
          daysRemaining: rStats.daysRemaining,
          expiryDate: rStats.expiryDate.toISOString().split("T")[0],
          status: rStats.status,
          purchaseId: p.id,
        });
      }
    }
  });

  // Sort upcoming deadlines by days remaining
  upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Generate dynamic AI Insight based on user data
  let aiInsight = "All your active warranties are protected in Vaultly.";
  if (expiringWarrantiesCount > 0) {
    aiInsight = `You have ${expiringWarrantiesCount} warranty/warranties expiring in the next 30 days. Review them now to ensure timely coverage.`;
  } else if (upcomingDeadlines.some((d) => d.type === "return_window")) {
    const retItem = upcomingDeadlines.find((d) => d.type === "return_window");
    aiInsight = `You can still return "${retItem.title}" (${retItem.daysRemaining} days left).`;
  } else if (purchases.length > 0) {
    const topCat = purchases[0].category;
    aiInsight = `Your highest activity category is ${topCat}. Track warranties to avoid out-of-pocket repair costs.`;
  }

  return NextResponse.json({
    metrics: {
      totalPurchases: purchases.length,
      purchasesThisMonth: purchasesThisMonthCount,
      totalSpending,
      monthlySpending,
      activeWarranties: activeWarrantiesCount,
      expiringWarranties: expiringWarrantiesCount,
      currency: userSettings?.currency || "INR",
    },
    recentPurchases: purchases.slice(0, 6).map((p) => ({
      ...p,
      warrantyStats: p.warranty
        ? calculateWarrantyStatus(p.warranty.startDate, p.warranty.durationMonths)
        : null,
      returnStats: p.returnWindow
        ? calculateReturnWindowStatus(p.returnWindow.startDate, 14)
        : null,
    })),
    upcomingDeadlines: upcomingDeadlines.slice(0, 5),
    aiInsight,
  });
}
