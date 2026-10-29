import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import { MOCK_PATENTES, MOCK_FAMILIAS } from "../../mocks/adminMock";
import AyudaTip from "../../components/Ayuda/AyudaTip";

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Mismo recorrido que el Composite del backend, para mostrar los permisos efectivos
// antes de guardar. `visitados` corta los ciclos.
function patentesEfectivas(familiaIds, patenteIds, familiasPorId, visitados = new Set()) {
  const resultado = new Set(patenteIds);
  for (const id of familiaIds) {
    if (visitados.has(id)) continue;
    visitados.add(id);
    const f = familiasPorId.get(id);
    if (!f) continue;
    for (const p of patentesEfectivas(f.familias, f.patentes, familiasPorId, visitados)) resultado.add(p);
  }
  return resultado;
}

// ¿Desde `desde` se llega a `objetivo`? (para no ofrecer una familia que formaría un ciclo)
function alcanza(desde, objetivo, familiasPorId) {
  const pendientes = [desde];
  const vistos = new Set();
  while (pendientes.length) {
    const actual = pendientes.pop();
    if (actual === objetivo) return true;
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    pendientes.push(...(familiasPorId.get(actual)?.familias ?? []));
  }
  return false;
}

// El id del usuario logueado sale del JWT: solo se usa para deshabilitar
// la edición de los propios permisos (el backend lo rechaza igual).
function miUserId() {
  try {
    return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).userId;
  } catch {
    return null;
  }
}

function toggle(set, id) {
  const nuevo = new Set(set);
  if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
  return nuevo;
}

function ListaPatentes({ patentes, elegidas, onToggle, idPrefijo, descripcion }) {
  return (
    <div className="ad-checks">
      {patentes.map(p => (
        <label key={p._id} className="ad-check" htmlFor={`${idPrefijo}-${p._id}`}>
          <input
            type="checkbox"
            id={`${idPrefijo}-${p._id}`}
            checked={elegidas.has(p._id)}
            onChange={() => onToggle(p._id)}
          />
          <span className="ad-check__texto">
            <span className="ad-check__codigo">{p.codigo}</span>
            <span className="ad-check__desc">{descripcion(p)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function EditorFamilia({ familia, familias, familiasPorId, patentes, descripcion, onCancel, onGuardar }) {
  const { t } = useTranslation();
  const [nombre,      setNombre]      = useState(familia?.nombre ?? "");
  const [desc,        setDesc]        = useState(familia?.descripcion ?? "");
  const [elegidasP,   setElegidasP]   = useState(() => new Set(familia?.patentes ?? []));
  const [elegidasF,   setElegidasF]   = useState(() => new Set(familia?.familias ?? []));
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState("");
  const nombreRef = useRef(null);
  const descRef   = useRef(null);

  // En una familia base el nombre está deshabilitado: el foco va a la descripción
  useEffect(() => { (familia?.protegida ? descRef : nombreRef).current?.focus(); }, [familia?.protegida]);

  const idForm = familia?._id ?? "nueva";
  // Se puede incluir una familia si no es esta misma y no contiene (directa o indirectamente) a esta
  const incluibles = familias.filter(f => f._id !== familia?._id && !(familia && alcanza(f._id, familia._id, familiasPorId)));

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setError(t("admin.familias.errorNombre")); nombreRef.current?.focus(); return; }
    setGuardando(true);
    setError("");
    const ok = await onGuardar({
      nombre: nombre.trim(),
      descripcion: desc.trim(),
      patentes: [...elegidasP],
      familias: [...elegidasF],
    });
    setGuardando(false);
    if (!ok) setError(t("admin.familias.errorGuardar"));
  };

  return (
    <form className="ad-form" onSubmit={submit} aria-label={familia ? t("admin.familias.editarA", { nombre: familia.nombre }) : t("admin.familias.nueva")}>
      <div className="ad-form__fila">
        <div className="ad-field">
          <label htmlFor={`fam-nombre-${idForm}`} className="ad-field__label">{t("admin.familias.nombre")}</label>
          <input
            id={`fam-nombre-${idForm}`}
            ref={nombreRef}
            className="ad-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={40}
            disabled={familia?.protegida}
            aria-describedby={familia?.protegida ? `fam-nombre-ayuda-${idForm}` : undefined}
          />
          {familia?.protegida && (
            <p className="ad-field__ayuda" id={`fam-nombre-ayuda-${idForm}`}>{t("admin.familias.nombreProtegido")}</p>
          )}
        </div>
        <div className="ad-field">
          <label htmlFor={`fam-desc-${idForm}`} className="ad-field__label">{t("admin.familias.descripcion")}</label>
          <input
            id={`fam-desc-${idForm}`}
            ref={descRef}
            className="ad-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <fieldset className="ad-fieldset">
        <legend className="ad-field__label">{t("admin.familias.incluyeFamilias")}</legend>
        {incluibles.length === 0
          ? <p className="ad-field__ayuda">{t("admin.familias.sinIncluibles")}</p>
          : (
            <div className="ad-checks">
              {incluibles.map(f => (
                <label key={f._id} className="ad-check" htmlFor={`${idForm}-f-${f._id}`}>
                  <input
                    type="checkbox"
                    id={`${idForm}-f-${f._id}`}
                    checked={elegidasF.has(f._id)}
                    onChange={() => setElegidasF(s => toggle(s, f._id))}
                  />
                  <span className="ad-check__texto"><span className="ad-check__codigo">{f.nombre}</span></span>
                </label>
              ))}
            </div>
          )}
      </fieldset>

      <fieldset className="ad-fieldset">
        <legend className="ad-field__label">{t("admin.familias.patentes")}</legend>
        <ListaPatentes
          patentes={patentes}
          elegidas={elegidasP}
          onToggle={(id) => setElegidasP(s => toggle(s, id))}
          idPrefijo={`${idForm}-p`}
          descripcion={descripcion}
        />
      </fieldset>

      {error && <p className="ad-form__error" role="alert">{error}</p>}

      <div className="ad-form__acciones">
        <button type="button" className="ad-btn" onClick={onCancel} disabled={guardando}>{t("admin.cancelar")}</button>
        <button type="submit" className="ad-btn ad-btn--primary" disabled={guardando}>
          {guardando ? t("admin.familias.guardando") : t("admin.familias.guardar")}
        </button>
      </div>
    </form>
  );
}

export default function FamiliasTab({ users, setUsers, cargandoUsers, isPreview }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patentes,  setPatentes]  = useState(isPreview ? MOCK_PATENTES : []);
  const [familias,  setFamilias]  = useState(isPreview ? MOCK_FAMILIAS : []);
  const [loading,   setLoading]   = useState(!isPreview);
  const [error,     setError]     = useState(false);
  const [intento,   setIntento]   = useState(0);
  const [editando,  setEditando]  = useState(null); // null | "nueva" | id de familia
  const [aviso,     setAviso]     = useState("");
  const origenRef = useRef(null);

  const [userSel,       setUserSel]       = useState("");
  const [asigFamilias,  setAsigFamilias]  = useState(new Set());
  const [asigPatentes,  setAsigPatentes]  = useState(new Set());
  const [guardandoAsig, setGuardandoAsig] = useState(false);
  const [errorAsig,     setErrorAsig]     = useState("");
  const [avisoAsig,     setAvisoAsig]     = useState("");

  const yo = useMemo(() => (isPreview ? "m1" : miUserId()), [isPreview]);

  const pedir = (ruta, opciones = {}) => fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then(r => {
    if (r.status === 401) { localStorage.removeItem("token"); navigate("/login", { replace: true }); }
    return r;
  });

  useEffect(() => {
    if (isPreview) return;
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    Promise.all([
      fetch(`${API_URL}/permisos/patentes`, { headers }),
      fetch(`${API_URL}/permisos/familias`, { headers }),
    ])
      .then(async ([rP, rF]) => {
        if (rP.status === 401 || rF.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        if (!rP.ok || !rF.ok) throw new Error();
        setPatentes((await rP.json()).patentes ?? []);
        setFamilias((await rF.json()).familias ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isPreview, navigate, intento]);

  const familiasPorId = useMemo(() => new Map(familias.map(f => [f._id, f])), [familias]);
  const codigoDe      = useMemo(() => new Map(patentes.map(p => [p._id, p.codigo])), [patentes]);

  // Las patentes base tienen traducción; las que cree un admin muestran su descripción tal cual
  const descripcion = (p) => t(`admin.patentesDesc.${p.codigo.replace(".", "_")}`, { defaultValue: p.descripcion });

  const abrirEditor = (id, e) => {
    origenRef.current = e?.currentTarget ?? null;
    setAviso("");
    setEditando(id);
  };
  const cerrarEditor = () => {
    setEditando(null);
    origenRef.current?.focus();
  };

  const guardarFamilia = async (datos) => {
    const esNueva = editando === "nueva";
    try {
      let guardada;
      if (isPreview) {
        guardada = { _id: esNueva ? `f${Date.now()}` : editando, protegida: familiasPorId.get(editando)?.protegida ?? false, ...datos };
      } else {
        const res = await pedir(esNueva ? "/permisos/familias" : `/permisos/familias/${editando}`, {
          method: esNueva ? "POST" : "PUT",
          body: JSON.stringify(datos),
        });
        if (!res.ok) return false;
        guardada = (await res.json()).familia;
      }
      setFamilias(fs => (esNueva ? [...fs, guardada] : fs.map(f => (f._id === guardada._id ? guardada : f)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setAviso(t(esNueva ? "admin.familias.creada" : "admin.familias.actualizada", { nombre: guardada.nombre }));
      setEditando(null);
      origenRef.current?.focus();
      return true;
    } catch {
      return false;
    }
  };

  const elegirUsuario = (id) => {
    setUserSel(id);
    setErrorAsig("");
    setAvisoAsig("");
    const u = users.find(x => x._id === id);
    setAsigFamilias(new Set(u?.familias ?? []));
    setAsigPatentes(new Set(u?.patentes ?? []));
  };

  const usuarioElegido = users.find(u => u._id === userSel);
  const esYo = userSel && userSel === yo;
  const efectivas = useMemo(
    () => [...patentesEfectivas([...asigFamilias], [...asigPatentes], familiasPorId)].map(id => codigoDe.get(id)).filter(Boolean).sort(),
    [asigFamilias, asigPatentes, familiasPorId, codigoDe],
  );

  const guardarAsignacion = async (e) => {
    e.preventDefault();
    setGuardandoAsig(true);
    setErrorAsig("");
    setAvisoAsig("");
    const body = { familias: [...asigFamilias], patentes: [...asigPatentes] };
    try {
      let rol;
      if (isPreview) {
        const admin = familias.find(f => f.nombre === "Administrador");
        rol = admin && body.familias.some(id => alcanza(id, admin._id, familiasPorId)) ? "admin" : "usuario";
      } else {
        const res = await pedir(`/permisos/usuarios/${userSel}`, { method: "PUT", body: JSON.stringify(body) });
        if (!res.ok) { setErrorAsig(t("admin.familias.errorAsignar")); return; }
        rol = (await res.json()).usuario.rol;
      }
      setUsers(us => us.map(u => (u._id === userSel ? { ...u, ...body, rol } : u)));
      setAvisoAsig(t("admin.familias.asignado", { email: usuarioElegido.email }));
    } catch {
      setErrorAsig(t("admin.familias.errorAsignar"));
    } finally {
      setGuardandoAsig(false);
    }
  };

  const reintentar = () => { setError(false); setLoading(true); setIntento(n => n + 1); };

  if (loading) {
    return (
      <div className="ad-skeleton" role="status" aria-busy="true" aria-label={t("comun.cargando")}>
        {[0, 1, 2].map(i => <div key={i} className="ad-sk ad-sk--alto" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-error" role="alert">
        <p>{t("admin.familias.errorCarga")}</p>
        <button type="button" className="ad-btn" onClick={reintentar}>{t("admin.reintentar")}</button>
      </div>
    );
  }

  return (
    <>
      {/* ── Familias ── */}
      <section className="ad-section" aria-labelledby="ad-fam-titulo">
        <header className="ad-header">
          <div>
            <h2 className="ad-subtitle" id="ad-fam-titulo">{t("admin.familias.titulo")} <AyudaTip etiqueta={t("ayuda.tips.seccionEtiqueta", { seccion: t("admin.tabs.familias") })} texto={t("ayuda.tips.familias")} ancla="admin-familias" lado="izq" /></h2>
            <p className="ad-intro">{t("admin.familias.intro")}</p>
          </div>
          {editando !== "nueva" && (
            <button type="button" className="ad-btn ad-btn--primary" onClick={(e) => abrirEditor("nueva", e)}>
              <IconPlus /> <span>{t("admin.familias.nueva")}</span>
            </button>
          )}
        </header>

        <p className="ad-aviso" role="status" aria-live="polite">{aviso}</p>

        {editando === "nueva" && (
          <div className="ad-fam ad-fam--editando">
            <h3 className="ad-fam__nombre">{t("admin.familias.nueva")}</h3>
            <EditorFamilia
              familia={null}
              familias={familias}
              familiasPorId={familiasPorId}
              patentes={patentes}
              descripcion={descripcion}
              onCancel={cerrarEditor}
              onGuardar={guardarFamilia}
            />
          </div>
        )}

        <ul className="ad-fams">
          {familias.map(f => {
            const total = patentesEfectivas([f._id], [], familiasPorId).size;
            return (
              <li key={f._id} className={`ad-fam${editando === f._id ? " ad-fam--editando" : ""}`}>
                <div className="ad-fam__head">
                  <h3 className="ad-fam__nombre">
                    {f.nombre}
                    {f.protegida && <span className="ad-badge">{t("admin.familias.base")}</span>}
                  </h3>
                  {editando !== f._id && (
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={(e) => abrirEditor(f._id, e)}
                      aria-label={t("admin.familias.editarA", { nombre: f.nombre })}
                    >
                      {t("admin.familias.editar")}
                    </button>
                  )}
                </div>

                {editando === f._id ? (
                  <EditorFamilia
                    familia={f}
                    familias={familias}
                    familiasPorId={familiasPorId}
                    patentes={patentes}
                    descripcion={descripcion}
                    onCancel={cerrarEditor}
                    onGuardar={guardarFamilia}
                  />
                ) : (
                  <>
                    {f.descripcion && <p className="ad-fam__desc">{f.descripcion}</p>}
                    {f.familias.length > 0 && (
                      <p className="ad-fam__meta">
                        {t("admin.familias.incluye")}{" "}
                        {f.familias.map(id => familiasPorId.get(id)?.nombre).filter(Boolean).join(", ")}
                      </p>
                    )}
                    {f.patentes.length > 0 && (
                      <ul className="ad-chips" aria-label={t("admin.familias.patentesPropias")}>
                        {f.patentes.map(id => codigoDe.get(id)).filter(Boolean).map(c => (
                          <li key={c} className="ad-chip">{c}</li>
                        ))}
                      </ul>
                    )}
                    <p className="ad-fam__meta">{t("admin.familias.totalPermisos", { count: total })}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Asignación a usuarios ── */}
      <section className="ad-section" aria-labelledby="ad-asig-titulo">
        <header className="ad-header">
          <div>
            <h2 className="ad-subtitle" id="ad-asig-titulo">{t("admin.familias.asignarTitulo")}</h2>
            <p className="ad-intro">{t("admin.familias.asignarIntro")}</p>
          </div>
        </header>

        <form className="ad-form" onSubmit={guardarAsignacion}>
          <div className="ad-field ad-field--angosto">
            <label htmlFor="ad-asig-user" className="ad-field__label">{t("admin.familias.usuario")}</label>
            <select
              id="ad-asig-user"
              className="ad-input"
              value={userSel}
              onChange={(e) => elegirUsuario(e.target.value)}
              disabled={cargandoUsers || users.length === 0}
            >
              <option value="">{t("admin.familias.elegirUsuario")}</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.email}{u._id === yo ? ` (${t("admin.familias.vos")})` : ""}
                </option>
              ))}
            </select>
          </div>

          {usuarioElegido && esYo && (
            <p className="ad-field__ayuda">{t("admin.familias.noPropios")}</p>
          )}

          {usuarioElegido && !esYo && (
            <>
              <fieldset className="ad-fieldset">
                <legend className="ad-field__label">{t("admin.familias.familiasAsignadas")}</legend>
                <div className="ad-checks">
                  {familias.map(f => (
                    <label key={f._id} className="ad-check" htmlFor={`asig-f-${f._id}`}>
                      <input
                        type="checkbox"
                        id={`asig-f-${f._id}`}
                        checked={asigFamilias.has(f._id)}
                        onChange={() => setAsigFamilias(s => toggle(s, f._id))}
                      />
                      <span className="ad-check__texto"><span className="ad-check__codigo">{f.nombre}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="ad-fieldset">
                <legend className="ad-field__label">{t("admin.familias.patentesSueltas")}</legend>
                <ListaPatentes
                  patentes={patentes}
                  elegidas={asigPatentes}
                  onToggle={(id) => setAsigPatentes(s => toggle(s, id))}
                  idPrefijo="asig-p"
                  descripcion={descripcion}
                />
              </fieldset>

              <div className="ad-efectivas">
                <p className="ad-field__label">{t("admin.familias.efectivas", { count: efectivas.length })}</p>
                {efectivas.length > 0
                  ? (
                    <ul className="ad-chips">
                      {efectivas.map(c => <li key={c} className="ad-chip">{c}</li>)}
                    </ul>
                  )
                  : <p className="ad-field__ayuda">{t("admin.familias.sinPermisos")}</p>}
              </div>

              {errorAsig && <p className="ad-form__error" role="alert">{errorAsig}</p>}

              <div className="ad-form__acciones">
                <button type="submit" className="ad-btn ad-btn--primary" disabled={guardandoAsig}>
                  {guardandoAsig ? t("admin.familias.guardando") : t("admin.familias.guardarAsignacion")}
                </button>
              </div>
            </>
          )}

          <p className="ad-aviso" role="status" aria-live="polite">{avisoAsig}</p>
        </form>
      </section>
    </>
  );
}
