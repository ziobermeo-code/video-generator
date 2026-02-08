import { describe, it, expect } from "vitest";
import { parseUserIntent } from "./parse-user-intent";

describe("parseUserIntent", () => {
  describe("saludos", () => {
    it.each(["hola", "hello", "hi", "hey", "buenas", "qué tal"])(
      '"%s" devuelve mensaje de bienvenida',
      (greeting) => {
        const result = parseUserIntent(greeting);
        expect(result.action).toBeUndefined();
        expect(result.message).toContain("Soy tu asistente");
      }
    );

    it("un saludo con generación no se trata como saludo", () => {
      const result = parseUserIntent("hola, genera un vídeo de un gato");
      expect(result.action).toBe("generate");
    });
  });

  describe("ayuda", () => {
    it.each(["ayuda", "help", "¿cómo funciona?", "qué puedo decir", "modelos"])(
      '"%s" devuelve mensaje de ayuda',
      (msg) => {
        const result = parseUserIntent(msg);
        expect(result.action).toBeUndefined();
        expect(result.message).toContain("modelos disponibles");
      }
    );

    it("ayuda con generación no se trata como ayuda", () => {
      const result = parseUserIntent("crea un vídeo de cómo funciona un motor");
      expect(result.action).toBe("generate");
    });
  });

  describe("generación de vídeo", () => {
    describe("detecta intención de generar", () => {
      const prompts = [
        "genera un vídeo de un atardecer",
        "crea un vídeo de un bosque",
        "haz un vídeo de una ciudad",
        "generate a video of a sunset",
        "create a video of a forest",
        "quiero un vídeo de montañas",
        "hazme un video de una playa",
      ];

      it.each(prompts)('"%s" → action: generate', (prompt) => {
        const result = parseUserIntent(prompt);
        expect(result.action).toBe("generate");
        expect(result.model).toBeDefined();
        expect(result.prompt).toBeDefined();
      });
    });

    describe("detecta modelo en el texto", () => {
      it("detecta Kling en el mensaje", () => {
        const result = parseUserIntent("genera con kling un paisaje");
        expect(result.model).toBe("kling");
      });

      it("detecta VEO en el mensaje", () => {
        const result = parseUserIntent("genera con veo un paisaje con música");
        expect(result.model).toBe("veo");
      });

      it("detecta Sora en el mensaje", () => {
        const result = parseUserIntent("genera con sora una escena épica");
        expect(result.model).toBe("sora");
      });

      it("modelo en texto tiene prioridad sobre selectedModel", () => {
        const result = parseUserIntent("genera con sora un paisaje", "kling");
        expect(result.model).toBe("sora");
      });
    });

    describe("usa selectedModel cuando no hay modelo en el texto", () => {
      it("usa kling si está seleccionado", () => {
        const result = parseUserIntent("genera un vídeo de un gato", "kling");
        expect(result.model).toBe("kling");
      });

      it("usa veo si está seleccionado", () => {
        const result = parseUserIntent("genera un vídeo de un gato", "veo");
        expect(result.model).toBe("veo");
      });

      it("usa sora si está seleccionado", () => {
        const result = parseUserIntent("genera un vídeo de un gato", "sora");
        expect(result.model).toBe("sora");
      });
    });

    describe("auto-selección de modelo", () => {
      it("auto selecciona VEO para audio", () => {
        const result = parseUserIntent("genera un vídeo con música relajante", "auto");
        expect(result.model).toBe("veo");
      });

      it("auto selecciona Sora para cinematográfico", () => {
        const result = parseUserIntent("crea un vídeo cinematográfico de una ciudad", "auto");
        expect(result.model).toBe("sora");
      });

      it("auto selecciona Kling por defecto", () => {
        const result = parseUserIntent("genera un vídeo de un gato", "auto");
        expect(result.model).toBe("kling");
      });

      it("sin selectedModel usa auto-selección", () => {
        const result = parseUserIntent("genera un vídeo con música");
        expect(result.model).toBe("veo");
      });
    });
  });

  describe("detección de aspect ratio", () => {
    it("detecta vertical", () => {
      const result = parseUserIntent("genera un vídeo vertical de un gato");
      expect(result.aspect_ratio).toBe("9:16");
    });

    it("detecta 9:16", () => {
      const result = parseUserIntent("genera un vídeo en 9:16 de un gato");
      expect(result.aspect_ratio).toBe("9:16");
    });

    it("detecta cuadrado", () => {
      const result = parseUserIntent("genera un vídeo cuadrado de un gato");
      expect(result.aspect_ratio).toBe("1:1");
    });

    it("detecta square", () => {
      const result = parseUserIntent("create a square video of a cat");
      expect(result.aspect_ratio).toBe("1:1");
    });

    it("detecta 1:1", () => {
      const result = parseUserIntent("genera un vídeo en 1:1 de un gato");
      expect(result.aspect_ratio).toBe("1:1");
    });

    it("detecta horizontal", () => {
      const result = parseUserIntent("genera un vídeo horizontal de un gato");
      expect(result.aspect_ratio).toBe("16:9");
    });

    it("16:9 por defecto si no se especifica", () => {
      const result = parseUserIntent("genera un vídeo de un gato");
      expect(result.aspect_ratio).toBe("16:9");
    });
  });

  describe("extracción del prompt", () => {
    it("elimina prefijos de generación", () => {
      const result = parseUserIntent("genera un vídeo de un atardecer en la playa");
      expect(result.prompt).toBe("un atardecer en la playa");
    });

    it("elimina nombre del modelo del prompt", () => {
      const result = parseUserIntent("crea con kling un paisaje nevado de montaña");
      expect(result.prompt).toBe("paisaje nevado de montaña");
    });

    it("mantiene el prompt original si queda muy corto", () => {
      const result = parseUserIntent("genera un vídeo de sol");
      expect(result.prompt!.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("duración según modelo", () => {
    it("Kling tiene duración 5", () => {
      const result = parseUserIntent("genera con kling un paisaje");
      expect(result.duration).toBe(5);
    });

    it("VEO tiene duración 8", () => {
      const result = parseUserIntent("genera con veo un paisaje con música");
      expect(result.duration).toBe(8);
    });

    it("Sora tiene duración 5", () => {
      const result = parseUserIntent("genera con sora un paisaje épico");
      expect(result.duration).toBe(5);
    });
  });

  describe("mensaje por defecto", () => {
    it("devuelve opciones cuando no entiende el mensaje", () => {
      const result = parseUserIntent("asdfgh");
      expect(result.action).toBeUndefined();
      expect(result.message).toContain("No estoy seguro");
    });

    it("no genera para mensajes ambiguos", () => {
      const result = parseUserIntent("me gusta el color azul");
      expect(result.action).toBeUndefined();
    });
  });
});
