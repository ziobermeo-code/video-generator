import { NextRequest, NextResponse } from "next/server";
import { fal } from "@/lib/fal";
import { createServerClient } from "@/lib/supabase";
import { VIDEO_MODELS, type GenerateRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, model, aspect_ratio = "16:9", duration } = body;

    if (!prompt || !model) {
      return NextResponse.json(
        { error: "prompt and model are required" },
        { status: 400 }
      );
    }

    const modelConfig = VIDEO_MODELS.find((m) => m.id === model);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Invalid model: ${model}. Available: kling, veo, sora` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Create video record in DB
    const { data: video, error: dbError } = await supabase
      .from("videos")
      .insert({
        prompt,
        model,
        status: "processing",
        aspect_ratio,
        duration: duration || modelConfig.defaultDuration,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    // Build fal.ai request payload based on model
    const falInput: Record<string, unknown> = { prompt };

    if (model === "kling") {
      falInput.duration = String(duration || modelConfig.defaultDuration);
      falInput.aspect_ratio = aspect_ratio;
    } else if (model === "veo") {
      falInput.aspect_ratio = aspect_ratio;
    } else if (model === "sora") {
      falInput.duration = duration || modelConfig.defaultDuration;
      falInput.aspect_ratio = aspect_ratio;
    }

    // Submit to fal.ai queue
    const result = await fal.subscribe(modelConfig.falModel, {
      input: falInput,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[${model}] Queue status:`, update.status);
      },
    });

    // Extract video URL from result
    const videoUrl =
      result.data?.video?.url ||
      result.data?.video_url ||
      result.data?.output?.video?.url ||
      null;

    const thumbnailUrl =
      result.data?.video?.thumbnail_url ||
      result.data?.thumbnail_url ||
      null;

    // Update video record with result
    const { data: updatedVideo, error: updateError } = await supabase
      .from("videos")
      .update({
        status: videoUrl ? "completed" : "failed",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        fal_request_id: result.requestId,
        error_message: videoUrl ? null : "No video URL in response",
      })
      .eq("id", video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return NextResponse.json({
      video: updatedVideo || video,
      message: videoUrl
        ? `Video generated successfully with ${modelConfig.name}!`
        : "Video generation completed but no URL was returned.",
    });
  } catch (error: unknown) {
    console.error("Generate error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Video generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
