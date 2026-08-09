import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (params.id === "all") {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ message: "All notifications marked as read." });
  }

  const notification = await db.notification.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await db.notification.update({
    where: { id: params.id },
    data: { read: true },
  });

  return NextResponse.json({ message: "Marked as read." });
}
