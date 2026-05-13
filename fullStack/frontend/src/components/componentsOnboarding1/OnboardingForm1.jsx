import "./OnboardingForm1.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingForm1() {
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [sexo, setSexo] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ edad, peso, altura, sexo });
    // Acá luego mandás los datos al backend o a un contexto global
    navigate("/onboarding/2"); // 👈 redirige al paso 2
  };

  return (
    <form className="onboarding-form1" onSubmit={handleSubmit}>
      <h2>Paso 1 de 4 - Tu cuerpo</h2>

      <label>Edad</label>
      <input
        type="number"
        value={edad}
        onChange={(e) => setEdad(e.target.value)}
      />

      <label>Peso (kg)</label>
      <input
        type="number"
        value={peso}
        onChange={(e) => setPeso(e.target.value)}
      />

      <label>Altura (cm)</label>
      <input
        type="number"
        value={altura}
        onChange={(e) => setAltura(e.target.value)}
      />

      <label>Sexo</label>
      <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
        <option value="">Seleccioná</option>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>

      <button type="submit">Siguiente →</button>
    </form>
  );
}
