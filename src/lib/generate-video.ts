import { VIDEO_MODELS, type GenerateRequest, type Video } from "./types";

export interface GenerateResult {
  video: Video;
  message: string;
}

export interface GenerateError {
  error: string;
  status: number;
}

export type GenerateResponse = GenerateResult | GenerateError;

export function isGenerateError(res: GenerateResponse): res is GenerateError {
  return "error" in res;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FalClient = { subscribe(model: string, options: Record<string, unknown>): Promise<any> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from(table: string): any };

export function buildFalInput(prompt: string, model: string, aspect_ratio: string, duration: number): Record<string, unknown> {
  const input: Record<string, unknown> = { prompt };

  if (model === "kling") {
    input.duration = String(duration);
    input.aspect_ratio = aspect_ratio;
  } else if (model === "veo") {
    input.aspect_ratio = aspect_ratio;
  } else if (model === "sora") {
    input.duration = duration;
    input.aspect_ratio = aspect_ratio;
  }

  return input;
}

export function extractVideoUrl(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const video = data.video as Record<string, unknown> | undefined;
  const output = data.output as Record<string, unknown> | undefined;
  const outputVideo = output?.video as Record<string, unknown> | undefined;

  return (
    (video?.url as string) ||
    (data.video_url as string) ||
    (outputVideo?.url as string) ||
    null
  );
}

export function extractThumbnailUrl(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const video = data.video as Record<string, unknown> | undefined;

  return (
    (video?.thumbnail_url as string) ||
    (data.thumbnail_url as string) ||
    null
  );
}

export function validateGenerateRequest(body: GenerateRequest): GenerateError | null {
  const { prompt, model } = body;

  if (!prompt || !model) {
    return { error: "prompt and model are required", status: 400 };
  }

  const modelConfig = VIDEO_MODELS.find((m) => m.id === model);
  if (!modelConfig) {
    return { error: `Invalid model: ${model}. Available: kling, veo, sora`, status: 400 };
  }

  return null;
}

export async function generateVideo(
  body: GenerateRequest,
  falClient: FalClient,
  supabase: SupabaseClient,
): Promise<GenerateResponse> {
  const validationError = validateGenerateRequest(body);
  if (validationError) return validationError;

  const { prompt, model, aspect_ratio = "16:9", duration } = body;
  const modelConfig = VIDEO_MODELS.find((m) => m.id === model)!;

  const effectiveDuration = duration || modelConfig.defaultDuration;

  // Create video record in DB
  const { data: video, error: dbError } = await supabase
    .from("videos")
    .insert({
      prompt,
      model,
      status: "processing",
      aspect_ratio,
      duration: effectiveDuration,
    })
    .select()
    .single();

  if (dbError || !video) {
    return { error: "Failed to create video record", status: 500 };
  }

  // Build fal.ai request payload
  const falInput = buildFalInput(prompt, model, aspect_ratio, effectiveDuration);

  // Submit to fal.ai
  const result = await falClient.subscribe(modelConfig.falModel, {
    input: falInput,
    logs: true,
  });

  // Extract URLs
  const videoUrl = extractVideoUrl(result.data);
  const thumbnailUrl = extractThumbnailUrl(result.data);

  // Update video record
  const { data: updatedVideo } = await supabase
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

  return {
    video: updatedVideo || video,
    message: videoUrl
      ? `Video generated successfully with ${modelConfig.name}!`
      : "Video generation completed but no URL was returned.",
  };
}
