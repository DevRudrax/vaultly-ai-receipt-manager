import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { SignUpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = SignUpSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);

    // Create user and default settings
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(validated.name)}`,
        settings: {
          create: {
            currency: "INR",
            timezone: "Asia/Kolkata",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    const token = generateToken(user);

    const response = NextResponse.json(
      { user, token, message: "Account created successfully!" },
      { status: 201 }
    );

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong creating your account." },
      { status: 500 }
    );
  }
}
