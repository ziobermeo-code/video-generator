import { describe, it, expect, vi } from "vitest";
import {
  validateGenerateRequest,
  buildFalInput,
  extractVideoUrl,
  extractThumbnailUrl,
  generateVideo,
  isGenerateError,
} from "./generate-video";

describe("validateGenerateRequest", () => {
  it("devuelve error si falta prompt", () => {
    const err = validateGenerateRequest({ prompt: "", model: "kling" });
    expect(err).toEqual({ error: "prompt and model are required", status: 400 });
  });

  it("devuelve error si falta model", () => {
    const err = validateGenerateRequest({ prompt: "test", model: "" as never });
    expect(err).toEqual({ error: "prompt and model are required", status: 400 });
  });

  it("devuelve error si el modelo no existe", () => {
    const err = validateGenerateRequest({ prompt: "test", model: "invalid" as never });
    expect(err?.status).toBe(400);
    expect(err?.error).toContain("Invalid model");
  });

  it("devuelve null para request válido con kling", () => {
    expect(validateGenerateRequest({ prompt: "test", model: "kling" })).toBeNull();
  });

  it("devuelve null para request válido con veo", () => {
    expect(validateGenerateRequest({ prompt: "test", model: "veo" })).toBeNull();
  });

  it("devuelve null para request válido con sora", () => {
    expect(validateGenerateRequest({ prompt: "test", model: "sora" })).toBeNull();
  });
});

describe("buildFalInput", () => {
  it("Kling: duration como string y aspect_ratio", () => {
    const input = buildFalInput("a cat", "kling", "16:9", 5);
    expect(input).toEqual({ prompt: "a cat", duration: "5", aspect_ratio: "16:9" });
  });

  it("VEO: solo aspect_ratio, sin duration", () => {
    const input = buildFalInput("a cat", "veo", "9:16", 8);
    expect(input).toEqual({ prompt: "a cat", aspect_ratio: "9:16" });
  });

  it("Sora: duration como número y aspect_ratio", () => {
    const input = buildFalInput("a cat", "sora", "1:1", 5);
    expect(input).toEqual({ prompt: "a cat", duration: 5, aspect_ratio: "1:1" });
  });
});

describe("extractVideoUrl", () => {
  it("extrae de data.video.url", () => {
    expect(extractVideoUrl({ video: { url: "https://example.com/v.mp4" } })).toBe("https://example.com/v.mp4");
  });

  it("extrae de data.video_url", () => {
    expect(extractVideoUrl({ video_url: "https://example.com/v.mp4" })).toBe("https://example.com/v.mp4");
  });

  it("extrae de data.output.video.url", () => {
    expect(extractVideoUrl({ output: { video: { url: "https://example.com/v.mp4" } } })).toBe("https://example.com/v.mp4");
  });

  it("devuelve null si no hay URL", () => {
    expect(extractVideoUrl({})).toBeNull();
  });

  it("devuelve null si data es undefined", () => {
    expect(extractVideoUrl(undefined)).toBeNull();
  });
});

describe("extractThumbnailUrl", () => {
  it("extrae de data.video.thumbnail_url", () => {
    expect(extractThumbnailUrl({ video: { thumbnail_url: "https://example.com/t.jpg" } })).toBe("https://example.com/t.jpg");
  });

  it("extrae de data.thumbnail_url", () => {
    expect(extractThumbnailUrl({ thumbnail_url: "https://example.com/t.jpg" })).toBe("https://example.com/t.jpg");
  });

  it("devuelve null si no hay thumbnail", () => {
    expect(extractThumbnailUrl({})).toBeNull();
  });

  it("devuelve null si data es undefined", () => {
    expect(extractThumbnailUrl(undefined)).toBeNull();
  });
});

describe("isGenerateError", () => {
  it("detecta error", () => {
    expect(isGenerateError({ error: "fail", status: 400 })).toBe(true);
  });

  it("detecta resultado exitoso", () => {
    expect(isGenerateError({ video: {} as never, message: "ok" })).toBe(false);
  });
});

describe("generateVideo", () => {
  const mockVideo = {
    id: "vid-1",
    prompt: "a cat",
    model: "kling",
    status: "processing",
    video_url: null,
    thumbnail_url: null,
    duration: 5,
    aspect_ratio: "16:9",
    error_message: null,
    created_at: "2025-01-01T00:00:00Z",
  };

  const mockUpdatedVideo = {
    ...mockVideo,
    status: "completed",
    video_url: "https://fal.media/v.mp4",
  };

  function createMockSupabase(opts: { insertError?: boolean; updateError?: boolean } = {}) {
    return {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve(
              opts.insertError
                ? { data: null, error: { message: "DB error" } }
                : { data: mockVideo, error: null }
            ),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve(
                opts.updateError
                  ? { data: null, error: { message: "Update error" } }
                  : { data: mockUpdatedVideo, error: null }
              ),
            }),
          }),
        }),
      }),
    };
  }

  function createMockFal(videoUrl: string | null = "https://fal.media/v.mp4") {
    return {
      subscribe: vi.fn().mockResolvedValue({
        data: videoUrl ? { video: { url: videoUrl } } : {},
        requestId: "req-123",
      }),
    };
  }

  it("genera vídeo correctamente", async () => {
    const fal = createMockFal();
    const supabase = createMockSupabase();

    const result = await generateVideo(
      { prompt: "a cat", model: "kling" },
      fal,
      supabase,
    );

    expect(isGenerateError(result)).toBe(false);
    if (!isGenerateError(result)) {
      expect(result.video.status).toBe("completed");
      expect(result.message).toContain("Kling 2.1");
    }
  });

  it("llama a fal.subscribe con el modelo correcto", async () => {
    const fal = createMockFal();
    const supabase = createMockSupabase();

    await generateVideo({ prompt: "a cat", model: "kling" }, fal, supabase);

    expect(fal.subscribe).toHaveBeenCalledWith(
      "fal-ai/kling-video/v2.1/standard/text-to-video",
      expect.objectContaining({
        input: { prompt: "a cat", duration: "5", aspect_ratio: "16:9" },
      }),
    );
  });

  it("devuelve error 400 si falta prompt", async () => {
    const result = await generateVideo(
      { prompt: "", model: "kling" },
      createMockFal(),
      createMockSupabase(),
    );

    expect(isGenerateError(result)).toBe(true);
    if (isGenerateError(result)) {
      expect(result.status).toBe(400);
    }
  });

  it("devuelve error 400 para modelo inválido", async () => {
    const result = await generateVideo(
      { prompt: "test", model: "invalid" as never },
      createMockFal(),
      createMockSupabase(),
    );

    expect(isGenerateError(result)).toBe(true);
    if (isGenerateError(result)) {
      expect(result.status).toBe(400);
    }
  });

  it("devuelve error 500 si falla la inserción en DB", async () => {
    const result = await generateVideo(
      { prompt: "a cat", model: "kling" },
      createMockFal(),
      createMockSupabase({ insertError: true }),
    );

    expect(isGenerateError(result)).toBe(true);
    if (isGenerateError(result)) {
      expect(result.status).toBe(500);
      expect(result.error).toContain("Failed to create video record");
    }
  });

  it("maneja respuesta sin video URL", async () => {
    const fal = createMockFal(null);
    const updatedNoUrl = { ...mockVideo, status: "failed", error_message: "No video URL in response" };
    const supabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockVideo, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedNoUrl, error: null }),
            }),
          }),
        }),
      }),
    };

    const result = await generateVideo(
      { prompt: "a cat", model: "kling" },
      fal,
      supabase,
    );

    expect(isGenerateError(result)).toBe(false);
    if (!isGenerateError(result)) {
      expect(result.message).toContain("no URL");
    }
  });

  it("usa aspect_ratio custom", async () => {
    const fal = createMockFal();
    const supabase = createMockSupabase();

    await generateVideo(
      { prompt: "a cat", model: "sora", aspect_ratio: "9:16" },
      fal,
      supabase,
    );

    expect(fal.subscribe).toHaveBeenCalledWith(
      "fal-ai/sora-2/text-to-video",
      expect.objectContaining({
        input: { prompt: "a cat", duration: 5, aspect_ratio: "9:16" },
      }),
    );
  });

  it("usa duration custom", async () => {
    const fal = createMockFal();
    const supabase = createMockSupabase();

    await generateVideo(
      { prompt: "a cat", model: "kling", duration: 10 },
      fal,
      supabase,
    );

    expect(fal.subscribe).toHaveBeenCalledWith(
      "fal-ai/kling-video/v2.1/standard/text-to-video",
      expect.objectContaining({
        input: { prompt: "a cat", duration: "10", aspect_ratio: "16:9" },
      }),
    );
  });

  it("devuelve video original si falla el update", async () => {
    const result = await generateVideo(
      { prompt: "a cat", model: "kling" },
      createMockFal(),
      createMockSupabase({ updateError: true }),
    );

    expect(isGenerateError(result)).toBe(false);
    if (!isGenerateError(result)) {
      expect(result.video.id).toBe("vid-1");
    }
  });
});
