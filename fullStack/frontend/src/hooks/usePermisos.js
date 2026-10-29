import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { MOCK_PERMISOS } from "../mocks/adminMock";

// Cache a nivel de módulo: Dashboard y Admin comparten un solo pedido por sesión.
// Se guarda la promesa (y no el resultado) para que dos componentes que montan
// a la vez no disparen dos fetch.
let cache = { token: null, promesa: null };

function pedirPermisos(token) {
  if (cache.token !== token || !cache.promesa) {
    cache = {
      token,
      promesa: fetch(`${API_URL}/users/permisos`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(data => new Set(data.patentes ?? []))
        .catch(err => { cache = { token: null, promesa: null }; throw err; }),
    };
  }
  return cache.promesa;
}

// Llamar al cerrar sesión o al cambiar permisos de uno mismo
export function invalidarPermisos() {
  cache = { token: null, promesa: null };
}

// Devuelve { permisos: Set, cargando, tiene(codigo) }. Ocultar un botón es solo comodidad:
// el que decide es el backend (requierePatente), que responde 403 igual.
export default function usePermisos() {
  const [searchParams] = useSearchParams();
  const isPreview = import.meta.env.DEV && searchParams.get("preview") === "true";
  const token = localStorage.getItem("token");

  const [estado, setEstado] = useState(() => ({
    permisos: isPreview ? new Set(MOCK_PERMISOS) : new Set(),
    cargando: !isPreview && Boolean(token),
  }));

  useEffect(() => {
    if (isPreview || !token) return;
    let vigente = true;
    pedirPermisos(token)
      .then(permisos => { if (vigente) setEstado({ permisos, cargando: false }); })
      .catch(() => { if (vigente) setEstado({ permisos: new Set(), cargando: false }); });
    return () => { vigente = false; };
  }, [isPreview, token]);

  return { ...estado, tiene: (codigo) => estado.permisos.has(codigo) };
}
