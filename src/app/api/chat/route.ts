import { NextRequest, NextResponse } from "next/server";
import { parseUserIntent } from "@/lib/parse-user-intent";

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const response = parseUserIntent(message, model);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
