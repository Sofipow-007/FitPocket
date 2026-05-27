// REEMPLAZAR HomeGuestHero.jsx con este archivo
// Fixes:
// 1. Botones navbar con clases hg-nav-login y hg-nav-register
// 2. Todos los .reveal tienen ref via useScrollReveal
// 3. hg-section-title no usa reveal (siempre visible)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar/Navbar";
import WaveDivider from "./WaveDivider";
import AuthModal from "./AuthModal";
import useScrollReveal from "../../hooks/useScrollReveal";
import "./HomeGuestHero.css";

function PlanMockup() {
  const days = [
    { day: "Lun", work: "Tren superior",   dur: "45 min", done: true },
    { day: "Mar", work: "Cardio HIIT",     dur: "30 min", done: true },
    { day: "Mié", work: "Descanso activo", dur: "—",      done: false, rest: true },
    { day: "Jue", work: "Tren inferior",   dur: "45 min", done: false, today: true },
    { day: "Vie", work: "Cardio + Core",   dur: "40 min", done: false },
  ];
  return (
    <div className="hg-mockup">
      <div className="hg-mockup__header">
        <div className="hg-mockup__dots"><span /><span /><span /></div>
        <span className="hg-mockup__title">Semana 1 · Perder grasa</span>
        <span className="hg-mockup__badge">1800 kcal</span>
      </div>
      <div className="hg-mockup__rows">
        {days.map((d, i) => (
          <div key={d.day}
            className={`hg-mockup__row ${d.done?"done":""} ${d.today?"today":""} ${d.rest?"rest":""}`}
            style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
            <span className="hg-mockup__dot" />
            <span className="hg-mockup__day">{d.day}</span>
            <span className="hg-mockup__work">{d.work}</span>
            <span className="hg-mockup__dur">{d.dur}</span>
            {d.done  && <span className="hg-mockup__check">✓</span>}
            {d.today && <span className="hg-mockup__today-tag">Hoy</span>}
          </div>
        ))}
      </div>
      <div className="hg-mockup__footer">
        <span className="hg-mockup__adherence-label">Adherencia</span>
        <div className="hg-mockup__bar">
          <div className="hg-mockup__bar-fill" style={{ width: "74%" }} />
        </div>
        <span className="hg-mockup__adherence-val">74%</span>
      </div>
      <div className="hg-mockup__ai-tag">Generado por IA ✦</div>
    </div>
  );
}

function SectionHero({ onRegisterClick }) {
  const scrollToPasos = () => {
    document.getElementById("el-proceso")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="hg-hero">
      <div className="hg-hero__left">
        <div className="hg-badge reveal"><span className="hg-badge__dot" />COACHING CON IA</div>
        <h1 className="hg-hero__title reveal">
          Tu entrenador<br />personal, <em>inteligente.</em>
        </h1>
        <p className="hg-hero__body reveal">
          Plan de rutina y alimentación generado por IA según tus datos, objetivos y presupuesto.
          Se adapta automáticamente si tu adherencia baja del 50%.
        </p>
        <div className="hg-hero__ctas reveal">
          <button className="hg-btn hg-btn--primary" onClick={onRegisterClick}>Empezar gratis</button>
          <button className="hg-btn hg-btn--ghost" onClick={scrollToPasos}>Ver cómo funciona</button>
        </div>
        <div className="hg-hero__social reveal">
          <div className="hg-avatars">
            <div className="hg-avatar">SO</div>
            <div className="hg-avatar">MG</div>
            <div className="hg-avatar">LR</div>
          </div>
          <span>+2.400 planes generados esta semana</span>
        </div>
      </div>
      <div className="hg-hero__right reveal">
        <div className="hg-hero__glow" />
        <PlanMockup />
      </div>
    </section>
  );
}

function SectionFeatures() {
  const labelRef = useScrollReveal({ threshold: 0.05 });
  const r1 = useScrollReveal({ threshold: 0.05 });
  const r2 = useScrollReveal({ threshold: 0.05 });
  const r3 = useScrollReveal({ threshold: 0.05 });
  const cards = [
    { num:"F1", icon:"⊞", title:"Rutina semanal",  body:"7 días adaptados a tu nivel, horario y limitaciones físicas.", ref:r1 },
    { num:"F2", icon:"◫", title:"Alimentación",     body:"Menú diario con calorías y costo ajustado a tu presupuesto mensual.", ref:r2 },
    { num:"F3", icon:"↗", title:"Seguimiento",      body:"Checklist diario. El plan se regenera si tu adherencia cae del 50%.", ref:r3 },
  ];
  return (
    <section className="hg-features">
      <div className="hg-section-label reveal" ref={labelRef}>TODO LO QUE NECESITÁS</div>
      <h2 className="hg-section-title">Un plan que se adapta.<br /><em>No vos al plan.</em></h2>
      <div className="hg-features__grid">
        {cards.map(c => (
          <div key={c.num} className="hg-feature-card reveal" ref={c.ref}>
            <div className="hg-feature-card__num">{c.num}</div>
            <div className="hg-feature-card__icon">{c.icon}</div>
            <h3 className="hg-feature-card__title">{c.title}</h3>
            <p className="hg-feature-card__body">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionComparison() {
  const labelRef = useScrollReveal({ threshold: 0.05 });
  const leftRef  = useScrollReveal({ threshold: 0.05 });
  const rightRef = useScrollReveal({ threshold: 0.05 });
  return (
    <section className="hg-comparison">
      <div className="hg-section-label reveal" ref={labelRef}>POR QUÉ FITPOCKET</div>
      <h2 className="hg-section-title">Dos formas de entrenar.<br /><em>Una funciona.</em></h2>
      <div className="hg-comparison__grid">
        <div className="hg-comparison__card hg-comparison__card--them reveal" ref={leftRef}>
          <div className="hg-comparison__tag">LOS DEMÁS</div>
          <h3>Plan genérico.<br />Vos te adaptás.</h3>
          <p>Rutinas de internet que no conocen tu cuerpo, tu horario ni tu presupuesto. Abandonás en dos semanas.</p>
        </div>
        <div className="hg-comparison__card hg-comparison__card--us reveal" ref={rightRef}>
          <div className="hg-comparison__tag hg-comparison__tag--us">FITPOCKET</div>
          <h3>Plan que te conoce.<br />Y aprende.</h3>
          <p>La IA analiza tus datos, genera tu rutina y dieta, y las regenera automáticamente si bajás del umbral de adherencia.</p>
        </div>
      </div>
    </section>
  );
}

function SectionSteps() {
  const labelRef = useScrollReveal({ threshold: 0.05 });
  const s1 = useScrollReveal({ threshold: 0.05 });
  const s2 = useScrollReveal({ threshold: 0.05 });
  const s3 = useScrollReveal({ threshold: 0.05 });
  const steps = [
    { num:"01", title:"Completás el onboarding", body:"Datos físicos, objetivo y disponibilidad. 3 minutos.", ref:s1 },
    { num:"02", title:"La IA genera tu plan",    body:"Rutina + dieta personalizadas en ~15 segundos.", ref:s2 },
    { num:"03", title:"Seguís el checklist",     body:"El plan se adapta automáticamente a tu adherencia.", ref:s3 },
  ];
  return (
    <section className="hg-steps" id="el-proceso">
      <div className="hg-section-label reveal" ref={labelRef}>EL PROCESO</div>
      <h2 className="hg-section-title">Tres pasos.<br /><em>Un plan perfecto.</em></h2>
      <div className="hg-steps__grid">
        {steps.map((s, i) => (
          <div key={s.num} className="hg-step reveal" ref={s.ref} style={{ transitionDelay:`${i*0.1}s` }}>
            <div className="hg-step__num">{s.num}</div>
            <h3 className="hg-step__title">{s.title}</h3>
            <p className="hg-step__body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionCTA({ onRegisterClick }) {
  const ref = useScrollReveal({ threshold: 0.05 });
  return (
    <section className="hg-cta">
      <div className="hg-cta__inner reveal" ref={ref}>
        <h2 className="hg-cta__title">Listo cuando<br /><em>vos lo estés.</em></h2>
        <p className="hg-cta__body">Configurá tu plan en 3 minutos. Sin tarjeta de crédito.</p>
        <div className="hg-cta__btns">
          <button className="hg-btn hg-btn--primary hg-btn--lg" onClick={onRegisterClick}>Empezar gratis</button>
        </div>
        <span className="hg-cta__note">Sin datos de pago · Sin compromisos</span>
      </div>
    </section>
  );
}

export default function HomeGuestHero() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll(".hg-hero .reveal").forEach((el, i) => {
        setTimeout(() => el.classList.add("revealed"), i * 120);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hg-root">
      <Navbar>
        <button className="hg-nav-login"    onClick={() => setLoginOpen(true)}>Entrar</button>
        <button className="hg-nav-register" onClick={() => navigate("/register")}>Empezar gratis</button>
      </Navbar>

      <SectionHero    onRegisterClick={() => navigate("/register")} />
      <WaveDivider color="rgba(139,127,245,0.3)"  height={80} />
      <SectionFeatures />
      <WaveDivider color="rgba(139,127,245,0.2)"  height={80} flip />
      <SectionComparison />
      <WaveDivider color="rgba(139,127,245,0.25)" height={80} />
      <SectionSteps />
      <WaveDivider color="rgba(139,127,245,0.2)"  height={80} flip />
      <SectionCTA onRegisterClick={() => navigate("/register")} />

      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
