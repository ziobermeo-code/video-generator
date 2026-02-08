import type { VideoModel } from "./types";

export function pickBestModel(prompt: string): VideoModel {
  const lower = prompt.toLowerCase();

  // VEO 3: best for scenes that benefit from audio, music, dialogue, nature sounds
  const audioKeywords = ["música", "musica", "canción", "cancion", "audio", "sonido", "habla", "diálogo", "dialogo", "canta", "narración", "narracion", "voz", "sound", "music", "voice", "sing"];
  if (audioKeywords.some((kw) => lower.includes(kw))) return "veo";

  // Sora 2: best for cinematic, artistic, abstract, dreamlike content
  const cinematicKeywords = ["cinematográfic", "cinematografic", "cinematic", "surrealista", "surreal", "artístic", "artistic", "abstract", "sueño", "dream", "fantasía", "fantasia", "fantasy", "épic", "epic", "dramátic", "dramatic"];
  if (cinematicKeywords.some((kw) => lower.includes(kw))) return "sora";

  // Kling 2.1: best for realistic scenes, camera movements, action, people
  const realisticKeywords = ["realista", "realistic", "persona", "person", "gente", "people", "cámara", "camara", "camera", "acción", "accion", "action", "deporte", "sport", "movimiento", "movement"];
  if (realisticKeywords.some((kw) => lower.includes(kw))) return "kling";

  // Default: Kling is the most versatile
  return "kling";
}
