import { describe, it, expect } from "vitest";
import { pickBestModel } from "./pick-best-model";

describe("pickBestModel", () => {
  describe("selecciona VEO para contenido con audio", () => {
    const prompts = [
      "una escena con música relajante",
      "un vídeo con musica de fondo",
      "una canción de cuna animada",
      "escena con audio ambiental",
      "paisaje con sonido de lluvia",
      "persona que habla a cámara",
      "un diálogo entre dos personas",
      "narración sobre el universo",
      "una voz en off explicando",
      "a video with background music",
      "someone singing a song",
      "a voice narrating the story",
    ];

    it.each(prompts)('"%s" → veo', (prompt) => {
      expect(pickBestModel(prompt)).toBe("veo");
    });
  });

  describe("selecciona Sora para contenido cinematográfico", () => {
    const prompts = [
      "un plano cinematográfico de una ciudad",
      "escena cinematografica al atardecer",
      "un vídeo surrealista con formas",
      "contenido artístico y abstracto",
      "un sueño en el que vuelo",
      "mundo de fantasía con dragones",
      "una batalla épica medieval",
      "un momento dramático bajo la lluvia",
      "a cinematic shot of mountains",
      "surreal dreamlike landscape",
      "abstract artistic composition",
    ];

    it.each(prompts)('"%s" → sora', (prompt) => {
      expect(pickBestModel(prompt)).toBe("sora");
    });
  });

  describe("selecciona Kling para contenido realista", () => {
    const prompts = [
      "un vídeo realista de una calle",
      "una persona caminando por el parque",
      "gente bailando en una fiesta",
      "movimiento de cámara alrededor de un coche",
      "escena de acción con explosiones",
      "un deporte extremo en la montaña",
      "realistic street scene at night",
      "a person walking through a market",
      "camera movement around a building",
    ];

    it.each(prompts)('"%s" → kling', (prompt) => {
      expect(pickBestModel(prompt)).toBe("kling");
    });
  });

  describe("devuelve Kling por defecto", () => {
    const prompts = [
      "un atardecer en la playa",
      "un gato jugando con una pelota",
      "flores abriéndose en primavera",
      "a sunset over the ocean",
    ];

    it.each(prompts)('"%s" → kling (default)', (prompt) => {
      expect(pickBestModel(prompt)).toBe("kling");
    });
  });

  describe("es case-insensitive", () => {
    it("detecta keywords en mayúsculas", () => {
      expect(pickBestModel("MÚSICA CLÁSICA")).toBe("veo");
      expect(pickBestModel("CINEMATOGRÁFICO")).toBe("sora");
      expect(pickBestModel("REALISTA")).toBe("kling");
    });

    it("detecta keywords con mezcla de mayúsculas/minúsculas", () => {
      expect(pickBestModel("Canción De Amor")).toBe("veo");
      expect(pickBestModel("Surrealista Y Onírico")).toBe("sora");
    });
  });

  describe("prioridad: VEO > Sora > Kling", () => {
    it("VEO gana sobre Sora cuando hay keywords de ambos", () => {
      expect(pickBestModel("escena cinematográfica con música")).toBe("veo");
    });

    it("VEO gana sobre Kling cuando hay keywords de ambos", () => {
      expect(pickBestModel("persona realista cantando")).toBe("veo");
    });

    it("Sora gana sobre Kling cuando hay keywords de ambos", () => {
      expect(pickBestModel("escena realista pero cinematográfica")).toBe("sora");
    });
  });
});
