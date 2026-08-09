import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteUploadedFile } from "@/lib/services/storage";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch user receipts to delete files
    const receipts = await db.receipt.findMany({
      where: { userId: user.id },
      select: { fileUrl: true },
    });

    for (const r of receipts) {
      if (r.fileUrl) {
        await deleteUploadedFile(r.fileUrl);
      }
    }

    // 2. Cascade delete user (Prisma cascade deletes purchases, receipts, settings, notifications)
    await db.user.delete({
      where: { id: user.id },
    });

    // 3. Clear session cookie
    const response = NextResponse.json(
      { message: "Account and all associated records deleted successfully." },
      { status: 200 }
    );

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: "",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }
}
