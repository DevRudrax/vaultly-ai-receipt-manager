import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      warranty: true,
    },
    orderBy: { purchaseDate: "asc" },
  });

  const totalSpend = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  // Spending by Category
  const categoryMap: Record<string, number> = {};
  // Spending by Store
  const storeMap: Record<string, number> = {};
  // Monthly spending breakdown
  const monthlyMap: Record<string, number> = {};

  let itemsWithWarrantyCount = 0;

  purchases.forEach((p) => {
    // Category
    const cat = p.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + p.totalAmount;

    // Store
    const store = p.storeName || "Other";
    storeMap[store] = (storeMap[store] || 0) + p.totalAmount;

    // Monthly
    const d = new Date(p.purchaseDate);
    const monthKey = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.totalAmount;

    // Warranty
    if (p.warranty) {
      const wStats = calculateWarrantyStatus(p.warranty.startDate, p.warranty.durationMonths);
      if (wStats.status !== "expired") {
        itemsWithWarrantyCount++;
      }
    }
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
  }));

  const topStores = Object.entries(storeMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const monthlyTrend = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount,
  }));

  const mostExpensivePurchases = [...purchases]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      storeName: p.storeName,
      totalAmount: p.totalAmount,
      purchaseDate: p.purchaseDate.toISOString().split("T")[0],
      productName: p.items[0]?.productName || p.storeName,
    }));

  const warrantyCoveragePercentage =
    purchases.length > 0
      ? Math.round((itemsWithWarrantyCount / purchases.length) * 100)
      : 0;

  return NextResponse.json({
    totalSpend,
    totalPurchases: purchases.length,
    warrantyCoveragePercentage,
    itemsWithWarrantyCount,
    categoryBreakdown,
    topStores,
    monthlyTrend,
    mostExpensivePurchases,
  });
}
