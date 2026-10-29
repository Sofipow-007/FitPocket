import usePermisos from "../hooks/usePermisos";

// Muestra `children` solo si el usuario tiene la patente. Mientras cargan los permisos
// no se muestra nada, para que un botón de admin no aparezca y desaparezca.
export default function ConPermiso({ patente, fallback = null, children }) {
  const { tiene, cargando } = usePermisos();
  if (cargando || !tiene(patente)) return fallback;
  return children;
}
