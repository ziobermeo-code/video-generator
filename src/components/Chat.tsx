"use client";

import { useState, useRef, useEffect } from "react";
import { type ChatMessage as ChatMessageType, type VideoModel, type Video } from "@/lib/types";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ModelSelector from "./ModelSelector";

interface ChatProps {
  onVideoGenerated: (video: Video) => void;
}

export default function Chat({ onVideoGenerated }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 ¡Hola! Soy tu asistente de generación de vídeos con IA.\n\n" +
        "Puedo crear vídeos usando estos modelos:\n\n" +
        "🎬 **Kling 2.1** — Vídeos de alta calidad con movimientos de cámara precisos\n" +
        "🌟 **VEO 3** — Modelo de Google con audio nativo profesional\n" +
        "🎥 **Sora 2** — Modelo de OpenAI con detalle cinematográfico\n\n" +
        "Selecciona un modelo arriba y escribe tu prompt, o simplemente dime qué vídeo quieres crear.",
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<VideoModel>("kling");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const addMessage = (role: "user" | "assistant", content: string, videoId?: string) => {
    const msg: ChatMessageType = {
      id: crypto.randomUUID(),
      role,
      content,
      video_id: videoId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      // Get agent response
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, model: selectedModel }),
      });
      const chatData = await chatRes.json();

      if (chatData.error) {
        addMessage("assistant", `❌ Error: ${chatData.error}`);
        setIsLoading(false);
        return;
      }

      addMessage("assistant", chatData.message);

      // If the agent wants to generate a video
      if (chatData.action === "generate") {
        const model = chatData.model || selectedModel;
        const prompt = chatData.prompt || userMessage;

        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model,
            aspect_ratio: chatData.aspect_ratio || "16:9",
            duration: chatData.duration,
          }),
        });
        const genData = await genRes.json();

        if (genData.error) {
          addMessage(
            "assistant",
            `❌ Error al generar el vídeo: ${genData.error}\n\nPuedes intentar con otro modelo o prompt.`
          );
        } else {
          addMessage(
            "assistant",
            genData.video?.status === "completed"
              ? `✅ ¡Vídeo generado! Puedes verlo en la galería.\n\n🎬 Modelo: **${model}**\n📝 Prompt: *"${prompt}"*`
              : `⚠️ ${genData.message}`,
            genData.video?.id
          );
          if (genData.video) {
            onVideoGenerated(genData.video);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage(
        "assistant",
        "❌ Hubo un error de conexión. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Model selector */}
      <div className="p-4 border-b border-[var(--border)]">
        <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe el vídeo que quieres crear..."
            className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Enviar"
            )}
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-2">
          Shift+Enter para nueva línea • Enter para enviar
        </p>
      </form>
    </div>
  );
}
