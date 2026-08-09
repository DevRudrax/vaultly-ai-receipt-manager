import { db } from "../db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "./warranty-engine";

export interface VaultlyAiResponse {
  answer: string;
  matchedPurchases?: Array<{
    id: string;
    storeName: string;
    purchaseDate: string;
    totalAmount: number;
    currency: string;
    category: string;
    items: string[];
    receiptUrl?: string | null;
  }>;
  summaryStats?: {
    totalSpend?: number;
    count?: number;
    category?: string;
  };
}

export class VaultlyAiService {
  /**
   * Processes natural language queries against authenticated user's database records
   */
  public static async queryVault(
    userId: string,
    query: string
  ): Promise<VaultlyAiResponse> {
    const qLower = query.toLowerCase().trim();

    // Fetch user's purchases with items, warranty, return window, receipt
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

    const userSettings = await db.userSettings.findUnique({
      where: { userId },
    });

    const currencySymbol = userSettings?.currency === "INR" ? "₹" : "$";

    // Intent 1: Warranties expiring / expiring this month / active warranties
    if (
      qLower.includes("warranty") ||
      qLower.includes("warranties") ||
      qLower.includes("expire") ||
      qLower.includes("coverage")
    ) {
      const activeOrExpiring = purchases.filter((p) => {
        if (!p.warranty) return false;
        const wStats = calculateWarrantyStatus(
          p.warranty.startDate,
          p.warranty.durationMonths
        );
        return wStats.status === "active" || wStats.status === "expiring";
      });

      const expiringSoon = activeOrExpiring.filter((p) => {
        if (!p.warranty) return false;
        const wStats = calculateWarrantyStatus(
          p.warranty.startDate,
          p.warranty.durationMonths
        );
        return wStats.daysRemaining <= 30;
      });

      if (qLower.includes("this month") || qLower.includes("soon") || qLower.includes("expiring")) {
        if (expiringSoon.length === 0) {
          return {
            answer: `Good news! You have no warranties expiring in the next 30 days. You currently have ${activeOrExpiring.length} active warranties safely stored in your vault.`,
            matchedPurchases: activeOrExpiring.map(this.mapPurchaseSummary),
          };
        }

        const itemsList = expiringSoon
          .map(
            (p) =>
              `• **${p.items[0]?.productName || p.storeName}** (${p.storeName}) — expires in ${calculateWarrantyStatus(p.warranty!.startDate, p.warranty!.durationMonths).daysRemaining} days`
          )
          .join("\n");

        return {
          answer: `You have **${expiringSoon.length} warranty/warranties** expiring soon:\n\n${itemsList}`,
          matchedPurchases: expiringSoon.map(this.mapPurchaseSummary),
        };
      }

      return {
        answer: `You have **${activeOrExpiring.length} active warranties** tracked in Vaultly.`,
        matchedPurchases: activeOrExpiring.map(this.mapPurchaseSummary),
      };
    }

    // Intent 2: Return window eligibility ("What can I still return?")
    if (qLower.includes("return") || qLower.includes("eligible") || qLower.includes("refund")) {
      const eligibleReturns = purchases.filter((p) => {
        if (!p.returnWindow) return false;
        const rStats = calculateReturnWindowStatus(p.returnWindow.startDate, 14);
        return rStats.isEligible;
      });

      if (eligibleReturns.length === 0) {
        return {
          answer: `None of your recorded purchases are currently within an open return window.`,
        };
      }

      const list = eligibleReturns
        .map((p) => {
          const rStats = calculateReturnWindowStatus(p.returnWindow!.startDate, 14);
          return `• **${p.items[0]?.productName || p.storeName}** (${p.storeName}) — ${rStats.daysRemaining} days remaining for return`;
        })
        .join("\n");

      return {
        answer: `You have **${eligibleReturns.length} purchase(s)** currently eligible for return:\n\n${list}`,
        matchedPurchases: eligibleReturns.map(this.mapPurchaseSummary),
      };
    }

    // Intent 3: Category spending queries ("How much did I spend on electronics?")
    const categoryKeywords = ["electronics", "appliances", "apparel", "audio", "home", "general"];
    const matchedCategory = categoryKeywords.find((cat) => qLower.includes(cat));

    if (
      qLower.includes("spend") ||
      qLower.includes("spent") ||
      qLower.includes("cost") ||
      qLower.includes("total") ||
      matchedCategory
    ) {
      let filtered = purchases;
      let catName = "all categories";

      if (matchedCategory) {
        catName = matchedCategory;
        filtered = purchases.filter(
          (p) =>
            p.category.toLowerCase().includes(matchedCategory) ||
            p.items.some((i) => (i.category || "").toLowerCase().includes(matchedCategory))
        );
      }

      const totalSpend = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);

      return {
        answer: `Based on your Vaultly records, you have spent **${currencySymbol}${totalSpend.toLocaleString()}** on ${catName} across ${filtered.length} purchase(s).`,
        summaryStats: {
          totalSpend,
          count: filtered.length,
          category: catName,
        },
        matchedPurchases: filtered.map(this.mapPurchaseSummary),
      };
    }

    // Intent 4: Specific Product / Store lookup ("Find my Samsung TV receipt", "Croma", "AirPods")
    const searchMatches = purchases.filter((p) => {
      const matchStore = p.storeName.toLowerCase().includes(qLower);
      const matchInvoice = p.invoiceNumber?.toLowerCase().includes(qLower);
      const matchItems = p.items.some(
        (i) =>
          i.productName.toLowerCase().includes(qLower) ||
          (i.brand && i.brand.toLowerCase().includes(qLower))
      );
      return matchStore || matchInvoice || matchItems;
    });

    if (searchMatches.length > 0) {
      const itemNames = searchMatches
        .map(
          (p) =>
            `• **${p.items[0]?.productName || p.storeName}** from ${p.storeName} on ${new Date(p.purchaseDate).toLocaleDateString()} (${currencySymbol}${p.totalAmount.toLocaleString()})`
        )
        .join("\n");

      return {
        answer: `I found **${searchMatches.length} matching purchase(s)** in your vault:\n\n${itemNames}`,
        matchedPurchases: searchMatches.map(this.mapPurchaseSummary),
      };
    }

    // General fallback using AI summary if query is generic
    const totalVaultSpend = purchases.reduce((a, b) => a + b.totalAmount, 0);
    return {
      answer: `You currently have **${purchases.length} purchases** in Vaultly with a total tracked spending of **${currencySymbol}${totalVaultSpend.toLocaleString()}**. Try asking "Which warranties expire soon?", "How much did I spend on electronics?", or searching for a specific store like "Croma".`,
      matchedPurchases: purchases.slice(0, 5).map(this.mapPurchaseSummary),
    };
  }

  private static mapPurchaseSummary(p: any) {
    return {
      id: p.id,
      storeName: p.storeName,
      purchaseDate: new Date(p.purchaseDate).toISOString().split("T")[0],
      totalAmount: p.totalAmount,
      currency: p.currency,
      category: p.category,
      items: p.items.map((i: any) => i.productName),
      receiptUrl: p.receipt?.fileUrl || null,
    };
  }
}
