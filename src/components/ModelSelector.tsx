"use client";

import { VIDEO_MODELS, type VideoModel } from "@/lib/types";

interface ModelSelectorProps {
  selected: VideoModel;
  onSelect: (model: VideoModel) => void;
}

const modelIcons: Record<VideoModel, string> = {
  kling: "🎬",
  veo: "🌟",
  sora: "🎥",
};

export default function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex gap-2">
      {VIDEO_MODELS.map((model) => (
        <button
          key={model.id}
          onClick={() => onSelect(model.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
            selected === model.id
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
          } border border-[var(--border)]`}
          title={model.description}
        >
          <span>{modelIcons[model.id]}</span>
          <span className="font-medium">{model.name}</span>
        </button>
      ))}
    </div>
  );
}
