"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5 text-xs text-[var(--muted)]">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px]">
            AI
          </span>
          VideoGenerator Agent
        </div>
        <div className="flex gap-1.5 py-1">
          <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-pulse-dot" />
          <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-pulse-dot-delay-1" />
          <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-pulse-dot-delay-2" />
        </div>
      </div>
    </div>
  );
}
