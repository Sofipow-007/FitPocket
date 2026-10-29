import { beforeEach, describe, expect, test, vi } from "vitest";
import { pedirConCache, invalidar, invalidarTodo, actualizarCache } from "./apiCache";

const respuesta = (status, datos) => Promise.resolve({ status, json: () => Promise.resolve(datos) });

beforeEach(() => {
  invalidarTodo();
  localStorage.setItem("token", "token-a");
  globalThis.fetch = vi.fn(() => respuesta(200, { _id: "plan-1" }));
});

describe("apiCache", () => {
  test("el segundo pedido sale de la caché", async () => {
    const a = await pedirConCache("plan");
    const b = await pedirConCache("plan");
    expect(a.datos).toEqual({ _id: "plan-1" });
    expect(b.desdeCache).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("dos pantallas que piden lo mismo a la vez comparten un solo pedido", async () => {
    const [a, b] = await Promise.all([pedirConCache("perfil"), pedirConCache("perfil")]);
    expect(a).toBe(b);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("con otro token no se reusa lo de la cuenta anterior", async () => {
    await pedirConCache("plan");
    localStorage.setItem("token", "token-b");
    await pedirConCache("plan");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer token-b");
  });

  test("vencido se pide normal; invalidado se pide salteando la caché HTTP", async () => {
    vi.useFakeTimers();
    try {
      await pedirConCache("plan");                // primero después de invalidarTodo (beforeEach): reload
      vi.advanceTimersByTime(6 * 60 * 1000);      // vence (dura 5 minutos)
      await pedirConCache("plan");
      invalidar("plan");
      await pedirConCache("plan");
      expect(fetch.mock.calls.map(c => c[1].cache)).toEqual(["reload", "default", "reload"]);
    } finally {
      vi.useRealTimers();
    }
  });

  test("invalidar una clave no toca las otras", async () => {
    await pedirConCache("plan");
    await pedirConCache("perfil");
    invalidar("plan");
    await pedirConCache("perfil");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("guarda el 404 (sin plan) pero no los errores", async () => {
    fetch.mockImplementationOnce(() => respuesta(404, { error: "Sin plan activo" }));
    expect((await pedirConCache("plan")).status).toBe(404);
    expect((await pedirConCache("plan")).desdeCache).toBe(true);

    fetch.mockImplementation(() => respuesta(500, null));
    await pedirConCache("semana");
    await pedirConCache("semana");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test("vence después de su tiempo de vida", async () => {
    vi.useFakeTimers();
    try {
      await pedirConCache("permisos");          // dura 1 minuto
      vi.advanceTimersByTime(61 * 1000);
      await pedirConCache("permisos");
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  test("sobrevive a un F5: queda en sessionStorage", async () => {
    await pedirConCache("plan");
    expect(JSON.parse(sessionStorage.getItem("fp:cache:plan")).datos).toEqual({ _id: "plan-1" });
  });

  test("actualizarCache guarda un dato conocido sin pedirlo", async () => {
    actualizarCache("hoy", 200, { checkin: { puntajeTotal: 2 } });
    const r = await pedirConCache("hoy");
    expect(r.datos.checkin.puntajeTotal).toBe(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("una clave desconocida es un error", async () => {
    await expect(pedirConCache("otra")).rejects.toThrow();
  });
});
