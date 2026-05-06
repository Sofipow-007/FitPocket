import "./LoginForm.css";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Error en login");
        return;
      }

      // Guardar token en localStorage
      localStorage.setItem("token", data.token);

      // Podés guardar también el usuario
      console.log("Usuario logueado:", data.user);

      // Redirigir a dashboard o home
      // window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Error en el servidor");
    }
  };

  return (
    <div className="login-form">
      <h2>Bienvenido de vuelta</h2>
      <p>Ingresá para continuar con tu plan activo</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
        <button type="submit" className="btn btn-primary">Iniciar sesión</button>
      </form>
    </div>
  );
}
