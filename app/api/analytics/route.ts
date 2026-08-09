import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateWarrantyStatus } from "@/lib/services/warranty-engine";

const DEMO_ANALYTICS_FALLBACK = {
  totalSpend: 244387,
  totalPurchases: 6,
  warrantyCoveragePercentage: 83,
  itemsWithWarrantyCount: 5,
  categoryBreakdown: [
    { name: "Electronics", amount: 74999, percentage: 31 },
    { name: "Appliances", amount: 58999, percentage: 24 },
    { name: "Audio", amount: 54890, percentage: 22 },
    { name: "Home Appliances", amount: 42500, percentage: 17 },
    { name: "Apparel", amount: 12999, percentage: 5 },
  ],
  topStores: [
    { name: "Croma", amount: 74999 },
    { name: "Reliance Digital", amount: 58999 },
    { name: "Dyson Flagship", amount: 42500 },
    { name: "Amazon", amount: 29990 },
    { name: "Apple Store", amount: 24900 },
  ],
  monthlyTrend: [
    { month: "Apr 26", amount: 58999 },
    { month: "Jun 26", amount: 74999 },
    { month: "Jul 26", amount: 29990 },
    { month: "Aug 26", amount: 55499 },
  ],
  mostExpensivePurchases: [
    { id: "demo-1", storeName: "Croma", totalAmount: 74999, purchaseDate: "2026-06-09", productName: "Samsung 55 OLED 4K Smart TV" },
    { id: "demo-4", storeName: "Reliance Digital", totalAmount: 58999, purchaseDate: "2026-04-09", productName: "LG 423L Refrigerator" },
    { id: "demo-5", storeName: "Dyson Flagship", totalAmount: 42500, purchaseDate: "2026-08-01", productName: "Dyson Purifier Cool Gen1" },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id || "demo-user-id";

    const purchases = await db.purchase.findMany({
      where: { userId },
      include: {
        items: true,
        warranty: true,
      },
      orderBy: { purchaseDate: "asc" },
    });

    if (!purchases || purchases.length === 0) {
      return NextResponse.json(DEMO_ANALYTICS_FALLBACK);
    }

    const totalSpend = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

    const categoryMap: Record<string, number> = {};
    const storeMap: Record<string, number> = {};
    const monthlyMap: Record<string, number> = {};

    let itemsWithWarrantyCount = 0;

    purchases.forEach((p) => {
      const cat = p.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + p.totalAmount;

      const store = p.storeName || "Other";
      storeMap[store] = (storeMap[store] || 0) + p.totalAmount;

      const d = new Date(p.purchaseDate);
      const monthKey = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.totalAmount;

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
  } catch (err) {
    console.warn("Analytics API fallback used:", err);
    return NextResponse.json(DEMO_ANALYTICS_FALLBACK);
  }
}
