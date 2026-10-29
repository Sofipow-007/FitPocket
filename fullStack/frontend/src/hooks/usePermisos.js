import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { pedirConCache } from "../lib/apiCache";
import { MOCK_PERMISOS } from "../mocks/adminMock";

// Devuelve { permisos: Set, cargando, tiene(codigo) }. Los permisos salen de la caché
// común (lib/apiCache): Dashboard, Admin y Ayuda comparten un solo pedido.
// Ocultar un botón es solo comodidad: el que decide es el backend (requierePatente).
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
    pedirConCache("permisos")
      .then(({ status, datos }) => {
        if (vigente) setEstado({ permisos: new Set(status === 200 ? datos?.patentes ?? [] : []), cargando: false });
      })
      .catch(() => { if (vigente) setEstado({ permisos: new Set(), cargando: false }); });
    return () => { vigente = false; };
  }, [isPreview, token]);

  return { ...estado, tiene: (codigo) => estado.permisos.has(codigo) };
}
