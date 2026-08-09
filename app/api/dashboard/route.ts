import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

const DEMO_FALLBACK_DASHBOARD = {
  metrics: {
    totalPurchases: 6,
    purchasesThisMonth: 2,
    totalSpending: 244387,
    monthlySpending: 55499,
    activeWarranties: 5,
    expiringWarranties: 1,
    currency: "INR",
  },
  recentPurchases: [
    {
      id: "demo-1",
      storeName: "Croma",
      purchaseDate: "2026-06-09T00:00:00.000Z",
      totalAmount: 74999,
      currency: "INR",
      category: "Electronics",
      items: [{ productName: "Samsung 55 OLED 4K Smart TV" }],
    },
    {
      id: "demo-2",
      storeName: "Apple Store",
      purchaseDate: "2025-09-09T00:00:00.000Z",
      totalAmount: 24900,
      currency: "INR",
      category: "Audio",
      items: [{ productName: "Apple AirPods Pro (2nd Gen)" }],
    },
    {
      id: "demo-3",
      storeName: "Amazon",
      purchaseDate: "2026-07-09T00:00:00.000Z",
      totalAmount: 29990,
      currency: "INR",
      category: "Audio",
      items: [{ productName: "Sony WH-1000XM5 Headphones" }],
    },
    {
      id: "demo-4",
      storeName: "Reliance Digital",
      purchaseDate: "2026-04-09T00:00:00.000Z",
      totalAmount: 58999,
      currency: "INR",
      category: "Appliances",
      items: [{ productName: "LG 423L Double Door Refrigerator" }],
    },
  ],
  upcomingDeadlines: [
    {
      id: "deadline-1",
      type: "warranty",
      title: "Apple AirPods Pro (2nd Gen)",
      storeName: "Apple Store",
      daysRemaining: 35,
      expiryDate: "2026-09-13",
      status: "expiring",
    },
    {
      id: "deadline-2",
      type: "return_window",
      title: "Dyson Purifier Cool Gen1",
      storeName: "Dyson Flagship",
      daysRemaining: 12,
      expiryDate: "2026-08-21",
      status: "active",
    },
  ],
  aiInsight: "You have 1 warranty expiring in 35 days (Apple AirPods Pro). Review it to ensure coverage.",
};

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id || "demo-user-id";

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const purchases = await db.purchase.findMany({
      where: { userId },
      include: {
        items: true,
        receipt: true,
        warranty: true,
        returnWindow: true,
      },
      orderBy: { purchaseDate: "desc" },
    });

    if (!purchases || purchases.length === 0) {
      return NextResponse.json(DEMO_FALLBACK_DASHBOARD);
    }

    const userSettings = await db.userSettings.findUnique({
      where: { userId },
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
          activeWarrantiesCount++;
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

    upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

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
  } catch (err) {
    console.warn("Dashboard API fallback used:", err);
    return NextResponse.json(DEMO_FALLBACK_DASHBOARD);
  }
}
