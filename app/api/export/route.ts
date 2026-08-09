import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      warranty: true,
      returnWindow: true,
    },
    orderBy: { purchaseDate: "desc" },
  });

  // Generate CSV rows
  const headers = [
    "Purchase ID",
    "Product Name",
    "Brand",
    "Store Name",
    "Category",
    "Purchase Date",
    "Price",
    "Currency",
    "Invoice Number",
    "Warranty Duration (Months)",
    "Warranty Expiry Date",
    "Warranty Status",
    "Return Deadline",
    "Return Eligibility",
  ];

  const rows: string[][] = [headers];

  purchases.forEach((p) => {
    const pDate = new Date(p.purchaseDate).toISOString().split("T")[0];
    let wMonths = "N/A";
    let wExpiry = "N/A";
    let wStatus = "N/A";
    if (p.warranty) {
      wMonths = String(p.warranty.durationMonths);
      const wStats = calculateWarrantyStatus(p.warranty.startDate, p.warranty.durationMonths);
      wExpiry = wStats.expiryDate.toISOString().split("T")[0];
      wStatus = wStats.status;
    }

    let rExpiry = "N/A";
    let rStatus = "N/A";
    if (p.returnWindow) {
      const rStats = calculateReturnWindowStatus(p.returnWindow.startDate, 14);
      rExpiry = rStats.expiryDate.toISOString().split("T")[0];
      rStatus = rStats.isEligible ? "Eligible" : "Expired";
    }

    p.items.forEach((item) => {
      rows.push([
        p.id,
        `"${item.productName.replace(/"/g, '""')}"`,
        `"${(item.brand || "").replace(/"/g, '""')}"`,
        `"${p.storeName.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        pDate,
        String(item.totalPrice),
        p.currency,
        `"${(p.invoiceNumber || "").replace(/"/g, '""')}"`,
        wMonths,
        wExpiry,
        wStatus,
        rExpiry,
        rStatus,
      ]);
    });
  });

  const csvContent = rows.map((e) => e.join(",")).join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vaultly_purchases_export_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
