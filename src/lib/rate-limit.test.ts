import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("permite la primera petición", () => {
    const result = checkRateLimit("test-first", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("permite peticiones dentro del límite", () => {
    const key = "test-within-" + Math.random();
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("bloquea peticiones que exceden el límite", () => {
    const key = "test-exceed-" + Math.random();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("el remaining disminuye con cada petición", () => {
    const key = "test-remaining-" + Math.random();
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(2);
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(1);
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(0);
  });

  it("resetea tras expirar la ventana", () => {
    const key = "test-reset-" + Math.random();
    // Usar ventana de 1ms para que expire inmediatamente
    checkRateLimit(key, 1, 1);

    // Esperar a que expire
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }

    const result = checkRateLimit(key, 1, 1);
    expect(result.allowed).toBe(true);
  });

  it("keys diferentes son independientes", () => {
    const keyA = "test-a-" + Math.random();
    const keyB = "test-b-" + Math.random();

    // Agotar keyA
    checkRateLimit(keyA, 1, 60_000);
    const resultA = checkRateLimit(keyA, 1, 60_000);
    expect(resultA.allowed).toBe(false);

    // keyB sigue disponible
    const resultB = checkRateLimit(keyB, 1, 60_000);
    expect(resultB.allowed).toBe(true);
  });

  it("devuelve resetAt en el futuro", () => {
    const key = "test-resetat-" + Math.random();
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
  });
});
