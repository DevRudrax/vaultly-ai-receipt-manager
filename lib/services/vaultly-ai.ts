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

    // Optional Gemini LLM integration if API key is provided
    const aiKey = process.env.AI_API_KEY;
    if (aiKey && aiKey.trim() !== "") {
      try {
        const llmResponse = await this.queryWithGemini(query, purchases, currencySymbol, aiKey);
        if (llmResponse) return llmResponse;
      } catch (err) {
        console.warn("Gemini query failed, falling back to Vaultly query engine:", err);
      }
    }

    // Intent 1: Warranties expiring / expiring this month / active warranties
    if (
      qLower.includes("warranty") ||
      qLower.includes("warranties") ||
      qLower.includes("expire") ||
      qLower.includes("coverage")
    ) {
      const allWarrantyItems = purchases
        .filter((p) => p.warranty)
        .map((p) => {
          const stats = calculateWarrantyStatus(
            p.warranty!.startDate,
            p.warranty!.durationMonths
          );
          return { purchase: p, stats };
        });

      const activeOrExpiring = allWarrantyItems.filter(
        (w) => w.stats.status === "active" || w.stats.status === "expiring"
      );

      const expiringSoon = activeOrExpiring.filter(
        (w) => w.stats.daysRemaining <= 60
      );

      if (qLower.includes("this month") || qLower.includes("soon") || qLower.includes("expire")) {
        if (expiringSoon.length === 0) {
          return {
            answer: `Good news! You have no warranties expiring in the next 60 days. You currently have **${activeOrExpiring.length} active warranties** safely stored in your vault.`,
            matchedPurchases: activeOrExpiring.map((w) => this.mapPurchaseSummary(w.purchase)),
          };
        }

        const itemsList = expiringSoon
          .map(
            (w) =>
              `• **${w.purchase.items[0]?.productName || w.purchase.storeName}** (${w.purchase.storeName}) — expires in **${w.stats.daysRemaining} days** (${w.stats.expiryDate.toLocaleDateString()})`
          )
          .join("\n");

        return {
          answer: `You have **${expiringSoon.length} warranty/warranties** expiring soon:\n\n${itemsList}`,
          matchedPurchases: expiringSoon.map((w) => this.mapPurchaseSummary(w.purchase)),
        };
      }

      return {
        answer: `You have **${activeOrExpiring.length} active warranties** tracked in Vaultly.`,
        matchedPurchases: activeOrExpiring.map((w) => this.mapPurchaseSummary(w.purchase)),
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
          return `• **${p.items[0]?.productName || p.storeName}** (${p.storeName}) — **${rStats.daysRemaining} days remaining** for return`;
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
    const stopWords = new Set(["find", "my", "receipt", "show", "me", "the", "get", "for", "a", "an", "where", "is", "purchases", "items"]);
    const queryTokens = qLower
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    const searchMatches = purchases.filter((p) => {
      const storeLower = p.storeName.toLowerCase();
      const invoiceLower = p.invoiceNumber?.toLowerCase() || "";
      const itemTexts = p.items.map((i) => `${i.productName} ${i.brand || ""}`.toLowerCase()).join(" ");

      if (queryTokens.length === 0) return storeLower.includes(qLower) || itemTexts.includes(qLower);

      return queryTokens.some(
        (token) => storeLower.includes(token) || invoiceLower.includes(token) || itemTexts.includes(token)
      );
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

  private static async queryWithGemini(
    query: string,
    purchases: any[],
    currencySymbol: string,
    apiKey: string
  ): Promise<VaultlyAiResponse | null> {
    const summary = purchases.map((p) => ({
      id: p.id,
      store: p.storeName,
      date: p.purchaseDate,
      total: `${currencySymbol}${p.totalAmount}`,
      category: p.category,
      items: p.items.map((i: any) => i.productName),
    }));

    const prompt = `You are Vaultly AI, an intelligent receipt and warranty assistant. 
User Query: "${query}"
User's Vault Data: ${JSON.stringify(summary)}

Provide a concise, helpful response using Markdown formatting (bolding key items, totals, dates).
Also return an array of matched purchase IDs if relevant.
Format your response strictly as JSON:
{
  "answer": "Your formatted answer text...",
  "matchedIds": ["id1", "id2"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const matched = purchases.filter((p) => (parsed.matchedIds || []).includes(p.id));
          return {
            answer: parsed.answer,
            matchedPurchases: matched.map(this.mapPurchaseSummary),
          };
        }
      }
    }
    return null;
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
