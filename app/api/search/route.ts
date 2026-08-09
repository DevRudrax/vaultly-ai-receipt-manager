import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateReturnWindowStatus, calculateWarrantyStatus } from "@/lib/services/warranty-engine";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const purchases = await db.purchase.findMany({
    where: {
      userId: user.id,
      OR: [
        { storeName: { contains: q } },
        { invoiceNumber: { contains: q } },
        { category: { contains: q } },
        { notes: { contains: q } },
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
      ],
    },
    include: {
      items: true,
      receipt: true,
      warranty: true,
      returnWindow: true,
    },
    orderBy: { purchaseDate: "desc" },
    take: 20,
  });

  const results = purchases.map((p) => ({
    ...p,
    warrantyStats: p.warranty
      ? calculateWarrantyStatus(p.warranty.startDate, p.warranty.durationMonths)
      : null,
    returnStats: p.returnWindow
      ? calculateReturnWindowStatus(p.returnWindow.startDate, 14)
      : null,
  }));

  return NextResponse.json({ results, query: q, count: results.length });
}
