import { NextRequest, NextResponse } from "next/server";
import { fal } from "@/lib/fal";
import { createServerClient } from "@/lib/supabase";
import { generateVideo, isGenerateError } from "@/lib/generate-video";
import { checkRateLimit } from "@/lib/rate-limit";

// 5 video generations per minute per IP
const GENERATE_RATE_LIMIT = 5;
const GENERATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed } = checkRateLimit(`generate:${ip}`, GENERATE_RATE_LIMIT, GENERATE_WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many video generations. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await generateVideo(body, fal, createServerClient());

    if (isGenerateError(result)) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Generate error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Video generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
