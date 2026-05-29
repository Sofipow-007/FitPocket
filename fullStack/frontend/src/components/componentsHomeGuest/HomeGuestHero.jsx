import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import "./HomeGuestHero.css";

/* ── Icons ─────────────────────────────────────────────────────── */
const IconArrow = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBolt = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconDumbbell = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M3 9V6a1 1 0 011-1h1a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1v-3M21 9V6a1 1 0 00-1-1h-1a1 1 0 00-1 1v12a1 1 0 001 1h1a1 1 0 001-1v-3"/>
  </svg>
);
const IconChart = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconSpark = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
);

/* ── Mockup inside bento ───────────────────────────────────────── */
const DAYS = [
  { day: "Lun", work: "Tren superior",   dur: "45m", done: true },
  { day: "Mar", work: "Cardio HIIT",     dur: "30m", done: true },
  { day: "Mié", work: "Descanso activo", dur: "—",   rest: true },
  { day: "Jue", work: "Tren inferior",   dur: "45m", today: true },
  { day: "Vie", work: "Cardio + Core",   dur: "40m" },
];

function PlanMockup() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Semana 1</span>
        <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">1 800 kcal</span>
      </div>
      {DAYS.map((d, i) => (
        <div
          key={d.day}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] animate-row-in
            ${d.done  ? "bg-orange-500/10 border border-orange-500/15" : ""}
            ${d.today ? "bg-purple-500/10 border border-purple-500/20" : ""}
            ${d.rest  ? "opacity-50 bg-zinc-800/40" : ""}
            ${!d.done && !d.today && !d.rest ? "bg-zinc-800/50" : ""}
          `}
          style={{ animationDelay: `${0.3 + i * 0.1}s` }}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
            ${d.done ? "bg-orange-400" : d.today ? "bg-purple-400" : "bg-zinc-600"}`}
          />
          <span className="w-7 font-bold text-zinc-400 flex-shrink-0">{d.day}</span>
          <span className={`flex-1 font-medium ${d.today ? "text-white" : "text-zinc-300"}`}>{d.work}</span>
          <span className="text-zinc-500 text-[11px]">{d.dur}</span>
          {d.done && (
            <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <IconCheck />
            </span>
          )}
          {d.today && (
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded-full">Hoy</span>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
        <span className="text-[11px] text-zinc-500 flex-shrink-0">Adherencia</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full mockup-bar-fill" style={{ width: "74%" }} />
        </div>
        <span className="text-[12px] font-bold text-orange-400">74%</span>
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function HomeGuestHero() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen font-[DM_Sans,system-ui,sans-serif]" style={{ background: "#050508", color: "#FAFAFA" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-5xl z-50
        flex items-center justify-between px-5 py-3
        bg-[#0F0F16]/85 backdrop-blur-xl border border-white/8 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-dot" />
          <span className="font-[Space_Grotesk,sans-serif] font-bold text-[15px] text-white">FitPocket</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLoginOpen(true)}
            className="px-4 py-2 text-sm text-zinc-400 border border-white/10 rounded-full
              hover:border-orange-500/40 hover:text-orange-400 transition-all duration-150 cursor-pointer"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-4 py-2 text-sm font-semibold text-black bg-orange-500 rounded-full
              hover:bg-orange-400 transition-all duration-150 cursor-pointer btn-glow"
          >
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── Hero fullscreen centrado ── */}
      <section className="hero-mesh scanlines relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-28">
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">

          <h1 className="font-[Space_Grotesk,sans-serif] font-extrabold leading-[0.95] tracking-tight animate-float-up"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}>
            <span className="block text-white">ENTRENÁS</span>
            <span className="block text-gradient-orange">MEJOR.</span>
          </h1>

          <p className="text-zinc-400 text-lg max-w-md leading-relaxed animate-float-up" style={{ animationDelay: "0.1s" }}>
            Obtené tu rutina y alimentación personalizada según tu cuerpo, objetivos y presupuesto.
            Tu plan se adapta automáticamente si tu adherencia baja.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 animate-float-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-8 py-4 text-base font-bold text-black
                bg-orange-500 rounded-2xl hover:bg-orange-400 cursor-pointer
                transition-all duration-200 btn-glow"
            >
              Empezar gratis <IconArrow />
            </button>
            <button
              onClick={() => document.getElementById("bento")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400
                border border-white/10 rounded-2xl hover:border-orange-500/30 hover:text-orange-400
                cursor-pointer transition-all duration-200"
            >
              Ver cómo funciona
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 animate-float-up text-sm text-zinc-500" style={{ animationDelay: "0.4s" }}>
            <div className="flex -space-x-2">
              {["SO","MG","LR"].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#050508]
                  flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {i}
                </div>
              ))}
            </div>
            <span><strong className="text-orange-400">+2 400</strong> planes generados esta semana</span>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-[11px] uppercase tracking-widest text-zinc-500">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-500 to-transparent" />
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section id="bento" className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Funcionalidades</span>
          <h2 className="font-[Space_Grotesk,sans-serif] font-extrabold text-4xl md:text-5xl text-white mt-3 tracking-tight leading-tight">
            Todo en un solo lugar.
          </h2>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridAutoRows: "minmax(180px, auto)" }}>

          {/* Card grande — Plan mockup */}
          <div className="bento-card md:col-span-2 md:row-span-2 bg-[#0F0F16] border border-white/7 rounded-3xl p-6 flex flex-col gap-4 cursor-default">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/20
                flex items-center justify-center text-orange-400">
                <IconDumbbell />
              </span>
              <span className="font-[Space_Grotesk,sans-serif] font-semibold text-white text-sm">Tu plan semanal</span>
            </div>
            <PlanMockup />
          </div>

          {/* Card — Adherencia */}
          <div className="bento-card bg-[#0F0F16] border border-white/7 rounded-3xl p-6 flex flex-col justify-between cursor-default">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Adherencia promedio</span>
            <div>
              <div className="font-[Space_Grotesk,sans-serif] font-extrabold text-6xl text-gradient-orange leading-none">74%</div>
              <p className="text-zinc-500 text-sm mt-2">Usuarios que siguen el plan +2 semanas</p>
            </div>
          </div>

          {/* Card — Setup rápido */}
          <div className="bento-card bg-orange-500 rounded-3xl p-6 flex flex-col justify-between cursor-default">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-900/70">Setup</span>
            <div>
              <div className="font-[Space_Grotesk,sans-serif] font-extrabold text-6xl text-black leading-none">3 min</div>
              <p className="text-black/60 text-sm mt-2">Para tener tu plan completo listo</p>
            </div>
          </div>

          {/* Card — Cómo funciona */}
          <div className="bento-card md:col-span-2 bg-[#0F0F16] border border-white/7 rounded-3xl p-6 cursor-default">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 block">El proceso</span>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: "01", t: "Onboarding", d: "Datos, objetivo y disponibilidad" },
                { n: "02", t: "Tu plan listo", d: "Rutina + dieta personalizada en segundos" },
                { n: "03", t: "Seguís", d: "El plan se adapta automáticamente" },
              ].map(s => (
                <div key={s.n} className="flex flex-col gap-2">
                  <span className="font-[Space_Grotesk,sans-serif] font-extrabold text-2xl text-orange-500/50">{s.n}</span>
                  <span className="font-semibold text-white text-sm">{s.t}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{s.d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card — Adaptación */}
          <div className="bento-card bg-[#120E1F] border border-purple-500/15 rounded-3xl p-6 flex flex-col justify-between cursor-default">
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Se adapta solo</span>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconSpark />
                <span className="font-[Space_Grotesk,sans-serif] font-extrabold text-2xl text-white">Auto-ajuste</span>
              </div>
              <p className="text-zinc-500 text-sm">Si tu adherencia baja del 50%, el plan se regenera automáticamente</p>
            </div>
          </div>

          {/* Card — Stats */}
          <div className="bento-card md:col-span-2 bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 flex items-center gap-6 cursor-default">
            {[
              { val: "7", unit: "días", desc: "Plan completo" },
              { val: "50%", unit: "umbral", desc: "Regeneración auto" },
              { val: "100%", unit: "gratis", desc: "Sin tarjeta" },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="font-[Space_Grotesk,sans-serif] font-extrabold text-3xl text-white">
                  {s.val}<span className="text-orange-400 text-lg ml-0.5">{s.unit}</span>
                </div>
                <div className="text-zinc-500 text-xs mt-1">{s.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #A855F7 100%)" }}>
          <div className="relative z-10">
            <h2 className="font-[Space_Grotesk,sans-serif] font-extrabold text-5xl text-white tracking-tight mb-4 leading-tight">
              ¿Listo para entrenar<br />diferente?
            </h2>
            <p className="text-white/70 text-lg mb-8">Sin tarjeta de crédito · Sin compromisos · 3 minutos</p>
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 px-10 py-4 bg-black text-white
                font-bold text-lg rounded-2xl hover:bg-zinc-900 cursor-pointer transition-all duration-200"
            >
              Empezar gratis <IconArrow />
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-xs text-zinc-600">© 2025 FitPocket · Todos los derechos reservados</p>
      </footer>

      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
