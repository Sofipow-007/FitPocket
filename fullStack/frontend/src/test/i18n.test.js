import { describe, expect, test } from "vitest";
import es from "../i18n/es.json";
import en from "../i18n/en.json";

// Todas las rutas de claves de un objeto de traducciones ("admin.tabs.usuarios", "ayuda.secciones.0.p", ...)
function claves(obj, prefijo = "") {
  return Object.entries(obj).flatMap(([k, v]) => {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    return v && typeof v === "object" ? claves(v, ruta) : [ruta];
  });
}

describe("traducciones", () => {
  test("es.json y en.json tienen exactamente las mismas claves", () => {
    const enEs = new Set(claves(es));
    const enEn = new Set(claves(en));
    expect([...enEs].filter(k => !enEn.has(k))).toEqual([]); // faltan en inglés
    expect([...enEn].filter(k => !enEs.has(k))).toEqual([]); // faltan en español
  });

  test("ningún texto quedó vacío", () => {
    const vacios = (obj) => claves(obj).filter(ruta => ruta.split(".").reduce((o, k) => o[k], obj) === "");
    expect(vacios(es)).toEqual([]);
    expect(vacios(en)).toEqual([]);
  });

  test("las variables {{...}} son las mismas en los dos idiomas", () => {
    const valor = (obj, ruta) => ruta.split(".").reduce((o, k) => o[k], obj);
    const variables = (texto) => (String(texto).match(/{{\s*\w+\s*}}/g) ?? []).map(v => v.replace(/\s/g, "")).sort();
    const distintas = claves(es).filter(ruta => JSON.stringify(variables(valor(es, ruta))) !== JSON.stringify(variables(valor(en, ruta))));
    expect(distintas).toEqual([]);
  });
});
