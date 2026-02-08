"use client";

import { type Video } from "@/lib/types";
import VideoCard from "./VideoCard";

interface GalleryProps {
  videos: Video[];
  isLoading: boolean;
}

export default function Gallery({ videos, isLoading }: GalleryProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Galería</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <div className="aspect-video animate-shimmer" />
              <div className="bg-[var(--card)] p-3 space-y-2">
                <div className="h-3 w-20 animate-shimmer rounded" />
                <div className="h-4 w-full animate-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Galería
          {videos.length > 0 && (
            <span className="text-sm font-normal text-[var(--muted)] ml-2">
              ({videos.length} {videos.length === 1 ? "vídeo" : "vídeos"})
            </span>
          )}
        </h2>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🎬</span>
          <h3 className="text-lg font-medium mb-2">
            No hay vídeos todavía
          </h3>
          <p className="text-sm text-[var(--muted)] max-w-sm">
            Usa el chat para generar tu primer vídeo con IA. Selecciona un
            modelo y describe lo que quieres ver.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
