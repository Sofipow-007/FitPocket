import { Navigate } from "react-router-dom";

// Para landing, login y register: si ya hay sesión, no mostrar el
// flujo de invitado de nuevo, mandar directo al dashboard.
export default function RutaPublica({ children }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}
