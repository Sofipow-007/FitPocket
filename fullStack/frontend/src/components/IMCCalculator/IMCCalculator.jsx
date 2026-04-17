import { useState } from "react";
import "./IMCCalculator.css";

export default function IMCCalculator() {
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcularIMC = () => {
    if (!peso || !altura) return;
    const alturaMetros = altura / 100;
    const imc = (peso / (alturaMetros * alturaMetros)).toFixed(1);
    setResultado(imc);
  };

  return (
    <div className="imc">
      <h2>Calculá tu IMC sin cuenta</h2>
      <div className="imc__inputs">
        <input
          type="number"
          placeholder="Peso (kg)"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <input
          type="number"
          placeholder="Altura (cm)"
          value={altura}
          onChange={(e) => setAltura(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={calcularIMC}>
        Calcular
      </button>
      {resultado && (
        <p className="imc__resultado">Tu IMC es: {resultado}</p>
      )}
    </div>
  );
}
