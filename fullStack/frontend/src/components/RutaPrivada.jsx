import { Navigate, useSearchParams } from "react-router-dom";

// Protege rutas que requieren sesión. Sin token → /login.
// allowPreview habilita ?preview=true sin token, solo en desarrollo
// (usado por el panel PREVIEW para ver pantallas con datos mock).
export default function RutaPrivada({ children, allowPreview = false }) {
  const [searchParams] = useSearchParams();
  const isPreview = allowPreview && import.meta.env.DEV && searchParams.get("preview") === "true";
  const token = localStorage.getItem("token");

  if (!token && !isPreview) return <Navigate to="/login" replace />;
  return children;
}
