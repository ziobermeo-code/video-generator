export type VideoModel = "kling" | "veo" | "sora";

export interface VideoModelConfig {
  id: VideoModel;
  name: string;
  falModel: string;
  description: string;
  maxDuration: number;
  defaultDuration: number;
  aspectRatios: string[];
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: "kling",
    name: "Kling 2.1",
    falModel: "fal-ai/kling-video/v2.1/standard/text-to-video",
    description: "High quality video generation with precise camera movements",
    maxDuration: 10,
    defaultDuration: 5,
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "veo",
    name: "VEO 3",
    falModel: "fal-ai/veo3",
    description: "Google's professional-grade video with native audio",
    maxDuration: 8,
    defaultDuration: 8,
    aspectRatios: ["16:9", "9:16"],
  },
  {
    id: "sora",
    name: "Sora 2",
    falModel: "fal-ai/sora-2/text-to-video",
    description: "OpenAI's cinematic video model with rich detail",
    maxDuration: 10,
    defaultDuration: 5,
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
];

export interface Video {
  id: string;
  prompt: string;
  model: VideoModel;
  status: "pending" | "processing" | "completed" | "failed";
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  aspect_ratio: string;
  error_message: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  video_id?: string;
  created_at: string;
}

export interface GenerateRequest {
  prompt: string;
  model: VideoModel;
  aspect_ratio?: string;
  duration?: number;
}

export interface GenerateResponse {
  video: Video;
  message: string;
}
