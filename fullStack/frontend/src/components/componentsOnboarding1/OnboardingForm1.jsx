import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingForm1.css";
import Matter from "matter-js";

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

function getIMCCategory(imc) {
  if (imc < 18.5) return { label: "Bajo peso", color: "var(--blue)" };
  if (imc < 25) return { label: "Normal", color: "var(--green)" };
  if (imc < 30) return { label: "Sobrepeso", color: "var(--warn)" };
  return { label: "Obesidad", color: "var(--err)" };
}

export default function OnboardingForm1() {
  const navigate = useNavigate();
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [sexo, setSexo] = useState("");
  const [imc, setImc] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = parseFloat(peso);
    const h = parseFloat(altura);
    if (p > 0 && h > 0) {
      setImc(parseFloat((p / Math.pow(h / 100, 2)).toFixed(1)));
    } else {
      setImc(null);
    }
  }, [peso, altura]);

  const categoria = imc ? getIMCCategory(imc) : null;

  // ── Efecto caída por peso ────────────────────────────────────────
  const dustTimerRef = useRef(null);

  
  useEffect(() => {
    const p = parseFloat(peso);

    let level = 0;
    if (!p || p < 81) level = 0;
    else if (p < 121) level = 1;
    else if (p < 161) level = 2;
    else if (p < 201) level = 3;
    else if (p < 241) level = 4;
    else if (p < 300) level = 5;
    else level = 'fall';

    document.body.setAttribute('data-peso-level', String(level));

    if (dustTimerRef.current) {
      clearInterval(dustTimerRef.current);
      dustTimerRef.current = null;
    }
    document.querySelectorAll('.ob-dust').forEach(d => d.remove());

    const spawnDust = (count, maxSize) => {
      for (let i = 0; i < count; i++) {
        const d = document.createElement('div');
        d.className = 'ob-dust';
        const size = 2 + Math.random() * maxSize;
        d.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 40}px;
        width: ${size}px;
        height: ${size}px;
        --drift: ${(Math.random() * 60 - 30)}px;
        animation-duration: ${0.6 + Math.random() * 1.2}s;
        animation-delay: ${Math.random() * 0.3}s;
      `;
        document.body.appendChild(d);
        d.addEventListener('animationend', () => d.remove(), { once: true });
      }
    };

    const config = [
      null,
      { interval: 3500, count: 1, size: 2 },
      { interval: 2000, count: 2, size: 3 },
      { interval: 1000, count: 4, size: 4 },
      { interval: 500, count: 6, size: 5 },
      { interval: 200, count: 10, size: 7 },
    ];

    if (typeof level === 'number' && level > 0 && config[level]) {
      const { interval, count, size } = config[level];
      spawnDust(count, size);
      dustTimerRef.current = setInterval(() => spawnDust(count, size), interval);
    }

    if (level === 'fall') {
      spawnDust(30, 8);
      const burst = setInterval(() => spawnDust(20, 8), 100);
      setTimeout(() => clearInterval(burst), 800);
    }

    return () => {
      if (dustTimerRef.current) clearInterval(dustTimerRef.current);
    };
  }, [peso]);

  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-peso-level');
      document.querySelectorAll('.ob-dust').forEach(d => d.remove());
      if (dustTimerRef.current) clearInterval(dustTimerRef.current);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────

  const handleSiguiente = () => {
    if (!edad || !peso || !altura || !sexo) {
      setError("Completá todos los campos para continuar.");
      return;
    }
    setError("");
    localStorage.setItem("ob_paso1", JSON.stringify({
      edad: parseInt(edad),
      peso: parseFloat(peso),
      altura: parseFloat(altura),
      sexo,
    }));
    navigate("/onboarding/2");
  };

  return (
    <div className="ob1-card">
      <div className="ob1-header">
        <h1 className="ob1-header__title">Datos físicos</h1>
        <p className="ob1-header__subtitle">Calculamos tu IMC y personalizamos el plan</p>
      </div>

      <div className="ob1-form">
        <div className="ob1-row3">
          <div className="ob1-field">
            <label className="ob1-label" htmlFor="ob1-edad">Edad</label>
            <input
              id="ob1-edad"
              type="number"
              className="ob1-input"
              placeholder="Años"
              value={edad}
              onChange={e => setEdad(e.target.value)}
              min="10" max="99"
            />
          </div>
          <div className="ob1-field">
            <label className="ob1-label" htmlFor="ob1-peso">Peso (kg)</label>
            <input
              id="ob1-peso"
              type="number"
              className="ob1-input"
              placeholder="kg"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              min="30" max="300"
            />
          </div>
          <div className="ob1-field">
            <label className="ob1-label" htmlFor="ob1-altura">Altura (cm)</label>
            <input
              id="ob1-altura"
              type="number"
              className="ob1-input"
              placeholder="cm"
              value={altura}
              onChange={e => setAltura(e.target.value)}
              min="100" max="250"
            />
          </div>
        </div>

        <div className="ob1-row2">
          <div className="ob1-field">
            <label className="ob1-label" htmlFor="ob1-sexo">Sexo</label>
            <select
              id="ob1-sexo"
              className="ob1-select"
              value={sexo}
              onChange={e => setSexo(e.target.value)}
            >
              <option value="">Seleccioná</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
            </select>
          </div>

          <div className={`ob1-imc${!imc ? " ob1-imc--empty" : ""}`}>
            <span className="ob1-imc__label">IMC estimado</span>
            <span className="ob1-imc__val" style={{ color: categoria?.color ?? "var(--ink4)" }}>
              {imc ?? "—"}
            </span>
            <span className="ob1-imc__cat" style={{ color: categoria?.color ?? "var(--ink4)" }}>
              {categoria?.label ?? "Ingresá tus datos"}
            </span>
          </div>
        </div>

        {error && <p className="ob1-error" role="alert">{error}</p>}
        <div className="ob1-actions">
          <button type="button" className="ob1-btn-next" onClick={handleSiguiente}>
            Siguiente <IconArrow />
          </button>
        </div>
      </div>
    </div>
  );
}
