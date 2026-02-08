import { NextRequest, NextResponse } from "next/server";
import { VIDEO_MODELS, type VideoModel } from "@/lib/types";
import { pickBestModel } from "@/lib/pick-best-model";

interface AgentResponse {
  message: string;
  action?: "generate";
  model?: VideoModel;
  prompt?: string;
  aspect_ratio?: string;
  duration?: number;
}

function parseUserIntent(message: string, selectedModel?: VideoModel): AgentResponse {
  const lowerMsg = message.toLowerCase();

  // Detect model selection from message text
  let detectedModel: VideoModel | undefined;
  if (lowerMsg.includes("kling")) detectedModel = "kling";
  else if (lowerMsg.includes("veo")) detectedModel = "veo";
  else if (lowerMsg.includes("sora")) detectedModel = "sora";

  // Detect aspect ratio
  let aspectRatio: string | undefined;
  if (lowerMsg.includes("vertical") || lowerMsg.includes("9:16"))
    aspectRatio = "9:16";
  else if (lowerMsg.includes("cuadrado") || lowerMsg.includes("square") || lowerMsg.includes("1:1"))
    aspectRatio = "1:1";
  else if (lowerMsg.includes("horizontal") || lowerMsg.includes("16:9"))
    aspectRatio = "16:9";

  // Detect generation intent
  const generateKeywords = [
    "genera", "generar", "crea", "crear", "haz", "hacer",
    "generate", "create", "make",
    "quiero un video", "quiero un vídeo",
    "hazme un video", "hazme un vídeo",
  ];

  const wantsGeneration = generateKeywords.some((kw) => lowerMsg.includes(kw));

  // Detect greeting
  const greetings = ["hola", "hello", "hi", "hey", "buenas", "qué tal"];
  const isGreeting = greetings.some((g) => lowerMsg.includes(g));

  // Detect help request
  const helpKeywords = ["ayuda", "help", "cómo", "como", "qué puedo", "que puedo", "modelos"];
  const wantsHelp = helpKeywords.some((kw) => lowerMsg.includes(kw));

  if (isGreeting && !wantsGeneration) {
    return {
      message:
        "👋 ¡Hola! Soy tu asistente de generación de vídeos con IA.\n\n" +
        "Puedo crear vídeos usando estos modelos:\n\n" +
        "🎬 **Kling 2.1** — Vídeos de alta calidad con movimientos de cámara precisos\n" +
        "🌟 **VEO 3** — Modelo de Google con audio nativo profesional\n" +
        "🎥 **Sora 2** — Modelo de OpenAI con detalle cinematográfico\n\n" +
        "Dime qué vídeo quieres crear. Por ejemplo:\n" +
        '*"Genera con Kling un atardecer en la playa con olas suaves"*',
    };
  }

  if (wantsHelp && !wantsGeneration) {
    const modelsInfo = VIDEO_MODELS.map(
      (m) => `• **${m.name}**: ${m.description} (hasta ${m.maxDuration}s)`
    ).join("\n");

    return {
      message:
        "Estos son los modelos disponibles:\n\n" +
        modelsInfo +
        "\n\n" +
        "Para generar un vídeo, escribe algo como:\n" +
        '*"Crea con Sora un bosque mágico con luciérnagas"*\n\n' +
        "También puedes especificar:\n" +
        "• **Formato**: horizontal (16:9), vertical (9:16), cuadrado (1:1)\n" +
        "• **Modelo**: Kling, VEO o Sora",
    };
  }

  if (wantsGeneration) {
    // Extract the video description prompt
    // Remove the generation keywords and model name to get the actual prompt
    let videoPrompt = message;

    // Remove common prefixes
    const prefixPatterns = [
      /^(genera|generar|crea|crear|haz|hacer|generate|create|make)\s*(un\s*)?(video|vídeo)?\s*(con|using|with)?\s*(kling|veo|sora)?\s*(de|about|un|una|:)?\s*/i,
      /^(quiero|hazme)\s*(un\s*)?(video|vídeo)\s*(con|de|using)?\s*(kling|veo|sora)?\s*(de|about|:)?\s*/i,
    ];

    for (const pattern of prefixPatterns) {
      videoPrompt = videoPrompt.replace(pattern, "").trim();
    }

    // If prompt is too short after cleanup, use original
    if (videoPrompt.length < 10) {
      videoPrompt = message;
    }

    if (!detectedModel) {
      detectedModel = (!selectedModel || selectedModel === "auto")
        ? pickBestModel(videoPrompt)
        : selectedModel;
    }

    const modelConfig = VIDEO_MODELS.find((m) => m.id === detectedModel);

    return {
      message:
        `🎬 Generando vídeo con **${modelConfig?.name}**...\n\n` +
        `📝 Prompt: *"${videoPrompt}"*\n` +
        `📐 Formato: ${aspectRatio || "16:9"}\n\n` +
        "Esto puede tomar entre 30 segundos y unos minutos. Te avisaré cuando esté listo.",
      action: "generate",
      model: detectedModel,
      prompt: videoPrompt,
      aspect_ratio: aspectRatio || "16:9",
      duration: modelConfig?.defaultDuration,
    };
  }

  // Default: treat as a video prompt with default model
  return {
    message:
      "No estoy seguro de lo que quieres hacer. Aquí tienes algunas opciones:\n\n" +
      '• **Generar vídeo**: *"Genera con Kling un paisaje futurista"*\n' +
      '• **Ver modelos**: *"¿Qué modelos hay disponibles?"*\n' +
      '• **Ayuda**: *"Ayuda"*\n\n' +
      "También puedes seleccionar un modelo y escribir tu prompt directamente.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const response = parseUserIntent(message, model);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
