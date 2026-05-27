import "./RegisterForm.css";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";  // 👈 importamos íconos

export default function RegisterForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (pwd) => {
    if (!pwd) return "";
    if (pwd.length < 6) return "Débil";
    if (pwd.length < 10) return "Media";
    return "Fuerte";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.msg || "Error en registro");
        return;
      }
  
      // Guardamos el token para usarlo en onboarding
      localStorage.setItem("token", data.token);
  
      // Navegamos al primer paso del onboarding
      window.location.href = "/onboarding/1";
  
    } catch (err) {
      console.error(err);
      alert("Error en el servidor");
    }
  };

  return (
    <div className="register-form">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Contraseña</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {password && (
          <div className={`password-strength ${getStrength(password).toLowerCase()}`}>
            Fortaleza de contraseña: {getStrength(password)}
          </div>
        )}

        <button type="submit" className="btn btn-primary">
          Crear cuenta y continuar
        </button>
      </form>
      <p className="terms">
        Al registrarte aceptás los términos de uso
      </p>
    </div>
  );
}
