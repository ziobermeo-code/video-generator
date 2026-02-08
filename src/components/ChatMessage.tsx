"use client";

import { type ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--accent)] text-white rounded-br-md"
            : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-md"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[var(--muted)]">
            <span className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px]">
              AI
            </span>
            VideoGenerator Agent
          </div>
        )}
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: formatMarkdown(message.content),
          }}
        />
        <div
          className={`text-[10px] mt-1.5 ${
            isUser ? "text-white/60" : "text-[var(--muted)]"
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}
