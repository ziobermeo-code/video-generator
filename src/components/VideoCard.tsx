"use client";

import { type Video } from "@/lib/types";

interface VideoCardProps {
  video: Video;
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-[var(--warning)]" },
  processing: { label: "Procesando", color: "bg-blue-500" },
  completed: { label: "Completado", color: "bg-[var(--success)]" },
  failed: { label: "Error", color: "bg-[var(--error)]" },
};

const modelLabels: Record<string, string> = {
  kling: "Kling 2.1",
  veo: "VEO 3",
  sora: "Sora 2",
};

export default function VideoCard({ video }: VideoCardProps) {
  const status = statusConfig[video.status];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/50 transition-all group animate-fade-in">
      {/* Video / Thumbnail */}
      <div className="relative aspect-video bg-black">
        {video.status === "completed" && video.video_url ? (
          <video
            src={video.video_url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
            poster={video.thumbnail_url || undefined}
          />
        ) : video.status === "processing" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--muted)]">
                Generando vídeo...
              </span>
            </div>
          </div>
        ) : video.status === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl">❌</span>
              <p className="text-sm text-[var(--error)] mt-2">
                {video.error_message || "Error al generar"}
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 animate-shimmer" />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--accent)]">
            {modelLabels[video.model] || video.model}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full text-white ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-sm text-[var(--foreground)] line-clamp-2">
          {video.prompt}
        </p>
        <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--muted)]">
          <span>{video.aspect_ratio}</span>
          <span>
            {new Date(video.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
