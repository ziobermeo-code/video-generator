import { NextRequest, NextResponse } from "next/server";
import { parseUserIntent } from "@/lib/parse-user-intent";
import { checkRateLimit } from "@/lib/rate-limit";

// 30 requests per minute per IP
const CHAT_RATE_LIMIT = 30;
const CHAT_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed } = checkRateLimit(`chat:${ip}`, CHAT_RATE_LIMIT, CHAT_WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

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
