import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { AiQuerySchema } from "@/lib/validators";
import { VaultlyAiService } from "@/lib/services/vaultly-ai";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = AiQuerySchema.parse(body);

    const result = await VaultlyAiService.queryVault(user.id, validated.query);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Vaultly AI query error:", error);
    return NextResponse.json(
      { error: "Vaultly AI was unable to process your request. Please try again." },
      { status: 500 }
    );
  }
}
