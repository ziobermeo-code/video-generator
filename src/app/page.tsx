"use client";

import { useState, useEffect, useCallback } from "react";
import { type Video } from "@/lib/types";
import Chat from "@/components/Chat";
import Gallery from "@/components/Gallery";

type Tab = "chat" | "gallery";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Poll for processing videos every 5 seconds
  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, [videos, fetchVideos]);

  const handleVideoGenerated = (video: Video) => {
    setVideos((prev) => [video, ...prev]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <h1 className="text-base font-bold tracking-tight">
              VideoGenerator
            </h1>
            <p className="text-[10px] text-[var(--muted)]">
              Powered by fal.ai
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex bg-[var(--card)] rounded-lg p-0.5 border border-[var(--border)]">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "chat"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => {
              setActiveTab("gallery");
              fetchVideos();
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "gallery"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            🖼️ Galería
            {videos.length > 0 && (
              <span className="ml-1.5 bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] px-1.5 py-0.5 rounded-full">
                {videos.length}
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <Chat onVideoGenerated={handleVideoGenerated} />
        ) : (
          <div className="h-full overflow-y-auto">
            <Gallery videos={videos} isLoading={isLoadingVideos} />
          </div>
        )}
      </main>
    </div>
  );
}
