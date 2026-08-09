import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDetail = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      settings: true,
    },
  });

  return NextResponse.json({ user: userDetail });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.avatar) updateData.avatar = body.avatar;
    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (body.settings) {
      await db.userSettings.upsert({
        where: { userId: user.id },
        update: body.settings,
        create: {
          userId: user.id,
          ...body.settings,
        },
      });
    }

    return NextResponse.json({ user: updatedUser, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
