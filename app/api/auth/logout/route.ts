import { NextResponse } from "next/server";
import { TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}
