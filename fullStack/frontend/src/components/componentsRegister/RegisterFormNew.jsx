import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./RegisterFormNew.css";

/* ── Icons ─────────────────────────────────────────────────────── */
const IconArrowLeft = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconFlask = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v7l-5 9a2 2 0 001.8 2.9h12.4A2 2 0 0020 19l-5-9V3"/>
  </svg>
);
const IconArrow = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Password strength ─────────────────────────────────────────── */
const FUERZA_KEYS = [
  null,
  { key: "register.fuerza.muyDebil",  color: "#EF4444" },
  { key: "register.fuerza.debil",     color: "#F97316" },
  { key: "register.fuerza.media",     color: "#EAB308" },
  { key: "register.fuerza.fuerte",    color: "#3B82F6" },
  { key: "register.fuerza.muyFuerte", color: "#22C55E" },
];

function getStrength(pwd) {
  if (!pwd) return { score: 0, key: "", color: "" };
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (pwd.length >= 12)         s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return { score: s, ...FUERZA_KEYS[s] };
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function RegisterFormNew({ onLoginClick, onLogoClick, onGoOnboarding }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const [nombre,       setNombre]       = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:3000/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || t("register.errorRegistro")); return; }
      localStorage.setItem("token", data.token);
      navigate("/onboarding");
    } catch {
      setError(t("register.errorConexion"));
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full bg-[#161620] border border-white/10 rounded-xl text-white text-sm px-4 py-3 transition-all duration-150 placeholder:text-zinc-600 reg-input";

  return (
    <div className="w-full max-w-[440px] mx-auto reg-card-anim">

      {/* Back */}
      <button
        onClick={() => onLogoClick?.() ?? navigate("/")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-6 cursor-pointer"
      >
        <IconArrowLeft /> {t("register.volver")}
      </button>

      {/* Card */}
      <div className="bg-[#0F0F16] border border-white/8 rounded-3xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          <span className="font-[Space_Grotesk,sans-serif] font-bold text-sm text-zinc-400">FitPocket</span>
        </div>

        <h1 className="font-[Space_Grotesk,sans-serif] font-extrabold text-[1.75rem] text-white tracking-tight mb-1">
          {t("register.titulo")}
        </h1>
        <p className="text-sm text-zinc-500 mb-7">{t("register.subtitulo")}</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-nombre" className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("register.nombre")}
            </label>
            <input id="reg-nombre" type="text" className={inputBase} placeholder={t("register.placeholder.nombre")}
              value={nombre} onChange={e => setNombre(e.target.value)} required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("register.email")}
            </label>
            <input id="reg-email" type="email" className={inputBase} placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("register.contrasena")}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className={`${inputBase} pr-12`}
                placeholder={t("register.placeholder.contrasena")}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? t("register.ocultar") : t("register.mostrar")}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {/* Strength */}
            {password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength.score ? strength.color : "#27272A" }} />
                  ))}
                </div>
                <span className="text-[11px] font-semibold min-w-[64px] text-right transition-colors"
                  style={{ color: strength.color }}>
                  {strength.key ? t(strength.key) : ""}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3.5 rounded-xl font-bold text-sm text-black
              bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer transition-all duration-150"
          >
            {loading ? t("register.creando") : t("register.crear")}
          </button>

        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-zinc-600">o</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* ── BOTÓN DE PRUEBA — Ir directo al Onboarding ── */}
        <button
          type="button"
          onClick={() => onGoOnboarding?.() ?? navigate("/onboarding")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
            text-orange-400 border border-dashed border-orange-500/30
            hover:border-orange-500/60 hover:bg-orange-500/5 cursor-pointer transition-all duration-150"
        >
          <IconFlask />
          [DEV] Ver Onboarding directamente
        </button>

        {/* Footer links */}
        <p className="text-xs text-zinc-600 text-center mt-4">
          {t("register.terminos")}{" "}
          <button type="button" className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300 cursor-pointer transition-colors">
            {t("register.terminosLink")}
          </button>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-zinc-600">
          <span>{t("register.yaTenes")}</span>
          <button
            type="button"
            onClick={onLoginClick}
            className="text-orange-400 font-semibold hover:opacity-75 cursor-pointer transition-opacity"
          >
            {t("register.iniciarSesion")}
          </button>
        </div>

      </div>
    </div>
  );
}
